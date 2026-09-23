// Cover letters — list, generator (EN/SW), download, WhatsApp share.
import { getCVs, getLetters, upsertLetter, deleteLetter, buildLetter, esc, fmtDate, waLink, downloadDoc, downloadFromBackend } from './mrcv-store.js';
import { t } from './mrcv-i18n.js';

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
      <h3 class="h6 mt-3">${t('ltr.noletters')}</h3>
      <p class="text-secondary small">${t('ltr.nolettersSub')}</p>
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
          <small class="text-secondary">${t('ltr.from')} ${esc(cvs[l.cvId] || 'CV')} · Updated ${fmtDate(l.updatedAt)}</small>
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

// ---- offline AI tailor: job advert keywords + background -> tailored letter ----
const AD_STOP = new Set('the,a,an,and,or,for,with,you,your,our,are,will,have,has,who,can,all,from,that,this,shall,should,would,position,role,work,team,company,job,required,requirements,experience,skills,ability,strong,plus,must,join,looking,seeking,ideal,apply,bank,tz,ajira,kazi,katika,kwa,na,ya,za,wa,hii,hiyo,kama,ili,ni,sana,tena,yetu,yako,yao,mimi,sisi,wewe,also,into,over,under,more,most,very,just,than,about,them,they,their,been,were,was,had,not,but'.split(','));

export function topKeywords(text, n = 3) {
  const freq = {};
  (String(text).toLowerCase().match(/[a-z]{5,}/g) || []).forEach((w) => { if (!AD_STOP.has(w)) freq[w] = (freq[w] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, n).map(([w]) => w.replace(/^\w/, (c) => c.toUpperCase()));
}

export function tailoredLetter(f, kws, bg) {
  const jt = f.jobTitle || 'the advertised position';
  const co = f.company || 'your organisation';
  const mgr = f.manager;
  const bgSnip = String(bg).split(/[.\n]+/).map((s) => s.trim()).filter(Boolean)[0] || (f.lang === 'SW' ? 'uzoefu wangu' : 'my experience');
  const kwTxt = kws.length ? kws.join(', ') : (f.lang === 'SW' ? 'sifa muhimu' : 'key requirements');
  if (f.lang === 'SW') {
    return `${fmtDate(new Date())}\n${mgr || 'Meneja wa Ajira'}\n${co}\nDar es Salaam, Tanzania\n\nNdugu Meneja,\n\nYAH: MAOMBI YA KAZI YA ${jt.toUpperCase()}\n\nMimi, ${f.cvName}, ninaomba kazi ya ${jt} kama ilivyotangazwa.\n\nKutokana na historia yangu — ${bgSnip} — ninafaa mahitaji yako muhimu (${kwTxt}). Wasifu wangu (CV) nilioambatanisha unaeleza elimu, ujuzi na uzoefu wangu zaidi.\n\nNitafurahi kupata fursa ya kujadili maombi yangu kwenye usaili.\n\nWako mtiifu,\n${f.cvName}\nViambatanisho: CV`;
  }
  return `${fmtDate(new Date())}\n${mgr || 'The Hiring Manager'}\n${co}\nDar es Salaam, Tanzania\n\nDear ${mgr ? mgr : 'Sir/Madam'},\n\nRE: APPLICATION FOR THE POSITION OF ${jt.toUpperCase()}\n\nI, ${f.cvName}, wish to apply for the above position as advertised.\n\nDrawing from my background — ${bgSnip} — I am a strong match for your key requirements (${kwTxt}). My CV, attached herewith, outlines my education, skills and experience in more detail.\n\nI would welcome the opportunity to discuss my application at an interview.\n\nYours faithfully,\n${f.cvName}\nAttachments: CV`;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('letterList')) return;
  fillCvSelect();
  renderLetters();
  refreshPreview();

  let letterMode = null;
  try { letterMode = localStorage.getItem('mrcv.letterMode') || null; } catch (e) { /* ignore */ }
  const showLetterMode = (m) => {
    letterMode = m;
    try { localStorage.setItem('mrcv.letterMode', m || ''); } catch (e) { /* ignore */ }
    document.getElementById('modeChooser').classList.toggle('d-none', !!m);
    document.getElementById('aiPanel').classList.toggle('d-none', m !== 'ai');
    document.getElementById('modeChip').classList.toggle('d-none', !m);
    if (m) document.getElementById('modeName').textContent = m === 'ai' ? t('mode.ai') : t('mode.manual');
  };
  showLetterMode(letterMode);
  document.querySelectorAll('#modeChooser [data-mode]').forEach((b) =>
    b.addEventListener('click', () => showLetterMode(b.dataset.mode)));
  document.getElementById('modeChange').addEventListener('click', () => showLetterMode(null));
  document.getElementById('aiGenLetter').addEventListener('click', () => {
    const f = currentForm();
    if (!f.jobTitle || !f.company) { window.alert(t('ltr.needBoth')); return; }
    const kws = topKeywords(document.getElementById('aiAd').value);
    const bg = document.getElementById('aiBg').value;
    document.getElementById('letterBody').value = tailoredLetter(f, kws, bg);
    document.getElementById('aiKeys').textContent = kws.length ? `${t('ai2.matched')} ${kws.join(', ')}` : '';
    document.getElementById('generator').scrollIntoView({ behavior: 'smooth' });
  });

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
    if (!f.jobTitle || !f.company) { window.alert(t('ltr.needBoth')); return; }
    upsertLetter({ id: editingId, cvId: f.cvId, jobTitle: f.jobTitle, company: f.company, lang: f.lang, body: document.getElementById('letterBody').value });
    editingId = null;
    renderLetters();
  });

  document.getElementById('letterDl').addEventListener('click', async () => {
    const f = currentForm();
    const text = document.getElementById('letterBody').value;
    const name = `Cover-Letter-${f.jobTitle || 'draft'}`;
    const html = text.split('\n').map((p) => (p.trim() ? `<p>${esc(p.trim())}</p>` : '')).join('');
    const css = 'body{font-family:Georgia,serif;font-size:12pt;color:#111;}p{margin:0 0 8pt;}';
    const ok = await downloadFromBackend('docx', { html, css, filename: name });
    if (!ok) downloadDoc(`${name}.doc`, text, { headline: false });
  });

  document.getElementById('letterWa').addEventListener('click', (e) => {
    e.preventDefault();
    window.open(waLink(document.getElementById('letterBody').value), '_blank', 'noopener');
  });

  document.getElementById('letterList').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const letters = getLetters();
    const l = letters.find((x) => x.id === btn.dataset.id);
    if (!l) return;
    if (btn.dataset.act === 'del') {
      if (!window.confirm(t('ltr.delConfirm'))) return;
      deleteLetter(l.id);
      renderLetters();
    }
    if (btn.dataset.act === 'dl') {
      const html = l.body.split('\n').map((p) => (p.trim() ? `<p>${esc(p.trim())}</p>` : '')).join('');
      const ok = await downloadFromBackend('docx', { html, css: 'body{font-family:Georgia,serif;font-size:12pt;}p{margin:0 0 8pt;}', filename: `Cover-Letter-${l.jobTitle}` });
      if (!ok) downloadDoc(`Cover-Letter-${l.jobTitle}.doc`, l.body, { headline: false });
    }
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
