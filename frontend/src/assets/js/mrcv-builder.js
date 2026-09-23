// MrCV guided builder — form <-> data <-> live preview, autosaved locally.
import { getCV, createCV, updateCV, blankData, TEMPLATE_LABELS, esc, waLink, downloadDoc, normalizeTZPhone } from './mrcv-store.js';

const params = new URLSearchParams(location.search);
let cvId = params.get('id') || null;
let template = params.get('template') || 'general';
if (!TEMPLATE_LABELS[template] || template === 'barua') template = 'general';
let data = blankData();
const TPL_DEFAULTS = { graduate: '#E66239', government: '#00C951', banking: '#E66239', general: '#E66239' };
const FONTS = { poppins: "'Poppins',sans-serif", georgia: "Georgia,'Times New Roman',serif", arial: "Arial,Helvetica,sans-serif" };
const SIZES = { s: '12px', m: '13px', l: '14.5px' };
let theme = { color: TPL_DEFAULTS[template] || '#E66239', font: 'poppins', size: 'm' };
if (cvId) {
  const existing = getCV(cvId);
  if (existing && existing.data) { data = existing.data; template = existing.template || template; if (existing.theme) theme = { ...theme, ...existing.theme }; }
  else cvId = null;
}

function applyTheme() {
  const sheet = document.getElementById('cvSheet');
  sheet.style.setProperty('--cv-accent', theme.color);
  sheet.style.setProperty('--cv-font', FONTS[theme.font] || FONTS.poppins);
  sheet.style.setProperty('--cv-size', SIZES[theme.size] || SIZES.m);
  document.querySelectorAll('#themeColors .theme-swatch').forEach((b) =>
    b.classList.toggle('active', b.dataset.color.toLowerCase() === String(theme.color).toLowerCase()));
  document.getElementById('themeFont').value = theme.font;
  document.querySelectorAll('#themeSize [data-size]').forEach((b) => {
    const on = b.dataset.size === theme.size;
    b.classList.toggle('btn-primary', on);
    b.classList.toggle('btn-outline-secondary', !on);
  });
}

