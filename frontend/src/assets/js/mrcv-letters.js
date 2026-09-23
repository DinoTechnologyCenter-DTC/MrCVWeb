// Cover letters — list, generator (EN/SW), download, WhatsApp share.
import { getCVs, getLetters, upsertLetter, deleteLetter, buildLetter, esc, fmtDate, waLink, downloadDoc } from './mrcv-store.js';

let editingId = null;

function renderLetters() {
  const letters = getLetters();
  const box = document.getElementById('letterList');
  const cvs = Object.fromEntries(getCVs().map((c) => [c.id, c.name]));
  document.getElementById('statLetters').textContent = letters.length;
  document.getElementById('statLetterCvs').textContent = getCVs().length;
  if (!letters.length) {
    box.innerHTML = `<div class="text-center py-5">
      <i class="ti ti-mail fs-1 text-secondary"></i>
      <h3 class="h6 mt-3">No letters yet</h3>
      <p class="text-secondary small">Generate one below from any saved CV — English or Kiswahili.</p>
    </div>`;
    return;
  }
  box.innerHTML = letters.map((l) => `
    <div class="list-group-item p-3">
      <div class="d-flex flex-column flex-md-row gap-2 align-items-md-center">
        <div class="icon-shape icon-md bg-info bg-opacity-10 text-info rounded-2 flex-shrink-0"><i class="ti ti-mail fs-4"></i></div>
        <div class="flex-grow-1">
          <strong>${esc(l.jobTitle)} — ${esc(l.company)}</strong>
          <span class="badge bg-light text-secondary border ms-1">${esc(l.lang)}</span><br>
          <small class="text-secondary">From: ${esc(cvs[l.cvId] || 'CV')} · Updated ${fmtDate(l.updatedAt)}</small>
        </div>
        <div class="d-flex gap-1 flex-shrink-0">
          <button class="btn btn-sm btn-outline-primary" data-act="edit" data-id="${l.id}" title="Edit"><i class="ti ti-edit"></i></button>
          <button class="btn btn-sm btn-outline-secondary" data-act="dl" data-id="${l.id}" title="Download .doc"><i class="ti ti-download"></i></button>
          <a class="btn btn-sm btn-outline-success" target="_blank" rel="noopener" title="Share via WhatsApp" href="${waLink(l.body)}"><i class="ti ti-brand-whatsapp"></i></a>
          <button class="btn btn-sm btn-outline-danger" data-act="del" data-id="${l.id}" title="Delete"><i class="ti ti-trash"></i></button>
        </div>
      </div>
    </div>`).join('');
}

function fillCvSelect() {
  const sel = document.getElementById('letterCv');
  sel.innerHTML = getCVs().map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')
    || '<option value="">No CVs yet — create one first</option>';
}

function currentForm() {
  const cvs = getCVs();
  const cv = cvs.find((c) => c.id === document.getElementById('letterCv').value) || cvs[0];
  return {
    cvId: cv ? cv.id : '',
    cvName: cv ? cv.name.split('—')[0].trim() : 'Your Name',
    jobTitle: document.getElementById('letterJob').value.trim(),
    company: document.getElementById('letterCompany').value.trim(),
    manager: document.getElementById('letterManager').value.trim(),
    lang: document.querySelector('input[name="letterLang"]:checked').value,
  };
}

function refreshPreview() {
  const f = currentForm();
  document.getElementById('letterBody').value = buildLetter(f);
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('letterList')) return;
  fillCvSelect();
  renderLetters();
  refreshPreview();

  ['letterCv', 'letterJob', 'letterCompany', 'letterManager'].forEach((id) =>
    document.getElementById(id).addEventListener('input', refreshPreview));
  document.querySelectorAll('input[name="letterLang"]').forEach((r) =>
    r.addEventListener('change', refreshPreview));

  document.getElementById('letterNew').addEventListener('click', () => {
    editingId = null;
    document.getElementById('letterForm').reset();
    fillCvSelect();
    refreshPreview();
    document.getElementById('generator').scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('letterSave').addEventListener('click', () => {
    const f = currentForm();
    if (!f.jobTitle || !f.company) { window.alert('Add a job title and company first.'); return; }
    upsertLetter({ id: editingId, cvId: f.cvId, jobTitle: f.jobTitle, company: f.company, lang: f.lang, body: document.getElementById('letterBody').value });
    editingId = null;
    renderLetters();
  });

  document.getElementById('letterDl').addEventListener('click', () => {
    const f = currentForm();
    downloadDoc(`Cover-Letter-${f.jobTitle || 'draft'}.doc`, document.getElementById('letterBody').value, { headline: false });
  });

  document.getElementById('letterWa').addEventListener('click', (e) => {
    e.preventDefault();
    window.open(waLink(document.getElementById('letterBody').value), '_blank', 'noopener');
  });

  document.getElementById('letterList').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const letters = getLetters();
    const l = letters.find((x) => x.id === btn.dataset.id);
    if (!l) return;
    if (btn.dataset.act === 'del') {
      if (!window.confirm('Delete this letter?')) return;
      deleteLetter(l.id);
      renderLetters();
    }
    if (btn.dataset.act === 'dl') downloadDoc(`Cover-Letter-${l.jobTitle}.doc`, l.body, { headline: false });
    if (btn.dataset.act === 'edit') {
      editingId = l.id;
      fillCvSelect();
      document.getElementById('letterCv').value = l.cvId;
      document.getElementById('letterJob').value = l.jobTitle;
      document.getElementById('letterCompany').value = l.company;
      document.querySelector(`input[name="letterLang"][value="${l.lang}"]`).checked = true;
      document.getElementById('letterBody').value = l.body;
      document.getElementById('generator').scrollIntoView({ behavior: 'smooth' });
    }
  });
});
