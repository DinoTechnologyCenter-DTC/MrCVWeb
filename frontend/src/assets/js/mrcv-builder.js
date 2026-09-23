// MrCV guided builder — form <-> data <-> live preview, autosaved locally.
import { getCV, createCV, updateCV, blankData, TEMPLATE_LABELS, esc, waLink, downloadDoc, normalizeTZPhone, cvToHTML, getUser, COUNTRIES } from './mrcv-store.js';
import { t, lang } from './mrcv-i18n.js';

const params = new URLSearchParams(location.search);
let cvId = params.get('id') || null;
let template = params.get('template') || 'graduate';
if (!TEMPLATE_LABELS[template] || template === 'barua') template = 'graduate';

// Entry mode: chooser -> manual (guided form) or ai (smart draft)
let entryMode = params.get('mode') || null;
try { entryMode = entryMode || localStorage.getItem('mrcv.cvMode') || null; } catch (e) { /* ignore */ }
let aiShowForm = false;
let aiPreviewOpen = false;
function applyAiLayout() {
  const aiCol = document.getElementById('aiCol');
  const builderCol = document.getElementById('builderCol');
  const cvCol = document.getElementById('cvCol');
  const collapseBtn = document.getElementById('previewCollapse');
  if (entryMode !== 'ai') {
    aiCol.className = 'col-12 d-none no-print';
    builderCol.className = 'col-12 col-lg-6 no-print';
    cvCol.className = 'col-12 col-lg-6';
    if (collapseBtn) collapseBtn.classList.add('d-none');
    return;
  }
  // AI mode: chat left, preview docked right like a sidebar panel — only when expanded
  aiCol.className = aiPreviewOpen ? 'col-12 col-lg-5 no-print' : 'col-12 no-print';
  builderCol.className = aiShowForm ? 'col-12 no-print' : 'd-none';
  cvCol.className = aiPreviewOpen ? 'col-12 col-lg-7' : 'd-none';
  if (collapseBtn) collapseBtn.classList.toggle('d-none', !aiPreviewOpen);
}
function showMode(m) {
  entryMode = m;
  try { localStorage.setItem('mrcv.cvMode', m || ''); } catch (e) { /* ignore */ }
  document.getElementById('modeChooser').classList.toggle('d-none', !!m);
  document.getElementById('manualBars').classList.toggle('d-none', m !== 'manual');
  document.getElementById('modeChip').classList.toggle('d-none', !m);
  if (m === 'ai') { aiShowForm = false; aiPreviewOpen = false; }
  applyAiLayout();
  if (m) document.getElementById('modeName').textContent = m === 'ai' ? t('mode.ai') : t('mode.manual');
  if (m === 'ai') {
    document.getElementById('aiExpandBtn').classList.toggle('d-none', !data.personal.fullName);
    startChat();
  }
}