let saveTimer = null;
function ensureCV() {
  if (cvId) return cvId;
  const cv = createCV(template);
  cvId = cv.id;
  history.replaceState(null, '', `new-cv.html?id=${cvId}`);
  return cvId;
}
function scheduleSave() {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(persist, 700);
}
function persist() {
  const id = ensureCV();
  const name = data.personal.fullName.trim();
  updateCV(id, {
    template,
    theme,
    data,
    match: completeness(),
    target: data.personal.title.trim(),
    name: name ? `${name} (${TEMPLATE_LABELS[template]})` : 'Untitled CV',
  });
  const el = document.getElementById('saveState');
  if (el) el.textContent = `· Saved ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

// ---- repeaters ----
function eduItem(e, i) {
  return `<div class="border rounded p-2 mb-2" data-row="education" data-idx="${i}">
    <div class="row g-2">
      <div class="col-12"><input class="form-control form-control-sm" data-f="school" value="${esc(e.school)}" placeholder="School / university"></div>
      <div class="col-12"><input class="form-control form-control-sm" data-f="qualification" value="${esc(e.qualification)}" placeholder="Qualification, e.g. Diploma in Teaching"></div>
      <div class="col-6"><input class="form-control form-control-sm" data-f="start" value="${esc(e.start)}" placeholder="Start (e.g. 2019)"></div>
      <div class="col-6"><input class="form-control form-control-sm" data-f="end" value="${esc(e.end)}" placeholder="End (e.g. 2021)"></div>
    </div>
    <button class="btn btn-sm btn-link link-danger p-0 mt-1" data-del>Remove</button>
  </div>`;
}
function expItem(e, i) {
  return `<div class="border rounded p-2 mb-2" data-row="experience" data-idx="${i}">
    <div class="row g-2">
      <div class="col-md-6"><input class="form-control form-control-sm" data-f="role" value="${esc(e.role)}" placeholder="Role, e.g. Sales Assistant"></div>
      <div class="col-md-6"><input class="form-control form-control-sm" data-f="employer" value="${esc(e.employer)}" placeholder="Employer"></div>
      <div class="col-6"><input class="form-control form-control-sm" data-f="start" value="${esc(e.start)}" placeholder="Start"></div>
      <div class="col-6"><input class="form-control form-control-sm" data-f="end" value="${esc(e.end)}" placeholder="End / Present"></div>
      <div class="col-12"><textarea class="form-control form-control-sm" rows="3" data-f="bullets" placeholder="Achievements, one per line:&#10;Served 50+ customers daily&#10;Trained 3 new staff">${esc(e.bullets)}</textarea></div>
    </div>
    <button class="btn btn-sm btn-link link-danger p-0 mt-1" data-del>Remove</button>
  </div>`;
}
function projItem(p, i) {
  return `<div class="border rounded p-2 mb-2" data-row="projects" data-idx="${i}">
    <input class="form-control form-control-sm mb-2" data-f="name" value="${esc(p.name)}" placeholder="Project name">
    <textarea class="form-control form-control-sm" rows="2" data-f="desc" placeholder="What you did / result">${esc(p.desc)}</textarea>
    <button class="btn btn-sm btn-link link-danger p-0 mt-1" data-del>Remove</button>
  </div>`;
}
function refItem(r, i) {
  return `<div class="border rounded p-2 mb-2" data-row="referees" data-idx="${i}">
    <div class="row g-2">
      <div class="col-12"><input class="form-control form-control-sm" data-f="name" value="${esc(r.name)}" placeholder="Full name"></div>
      <div class="col-md-6"><input class="form-control form-control-sm" data-f="title" value="${esc(r.title)}" placeholder="Title, e.g. Head Teacher"></div>
      <div class="col-md-6"><input class="form-control form-control-sm" data-f="phone" data-phone value="${esc(r.phone)}" inputmode="tel" placeholder="Phone, e.g. 0765…"></div>
    </div>
    <button class="btn btn-sm btn-link link-danger p-0 mt-1" data-del>Remove</button>
  </div>`;
}

function renderRepeaters() {
  document.getElementById('eduList').innerHTML = data.education.map(eduItem).join('');
  document.getElementById('expList').innerHTML = data.experience.map(expItem).join('');
  document.getElementById('projList').innerHTML = data.projects.map(projItem).join('');
  document.getElementById('refList').innerHTML = data.referees.map(refItem).join('');
  document.querySelector('[data-bind="personal.fullName"]').value = data.personal.fullName;
  document.querySelector('[data-bind="personal.title"]').value = data.personal.title;
  document.querySelector('[data-bind="personal.phone"]').value = data.personal.phone;
  document.querySelector('[data-bind="personal.email"]').value = data.personal.email;
  document.querySelector('[data-bind="personal.address"]').value = data.personal.address;
  document.querySelector('[data-bind="personal.summary"]').value = data.personal.summary;
  document.querySelector('[data-bind="skills"]').value = data.skills;
}

function scrape() {
  document.querySelectorAll('#builderForm [data-bind]').forEach((el) => {
    const [head, ...rest] = el.dataset.bind.split('.');
    if (rest.length) data[head][rest.join('.')] = el.value;
    else data[head] = el.value;
  });
  const scrapeList = (key, containerId) => {
    data[key] = [...document.querySelectorAll(`#${containerId} [data-row]`)].map((row) => {
      const obj = {};
      row.querySelectorAll('[data-f]').forEach((el) => { obj[el.dataset.f] = el.value; });
      return obj;
    });
  };
  scrapeList('education', 'eduList');
  scrapeList('experience', 'expList');
  scrapeList('projects', 'projList');
  scrapeList('referees', 'refList');
}

// ---- preview ----
function bulletsHTML(text) {
  const lines = String(text || '').split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return '';
  return `<ul class="cv-bullets">${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`;
}
function datesHTML(s, e) {
  const t = [s, e].map((x) => String(x || '').trim()).filter(Boolean).join(' – ');
  return t ? `<span class="cv-dates">${esc(t)}</span>` : '';
}

