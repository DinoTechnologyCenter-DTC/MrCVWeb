import { getCVs, getLetters, getUser } from './mrcv-store.js';
import { t } from './mrcv-i18n.js';

const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');
    const topbar = document.getElementById('topbar');
    const toggleBtn = document.getElementById('toggleBtn');
    const mobileBtn = document.getElementById('mobileBtn');
    const overlay = document.getElementById('overlay');

    // Desktop collapse
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (sidebar) sidebar.classList.toggle('collapsed');
        if (content) content.classList.toggle('full');
        if (topbar) topbar.classList.toggle('full');
      });
    }

    // Mobile sidebar open
    if (mobileBtn) {
      mobileBtn.addEventListener('click', () => {
        if (sidebar) sidebar.classList.add('mobile-show');
        if (overlay) overlay.classList.add('show');
      });
    }

    // 🔥 Click outside to close
    if (overlay) {
      overlay.addEventListener('click', () => {
        if (sidebar) sidebar.classList.remove('mobile-show');
        if (overlay) overlay.classList.remove('show');
      });
    }

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.sidebar .nav-link');

    if (navLinks.length > 0) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPage) {
          link.classList.add('active');
        }
      });
    }

    // MrCV logout: clear device-local profile, then go to sign in
    document.querySelectorAll('[data-logout]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        try { localStorage.removeItem('mrcv.user'); } catch (err) { /* ignore */ }
        window.location.href = link.getAttribute('href') || 'signin.html';
      });
    });

    // MrCV topbar profile: real photo if set, else 1st letter of username
    export function renderAvatar() {
      let user = {};
      try { user = JSON.parse(localStorage.getItem('mrcv.user')) || {}; } catch (err) { /* ignore */ }
      const name = (user.name || '').trim() || 'MrCV User';
      const initial = (name.charAt(0) || 'M').toUpperCase();
      const handle = user.email ? '@' + user.email.split('@')[0] : '@mycv';
      const paint = (box, size) => {
        if (!box) return;
        box.innerHTML = '';
        if (user.photo) {
          const img = document.createElement('img');
          img.setAttribute('src', user.photo);
          img.setAttribute('alt', '');
          img.className = `avatar avatar-${size} rounded-circle`;
          box.appendChild(img);
        } else {
          const s = document.createElement('span');
          s.className = `avatar avatar-${size} rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center fw-bold`;
          s.textContent = initial;
          box.appendChild(s);
        }
      };
      paint(document.getElementById('navAvatar'), 'sm');
      paint(document.getElementById('menuAvatar'), 'md');
      const nameEl = document.getElementById('navUserName');
      if (nameEl) nameEl.textContent = name;
      const handleEl = document.getElementById('navUserHandle');
      if (handleEl) handleEl.textContent = handle;
    }
    renderAvatar();
    renderNotifs();

    // MrCV notifications: actionable next steps built from local data
    export function buildNotifs(cvs, letters, user) {
      const items = [];
      if (!user.name) items.push({ icon: 'ti-user', cls: 'primary', title: t('notif.profileT'), text: t('notif.profileS'), link: 'account.html' });
      if (!cvs.length) items.push({ icon: 'ti-files', cls: 'success', title: t('notif.firstT'), text: t('notif.firstS'), link: 'new-cv.html' });
      else if (!cvs.some((c) => (c.downloads || 0) > 0)) items.push({ icon: 'ti-download', cls: 'warning', title: t('notif.dlT'), text: t('notif.dlS'), link: 'index.html' });
      if (cvs.length && !letters.length) items.push({ icon: 'ti-mail', cls: 'info', title: t('notif.letterT'), text: t('notif.letterS'), link: 'cover-letters.html' });
      return items.slice(0, 4);
    }
    function renderNotifs() {
      const box = document.getElementById('notifList');
      const badge = document.getElementById('notifCount');
      if (!box) return;
      let items = [];
      try { items = buildNotifs(getCVs(), getLetters(), getUser()); } catch (err) { /* ignore */ }
      if (!items.length) {
        box.innerHTML = `<li class="p-4 text-center text-secondary small">${t('notif.caughtUp')}</li>`;
      } else {
        box.innerHTML = items.map((n) => `
          <li class="p-3 border-bottom">
            <a href="${n.link}" class="d-flex gap-3 text-decoration-none">
              <span class="icon-shape icon-sm bg-${n.cls} bg-opacity-10 text-${n.cls} rounded-2 flex-shrink-0"><i class="ti ${n.icon} fs-5"></i></span>
              <span class="flex-grow-1 small">
                <span class="d-block fw-semibold">${n.title}</span>
                <span class="d-block text-secondary">${n.text}</span>
              </span>
            </a>
          </li>`).join('');
      }
      if (badge) {
        badge.childNodes.forEach((nd) => { if (nd.nodeType === 3) nd.textContent = ` ${items.length} `; });
        badge.style.display = items.length ? '' : 'none';
      }
    }

    // MrCV light/dark theme: toggle in topbar, persisted, system default
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const applyThemeMode = (mode) => {
      document.documentElement.setAttribute('data-bs-theme', mode);
      try { localStorage.setItem('mrcv.theme', mode); } catch (err) { /* ignore */ }
      if (themeIcon) themeIcon.className = mode === 'dark' ? 'ti ti-sun' : 'ti ti-moon';
    };
    let savedTheme = null;
    try { savedTheme = localStorage.getItem('mrcv.theme'); } catch (err) { /* ignore */ }
    if (!savedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) savedTheme = 'dark';
    applyThemeMode(savedTheme === 'dark' ? 'dark' : 'light');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        applyThemeMode(document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark');
      });
    }