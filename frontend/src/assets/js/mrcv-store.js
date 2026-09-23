// MrCV local-first store — P0: works with no account, data stays on device.
const KEY = 'mrcv.v1';
const nowISO = () => new Date().toISOString();

export const TEMPLATES = [
  { slug: 'graduate', name: 'Graduate Starter', cat: 'graduate', mock: 'clean',
    desc: 'No experience? No problem. Education-first layout with projects and attachment section.',
    best: 'Students, fresh graduates, interns', badges: ['ATS-safe', 'EN/SW', 'Free'] },
  { slug: 'government', name: 'Government & NGO', cat: 'government', mock: 'formal',
    desc: 'Formal 2-page layout with referees block, made for Ajira portal and NGO applications.',
    best: 'Government, NGOs, teaching', badges: ['ATS-safe', 'Referees', 'Free'] },
  { slug: 'banking', name: 'Banking & Telecom', cat: 'banking', mock: 'compact',
    desc: 'Compact 1-page, skills-first layout recruiters at banks and telcos scan in seconds.',
    best: 'Banks, Vodacom / Tigo / Airtel', badges: ['ATS-safe', '1-page', 'Free'] },
  { slug: 'general', name: 'General Professional', cat: 'general', mock: 'clean',
    desc: 'Balanced 2-page CV for any role. Work history first, clean headings parsers love.',
    best: 'Any role, experienced hires', badges: ['ATS-safe', 'EN/SW', 'Free'] },
  { slug: 'clinical', name: 'Professional Two-Column', cat: 'general', mock: 'formal',
    desc: 'Teal two-column design converted from a pro layout. Best for email and hand-in; use an ATS-clean template for portals.',
    best: 'Doctors, nurses, consultants, hand-in CVs', badges: ['2-column', 'Print-ready', 'Free'] },
  { slug: 'barua', name: 'Application Letter (Barua ya Maombi)', cat: 'barua', kind: 'letter', mock: 'letter',
    desc: 'Swahili or English application-letter layout. Pairs with any CV for a complete application pack.',
    best: 'Barua za maombi kwa Kiswahili au Kiingereza', badges: ['Kiswahili', 'Letter', 'Free'], useLink: 'cover-letters.html#generator' },
];

function seedLetterEN(cvName, jobTitle, company) {
  return `${fmtDate(new Date())}\nThe Hiring Manager\n${company}\nDar es Salaam, Tanzania\n\nDear Sir/Madam,\n\nRE: APPLICATION FOR THE POSITION OF ${jobTitle.toUpperCase()}\n\nI, ${cvName}, wish to apply for the above position as advertised. My CV, attached herewith, outlines my education, skills and experience relevant to this role.\n\nI am hardworking, quick to learn and ready to contribute to ${company}. I would welcome the opportunity to discuss my application at an interview.\n\nYours faithfully,\n${cvName}\nAttachments: CV`;
}

function seedLetterSW(cvName, jobTitle, company) {
  return `${fmtDate(new Date())}\nMeneja wa Ajira\n${company}\nDar es Salaam, Tanzania\n\nNdugu Meneja,\n\nYAH: MAOMBI YA KAZI YA ${jobTitle.toUpperCase()}\n\nMimi, ${cvName}, ninaomba kazi ya ${jobTitle} kama ilivyotangazwa. Wasifu wangu (CV) nilioambatanisha unaeleza elimu, ujuzi na uzoefu wangu unaohusiana na kazi hii.\n\nNina bidii, nina uwezo wa kujifunza haraka na niko tayari kuchangia ${company}. Nitafurahi kupata fursa ya kujadili maombi yangu kwenye usaili.\n\nWako mtiifu,\n${cvName}\nViambatanisho: CV`;
}

function seed() {
  return {
    seq: 100,
    cvs: [
      { id: 'cv-master', name: 'Juma Mwansa — Master CV', template: 'general', lang: 'EN', target: 'General applications', match: 72, downloads: 3, updatedAt: nowISO() },
      { id: 'cv-crdb', name: 'Teller Application — CRDB', template: 'banking', lang: 'EN', target: 'CRDB Bank Teller', match: 86, downloads: 1, updatedAt: nowISO() },
    ],
    letters: [
      { id: 'lt-1', cvId: 'cv-crdb', jobTitle: 'Bank Teller', company: 'CRDB Bank', lang: 'EN', updatedAt: nowISO(),
        body: seedLetterEN('Juma Mwansa', 'Bank Teller', 'CRDB Bank') },
    ],
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* corrupted -> reseed */ }
  const s = seed();
  save(s);
  return s;
}