function renderPreview() {
  const p = data.personal;
  const contact = [p.phone, p.email, p.address].map((x) => String(x || '').trim()).filter(Boolean).join(' · ');
  const skills = String(data.skills || '').split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
  const sheet = document.getElementById('cvSheet');
  sheet.className = `cv-sheet tpl-${template}`;
  sheet.innerHTML = `
    <div class="cv-head">
      <div class="cv-name">${esc(p.fullName) || '<span class="text-secondary">Your Name</span>'}</div>
      ${p.title ? `<div class="cv-title">${esc(p.title)}</div>` : ''}
      ${contact ? `<div class="cv-contact">${esc(contact)}</div>` : ''}
    </div>
    ${p.summary ? `<div class="cv-sec">Summary</div><div>${esc(p.summary)}</div>` : ''}
    ${data.experience.some((e) => e.role || e.employer) ? `<div class="cv-sec">Experience</div>${data.experience.filter((e) => e.role || e.employer).map((e) => `
      <div class="cv-item"><div class="cv-item-head"><span>${esc(e.role)}${e.employer ? ` — ${esc(e.employer)}` : ''}</span>${datesHTML(e.start, e.end)}</div>${bulletsHTML(e.bullets)}</div>`).join('')}` : ''}
    ${data.education.some((e) => e.school || e.qualification) ? `<div class="cv-sec">Education</div>${data.education.filter((e) => e.school || e.qualification).map((e) => `
      <div class="cv-item"><div class="cv-item-head"><span>${esc(e.qualification)}${e.school ? ` — ${esc(e.school)}` : ''}</span>${datesHTML(e.start, e.end)}</div></div>`).join('')}` : ''}
    ${skills.length ? `<div class="cv-sec">Skills</div><div>${skills.map((s) => `<span class="skill-chip">${esc(s)}</span>`).join('')}</div>` : ''}
    ${data.projects.some((x) => x.name || x.desc) ? `<div class="cv-sec">Projects</div>${data.projects.filter((x) => x.name || x.desc).map((x) => `
      <div class="cv-item"><div class="cv-item-head"><span>${esc(x.name)}</span></div><div>${esc(x.desc)}</div></div>`).join('')}` : ''}
    ${data.referees.some((r) => r.name) ? `<div class="cv-sec">Referees</div>${data.referees.filter((r) => r.name).map((r) => `
      <div class="cv-item"><strong>${esc(r.name)}</strong>${r.title ? ` — ${esc(r.title)}` : ''}${r.phone ? `<br><span class="cv-dates">${esc(r.phone)}</span>` : ''}</div>`).join('')}` : ''}`;
}

