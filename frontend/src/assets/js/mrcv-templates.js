// Templates gallery — all real templates: 4 CV designs + application letter.
import { TEMPLATES, SAMPLE_CV, SAMPLE_LETTER, cvToHTML, letterToHTML, esc } from './mrcv-store.js';
import { t as tr } from './mrcv-i18n.js';

function previewHTML(t) {
  if (t.kind === 'letter') return `<div class="cv-sheet tpl-letter cv-zoom">${letterToHTML(SAMPLE_LETTER)}</div>`;
  return `<div class="cv-sheet tpl-${t.slug} cv-zoom">${cvToHTML(SAMPLE_CV)}</div>`;
}

function cardHTML(t) {
  const use = t.useLink || `new-cv.html?template=${t.slug}`;
  return `
  <div class="col-12 col-md-6 col-lg-4 tpl-card" data-cat="${t.cat}">
    <div class="card h-100">
      <div class="card-body p-3 d-flex flex-column">
        <div class="cv-frame cv-frame-sm mb-3">${previewHTML(t)}</div>
        <h3 class="h6 mb-1">${esc(t.name)}</h3>
        <p class="small text-secondary mb-2">${esc(t.desc)}</p>
        <p class="small mb-2"><i class="ti ti-briefcase text-primary"></i> ${tr('tpl.bestfor')} ${esc(t.best)}</p>
        <div class="d-flex flex-wrap gap-1 mb-3">
          ${t.badges.map((b) => `<span class="badge bg-light text-secondary border">${esc(b)}</span>`).join('')}
        </div>
        <div class="d-flex gap-2 mt-auto">
          <a href="${use}" class="btn btn-primary btn-sm flex-grow-1">${tr('tpl.use')}</a>
          <button class="btn btn-outline-secondary btn-sm" data-preview="${t.slug}" data-bs-toggle="modal" data-bs-target="#tplModal">${tr('tpl.preview')}</button>
        </div>
      </div>
    </div>
  </div>`;
}

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('tplGrid');
  if (!grid) return;
  grid.innerHTML = TEMPLATES.map(cardHTML).join('');

  document.querySelectorAll('[data-filter]').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      const f = chip.dataset.filter;
      document.querySelectorAll('.tpl-card').forEach((card) => {
        card.style.display = f === 'all' || card.dataset.cat === f ? '' : 'none';
      });
    });
  });

  const modal = document.getElementById('tplModal');
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-preview]');
    if (!btn || !modal) return;
    const t = TEMPLATES.find((x) => x.slug === btn.dataset.preview);
    if (!t) return;
    const full = t.kind === 'letter'
      ? `<div class="cv-sheet tpl-letter">${letterToHTML(SAMPLE_LETTER)}</div>`
      : `<div class="cv-sheet tpl-${t.slug}">${cvToHTML(SAMPLE_CV)}</div>`;
    modal.querySelector('.modal-title').textContent = t.name;
    modal.querySelector('#tplModalBody').innerHTML = full;
    modal.querySelector('#tplModalUse').href = t.useLink || `new-cv.html?template=${t.slug}`;
  });
});