// ---- AI chat state + rendering (module scope so showMode can start it) ----
const chat = { step: -1, name: '', job: '', level: 'student' };
function scrollLog() {
  const log = document.getElementById('chatLog');
  if (!log) return;
  const nearBottom = log.scrollHeight - log.scrollTop - (log.clientHeight || 0) < 140;
  if (!nearBottom) return;
  try { log.scrollTo({ top: log.scrollHeight, behavior: 'smooth' }); }
  catch (e) { log.scrollTop = log.scrollHeight; }
}
function chatAdd(who, html) {
  const log = document.getElementById('chatLog');
  const div = document.createElement('div');
  div.className = who === 'user' ? 'd-flex justify-content-end mb-3' : 'd-flex mb-3';
  div.innerHTML = who === 'user'
    ? `<div class="bubble-user">${html}</div>`
    : `<div class="d-flex gap-2"><div class="chat-avatar"><i class="ti ti-sparkles"></i></div><div class="bubble-bot">${html}</div></div>`;
  log.appendChild(div);
  scrollLog();
}
function chatAsk(html, chips = []) {
  const box = document.getElementById('chatChips');
  box.innerHTML = chips.map((c) => `<button class="btn btn-sm btn-outline-primary" data-chip="${c.v}">${esc(c.label)}</button>`).join('');
  const ty = document.createElement('div');
  ty.className = 'd-flex mb-3';
  ty.innerHTML = '<div class="d-flex gap-2"><div class="chat-avatar"><i class="ti ti-sparkles"></i></div><div class="bubble-bot typing"><span></span><span></span><span></span></div></div>';
  const log = document.getElementById('chatLog');
  log.appendChild(ty);
  scrollLog();
  setTimeout(() => { ty.remove(); chatAdd('bot', html); }, 600);
}
function startChat() {
  const log = document.getElementById('chatLog');
  if (log.dataset.started) return;
  log.dataset.started = '1';
  Object.assign(chat, { step: 0, name: '', job: '', level: 'student' });
  chatAdd('bot', esc(t('chat.hi')));
  setTimeout(() => chatAsk(t('chat.qName')), 800);
}
let data = blankData();
const TPL_DEFAULTS = { graduate: '#E66239', government: '#00C951', banking: '#E66239', general: '#E66239' };
const FONTS = { poppins: "'Poppins',sans-serif", georgia: "Georgia,'Times New Roman',serif", arial: "Arial,Helvetica,sans-serif" };
const SIZES = { s: '12px', m: '13px', l: '14.5px' };
let theme = { color: TPL_DEFAULTS[template] || '#E66239', font: 'poppins', size: 'm' };
// sections revealed during AI streaming (null = show all)
let aiReveal = null;
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
  history.replaceState(null, '', `new-cv.html?id=${cvId}${entryMode ? `&mode=${entryMode}` : ''}`);
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
  if (el) el.textContent = `${t('bld.savedAt')}${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
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
    <button class="btn btn-sm btn-link link-danger p-0 mt-1" data-del>${t('bld.remove')}</button>
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
    <button class="btn btn-sm btn-link link-danger p-0 mt-1" data-del>${t('bld.remove')}</button>
  </div>`;
}
function projItem(p, i) {
  return `<div class="border rounded p-2 mb-2" data-row="projects" data-idx="${i}">
    <input class="form-control form-control-sm mb-2" data-f="name" value="${esc(p.name)}" placeholder="Project name">
    <textarea class="form-control form-control-sm" rows="2" data-f="desc" placeholder="What you did / result">${esc(p.desc)}</textarea>
    <button class="btn btn-sm btn-link link-danger p-0 mt-1" data-del>${t('bld.remove')}</button>
  </div>`;
}
function refItem(r, i) {
  return `<div class="border rounded p-2 mb-2" data-row="referees" data-idx="${i}">
    <div class="row g-2">
      <div class="col-12"><input class="form-control form-control-sm" data-f="name" value="${esc(r.name)}" placeholder="Full name"></div>
      <div class="col-md-6"><input class="form-control form-control-sm" data-f="title" value="${esc(r.title)}" placeholder="Title, e.g. Head Teacher"></div>
      <div class="col-md-6"><input class="form-control form-control-sm" data-f="phone" data-phone value="${esc(r.phone)}" inputmode="tel" placeholder="Phone, e.g. 0765…"></div>
    </div>
    <button class="btn btn-sm btn-link link-danger p-0 mt-1" data-del>${t('bld.remove')}</button>
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
function renderPreview() {
  const sheet = document.getElementById('cvSheet');
  sheet.className = `cv-sheet tpl-${template}`;
  sheet.innerHTML = cvToHTML(data, aiReveal);
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

// ---- offline AI draft: rough text -> structured CV ----
const TZ_CITIES = ['Dar es Salaam', 'Arusha', 'Mwanza', 'Dodoma', 'Mbeya', 'Morogoro', 'Tanga', 'Moshi', 'Iringa', 'Tabora', 'Kigoma', 'Shinyanga', 'Mtwara', 'Lindi', 'Singida', 'Bukoba', 'Musoma', 'Zanzibar', 'Kariakoo', 'Ubungo', 'Kinondoni', 'Temeke'];
const SKILL_WORDS = ['computer', 'driving', 'teaching', 'cooking', 'tailoring', 'electrical', 'plumbing', 'networking', 'office', 'communication', 'leadership', 'teamwork', 'customer', 'sales', 'cashier', 'typing', 'english', 'kiswahili', 'first aid', 'carpentry', 'welding', 'hairdressing', 'photography', 'accounting'];

export function aiDraft(src) {
  const g = (id) => document.getElementById(id).value;
  const name = ((src && src.name) ?? g('aiName')).trim();
  const job = ((src && src.job) ?? g('aiJob')).trim() || 'General Worker';
  const level = (src && src.level) || g('aiLevel');
  const about = (src && src.about) ?? g('aiAbout') ?? '';
  const sw = lang() === 'sw';
  const d = blankData();
  d.personal.fullName = name;
  d.personal.title = job;
  const ph = about.match(/(\+255|0)\s?\d{3}\s?\d{3}\s?\d{3}/);
  if (ph) d.personal.phone = normalizeTZPhone(ph[0]);
  const em = about.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  if (em) d.personal.email = em[0].replace(/[.,;]+$/, '');
  const city = TZ_CITIES.find((c) => about.toLowerCase().includes(c.toLowerCase()));
  if (city) d.personal.address = city;
  const summaries = {
    student: sw ? `Mwanafunzi mwenye bidii anayetafuta nafasi ya ${job}. Haraka kujifunza, mwenye nidhamu na tayari kuchangia tangu siku ya kwanza.`
      : `Motivated and hardworking student seeking a ${job} position. Quick to learn, disciplined and ready to contribute from day one.`,
    fresher: sw ? `Mhitimu mpya mwenye nguvu anayetafuta kazi ya ${job}. Niko tayari kutumia mafunzo yangu, kujifunza haraka na kutoa matokeo.`
      : `Energetic fresh graduate seeking a ${job} position. Eager to apply my training, learn fast and deliver results.`,
    experienced: sw ? `Mwenye uzoefu kama ${job} mwenye rekodi ya kazi ya kuaminika na yenye ubora. Mawasiliano mazuri, mchezaji wa timu na mtatuzi wa matatizo.`
      : `Experienced ${job} with a record of reliable, quality work. Strong communicator, team player and problem solver.`,
  };
  d.personal.summary = summaries[level] || summaries.student;
  const sentences = about.split(/[\n.]+/).map((s) => s.trim()).filter((s) => s.length > 4 && !/^\d[\d\s+]*$/.test(s) && !s.includes('@'));
  const empMatch = about.match(/(?:at|kwa|kwenye)\s+([A-Z][\w&'’.-]+(?:\s+[A-Z][\w&'’.-]+){0,3})/);
  const lower = about.toLowerCase();
  if (/degree|bachelor|shahada ya/i.test(about)) d.education = [{ school: '', qualification: sw ? 'Shahada ya Kwanza (weka chuo)' : 'Bachelor Degree (add university)', start: '', end: '' }];
  else if (/diploma|stashahada/i.test(about)) d.education = [{ school: '', qualification: 'Diploma (add school)', start: '', end: '' }];
  else if (/form six|acsee|advance|kidato cha sita/i.test(about)) d.education = [{ school: '', qualification: sw ? 'Kidato cha Sita — ACSEE' : 'Form Six — ACSEE', start: '', end: '' }];
  else if (/form four|csee|kidato cha nne/i.test(about)) d.education = [{ school: '', qualification: sw ? 'Kidato cha Nne — CSEE' : 'Form Four — CSEE', start: '', end: '' }];
  if (sentences.length) {
    d.experience = [{
      employer: empMatch ? empMatch[1].trim() : '',
      role: job, start: '', end: sw ? 'Sasa' : 'Present',
      bullets: sentences.slice(0, 6).join('\n'),
    }];
  }
  const found = SKILL_WORDS.filter((w) => lower.includes(w));
  d.skills = [...new Set(found)].map((w) => w.replace(/\b\w/g, (c) => c.toUpperCase())).join('\n');
  return d;
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
  document.querySelectorAll('#modeChooser [data-mode]').forEach((b) =>
    b.addEventListener('click', () => showMode(b.dataset.mode)));
  document.getElementById('modeChange').addEventListener('click', () => showMode(null));
  document.getElementById('aiPromoBtn').addEventListener('click', () => {
    showMode('ai');
    document.getElementById('aiCol').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // ---- AI chat input handling ----
  function chatSend(text) {
    const v = String(text || '').trim();
    if (!v || chat.step < 0 || chat.step > 3) return;
    chatAdd('user', esc(v));
    document.getElementById('chatInput').value = '';
    document.getElementById('chatChips').innerHTML = '';
    if (chat.step === 0) {
      chat.name = v; chat.step = 1;
      setTimeout(() => chatAsk(t('chat.qJob').replace('{name}', esc(chat.name.split(' ')[0]))), 700);
    } else if (chat.step === 1) {
      chat.job = v; chat.step = 2;
      setTimeout(() => chatAsk(t('chat.qLevel'), [
        { v: 'student', label: t('ai.lStudent') },
        { v: 'fresher', label: t('ai.lFresher') },
        { v: 'experienced', label: t('ai.lExperienced') },
      ]), 700);
    } else if (chat.step === 3) {
      chat.step = 4;
      chatAdd('bot', esc(t('chat.generating')));
      setTimeout(() => {
        data = aiDraft({ name: chat.name, job: chat.job || 'General Worker', level: chat.level, about: v });
        renderRepeaters(); renderScore(); scheduleSave();
        const stages = [
          ['summary', 'chat.sSummary'], ['experience', 'chat.sExp'], ['education', 'chat.sEdu'],
          ['skills', 'chat.sSkills'], ['projects', 'chat.sProj'], ['referees', 'chat.sRef'],
        ];
        aiReveal = [];
        renderPreview();
        let i = 0;
        const revealStep = () => {
          if (i >= stages.length) {
            aiReveal = null;
            renderPreview();
            chatAdd('bot', `${esc(t('chat.done'))}<br><button class="btn btn-sm btn-primary mt-2" id="chatExpand"><i class="ti ti-arrows-maximize"></i> ${esc(t('preview.expand'))}</button>`);
            document.getElementById('chatExpand').addEventListener('click', () => {
              aiPreviewOpen = true;
              applyAiLayout();
              document.getElementById('cvCol').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
            document.getElementById('aiExpandBtn').classList.remove('d-none');
            return;
          }
          aiReveal.push(stages[i][0]);
          chatAdd('bot', `<small class="text-secondary">${esc(t(stages[i][1]))}</small>`);
          renderPreview();
          document.getElementById('cvSheet').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          i += 1;
          setTimeout(revealStep, 750);
        };
        setTimeout(revealStep, 800);
      }, 900);
    }
  }
  document.getElementById('chatSend').addEventListener('click', () =>
    chatSend(document.getElementById('chatInput').value));
  document.getElementById('chatInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); chatSend(e.target.value); }
  });
  document.getElementById('chatChips').addEventListener('click', (e) => {
    const chip = e.target.closest('[data-chip]');
    if (!chip || chat.step !== 2) return;
    chat.level = chip.dataset.chip;
    chatAdd('user', esc(chip.textContent));
    document.getElementById('chatChips').innerHTML = '';
    chat.step = 3;
    setTimeout(() => chatAsk(t('chat.qAbout')), 700);
  });
  document.getElementById('chatRestart').addEventListener('click', () => {
    const log = document.getElementById('chatLog');
    log.innerHTML = '';
    delete log.dataset.started;
    aiReveal = null;
    renderPreview();
    document.getElementById('aiExpandBtn').classList.add('d-none');
    startChat();
  });
  document.getElementById('aiEditBtn').addEventListener('click', () => {
    aiShowForm = !aiShowForm;
    applyAiLayout();
    document.getElementById(aiShowForm ? 'builderCol' : 'aiCol').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  document.getElementById('aiExpandBtn').addEventListener('click', () => {
    aiPreviewOpen = !aiPreviewOpen;
    applyAiLayout();
    if (aiPreviewOpen) document.getElementById('cvCol').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  document.getElementById('previewCollapse').addEventListener('click', () => {
    aiPreviewOpen = false;
    applyAiLayout();
    document.getElementById('aiCol').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

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

  document.getElementById('fillProfile').addEventListener('click', () => {
    const u = getUser();
    if (u.name) data.personal.fullName = u.name;
    if (u.phone) data.personal.phone = u.phone;
    if (u.email) data.personal.email = u.email;
    const co = COUNTRIES.find((c) => c.code === u.country);
    const loc = [u.region, co ? co.name : u.country].filter(Boolean).join(', ');
    if (loc) data.personal.address = loc;
    renderRepeaters(); renderPreview(); renderScore(); scheduleSave();
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
  showMode(entryMode);
});