export function save(s) { localStorage.setItem(KEY, JSON.stringify(s)); }
export function uid(p) { const s = load(); s.seq += 1; save(s); return `${p}-${s.seq}`; }

export const getCVs = () => load().cvs;
export const getCV = (id) => load().cvs.find((c) => c.id === id);
export const getLetters = () => load().letters;

export function duplicateCV(id) {
  const s = load();
  const cv = s.cvs.find((c) => c.id === id);
  if (!cv) return;
  s.seq += 1;
  s.cvs.unshift({ ...cv, id: `cv-${s.seq}`, name: `${cv.name} (copy)`, downloads: 0, match: cv.match, updatedAt: nowISO() });
  save(s);
}

export function deleteCV(id) {
  const s = load();
  s.cvs = s.cvs.filter((c) => c.id !== id);
  save(s);
}

export function bumpDownloads(id) {
  const s = load();
  const cv = s.cvs.find((c) => c.id === id);
  if (cv) { cv.downloads += 1; cv.updatedAt = nowISO(); save(s); }
}

export function upsertLetter(letter) {
  const s = load();
  letter.updatedAt = nowISO();
  if (letter.id) {
    const i = s.letters.findIndex((l) => l.id === letter.id);
    if (i >= 0) s.letters[i] = letter; else s.letters.unshift(letter);
  } else {
    s.seq += 1;
    letter.id = `lt-${s.seq}`;
    s.letters.unshift(letter);
  }
  save(s);
  return letter;
}

export function deleteLetter(id) {
  const s = load();
  s.letters = s.letters.filter((l) => l.id !== id);
  save(s);
}

export function buildLetter({ cvName, jobTitle, company, manager, lang }) {
  const jt = jobTitle || 'the advertised position';
  const co = company || 'your organisation';
  if (lang === 'SW') {
    return `${fmtDate(new Date())}\n${manager || 'Meneja wa Ajira'}\n${co}\nDar es Salaam, Tanzania\n\nNdugu Meneja,\n\nYAH: MAOMBI YA KAZI YA ${jt.toUpperCase()}\n\nMimi, ${cvName}, ninaomba kazi ya ${jt} kama ilivyotangazwa. Wasifu wangu (CV) nilioambatanisha unaeleza elimu, ujuzi na uzoefu wangu unaohusiana na kazi hii.\n\nNina bidii, nina uwezo wa kujifunza haraka na niko tayari kuchangia ${co}. Nitafurahi kupata fursa ya kujadili maombi yangu kwenye usaili.\n\nWako mtiifu,\n${cvName}\nViambatanisho: CV`;
  }
  return `${fmtDate(new Date())}\n${manager || 'The Hiring Manager'}\n${co}\nDar es Salaam, Tanzania\n\nDear ${manager ? manager : 'Sir/Madam'},\n\nRE: APPLICATION FOR THE POSITION OF ${jt.toUpperCase()}\n\nI, ${cvName}, wish to apply for the above position as advertised. My CV, attached herewith, outlines my education, skills and experience relevant to this role.\n\nI am hardworking, quick to learn and ready to contribute to ${co}. I would welcome the opportunity to discuss my application at an interview.\n\nYours faithfully,\n${cvName}\nAttachments: CV`;
}