function completeness() {
  const checks = [
    !!data.personal.fullName.trim(),
    !!data.personal.title.trim(),
    !!data.personal.phone.trim(),
    !!data.personal.email.trim(),
    !!data.personal.summary.trim(),
    data.education.some((e) => e.school.trim() && e.qualification.trim()),
    data.experience.some((e) => e.role.trim() && e.employer.trim()),
    !!String(data.skills).trim(),
    data.referees.filter((r) => r.name.trim() && r.phone.trim()).length >= 2,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
function renderScore() {
  const s = completeness();
  document.getElementById('completeBar').style.width = `${s}%`;
  document.getElementById('completeTxt').textContent = `${s}%`;
}

function plainText() {
  const p = data.personal;
  const out = [p.fullName, p.title, [p.phone, p.email, p.address].filter(Boolean).join(' | '), ''];
  if (p.summary) out.push('SUMMARY', '', p.summary, '');
  if (data.experience.some((e) => e.role)) {
    out.push('EXPERIENCE', '');
    data.experience.forEach((e) => { if (e.role || e.employer) { out.push(`${e.role} — ${e.employer} (${e.start} - ${e.end})`); String(e.bullets).split('\n').forEach((b) => { if (b.trim()) out.push(`- ${b.trim()}`); }); } });
    out.push('');
  }
  if (data.education.some((e) => e.school)) {
    out.push('EDUCATION', '');
    data.education.forEach((e) => { if (e.school || e.qualification) out.push(`${e.qualification} — ${e.school} (${e.start} - ${e.end})`); });
    out.push('');
  }
  if (String(data.skills).trim()) out.push('SKILLS', '', String(data.skills).trim(), '');
  const refs = data.referees.filter((r) => r.name.trim());
  if (refs.length) { out.push('REFEREES', ''); refs.forEach((r) => out.push(`${r.name}${r.title ? `, ${r.title}` : ''}${r.phone ? ` — ${r.phone}` : ''}`)); }
  return out.join('\n');
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('builderForm');
  if (!form) return;
  document.querySelectorAll('#tplPills [data-tpl]').forEach((b) => {
    if (b.dataset.tpl === template) { b.classList.remove('btn-outline-primary'); b.classList.add('btn-primary'); }
    b.addEventListener('click', () => {
      template = b.dataset.tpl;
      theme.color = TPL_DEFAULTS[template] || theme.color;
      document.querySelectorAll('#tplPills [data-tpl]').forEach((x) => { x.classList.add('btn-outline-primary'); x.classList.remove('btn-primary'); });
      b.classList.remove('btn-outline-primary'); b.classList.add('btn-primary');
      applyTheme(); renderPreview(); scheduleSave();
    });
  });

  document.querySelectorAll('#themeColors .theme-swatch').forEach((b) =>
    b.addEventListener('click', () => { theme.color = b.dataset.color; applyTheme(); scheduleSave(); }));
  document.getElementById('themeFont').addEventListener('change', (e) => { theme.font = e.target.value; applyTheme(); scheduleSave(); });
  document.querySelectorAll('#themeSize [data-size]').forEach((b) =>
    b.addEventListener('click', () => { theme.size = b.dataset.size; applyTheme(); scheduleSave(); }));
  applyTheme();

  renderRepeaters();
  renderPreview();
  renderScore();

  form.addEventListener('input', () => { scrape(); renderPreview(); renderScore(); scheduleSave(); });
  form.addEventListener('focusout', (e) => {
    if (e.target.matches('[data-phone]') && e.target.value.trim()) {
      e.target.value = normalizeTZPhone(e.target.value);
      scrape(); renderPreview(); scheduleSave();
    }
  });
  form.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) {
      const blanks = { education: { school: '', qualification: '', start: '', end: '' }, experience: { employer: '', role: '', start: '', end: '', bullets: '' }, projects: { name: '', desc: '' }, referees: { name: '', title: '', phone: '' } };
      scrape();
      data[add.dataset.add].push(blanks[add.dataset.add]);
      renderRepeaters(); renderPreview(); scheduleSave();
      return;
    }
    const del = e.target.closest('[data-del]');
    if (del) {
      scrape();
      const row = del.closest('[data-row]');
      data[row.dataset.row].splice(Number(row.dataset.idx), 1);
      if (!data[row.dataset.row].length) {
        const blanks = { education: [{ school: '', qualification: '', start: '', end: '' }], experience: [{ employer: '', role: '', start: '', end: '', bullets: '' }], projects: [{ name: '', desc: '' }], referees: [{ name: '', title: '', phone: '' }] };
        data[row.dataset.row] = blanks[row.dataset.row];
      }
      renderRepeaters(); renderPreview(); renderScore(); scheduleSave();
    }
  });

  document.getElementById('btnPrint').addEventListener('click', () => {
    persist();
    const cv = cvId ? getCV(cvId) : null;
    if (cv) updateCV(cvId, { downloads: (cv.downloads || 0) + 1 });
    window.print();
  });
  document.getElementById('btnDoc').addEventListener('click', () => {
    persist();
    downloadDoc(`${data.personal.fullName || 'My'}-CV.doc`, plainText());
  });
  document.getElementById('btnWa').addEventListener('click', (e) => {
    e.preventDefault();
    persist();
    window.open(waLink(`My CV: ${data.personal.fullName || 'Untitled'} — ${data.personal.title || ''}\n${plainText().slice(0, 500)}`), '_blank', 'noopener');
  });
});
