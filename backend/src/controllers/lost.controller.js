/**
 * Lost documents controller
 * - Create a lost report
 * - List current user's lost reports
 * - List all (admin)
 * - Auto-match a lost report against existing found reports
 */

const supabase = require('../config/db');

async function logActivity(userId, action, entityType, entityId, details) {
  await supabase.from('activity_log').insert({ user_id: userId, action, entity_type: entityType, entity_id: entityId, details });
}

async function notify(userId, title, message, type, lostId, foundId) {
  await supabase.from('notifications').insert({ user_id: userId, title, message, type, related_lost_id: lostId, related_found_id: foundId });
}

/**
 * Try to auto-match a new lost report against existing found reports.
 * Match rule: same document_type AND same document_number (case-insensitive).
 */
async function tryAutoMatchLost(lostId, docType, docNumber) {
  const { data: match, error } = await supabase
    .from('found_documents')
    .select('*')
    .ilike('document_type', docType.trim())
    .ilike('document_number', docNumber.trim())
    .eq('status', 'pending')
    .limit(1)
    .single();

  if (!match || error) return null;

  await supabase.from('lost_documents').update({ status: 'matched', matched_with_id: match.id }).eq('id', lostId);
  await supabase.from('found_documents').update({ status: 'matched', matched_with_id: lostId }).eq('id', match.id);

  const { data: lost } = await supabase.from('lost_documents').select('user_id').eq('id', lostId).single();
  const { data: found } = await supabase.from('found_documents').select('user_id').eq('id', match.id).single();

  await notify(lost.user_id, 'Good news! Your lost document has been found.',
    `Your ${docType} (${docNumber}) has a matching found report. Please visit the Security Office to claim it.`,
    'match', lostId, match.id);
  await notify(found.user_id, 'A lost report matches your found document.',
    `The owner of the ${docType} (${docNumber}) you reported has been notified.`,
    'match', lostId, match.id);

  await logActivity(null, 'auto_match', 'lost_document', lostId, `Matched with found #${match.id}`);
  return match.id;
}

exports.create = async (req, res) => {
  const { document_type, document_number, date_lost, location_lost, description, brand, color } = req.body;
  if (!document_type || !document_number || !date_lost) {
    return res.status(400).json({ error: 'document_type, document_number and date_lost are required' });
  }

  const { data: lost, error } = await supabase
    .from('lost_documents')
    .insert({ user_id: req.user.id, document_type, document_number, date_lost, location_lost, description, brand, color })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  const matchedFoundId = await tryAutoMatchLost(lost.id, document_type, document_number);
  await logActivity(req.user.id, 'create_lost', 'lost_document', lost.id, null);

  res.status(201).json({
    message: matchedFoundId
      ? 'Lost document reported. A match was found automatically!'
      : 'Lost document reported successfully',
    lost,
    matched: Boolean(matchedFoundId),
  });
};

exports.myLost = async (req, res) => {
  const { data: rows, error } = await supabase
    .from('lost_documents')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ lost: rows });
};

exports.listAll = async (req, res) => {
  const { data: rows, error } = await supabase
    .from('lost_documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ lost: rows });
};

exports.getOne = async (req, res) => {
  const { data: row, error } = await supabase
    .from('lost_documents')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json({ lost: row });
};

exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'matched', 'recovered', 'closed'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const { data: row, error: findError } = await supabase
    .from('lost_documents')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (!row || findError) return res.status(404).json({ error: 'Not found' });

  if ((status === 'recovered' || status === 'closed') && row.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not allowed' });
  }

  await supabase.from('lost_documents').update({ status }).eq('id', req.params.id);

  if (status === 'recovered') {
    await notify(row.user_id, 'Document recovered!',
      'Glad your document is back. You can close this report from your dashboard.', 'success', row.id, row.matched_with_id);
  }

  await logActivity(req.user.id, 'update_status', 'lost_document', row.id, `status -> ${status}`);
  res.json({ message: 'Status updated' });
};

exports.stats = async (req, res) => {
  const userId = req.user.id;

  const [lostCount, foundCount, recoveredCount, notifCount] = await Promise.all([
    supabase.from('lost_documents').select('*', { count: 'exact' }).eq('user_id', userId),
    supabase.from('found_documents').select('*', { count: 'exact' }).eq('user_id', userId),
    supabase.from('lost_documents').select('*', { count: 'exact' }).eq('user_id', userId).eq('status', 'recovered'),
    supabase.from('notifications').select('*', { count: 'exact' }).eq('user_id', userId).eq('is_read', false)
  ]);

  res.json({
    lost: lostCount.count || 0,
    found: foundCount.count || 0,
    recovered: recoveredCount.count || 0,
    notifications: notifCount.count || 0,
  });
};