export function fmtDate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(dt.getDate())}/${p(dt.getMonth() + 1)}/${dt.getFullYear()}`;
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function matchBadge(score) {
  const cls = score >= 80 ? 'bg-success' : score >= 60 ? 'bg-warning' : 'bg-secondary';
  return `<span class="badge ${cls}">${score}% match</span>`;
}

export function waLink(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function downloadDoc(filename, text, opts = {}) {
  // Real Word-renderable document: full HTML package Word/WPS/LibreOffice
  // recognise (not a bare <pre> fragment), UTF-8 BOM, sanitised filename.
  // Blank lines separate blocks; single ALL-CAPS lines become headings.
  // Pass { headline: false } for letters (no big name title on top).
  const headline = opts.headline !== false;
  const name = String(filename || 'document').replace(/[\\/:*?"<>|]/g, '-').replace(/(\.doc)?$/i, '.doc');
  const lines = String(text ?? '').split('\n').map((l) => l.trim());
  const blocks = [];
  let cur = [];
  lines.forEach((l) => { if (l) cur.push(esc(l)); else { if (cur.length) blocks.push(cur); cur = []; } });
  if (cur.length) blocks.push(cur);
  const isHeading = (t) => t.length >= 3 && t === t.toUpperCase() && /[A-Z]/.test(t);
  const body = blocks.map((b, i) => {
    if (headline && i === 0) return `<h1>${b[0]}</h1>` + (b.length > 1 ? `<p class="sub">${b.slice(1).join('<br>')}</p>` : '');
    if (b.length === 1 && isHeading(b[0])) return `<h2>${b[0]}</h2>`;
    return `<p>${b.join('<br>')}</p>`;
  }).join('');
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>CV</title><style>body{font-family:Georgia,serif;font-size:12pt;color:#111;}h1{font-size:20pt;margin:0 0 2pt;}p.sub{margin:0 0 10pt;color:#444;}h2{font-size:13pt;margin:12pt 0 4pt;border-bottom:1px solid #999;text-transform:uppercase;}p{margin:0 0 8pt;}</style></head><body>${body}</body></html>`;
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

// Single source of truth for exports: scrape the live compiled stylesheet for
// CV rules at download time, so exports can never drift from the website.
// Skips print rules, dark-theme rules (documents stay light paper) and
// gallery-only helpers. Resolves CSS vars from the live theme; maps the web
// font to an office-safe stack.
export function collectSheetCSS(theme) {
  const keep = (sel) => /(\.cv-sheet|\.tpl-|\.cv-(sec|head|name|title|contact|item|dates|bullets)|skill-chip)/.test(sel)
    && !/data-bs-theme/.test(sel);
  const out = [];
  let sheets = [];
  try { sheets = [...document.styleSheets]; } catch (e) { return ''; }
  for (const sh of sheets) {
    let rules = [];
    try { rules = [...(sh.cssRules || [])]; } catch (e) { continue; }
    for (const r of rules) {
      if (r.type === 4 && r.conditionText && !/print/.test(r.conditionText)) {
        for (const inner of r.cssRules || []) {
          if (inner.type === 1 && inner.selectorText && keep(inner.selectorText)) out.push(`${inner.selectorText}{${inner.style.cssText}}`);
        }
      } else if (r.type === 1 && r.selectorText && keep(r.selectorText)) {
        out.push(`${r.selectorText}{${r.style.cssText}}`);
      }
    }
  }
  if (!out.length) return '';
  const font = String((theme && theme.fontStack) || "'Poppins',sans-serif")
    .replace(/'Poppins',sans-serif/, 'Calibri,Arial,sans-serif');
  return out.join('\n')
    .replace(/var\(--cv-accent\)/g, (theme && theme.color) || '#E66239')
    .replace(/var\(--cv-font\)/g, font)
    .replace(/var\(--cv-size\)/g, (theme && theme.size) || '13px');
}

// Backend file export: tries the FastAPI service first, returns false when
// unreachable so callers fall back to local export (offline-first).
export function backendBase() {
  try {
    if (window.MRCV_BACKEND_URL) return String(window.MRCV_BACKEND_URL).replace(/\/$/, '');
    const h = location.hostname || '';
    if (h === 'localhost' || h === '127.0.0.1') return 'http://localhost:8000/api';
    return '/api';
  } catch (e) {
    return '';
  }
}

