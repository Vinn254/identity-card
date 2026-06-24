/**
 * Admin controller
 * - Stats overview
 * - List users
 * - Activate/deactivate users
 * - All reports
 * - Activity log
 */

const supabase = require('../config/db');

async function logActivity(userId, action, entityType, entityId, details) {
  await supabase.from('activity_log').insert({ user_id: userId, action, entity_type: entityType, entity_id: entityId, details });
}

exports.overview = async (req, res) => {
  const [activeUsers, lost, found, recovered, matched, pendingLost, pendingFound] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('lost_documents').select('*', { count: 'exact', head: true }),
    supabase.from('found_documents').select('*', { count: 'exact', head: true }),
    supabase.from('lost_documents').select('*', { count: 'exact', head: true }).eq('status', 'recovered'),
    supabase.from('lost_documents').select('*', { count: 'exact', head: true }).eq('status', 'matched'),
    supabase.from('lost_documents').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('found_documents').select('*', { count: 'exact', head: true }).eq('status', 'pending')
  ]);

  res.json({
    users: activeUsers.count || 0,
    lost: lost.count || 0,
    found: found.count || 0,
    recovered: recovered.count || 0,
    matched: matched.count || 0,
    pending_lost: pendingLost.count || 0,
    pending_found: pendingFound.count || 0,
  });
};

exports.listUsers = async (req, res) => {
  const { data: rows, error } = await supabase
    .from('users')
    .select('id, full_name, email, registration_number, phone, role, is_active, created_at')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ users: rows });
};

exports.setActive = async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  if (id === req.user.id) {
    return res.status(400).json({ error: 'You cannot deactivate your own account' });
  }
  await supabase.from('users').update({ is_active }).eq('id', id);
  await logActivity(req.user.id, is_active ? 'activate_user' : 'deactivate_user', 'user', id, null);
  res.json({ message: 'User updated' });
};

exports.allReports = async (req, res) => {
  const [lostResult, foundResult, users] = await Promise.all([
    supabase.from('lost_documents').select('*, user_id').order('created_at', { ascending: false }),
    supabase.from('found_documents').select('*, user_id').order('created_at', { ascending: false }),
    supabase.from('users').select('id, full_name').order('id')
  ]);

  const userMap = {};
  (users.data || []).forEach(u => userMap[u.id] = u.full_name);

  const lost = (lostResult.data || []).map(d => ({ ...d, report_type: 'lost', owner_name: userMap[d.user_id] || 'Unknown' }));
  const found = (foundResult.data || []).map(d => ({ ...d, report_type: 'found', finder_name: userMap[d.user_id] || 'Unknown' }));

  res.json({ reports: [...lost, ...found].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')) });
};

exports.matches = async (req, res) => {
  const { data: rows, error } = await supabase
    .from('lost_documents')
    .select('*')
    .not('matched_with_id', 'is', null)
    .order('updated_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const [users, foundDocs] = await Promise.all([
    supabase.from('users').select('id, full_name').order('id'),
    supabase.from('found_documents').select('id, user_id').order('id')
  ]);

  const userMap = {};
  (users.data || []).forEach(u => userMap[u.id] = u.full_name);

  const foundUserMap = {};
  (foundDocs.data || []).forEach(f => foundUserMap[f.id] = f.user_id);

  const withFinders = (rows || []).map(r => ({
    ...r,
    owner_name: userMap[r.user_id] || 'Unknown',
    finder_name: foundUserMap[r.matched_with_id] ? userMap[foundUserMap[r.matched_with_id]] || 'Unknown' : null
  }));

  res.json({ matches: withFinders });
};

exports.activity = async (req, res) => {
  const { data: rows, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return res.status(500).json({ error: error.message });

  const userIds = [...new Set((rows || []).map(r => r.user_id).filter(Boolean))];
  if (userIds.length === 0) return res.json({ activity: rows });

  const { data: users } = await supabase.from('users').select('id, full_name, role').in('id', userIds);
  const userMap = {};
  (users || []).forEach(u => userMap[u.id] = u);

  const activity = (rows || []).map(a => ({
    ...a,
    user_id: userMap[a.user_id] || null
  }));

  res.json({ activity });
};

exports.allNotifications = async (req, res) => {
  const { data: rows, error } = await supabase
    .from('notifications')
    .select('id, user_id, title, message, type, is_read, created_at')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const userIds = [...new Set((rows || []).map(r => r.user_id).filter(Boolean))];
  if (userIds.length === 0) return res.json({ notifications: rows });

  const { data: users } = await supabase.from('users').select('id, full_name').in('id', userIds);
  const userMap = {};
  (users || []).forEach(u => userMap[u.id] = u.full_name);

  const notifications = (rows || []).map(n => ({
    ...n,
    user_name: userMap[n.user_id] || 'Unknown'
  }));

  res.json({ notifications });
};