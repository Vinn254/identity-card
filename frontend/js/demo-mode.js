/* =================================================================
   UEAB IMS - Demo Mode
   If the backend is unreachable, fall back to localStorage so the
   UI is fully clickable in any preview / static hosting environment.
   ================================================================= */

(function () {
  window.USE_DEMO_MODE = true;

  const STORE_KEYS = {
    users:    'demo_users',
    lost:     'demo_lost',
    found:    'demo_found',
    notifs:   'demo_notifs',
    activity: 'demo_activity',
    session:  'demo_session',
  };

  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  }
  function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

  function seed() {
    if (load(STORE_KEYS.users)) return;

    const now = new Date().toISOString();
    const users = [
      { id: 1, full_name: 'System Administrator', email: 'admin@ueab.ac.ke', phone: '+254700000001', registration_number: 'UEAB/ADMIN/001', role: 'admin',    is_active: 1, created_at: now, password: 'admin123' },
      { id: 2, full_name: 'John Doe',            email: 'john@ueab.ac.ke',  phone: '+254712345678', registration_number: 'UEAB/23/00123',  role: 'student',  is_active: 1, created_at: now, password: 'student123' },
      { id: 3, full_name: 'Security Officer',    email: 'security@ueab.ac.ke', phone: '+254711222333', registration_number: 'UEAB/STAFF/0042', role: 'security', is_active: 1, created_at: now, password: 'security123' },
      { id: 4, full_name: 'Jane Smith',          email: 'jane@ueab.ac.ke',  phone: '+254798765432', registration_number: 'UEAB/22/00087',  role: 'student',  is_active: 1, created_at: now, password: 'student123' },
    ];
    save(STORE_KEYS.users, users);

    const lost = [
      { id: 1, user_id: 2, document_type: 'Student ID', document_number: 'UEAB/23/00123', date_lost: '2024-05-13', location_lost: 'Main Library, 2nd floor', description: 'Blue UEAB student ID card', status: 'matched', matched_with_id: 1, created_at: now },
      { id: 2, user_id: 4, document_type: 'National ID', document_number: 'ID4567890',   date_lost: '2024-05-14', location_lost: 'Cafeteria',                description: 'Lost while paying for lunch', status: 'pending', matched_with_id: null, created_at: now },
      { id: 3, user_id: 2, document_type: 'Passport',   document_number: 'PK1234567',   date_lost: '2024-05-10', location_lost: 'Lecture Hall A',           description: 'Brown cover', status: 'pending', matched_with_id: null, created_at: now },
    ];
    save(STORE_KEYS.lost, lost);

    const found = [
      { id: 1, user_id: 3, document_type: 'Student ID', document_number: 'UEAB/23/00123', date_found: '2024-05-15', location_found: 'Security Office', finder_contact: '+254711222333', description: 'Blue UEAB student ID card', status: 'matched', matched_with_id: 1, created_at: now, image_path: null },
      { id: 2, user_id: 3, document_type: 'Student ID', document_number: 'UEAB/23/00987', date_found: '2024-05-15', location_found: 'Lecture Hall B', finder_contact: '+254711222333', description: 'Found on a desk',          status: 'pending', matched_with_id: null, created_at: now, image_path: null },
    ];
    save(STORE_KEYS.found, found);

    const notifs = [
      { id: 1, user_id: 2, title: 'Good news! Your lost Student ID has been found.', message: 'Location: Security Office. Please come with your ID to claim it.', type: 'match', is_read: 0, related_lost_id: 1, related_found_id: 1, created_at: now },
      { id: 2, user_id: 2, title: 'Your report (Lost ID - UEAB/23/00123) has been matched.', message: 'A matching found document has been recorded. View details from your dashboard.', type: 'info', is_read: 0, related_lost_id: 1, related_found_id: null, created_at: now },
      { id: 3, user_id: 2, title: 'Your found document report has been recorded successfully.', message: 'Thank you for helping reunite this document with its owner.', type: 'success', is_read: 1, related_lost_id: null, related_found_id: null, created_at: now },
    ];
    save(STORE_KEYS.notifs, notifs);
    save(STORE_KEYS.activity, []);
  }
  seed();

  function nextId(arr) { return arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1; }
  function nowIso()    { return new Date().toISOString(); }
  function publicUser(u) { const { password, ...rest } = u; return rest; }
  function addNotif(user_id, title, message, type, lostId, foundId) {
    const n = load(STORE_KEYS.notifs, []);
    n.unshift({ id: nextId(n), user_id, title, message, type, is_read: 0, related_lost_id: lostId || null, related_found_id: foundId || null, created_at: nowIso() });
    save(STORE_KEYS.notifs, n);
  }
  function tryMatch(newReport, side) {
    const lost  = load(STORE_KEYS.lost,  []);
    const found = load(STORE_KEYS.found, []);
    let lostMatch = null, foundMatch = null;
    if (side === 'lost') {
      foundMatch = found.find(f => f.status === 'pending' && f.document_type.toLowerCase().trim() === newReport.document_type.toLowerCase().trim() && f.document_number.toLowerCase().trim() === newReport.document_number.toLowerCase().trim());
    } else {
      lostMatch = lost.find(l => l.status === 'pending' && l.document_type.toLowerCase().trim() === newReport.document_type.toLowerCase().trim() && l.document_number.toLowerCase().trim() === newReport.document_number.toLowerCase().trim());
    }
    if (side === 'lost' && foundMatch) {
      newReport.status = 'matched'; newReport.matched_with_id = foundMatch.id;
      const i = lost.findIndex(x => x.id === newReport.id); lost[i] = newReport; save(STORE_KEYS.lost, lost);
      const j = found.findIndex(x => x.id === foundMatch.id); found[j] = { ...foundMatch, status: 'matched', matched_with_id: newReport.id }; save(STORE_KEYS.found, found);
      addNotif(newReport.user_id, 'Good news! Your lost document has been found.', `Your ${newReport.document_type} (${newReport.document_number}) has a matching found report.`, 'match', newReport.id, foundMatch.id);
      addNotif(foundMatch.user_id, 'A lost report matches your found document.', `The owner of the ${newReport.document_type} (${newReport.document_number}) has been notified.`, 'match', newReport.id, foundMatch.id);
      return true;
    }
    if (side === 'found' && lostMatch) {
      newReport.status = 'matched'; newReport.matched_with_id = lostMatch.id;
      const i = found.findIndex(x => x.id === newReport.id); found[i] = newReport; save(STORE_KEYS.found, found);
      const j = lost.findIndex(x => x.id === lostMatch.id); lost[j] = { ...lostMatch, status: 'matched', matched_with_id: newReport.id }; save(STORE_KEYS.lost, lost);
      addNotif(lostMatch.user_id, 'Good news! Your lost document has been found.', `Your ${newReport.document_type} (${newReport.document_number}) has been matched.`, 'match', lostMatch.id, newReport.id);
      addNotif(newReport.user_id, 'A lost report matches your found document.', `The owner of the ${newReport.document_type} (${newReport.document_number}) has been notified.`, 'match', lostMatch.id, newReport.id);
      return true;
    }
    return false;
  }

  window.__demoApi = async function (path, opts = {}) {
    const { method = 'GET', body, formData, query } = opts;
    const data = formData ? Object.fromEntries(formData) : (body || {});
    const params = query || {};
    const q  = (params.q || '').trim().toLowerCase();
    const dn = (params.doc_number || '').trim().toLowerCase();
    const ty = (params.type || '').trim();
    const st = (params.status || '').trim();
    const match = (a, b) => !q || a.toLowerCase().includes(q) || b.toLowerCase().includes(q);
    const docMatch = (n) => !dn || n.toLowerCase().includes(dn);
    const typeMatch = (t) => !ty || t === ty;
    const statusMatch = (s) => !st || s === st;

    if (path === '/auth/register' && method === 'POST') {
      const users = load(STORE_KEYS.users, []);
      if (users.find(u => u.email === data.email)) throw new Error('Email already registered');
      const u = { id: nextId(users), ...data, role: 'student', is_active: 1, created_at: nowIso() };
      users.push(u); save(STORE_KEYS.users, users);
      const token = 'demo.' + btoa(JSON.stringify({ id: u.id, email: u.email, role: u.role }));
      Auth.setSession(token, publicUser(u));
      return { message: 'Account created', token, user: publicUser(u) };
    }
    if (path === '/auth/login' && method === 'POST') {
      const users = load(STORE_KEYS.users, []);
      const u = users.find(x => x.email === data.email || x.registration_number === data.email);
      if (!u || u.password !== data.password) throw new Error('Invalid credentials');
      const token = 'demo.' + btoa(JSON.stringify({ id: u.id, email: u.email, role: u.role }));
      Auth.setSession(token, publicUser(u));
      return { message: 'Login successful', token, user: publicUser(u) };
    }
    if (path === '/auth/me') {
      if (!Auth.getToken()) throw new Error('Not authenticated');
      return { user: Auth.getUser() };
    }

    const me = Auth.getUser();

    if (path === '/lost' && method === 'POST') {
      const lost = load(STORE_KEYS.lost, []);
      const r = { id: nextId(lost), user_id: me.id, ...data, status: 'pending', matched_with_id: null, created_at: nowIso() };
      lost.unshift(r); save(STORE_KEYS.lost, lost);
      const matched = tryMatch(r, 'lost');
      return { message: matched ? 'Lost reported. Match found!' : 'Lost reported', lost: r, matched };
    }
    if (path === '/lost/mine') return { lost: load(STORE_KEYS.lost, []).filter(l => l.user_id === me.id) };
    if (path === '/lost/stats/me') {
      const lost = load(STORE_KEYS.lost, []).filter(l => l.user_id === me.id);
      const found = load(STORE_KEYS.found, []).filter(f => f.user_id === me.id);
      const notifs = load(STORE_KEYS.notifs, []).filter(n => n.user_id === me.id && !n.is_read);
      return { lost: lost.length, found: found.length, recovered: lost.filter(l => l.status === 'recovered').length, notifications: notifs.length };
    }

    if (path === '/found' && method === 'POST') {
      const found = load(STORE_KEYS.found, []);
      const r = { id: nextId(found), user_id: me.id, ...data, status: 'pending', matched_with_id: null, created_at: nowIso() };
      found.unshift(r); save(STORE_KEYS.found, found);
      const matched = tryMatch(r, 'found');
      return { message: matched ? 'Found reported. Owner notified!' : 'Found reported', found: r, matched };
    }
    if (path === '/found/mine') return { found: load(STORE_KEYS.found, []).filter(f => f.user_id === me.id) };

    if (path === '/search') {
      const users = load(STORE_KEYS.users, []);
      const lost  = load(STORE_KEYS.lost,  []);
      const found = load(STORE_KEYS.found, []);
      return {
        lost: lost.filter(l => match(l.document_type + ' ' + l.document_number, l.location_lost || '') && docMatch(l.document_number) && typeMatch(l.document_type) && statusMatch(l.status))
                  .map(l => ({ ...l, owner_name: users.find(u => u.id === l.user_id)?.full_name })),
        found: found.filter(f => match(f.document_type + ' ' + f.document_number, f.location_found || '') && docMatch(f.document_number) && typeMatch(f.document_type) && statusMatch(f.status))
                    .map(f => ({ ...f, finder_name: users.find(u => u.id === f.user_id)?.full_name })),
      };
    }

    if (path === '/notifications') return { notifications: load(STORE_KEYS.notifs, []).filter(n => n.user_id === me.id) };
    if (path === '/notifications/unread-count') return { count: load(STORE_KEYS.notifs, []).filter(n => n.user_id === me.id && !n.is_read).length };
    if (path.startsWith('/notifications/') && path.endsWith('/read') && method === 'PATCH') {
      const id = Number(path.split('/')[2]);
      const n = load(STORE_KEYS.notifs, []); const i = n.findIndex(x => x.id === id && x.user_id === me.id);
      if (i >= 0) n[i].is_read = 1; save(STORE_KEYS.notifs, n);
      return { message: 'Marked as read' };
    }
    if (path === '/notifications/mark-all-read' && method === 'PATCH') {
      const n = load(STORE_KEYS.notifs, []).map(x => x.user_id === me.id ? { ...x, is_read: 1 } : x);
      save(STORE_KEYS.notifs, n); return { message: 'All marked as read' };
    }

    if (path === '/admin/overview') {
      const users = load(STORE_KEYS.users, []);
      const lost  = load(STORE_KEYS.lost, []);
      const found = load(STORE_KEYS.found, []);
      const activeUsers = users.filter(u => u.is_active === 1).length;
      return { users: activeUsers, lost: lost.length, found: found.length, recovered: lost.filter(l => l.status === 'recovered').length, matched: lost.filter(l => l.status === 'matched').length, pending_lost: lost.filter(l => l.status === 'pending').length, pending_found: found.filter(f => f.status === 'pending').length };
    }
    if (path === '/admin/users') return { users: load(STORE_KEYS.users, []).map(publicUser) };
    if (path === '/admin/reports') {
      const users = load(STORE_KEYS.users, []);
      const lost  = load(STORE_KEYS.lost,  []).map(l => ({ ...l, owner_name: users.find(u => u.id === l.user_id)?.full_name, report_type: 'lost' }));
      const found = load(STORE_KEYS.found, []).map(f => ({ ...f, owner_name: users.find(u => u.id === f.user_id)?.full_name, report_type: 'found' }));
      return { reports: [...lost, ...found].sort((a, b) => b.created_at.localeCompare(a.created_at)) };
    }
    if (path === '/admin/matches') {
      const users = load(STORE_KEYS.users, []);
      const lost  = load(STORE_KEYS.lost,  []);
      const found = load(STORE_KEYS.found, []);
      return { matches: lost.filter(l => l.matched_with_id).map(l => {
        const f = found.find(x => x.id === l.matched_with_id);
        return { ...l, lost_status: l.status, found_status: f?.status, location_found: f?.location_found, date_found: f?.date_found, owner_name: users.find(u => u.id === l.user_id)?.full_name, finder_name: users.find(u => u.id === f?.user_id)?.full_name };
      }) };
    }
    if (path === '/admin/all-notifications') {
      const notifs = load(STORE_KEYS.notifs, []);
      const users = load(STORE_KEYS.users, []);
      return { notifications: notifs.map(n => ({ ...n, user_name: users.find(u => u.id === n.user_id)?.full_name || 'Unknown' })) };
    }
    if (path === '/admin/activity') return { activity: load(STORE_KEYS.activity, []) };

    const lostStatus = path.match(/^\/lost\/(\d+)\/status$/);
    if (lostStatus && method === 'PATCH') {
      const id = Number(lostStatus[1]);
      const lost = load(STORE_KEYS.lost, []);
      const i = lost.findIndex(x => x.id === id);
      if (i < 0) throw new Error('Not found');
      lost[i].status = body.status; save(STORE_KEYS.lost, lost);
      if (body.status === 'recovered') addNotif(lost[i].user_id, 'Document recovered!', 'Glad your document is back.', 'success', id, null);
      return { message: 'Status updated' };
    }
    const foundStatus = path.match(/^\/found\/(\d+)\/status$/);
    if (foundStatus && method === 'PATCH') {
      const id = Number(foundStatus[1]);
      const found = load(STORE_KEYS.found, []);
      const i = found.findIndex(x => x.id === id);
      if (i < 0) throw new Error('Not found');
      found[i].status = body.status; save(STORE_KEYS.found, found);
      return { message: 'Status updated' };
    }

    throw new Error('Demo: endpoint not implemented: ' + method + ' ' + path);
  };
})();