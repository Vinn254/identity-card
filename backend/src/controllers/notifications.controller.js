/**
 * Notifications controller
 * - List user's notifications
 * - Mark as read (one or all)
 */

const supabase = require('../config/db');

exports.list = async (req, res) => {
  const { data: rows, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ notifications: rows });
};

exports.unreadCount = async (req, res) => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', req.user.id)
    .eq('is_read', false);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ count: count || 0 });
};

exports.markRead = async (req, res) => {
  await supabase.from('notifications').update({ is_read: true }).eq('id', req.params.id).eq('user_id', req.user.id);
  res.json({ message: 'Marked as read' });
};

exports.markAllRead = async (req, res) => {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', req.user.id);
  res.json({ message: 'All notifications marked as read' });
};