// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:8080/api';

// ─── AUTH HELPERS ─────────────────────────────────────────────────────────────
const Auth = {
  getToken:   () => localStorage.getItem('token'),
  getUser:    () => { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; },
  setSession: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  clear:      () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('chat_history'); // Clear chat history on logout
  },
  isLoggedIn: () => !!localStorage.getItem('token'),
  requireAuth: () => {
    if (!localStorage.getItem('token')) {
      const isInPages = window.location.pathname.includes('/pages/');
      window.location.href = isInPages ? '../index.html' : 'index.html';
      return false;
    }
    return true;
  },
  logout: async () => {
    // Show confirmation modal
    const confirmed = await showLogoutConfirmation();
    if (!confirmed) return;

    // Clear session
    Auth.clear();

    // Show success message
    Toast.success('Logged out successfully');

    // Redirect to login page
    setTimeout(() => {
      const isInPages = window.location.pathname.includes('/pages/');
      window.location.href = isInPages ? '../index.html' : 'index.html';
    }, 500);
  }
};

// ─── API WRAPPER ──────────────────────────────────────────────────────────────
const api = {
  async request(method, path, body = null, isFormData = false) {
    const headers = {};
    const token = Auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isFormData && body) headers['Content-Type'] = 'application/json';

    const opts = { method, headers };
    if (body) opts.body = isFormData ? body : JSON.stringify(body);

    try {
      const res = await fetch(API_BASE + path, opts);
      const data = await res.json();
      if (res.status === 401) {
        Auth.clear();
        const isInPages = window.location.pathname.includes('/pages/');
        window.location.href = isInPages ? '../index.html' : 'index.html';
        return;
      }
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      return { ok: false, data: { message: 'Network error. Is the server running?' } };
    }
  },
  get:       (path)           => api.request('GET', path),
  post:      (path, body)     => api.request('POST', path, body),
  put:       (path, body)     => api.request('PUT', path, body),
  delete:    (path)           => api.request('DELETE', path),
  upload:    (path, formData) => api.request('POST', path, formData, true),
  uploadPut: (path, formData) => api.request('PUT',  path, formData, true),
};

