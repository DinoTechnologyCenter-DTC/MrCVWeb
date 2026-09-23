// My CVs dashboard — renders stats + CV list from local store.
import { getCVs, getLetters, duplicateCV, deleteCV, bumpDownloads, esc, fmtDate, matchBadge, waLink } from './mrcv-store.js';
import { t } from './mrcv-i18n.js';

function templateName(slug) {
  return { graduate: 'Graduate', government: 'Govt/NGO', banking: 'Banking', general: 'General', clinical: 'Clinical', barua: 'Barua' }[slug] || slug;
}

function renderStats() {
  const cvs = getCVs();
  const letters = getLetters();
  const avg = cvs.length ? Math.round(cvs.reduce((a, c) => a + (c.match || 0), 0) / cvs.length) : 0;
  const dls = cvs.reduce((a, c) => a + (c.downloads || 0), 0);
  document.getElementById('statCvs').textContent = cvs.length;
  document.getElementById('statLetters').textContent = letters.length;
  document.getElementById('statMatch').textContent = cvs.length ? `${avg}%` : '—';
  document.getElementById('statDownloads').textContent = dls;
}

function renderList() {
  const cvs = getCVs();
  const box = document.getElementById('cvList');
  if (!cvs.length) {
    box.innerHTML = `
      <div class="text-center py-5">
        <i class="ti ti-files fs-1 text-secondary"></i>
        <h3 class="h6 mt-3">${t('idx.emptyT')}</h3>
        <p class="text-secondary small">${t('idx.emptyS')}</p>
        <a href="new-cv.html" class="btn btn-primary btn-sm"><i class="ti ti-plus"></i> ${t('idx.createFirst')}</a>
      </div>`;
    return;
  }
  box.innerHTML = cvs.map((cv) => `
    <div class="list-group-item p-3 d-flex flex-column flex-md-row gap-3 align-items-md-center">
      <div class="icon-shape icon-md bg-primary bg-opacity-10 text-primary rounded-2 flex-shrink-0">
        <i class="ti ti-file-text fs-4"></i>
      </div>
      <div class="flex-grow-1">
        <div class="d-flex flex-wrap align-items-center gap-2">
          <strong>${esc(cv.name)}</strong>
          ${matchBadge(cv.match || 0)}
          <span class="badge bg-light text-secondary border">${esc(templateName(cv.template))}</span>
        </div>
        <small class="text-secondary">${esc(cv.target || '')} · Updated ${fmtDate(cv.updatedAt)} · ${cv.downloads || 0} downloads</small>
      </div>
      <div class="d-flex gap-1 flex-shrink-0">
        <a href="new-cv.html?id=${encodeURIComponent(cv.id)}" class="btn btn-sm btn-outline-primary" title="Open"><i class="ti ti-edit"></i></a>
        <button class="btn btn-sm btn-outline-secondary" data-act="dup" data-id="${esc(cv.id)}" title="Duplicate"><i class="ti ti-copy"></i></button>
        <a class="btn btn-sm btn-outline-success" target="_blank" rel="noopener" title="Share via WhatsApp"
           href="${waLink(`My CV: ${cv.name} — made with MrCV`)}"><i class="ti ti-brand-whatsapp"></i></a>
        <button class="btn btn-sm btn-outline-danger" data-act="del" data-id="${esc(cv.id)}" title="Delete"><i class="ti ti-trash"></i></button>
      </div>
    </div>`).join('');
}

function renderChecklist() {
  const cvs = getCVs();
  const letters = getLetters();
  const steps = [
    { done: cvs.length > 0, text: t('idx.s1') },
    { done: letters.length > 0, text: t('idx.s2') },
    { done: cvs.reduce((a, c) => a + (c.downloads || 0), 0) > 0, text: t('idx.s3') },
  ];
  document.getElementById('startList').innerHTML = steps.map((s) => `
    <li class="list-group-item d-flex align-items-center gap-2 border-0 px-0 py-2">
      <i class="ti ${s.done ? 'ti-circle-check text-success' : 'ti-circle text-secondary'} fs-5"></i>
      <span class="${s.done ? 'text-decoration-line-through text-secondary' : ''}">${s.text}</span>
    </li>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('cvList')) return;
  renderStats();
  renderList();
  renderChecklist();
  document.getElementById('cvList').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const { act, id } = btn.dataset;
    if (act === 'dup') { duplicateCV(id); }
    if (act === 'del' && !window.confirm(t('idx.delConfirm'))) return;
    if (act === 'del') { deleteCV(id); }
    if (act === 'dl') { bumpDownloads(id); }
    renderStats(); renderList(); renderChecklist();
  });
});
