// My Account — profile (device-local), language, target country/region, stats, logout, wipe.
import { getCVs, getLetters, getUser, saveUser, clearUser, normalizeTZPhone, COUNTRIES, REGIONS } from './mrcv-store.js';
import { t, applyI18n } from './mrcv-i18n.js';

function countryName(code) {
  const c = COUNTRIES.find((x) => x.code === code);
  return c ? c.name : (code || '');
}

function fillCountries(sel, current) {
  sel.innerHTML = COUNTRIES.map((c) => `<option value="${c.code}">${c.name}</option>`).join('');
  sel.value = current || 'TZ';
}

function fillRegions(code, current) {
  const list = REGIONS[code] || [];
  const sel = document.getElementById('u-regionSel');
  const input = document.getElementById('u-region');
  const dl = document.getElementById('regionList');
  if (list.length) {
    sel.innerHTML = '<option value="">—</option>' + list.map((r) => `<option value="${r}">${r}</option>`).join('');
    if (current !== undefined) sel.value = list.includes(current) ? current : '';
    sel.classList.remove('d-none');
    input.classList.add('d-none');
  } else {
    dl.innerHTML = '';
    sel.classList.add('d-none');
    input.classList.remove('d-none');
    if (current !== undefined) input.value = current;
  }
}

function currentRegion() {
  const sel = document.getElementById('u-regionSel');
  if (!sel.classList.contains('d-none')) return sel.value;
  return document.getElementById('u-region').value.trim();
}

function renderPhoto(photo, name) {
  const box = document.getElementById('photoPreview');
  box.innerHTML = '';
  if (photo) {
    const img = document.createElement('img');
    img.src = photo;
    img.alt = '';
    img.className = 'avatar avatar-xl rounded-circle';
    box.appendChild(img);
  } else {
    const s = document.createElement('span');
    s.className = 'avatar avatar-xl rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center fw-bold fs-4';
    s.textContent = ((name || 'M').trim().charAt(0) || 'M').toUpperCase();
    box.appendChild(s);
  }
}

function renderTarget(user) {
  const parts = [countryName(user.country), user.region].filter(Boolean);
  document.getElementById('profileTarget').textContent = parts.length ? parts.join(' · ') : '—';
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('profileForm')) return;
  const countrySel = document.getElementById('u-country');
  fillCountries(countrySel, (getUser().country || 'TZ'));
  fillRegions(countrySel.value, getUser().region || '');

  const user = getUser();
  document.getElementById('u-name').value = user.name || '';
  document.getElementById('u-phone').value = user.phone || '';
  document.getElementById('u-email').value = user.email || '';
  document.getElementById('u-lang').value = user.lang || 'EN';
  renderPhoto(user.photo, user.name);
  document.getElementById('profileName').textContent = user.name || 'MrCV User';
  renderTarget(user);
  document.getElementById('avatarInitial').textContent = (user.name || 'M').trim().charAt(0).toUpperCase();
  document.getElementById('statCvs').textContent = getCVs().length;
  document.getElementById('statLetters').textContent = getLetters().length;
  document.getElementById('statDownloads').textContent = getCVs().reduce((a, c) => a + (c.downloads || 0), 0);
  if (!user.email) document.getElementById('profileEmail').textContent = t('acc.notsigned');
  else document.getElementById('profileEmail').textContent = user.email;

  countrySel.addEventListener('change', () => fillRegions(countrySel.value, ''));

  document.getElementById('u-phone').addEventListener('blur', (e) => {
    if (e.target.value.trim()) e.target.value = normalizeTZPhone(e.target.value);
  });

  const photoInput = document.getElementById('u-photo');
  photoInput.addEventListener('change', () => {
    const f = photoInput.files && photoInput.files[0];
    if (!f) return;
    const img = new Image();
    const url = URL.createObjectURL(f);
    img.onload = () => {
      const size = 128;
      const side = Math.min(img.width, img.height) || size;
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      c.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      const dataUrl = c.toDataURL('image/jpeg', 0.82);
      saveUser({ ...getUser(), photo: dataUrl });
      renderPhoto(dataUrl);
    };
    img.src = url;
  });
  document.getElementById('photoRemove').addEventListener('click', () => {
    const u = { ...getUser() };
    delete u.photo;
    saveUser(u);
    renderPhoto(null);
  });

  // Language switch applies instantly across the whole app shell
  document.getElementById('u-lang').addEventListener('change', (e) => {
    const u = { ...getUser(), lang: e.target.value };
    saveUser(u);
    applyI18n();
    document.getElementById('profileSaved').textContent = t('acc.saved');
    setTimeout(() => { document.getElementById('profileSaved').textContent = ''; }, 2000);
  });

  document.getElementById('profileSave').addEventListener('click', () => {
    const u = {
      ...getUser(),
      name: document.getElementById('u-name').value.trim(),
      phone: normalizeTZPhone(document.getElementById('u-phone').value.trim()),
      email: document.getElementById('u-email').value.trim(),
      lang: document.getElementById('u-lang').value,
      country: countrySel.value,
      region: currentRegion(),
    };
    saveUser(u);
    applyI18n();
    renderPhoto(getUser().photo, u.name);
    document.getElementById('profileName').textContent = u.name || 'MrCV User';
    document.getElementById('profileEmail').textContent = u.email || t('acc.notsigned');
    document.getElementById('avatarInitial').textContent = (u.name || 'M').trim().charAt(0).toUpperCase();
    renderTarget(u);
    document.getElementById('profileSaved').textContent = t('acc.saved');
    setTimeout(() => { document.getElementById('profileSaved').textContent = ''; }, 2000);
  });

  document.getElementById('btnLogout').addEventListener('click', () => {
    clearUser();
    window.location.href = 'signin.html';
  });

  document.getElementById('btnWipe').addEventListener('click', () => {
    if (!window.confirm(t('acc.wipeConfirm'))) return;
    localStorage.removeItem('mrcv.v1');
    clearUser();
    window.location.href = 'index.html';
  });
});