export async function downloadFromBackend(kind, payload) {
  const base = backendBase();
  if (!base) return false;
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), 25000);
  try {
    const r = await fetch(`${base}/export/${kind}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctl.signal,
    });
    if (!r.ok) return false;
    const blob = await r.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const m = (r.headers.get('Content-Disposition') || '').match(/filename="([^"]+)"/);
    a.download = m ? m[1] : payload.filename || (kind === 'pdf' ? 'cv.pdf' : 'cv.docx');
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    return true;
  } catch (e) {
    return false;
  } finally {
    clearTimeout(to);
  }
}

// Styled .doc export: full Word package carrying the live web design
// (accent color, font, size, template rules) — true WYSIWYG.
export function downloadStyledDoc(filename, sheetHTML, cssText) {
  const name = String(filename || 'document').replace(/[\\/:*?"<>|]/g, '-').replace(/(\.doc)?$/i, '.doc');
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>CV</title><style>${cssText}</style></head><body>${sheetHTML}</body></html>`;
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

export const TEMPLATE_LABELS = { graduate: 'Graduate', government: 'Govt/NGO', banking: 'Banking', general: 'General', clinical: 'Clinical', barua: 'Barua' };

export function blankData() {
  return {
    personal: { fullName: '', title: '', phone: '', email: '', address: '', summary: '' },
    education: [{ school: '', qualification: '', start: '', end: '' }],
    experience: [{ employer: '', role: '', start: '', end: '', bullets: '' }],
    skills: '',
    projects: [{ name: '', desc: '' }],
    referees: [{ name: '', title: '', phone: '' }, { name: '', title: '', phone: '' }],
  };
}

export function createCV(template) {
  const s = load();
  s.seq += 1;
  const cv = { id: `cv-${s.seq}`, name: 'Untitled CV', template: template || 'general', lang: 'EN', target: '', match: 0, downloads: 0, updatedAt: nowISO(), data: blankData() };
  s.cvs.unshift(cv);
  save(s);
  return cv;
}

export function updateCV(id, patch) {
  const s = load();
  const cv = s.cvs.find((c) => c.id === id);
  if (!cv) return null;
  Object.assign(cv, patch, { updatedAt: nowISO() });
  save(s);
  return cv;
}

export function normalizeTZPhone(raw) {
  const d = String(raw || '').replace(/[^\d+]/g, '');
  if (/^0\d{9}$/.test(d)) return `+255${d.slice(1)}`;
  if (/^255\d{9}$/.test(d)) return `+${d}`;
  return raw;
}

// ---- device-local user profile ----
const USER_KEY = 'mrcv.user';
export function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)) || {}; }
  catch (e) { return {}; }
}
export function saveUser(u) { localStorage.setItem(USER_KEY, JSON.stringify(u || {})); }
export function clearUser() { localStorage.removeItem(USER_KEY); }

// ---- target country / region ----
export const COUNTRIES = [
  { code: 'TZ', name: 'Tanzania' }, { code: 'KE', name: 'Kenya' }, { code: 'UG', name: 'Uganda' },
  { code: 'RW', name: 'Rwanda' }, { code: 'BI', name: 'Burundi' }, { code: 'CD', name: 'DR Congo' },
  { code: 'NG', name: 'Nigeria' }, { code: 'GH', name: 'Ghana' }, { code: 'ZA', name: 'South Africa' },
  { code: 'GB', name: 'United Kingdom' }, { code: 'US', name: 'United States' }, { code: 'CA', name: 'Canada' },
  { code: 'DE', name: 'Germany' }, { code: 'AE', name: 'UAE' },
];

export const REGIONS = {
  TZ: ['Arusha', 'Dar es Salaam', 'Dodoma', 'Geita', 'Iringa', 'Kagera', 'Katavi', 'Kigoma', 'Kilimanjaro', 'Lindi', 'Manyara', 'Mara', 'Mbeya', 'Morogoro', 'Mtwara', 'Mwanza', 'Njombe', 'Pemba North', 'Pemba South', 'Pwani', 'Rukwa', 'Ruvuma', 'Shinyanga', 'Simiyu', 'Singida', 'Songwe', 'Tabora', 'Tanga', 'Zanzibar North', 'Zanzibar South', 'Zanzibar West'],
  KE: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Kiambu'],
  UG: ['Kampala', 'Wakiso', 'Gulu', 'Mbarara', 'Jinja'],
  RW: ['Kigali', 'Musanze', 'Huye', 'Rusizi'],
  BI: ['Bujumbura', 'Gitega', 'Ngozi'],
  CD: ['Kinshasa', 'Lubumbashi', 'Goma'],
  NG: ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt'],
  GH: ['Accra', 'Kumasi', 'Tamale'],
  ZA: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria'],
  GB: ['London', 'Manchester', 'Birmingham'],
  US: ['New York', 'California', 'Texas'],
  CA: ['Toronto', 'Vancouver', 'Ontario'],
  DE: ['Berlin', 'Munich', 'Hamburg'],
  AE: ['Dubai', 'Abu Dhabi', 'Sharjah'],
};

// ---- shared CV renderer (single real template: Graduate Starter) ----
export function bulletsHTML(text) {
  const lines = String(text || '').split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return '';
  return `<ul class="cv-bullets">${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`;
}

