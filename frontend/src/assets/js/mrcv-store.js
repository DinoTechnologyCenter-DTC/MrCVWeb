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
  { slug: 'barua', name: 'Barua ya Maombi', cat: 'barua', mock: 'letter',
    desc: 'Swahili application-letter layout. Pairs with any CV for a complete application pack.',
    best: 'Barua za maombi kwa Kiswahili', badges: ['Kiswahili', 'Letter', 'Free'], useLink: 'cover-letters.html#generator' },
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

export const TEMPLATE_LABELS = { graduate: 'Graduate', government: 'Govt/NGO', banking: 'Banking', general: 'General', barua: 'Barua' };

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