// ─── TOAST ────────────────────────────────────────────────────────────────────
const Toast = {
  container: null,
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    }
  },
  show(message, type = 'info', duration = 3500) {
    this.init();
    const icons  = { success: '✓', error: '✕', info: 'ℹ' };
    const colors = { success: 'var(--green)', error: 'var(--red)', info: 'var(--accent-light)' };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span style="color:${colors[type]};font-weight:700;font-size:16px">${icons[type]}</span><span>${message}</span>`;
    this.container.appendChild(t);
    setTimeout(() => {
      t.style.animation = 'toastIn .3s reverse';
      setTimeout(() => t.remove(), 300);
    }, duration);
  },
  success: (msg) => Toast.show(msg, 'success'),
  error:   (msg) => Toast.show(msg, 'error'),
  info:    (msg) => Toast.show(msg, 'info'),
};

// ─── LOGOUT CONFIRMATION MODAL ────────────────────────────────────────────────
function showLogoutConfirmation() {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal" style="max-width:420px">
        <div class="modal-header">
          <h3 class="modal-title">Confirm Logout</h3>
          <button class="modal-close" id="logout-modal-close">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div style="padding:20px 0">
          <p style="color:var(--text-secondary);font-size:14px;line-height:1.6">
            Are you sure you want to log out? You'll need to sign in again to access your notes and features.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="logout-cancel-btn">Cancel</button>
          <button class="btn btn-danger" id="logout-confirm-btn">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    setTimeout(() => backdrop.classList.add('open'), 10);

    const cleanup = (result) => {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 200);
      resolve(result);
    };

    document.getElementById('logout-confirm-btn').addEventListener('click', () => cleanup(true));
    document.getElementById('logout-cancel-btn').addEventListener('click', () => cleanup(false));
    document.getElementById('logout-modal-close').addEventListener('click', () => cleanup(false));
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) cleanup(false);
    });
  });
}

// ─── DOM HELPERS ──────────────────────────────────────────────────────────────
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const el = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls)  e.className = cls;
  if (html) e.innerHTML = html;
  return e;
};

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Unknown date';
  let d;
  if (Array.isArray(dateStr)) {
    d = new Date(dateStr[0], dateStr[1] - 1, dateStr[2],
                 dateStr[3] || 0, dateStr[4] || 0, dateStr[5] || 0);
  } else {
    d = new Date(dateStr);
  }
  if (isNaN(d.getTime())) return 'Unknown date';
  const now  = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60)     return 'just now';
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  if (Array.isArray(dateStr)) {
    return new Date(dateStr[0], dateStr[1] - 1, dateStr[2],
                    dateStr[3] || 0, dateStr[4] || 0, dateStr[5] || 0);
  }
  return new Date(dateStr);
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function avatarHtml(name, color, size = '') {
  return `<div class="avatar ${size}" style="background:${color || '#6366f1'}">${initials(name)}</div>`;
}

function subjectColor(subject) {
  const colors = {
    math: '#6366f1', physics: '#3b82f6', chemistry: '#10b981',
    biology: '#22d3a5', english: '#f59e0b', history: '#ef4444',
    geography: '#8b5cf6', economics: '#ec4899', default: '#7c6af7',
  };
  return colors[(subject || '').toLowerCase()] || colors.default;
}

// ─── SIDEBAR BUILDER ──────────────────────────────────────────────────────────
function buildLayout(activePage) {
  const user = Auth.getUser();
  const nav = [
    { id: 'dashboard',   label: 'Dashboard',      icon: icons.dashboard, href: 'dashboard.html' },
    { id: 'feed',        label: 'Community Feed',  icon: icons.feed,      href: 'feed.html' },
    { id: 'my-notes',    label: 'My Notes',        icon: icons.notes,     href: 'my-notes.html' },
    { id: 'upload',      label: 'Upload Note',     icon: icons.upload,    href: 'upload.html' },
    { id: 'leaderboard', label: 'Leaderboard',     icon: icons.trophy,    href: 'leaderboard.html' },
    { id: 'chatbot',     label: 'AI Chatbot',      icon: icons.chat,      href: 'chatbot.html' },
  ];

  const sidebar = document.getElementById('sidebar');
  if (sidebar && user) {
    sidebar.innerHTML = `
      <div class="sidebar-logo">
        <div class="logo-icon">📚</div>
        <div>
          <div class="logo-text">NoteSphere</div>
          <div class="logo-sub">Academic Platform</div>
        </div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-group-label">Navigation</div>
        ${nav.map(n => `
          <a href="${n.href}" class="nav-item ${activePage === n.id ? 'active' : ''}">
            ${n.icon} <span>${n.label}</span>
          </a>`).join('')}
      </nav>
      <div class="sidebar-footer">
        <div class="user-chip" id="user-chip">
          ${avatarHtml(user.name, user.avatarColor)}
          <div class="user-info">
            <div class="user-name">${escapeHtml(user.name)}</div>
            <div class="user-role">${user.role}</div>
          </div>
        </div>
        <button class="btn btn-ghost w-full" id="logout-btn" style="margin-top:8px;justify-content:center;color:var(--text-muted)">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </div>`;

    // User chip click - show profile options
    $('#user-chip')?.addEventListener('click', (e) => {
      e.stopPropagation();
      showUserMenu();
    });

    // Logout button click
    document.getElementById('logout-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      Auth.logout();
    });
  }

  const navUser = document.getElementById('nav-user');
  if (navUser && user) {
    navUser.innerHTML = `
      <div class="user-dropdown" id="user-dropdown">
        ${avatarHtml(user.name, user.avatarColor)}
      </div>
    `;

    document.getElementById('user-dropdown')?.addEventListener('click', (e) => {
      e.stopPropagation();
      showUserMenu();
    });
  }

  const toggle  = document.getElementById('mobile-menu-btn');
  const overlay = document.getElementById('sidebar-overlay');
  toggle?.addEventListener('click', () => {
    sidebar?.classList.toggle('mobile-open');
    overlay?.classList.toggle('visible');
  });
  overlay?.addEventListener('click', () => {
    sidebar?.classList.remove('mobile-open');
    overlay?.classList.remove('visible');
  });
}

// ─── USER MENU DROPDOWN ───────────────────────────────────────────────────────
function showUserMenu() {
  const user = Auth.getUser();
  if (!user) return;

  // Remove existing menu if any
  document.getElementById('user-menu-dropdown')?.remove();

  const menu = document.createElement('div');
  menu.id = 'user-menu-dropdown';
  menu.className = 'user-menu-dropdown';
  menu.innerHTML = `
    <div class="user-menu-header">
      ${avatarHtml(user.name, user.avatarColor, 'lg')}
      <div>
        <div class="user-menu-name">${escapeHtml(user.name)}</div>
        <div class="user-menu-email">${escapeHtml(user.email)}</div>
      </div>
    </div>
    <div class="divider" style="margin:12px 0"></div>
    <div class="user-menu-items">
      <a href="dashboard.html" class="user-menu-item">
        ${icons.dashboard}
        <span>Dashboard</span>
      </a>
      <a href="my-notes.html" class="user-menu-item">
        ${icons.notes}
        <span>My Notes</span>
      </a>
      <div class="divider" style="margin:8px 0"></div>
      <button class="user-menu-item" id="user-menu-logout" style="color:var(--red)">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        <span>Logout</span>
      </button>
    </div>
  `;

  document.body.appendChild(menu);
  setTimeout(() => menu.classList.add('open'), 10);

  // Close on click outside
  const closeMenu = (e) => {
    if (!menu.contains(e.target)) {
      menu.classList.remove('open');
      setTimeout(() => menu.remove(), 200);
      document.removeEventListener('click', closeMenu);
    }
  };
  setTimeout(() => document.addEventListener('click', closeMenu), 10);

  // Logout click
  document.getElementById('user-menu-logout')?.addEventListener('click', (e) => {
    e.preventDefault();
    menu.remove();
    Auth.logout();
  });
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const icons = {
  dashboard: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  feed:      `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 4h18M3 9h18M3 14h12M3 19h8"/></svg>`,
  notes:     `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 4 0M9 5h6"/></svg>`,
  upload:    `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  trophy:    `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 22v-5"/><path d="M14 22v-5"/><path d="M6 4h12v6a6 6 0 0 1-12 0z"/></svg>`,
  chat:      `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  edit:      `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>`,
  trash:     `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
  star:      `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  file:      `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  comment:   `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  upvote:    `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg>`,
  downvote:  `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>`,
  ai:        `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>`,
  search:    `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  close:     `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  send:      `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  eye:       `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  back:      `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>`,
  menu:      `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
};

