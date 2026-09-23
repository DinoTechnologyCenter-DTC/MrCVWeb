"""MrCV export backend (FastAPI) — real files, no browser print dialog.

POST /api/export/pdf  { html, css, filename } -> application/pdf (A4, exact colors)
POST /api/export/docx { html, css, filename } -> Word .docx
GET  /api/health -> { ok, pdf, docx }

PDF renders the exact HTML/CSS the site shows via headless Chrome.
DOCX converts the same package through LibreOffice, so both files match
the website by construction (single source: the sheet markup + live CSS).

System needs (already on this box, override with env):
  Chrome/Chromium  -> CHROME_PATH (default /usr/bin/google-chrome)
  LibreOffice      -> SOFFICE_BIN (default soffice on PATH)

Run:
  python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt
  PORT=8000 uvicorn main:app
"""
import os
import re
import shutil
import subprocess
import tempfile

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from playwright.async_api import async_playwright

PORT = int(os.environ.get("PORT", "8000"))
CHROME_PATH = os.environ.get("CHROME_PATH", "/usr/bin/google-chrome")
SOFFICE_BIN = os.environ.get("SOFFICE_BIN", "soffice")

app = FastAPI(title="MrCV export backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ExportReq(BaseModel):
    html: str = ""
    css: str = ""
    filename: str = "document"


def safe_name(name: str, ext: str) -> str:
    base = re.sub(r'[\\/:*?"<>|]', "-", name or "document")
    base = re.sub(r"(\.[a-z0-9]+)?$", ext, base, flags=re.IGNORECASE)
    return base or f"document{ext}"


def page_doc(html: str, css: str) -> str:
    return (
        "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><style>"
        "@page{size:A4;margin:10mm;}"
        "body{margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}"
        f"{css or ''}</style></head><body>{html or ''}</body></html>"
    )


_browser = None


async def get_browser():
    global _browser
    if _browser is not None and _browser.is_connected():
        return _browser
    pw = await async_playwright().start()
    _browser = await pw.chromium.launch(
        executable_path=CHROME_PATH,
        args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    )
    return _browser


@app.get("/api/health")
async def health():
    pdf_ok, pdf_error = True, ""
    try:
        await get_browser()
    except Exception as e:  # noqa: BLE001
        pdf_ok, pdf_error = False, str(e)[:200]
    return {
        "ok": True,
        "pdf": pdf_ok,
        "docx": shutil.which(SOFFICE_BIN) is not None,
        "pdfError": pdf_error,
    }


@app.post("/api/export/pdf")
async def export_pdf(req: ExportReq):
    if not req.html.strip():
        raise HTTPException(400, "html required")
    try:
        browser = await get_browser()
        page = await browser.new_page()
        try:
            await page.set_content(page_doc(req.html, req.css), wait_until="networkidle", timeout=15000)
            pdf = await page.pdf(
                format="A4",
                print_background=True,
                margin={"top": "10mm", "bottom": "10mm", "left": "10mm", "right": "10mm"},
            )
        finally:
            await page.close()
    except Exception as e:  # noqa: BLE001
        raise HTTPException(500, f"pdf failed: {str(e)[:300]}")
    return Response(
        content=bytes(pdf),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{safe_name(req.filename, ".pdf")}"'},
    )


@app.post("/api/export/docx")
async def export_docx(req: ExportReq):
    if not req.html.strip():
        raise HTTPException(400, "html required")
    if shutil.which(SOFFICE_BIN) is None:
        raise HTTPException(500, "libreoffice not available")
    tmp = tempfile.mkdtemp(prefix="mrcv-")
    try:
        src = os.path.join(tmp, "cv.doc")
        with open(src, "w", encoding="utf-8") as f:
            f.write(page_doc(req.html, req.css))
        proc = subprocess.run(
            [
                SOFFICE_BIN, "--headless",
                "-env:UserInstallation=file://" + os.path.join(tmp, "soprofile"),
                "--infilter=HTML",
                "--convert-to", "docx:MS Word 2007 XML",
                "--outdir", tmp, src,
            ],
            capture_output=True,
            text=True,
            timeout=60,
        )
        out = os.path.join(tmp, "cv.docx")
        if proc.returncode != 0 or not os.path.exists(out):
            raise HTTPException(500, f"convert failed: {(proc.stderr or '')[:300]}")
        with open(out, "rb") as f:
            data = f.read()
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{safe_name(req.filename, ".docx")}"'},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=PORT)
