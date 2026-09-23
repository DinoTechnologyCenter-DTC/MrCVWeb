// Templates gallery — renders TZ template cards + filter + preview modal.
import { TEMPLATES, esc } from './mrcv-store.js';

function mockHTML(mock) {
  if (mock === 'letter') {
    return `<div class="cv-mock p-2"><div class="mock-line w-50"></div><div class="mock-line"></div><div class="mock-line"></div><div class="mock-line w-75"></div><div class="mock-line"></div><div class="mock-line w-50"></div></div>`;
  }
  if (mock === 'formal') {
    return `<div class="cv-mock p-2"><div class="mock-head"></div><div class="mock-line"></div><div class="d-flex gap-1"><div class="mock-side"></div><div class="flex-grow-1"><div class="mock-line"></div><div class="mock-line w-75"></div><div class="mock-line"></div></div></div></div>`;
  }
  if (mock === 'compact') {
    return `<div class="cv-mock p-2"><div class="d-flex gap-1 align-items-center"><div class="mock-photo"></div><div class="flex-grow-1"><div class="mock-line"></div><div class="mock-line w-50"></div></div></div><div class="mock-line"></div><div class="mock-line w-75"></div></div>`;
  }
  return `<div class="cv-mock p-2"><div class="mock-head w-75"></div><div class="mock-line"></div><div class="mock-line w-75"></div><div class="mock-line"></div><div class="mock-line w-50"></div></div>`;
}

function cardHTML(t) {
  const use = t.useLink || `new-cv.html?template=${t.slug}`;
  return `
  <div class="col-12 col-md-6 col-lg-4 tpl-card" data-cat="${t.cat}">
    <div class="card h-100">
      <div class="card-body p-3">
        ${mockHTML(t.mock)}
        <h3 class="h6 mt-3 mb-1">${esc(t.name)}</h3>
        <p class="small text-secondary mb-2">${esc(t.desc)}</p>
        <p class="small mb-2"><i class="ti ti-briefcase text-primary"></i> ${esc(t.best)}</p>
        <div class="d-flex flex-wrap gap-1 mb-3">
          ${t.badges.map((b) => `<span class="badge bg-light text-secondary border">${esc(b)}</span>`).join('')}
        </div>
        <div class="d-flex gap-2">
          <a href="${use}" class="btn btn-primary btn-sm flex-grow-1">Use this template</a>
          <button class="btn btn-outline-secondary btn-sm" data-preview="${t.slug}">Preview</button>
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
    modal.querySelector('.modal-title').textContent = t.name;
    modal.querySelector('#tplModalBody').innerHTML = `
      <div class="cv-mock cv-mock-lg p-3 mb-3">${mockHTML(t.mock).replace('cv-mock p-2', 'cv-mock p-2')}</div>
      <p class="small text-secondary">${esc(t.desc)}</p>
      <p class="small"><strong>Best for:</strong> ${esc(t.best)}</p>
      <div class="d-flex flex-wrap gap-1">${t.badges.map((b) => `<span class="badge bg-light text-secondary border">${esc(b)}</span>`).join('')}</div>`;
    modal.querySelector('#tplModalUse').href = t.useLink || `new-cv.html?template=${t.slug}`;
  });
});