export function datesHTML(s, e) {
  const t = [s, e].map((x) => String(x || '').trim()).filter(Boolean).join(' – ');
  return t ? `<span class="cv-dates">${esc(t)}</span>` : '';
}

export function cvToHTML(data, only = null) {
  const show = (key) => !only || only.includes(key);
  const p = data.personal;
  const contact = [p.phone, p.email, p.address].map((x) => String(x || '').trim()).filter(Boolean).join(' · ');
  const skills = String(data.skills || '').split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
  return `
    <div class="cv-head">
      <div class="cv-name">${esc(p.fullName) || '<span class="text-secondary">Your Name</span>'}</div>
      ${p.title ? `<div class="cv-title">${esc(p.title)}</div>` : ''}
      ${contact ? `<div class="cv-contact">${esc(contact)}</div>` : ''}
    </div>
    ${show('summary') && p.summary ? `<div class="cv-sec">Summary</div><div>${esc(p.summary)}</div>` : ''}
    ${show('experience') && data.experience.some((e) => e.role || e.employer) ? `<div class="cv-sec">Experience</div>${data.experience.filter((e) => e.role || e.employer).map((e) => `
      <div class="cv-item"><div class="cv-item-head"><span>${esc(e.role)}${e.employer ? ` — ${esc(e.employer)}` : ''}</span>${datesHTML(e.start, e.end)}</div>${bulletsHTML(e.bullets)}</div>`).join('')}` : ''}
    ${show('education') && data.education.some((e) => e.school || e.qualification) ? `<div class="cv-sec">Education</div>${data.education.filter((e) => e.school || e.qualification).map((e) => `
      <div class="cv-item"><div class="cv-item-head"><span>${esc(e.qualification)}${e.school ? ` — ${esc(e.school)}` : ''}</span>${datesHTML(e.start, e.end)}</div></div>`).join('')}` : ''}
    ${show('skills') && skills.length ? `<div class="cv-sec">Skills</div><div>${skills.map((s) => `<span class="skill-chip">${esc(s)}</span>`).join('')}</div>` : ''}
    ${show('projects') && data.projects.some((x) => x.name || x.desc) ? `<div class="cv-sec">Projects</div>${data.projects.filter((x) => x.name || x.desc).map((x) => `
      <div class="cv-item"><div class="cv-item-head"><span>${esc(x.name)}</span></div><div>${esc(x.desc)}</div></div>`).join('')}` : ''}
    ${show('referees') && data.referees.some((r) => r.name) ? `<div class="cv-sec">Referees</div>${data.referees.filter((r) => r.name).map((r) => `
      <div class="cv-item"><strong>${esc(r.name)}</strong>${r.title ? ` — ${esc(r.title)}` : ''}${r.phone ? `<br><span class="cv-dates">${esc(r.phone)}</span>` : ''}</div>`).join('')}` : ''}`;
}

