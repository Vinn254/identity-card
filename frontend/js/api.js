/* =================================================================
    UEAB IMS - Frontend API client
    Tiny fetch wrapper that injects JWT and handles JSON.
    ================================================================= */

const API_BASE = (() => {
  // Allow override via window.API_BASE for local dev, else fall back to
  // same-origin (/api) which works when the frontend is served from the
  // backend in production.
  if (window.API_BASE) return window.API_BASE.replace(/\/$/, '');
  // If frontend is served on a different port, point at the API directly.
  if (location.port === '5500' || location.port === '8080' || location.port === '3000') {
    return 'http://localhost:5000/api';
  }
  // If served as static site, use the deployed backend
  if (location.hostname.includes('onrender.com') || location.hostname.includes('netlify.app') || location.hostname.includes('vercel.app')) {
    return 'https://identity-card-m486.onrender.com/api';
  }
  return '/api';
})();

const TOKEN_KEY = 'ueab_ims_token';
const USER_KEY  = 'ueab_ims_user';

const Auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUser:  () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
    catch { return null; }
  },
  setSession: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  isLoggedIn: () => !!localStorage.getItem(TOKEN_KEY),
  isAdmin:    () => (Auth.getUser()?.role === 'admin'),
};

async function api(path, { method = 'GET', body, formData, query } = {}) {
  const headers = {};
  const token = Auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let payload = body;
  if (body && !formData) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let url = `${API_BASE}${path}`;
  if (query) {
    const qs = new URLSearchParams(query).toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, { method, headers, body: payload });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    const message = (data && data.error) || res.statusText || 'Request failed';
    if (res.status === 401) {
      Auth.clear();
      if (!location.pathname.endsWith('/login.html') && location.pathname !== '/login.html') {
        location.href = 'login.html';
      }
    }
    throw new Error(message);
  }
  return data;
}

const API = {
  // auth
  register: (data)        => api('/auth/register', { method: 'POST', body: data }),
  login:    (data)        => api('/auth/login',    { method: 'POST', body: data }),
  me:       ()            => api('/auth/me'),

  // lost
  reportLost:    (data)   => api('/lost',        { method: 'POST', body: data }),
  myLost:        ()       => api('/lost/mine'),
  allLost:       ()       => api('/lost'),
  getLost:       (id)     => api(`/lost/${id}`),
  updateLost:    (id, st) => api(`/lost/${id}/status`, { method: 'PATCH', body: { status: st } }),
  myStats:       ()       => api('/lost/stats/me'),

  // found
  reportFound:   (data)   => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => v != null && fd.append(k, v));
    return api('/found', { method: 'POST', formData: fd });
  },
  myFound:       ()       => api('/found/mine'),
  updateFound:   (id, st) => api(`/found/${id}/status`, { method: 'PATCH', body: { status: st } }),

  // search
  search:        (q)      => api('/search', { query: q }),

  // notifications
  listNotifs:        ()  => api('/notifications'),
  unreadCount:       ()  => api('/notifications/unread-count'),
  markRead:          (id)=> api(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead:       ()  => api('/notifications/mark-all-read', { method: 'PATCH' }),

  // admin
  adminOverview:  ()  => api('/admin/overview'),
  adminUsers:     ()  => api('/admin/users'),
  setUserActive:  (id, active) => api(`/admin/users/${id}/active`, { method: 'PATCH', body: { is_active: active } }),
  adminReports:   ()  => api('/admin/reports'),
  adminMatches:   ()  => api('/admin/matches'),
  adminActivity:  ()  => api('/admin/activity'),
};

/* ---------- Toast helper ---------- */
function toast(message, type = 'info', duration = 3500) {
  let host = document.getElementById('toast');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toast';
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  host.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity .25s';
    setTimeout(() => el.remove(), 260);
  }, duration);
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso.replace(' ', 'T') + (iso.endsWith('Z') ? '' : 'Z'));
  return d.toLocaleString();
}

function fmtDateOnly(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString();
}

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || '?';
}