// ─── NOTE CARD BUILDER ────────────────────────────────────────────────────────
function buildNoteCard(note, opts = {}) {
  const { showActions = false, onClick } = opts;
  const user    = Auth.getUser();
  const isOwner = user && note.authorId === user.id;
  const sc      = subjectColor(note.subject);

  const card = el('div', 'note-card fade-up');
  card.dataset.id = note.id;
  card.innerHTML = `
    <div class="note-card-header">
      <div style="flex:1;min-width:0">
        <div class="note-card-title truncate">${escapeHtml(note.title)}</div>
        <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;align-items:center">
          <span class="note-card-subject" style="background:${sc}22;color:${sc}">${escapeHtml(note.subject)}</span>
          ${note.hasFile ? `<span class="tag">${icons.file} ${note.fileType?.includes('pdf') ? 'PDF' : 'Image'}</span>` : ''}
          ${note.aiSummary ? `<span class="badge badge-accent">${icons.ai} AI Summary</span>` : ''}
        </div>
      </div>
      ${showActions && isOwner ? `
        <div style="display:flex;gap:4px;flex-shrink:0" onclick="event.stopPropagation()">
          <button class="btn btn-ghost btn-icon btn-sm edit-btn" title="Edit">${icons.edit}</button>
          <button class="btn btn-ghost btn-icon btn-sm delete-btn" title="Delete" style="color:var(--red)">${icons.trash}</button>
        </div>` : ''}
    </div>
    ${note.content ? `<p class="note-card-content">${escapeHtml(note.content)}</p>` : ''}
    ${note.tags?.length ? `<div class="tags-list">${note.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
    <div class="note-card-footer">
      <div class="note-card-meta">
        ${avatarHtml(note.authorName, '#6366f1')}
        <span>${escapeHtml(note.authorName)}</span>
        <span>·</span>
        <span>${timeAgo(note.createdAt)}</span>
        ${note.commentCount > 0 ? `<span>·</span><span>${icons.comment} ${note.commentCount}</span>` : ''}
      </div>
      <div class="note-card-actions" onclick="event.stopPropagation()">
        <button class="vote-btn upvote-btn ${note.userVote === 'UPVOTE' ? 'upvoted' : ''}" data-id="${note.id}">
          ${icons.upvote} <span class="uv-count">${note.upvotes}</span>
        </button>
        <button class="vote-btn downvote-btn ${note.userVote === 'DOWNVOTE' ? 'downvoted' : ''}" data-id="${note.id}">
          ${icons.downvote} <span class="dv-count">${note.downvotes}</span>
        </button>
      </div>
    </div>`;

  // ── Click to open note ──
  if (onClick) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
      if (e.target.closest('.note-card-actions') ||
          e.target.closest('.edit-btn') ||
          e.target.closest('.delete-btn')) return;
      onClick(note);
    });
  }

  // ── Vote handlers ──
  card.querySelector('.upvote-btn')?.addEventListener('click', e => {
    e.stopPropagation();
    handleVote(note.id, 'UPVOTE', card);
  });
  card.querySelector('.downvote-btn')?.addEventListener('click', e => {
    e.stopPropagation();
    handleVote(note.id, 'DOWNVOTE', card);
  });

  return card;
}

async function handleVote(noteId, type, card) {
  if (!Auth.isLoggedIn()) { Toast.info('Please log in to vote'); return; }
  const res = await api.post(`/notes/${noteId}/vote?type=${type}`);
  if (!res.ok) { Toast.error(res.data?.message || 'Vote failed'); return; }
  const note = res.data.data;
  const uvBtn = card.querySelector('.upvote-btn');
  const dvBtn = card.querySelector('.downvote-btn');
  if (uvBtn) {
    uvBtn.querySelector('.uv-count').textContent = note.upvotes;
    uvBtn.classList.toggle('upvoted', note.userVote === 'UPVOTE');
  }
  if (dvBtn) {
    dvBtn.querySelector('.dv-count').textContent = note.downvotes;
    dvBtn.classList.toggle('downvoted', note.userVote === 'DOWNVOTE');
  }
}

// ─── SEARCH DEBOUNCE ──────────────────────────────────────────────────────────
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}