// Export-ready HTML with the design inlined (accent, font, size, template
// rules as style="" attributes). LibreOffice ignores class CSS, so files
// must carry their looks inline; Chrome uses these + the scraped stylesheet.
// opts.singleFont: request only the first family (Word/LibreOffice take the
// whole stack as one broken name otherwise); browsers keep the full stack.
export function cvThemedHTML(data, theme, template, opts = {}) {
  const accent = (theme && theme.color) || '#E66239';
  const fullStack = (theme && theme.fontStack) || "'Poppins',sans-serif";
  const font = opts.singleFont ? fullStack.split(',')[0].replace(/['"]/g, '') : fullStack;
  const size = (theme && theme.size) || '13px';
  const st = (s) => ` style="${s}"`;
  let h = cvToHTML(data);
  const headExtra = template === 'banking'
    ? 'background:#262626;color:#ffffff;padding:12px 14px;margin-bottom:12px;'
    : (template === 'government' ? 'text-align:center;margin-bottom:12px;' : 'margin-bottom:12px;');
  h = h.replace('<div class="cv-head">', `<div${st(headExtra)}>`);
  const nameColor = template === 'banking' ? '#ffffff' : ((template === 'graduate' || template === 'clinical') ? accent : '#171717');
  h = h.split('<div class="cv-name">').join(`<div${st(`font-size:22px;font-weight:700;color:${nameColor};margin:0;`)}>`);
  const titleColor = template === 'banking' ? '#F0B100' : accent;
  h = h.split('<div class="cv-title">').join(`<div${st(`font-size:13px;font-weight:700;color:${titleColor};margin-bottom:4px;`)}>`);
  h = h.split('<div class="cv-contact">').join(`<div${st('font-size:12px;color:#737373;margin-bottom:12px;')}>`);
  let sec = `font-size:12px;font-weight:700;color:#171717;border-bottom:2px solid ${accent};padding-bottom:2px;margin:14px 0 6px;`;
  if (template === 'government') sec = `font-size:12px;font-weight:700;color:#171717;border-bottom:3px double ${accent};padding-bottom:2px;margin:14px 0 6px;`;
  if (template === 'general') sec = `font-size:12px;font-weight:700;color:#171717;border:none;border-left:4px solid ${accent};padding-left:8px;margin:14px 0 6px;`;
  h = h.split('<div class="cv-sec">').join(`<div${st(sec)}>`);
  h = h.split('<span class="cv-dates">').join(`<span${st('color:#737373;font-size:12px;')}>`);
  h = h.split('<div class="cv-item-head">').join(`<div${st('font-weight:700;')}>`);
  return `<div${st(`font-family:${font};font-size:${size};color:#262626;line-height:1.55;`)}>${h}</div>`;
}

export const SAMPLE_CV = {
  personal: {
    fullName: 'Amina Juma',
    title: 'BSc Computer Science Graduate',
    phone: '+255765123456',
    email: 'amina.juma@example.com',
    address: 'Ubungo, Dar es Salaam',
    summary: 'Motivated Computer Science graduate from the University of Dar es Salaam with hands-on IT support experience and a final-year project in mobile payments. Quick to learn, hardworking and ready to contribute from day one.',
  },
  education: [
    { school: 'University of Dar es Salaam', qualification: 'BSc in Computer Science', start: '2020', end: '2023' },
    { school: 'Kilakala Secondary School', qualification: 'ACSEE — Division I', start: '2018', end: '2020' },
  ],
  experience: [
    {
      employer: 'Vodacom Tanzania — IT Department',
      role: 'IT Support Intern (Field Attachment)',
      start: 'Jun 2022',
      end: 'Aug 2022',
      bullets: 'Resolved 30+ staff support tickets on hardware, email and network issues\nDocumented common fixes, cutting repeat tickets by 20%\nAssisted rollout of 50 new workstations across two floors',
    },
  ],
  skills: 'Computer troubleshooting\nMS Office & Google Workspace\nBasic networking\nKiswahili & English\nTeamwork',
  projects: [
    { name: 'M-Pesa Fee Calculator App', desc: 'Android class project that computes mobile-money charges offline. Presented to 60 students and lecturers.' },
  ],
  referees: [
    { name: 'Dr. Neema Shirima', title: 'Lecturer, UDSM', phone: '+255754987654' },
    { name: 'Mr. Baraka Mziray', title: 'Supervisor, Vodacom Tanzania', phone: '+255713456789' },
  ],
};

// ---- application letter renderer (Barua) ----
export function letterToHTML(l) {
  return `
    <div class="cv-item lt-date">${esc(l.date)}</div>
    <div class="cv-item"><strong>${esc(l.recipient)}</strong><br>${String(l.address || '').split('\n').map((a) => esc(a)).join('<br>')}</div>
    <div class="cv-item"><strong>${esc(l.ref)}</strong></div>
    ${(l.body || []).map((p) => `<p>${esc(p)}</p>`).join('')}
    <div class="cv-item">${esc(l.close)},<br><strong>${esc(l.name)}</strong><br><span class="cv-dates">${esc(l.attachments)}</span></div>`;
}

export const SAMPLE_LETTER = {
  date: '12/01/2026',
  recipient: 'Meneja wa Ajira',
  address: 'CRDB Bank\nDar es Salaam, Tanzania',
  ref: 'YAH: MAOMBI YA KAZI YA TELLER',
  body: [
    'Mimi, Amina Juma, ninaomba kazi ya Teller kama ilivyotangazwa. Wasifu wangu (CV) nilioambatanisha unaeleza elimu, ujuzi na uzoefu wangu unaohusiana na kazi hii.',
    'Nina bidii, nina uwezo wa kujifunza haraka na niko tayari kuchangia CRDB Bank. Nitafurahi kupata fursa ya kujadili maombi yangu kwenye usaili.',
  ],
  close: 'Wako mtiifu',
  name: 'Amina Juma',
  attachments: 'Viambatanisho: CV',
};
