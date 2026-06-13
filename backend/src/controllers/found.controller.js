/**
 * Found documents controller
 * - Create a found report (with optional image upload)
 * - List user's own found reports
 * - List all (admin)
 * - Auto-match against existing lost reports
 */

const supabase = require('../config/db');

async function logActivity(userId, action, entityType, entityId, details) {
  await supabase.from('activity_log').insert({ user_id: userId, action, entity_type: entityType, entity_id: entityId, details });
}

async function notify(userId, title, message, type, lostId, foundId) {
  await supabase.from('notifications').insert({ user_id: userId, title, message, type, related_lost_id: lostId, related_found_id: foundId });
}

async function tryAutoMatchFound(foundId, docType, docNumber) {
  const { data: match, error } = await supabase
    .from('lost_documents')
    .select('*')
    .ilike('document_type', docType.trim())
    .ilike('document_number', docNumber.trim())
    .eq('status', 'pending')
    .limit(1)
    .single();

  if (!match || error) return null;

  await supabase.from('lost_documents').update({ status: 'matched', matched_with_id: foundId }).eq('id', match.id);
  await supabase.from('found_documents').update({ status: 'matched', matched_with_id: match.id }).eq('id', foundId);

  const { data: lost } = await supabase.from('lost_documents').select('user_id').eq('id', match.id).single();
  const { data: found } = await supabase.from('found_documents').select('user_id').eq('id', foundId).single();

  await notify(lost.user_id, 'Good news! Your lost document has been found.',
    `Your ${docType} (${docNumber}) has a matching found report. Please visit the Security Office to claim it.`,
    'match', match.id, foundId);
  await notify(found.user_id, 'A lost report matches your found document.',
    `The owner of the ${docType} (${docNumber}) you reported has been notified.`,
    'match', match.id, foundId);

  await logActivity(null, 'auto_match', 'found_document', foundId, `Matched with lost #${match.id}`);
  return match.id;
}

exports.create = async (req, res) => {
  const { document_type, document_number, date_found, location_found, finder_contact, description } = req.body;
  if (!document_type || !document_number || !date_found || !location_found) {
    return res.status(400).json({ error: 'document_type, document_number, date_found and location_found are required' });
  }

  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  const { data: found, error } = await supabase
    .from('found_documents')
    .insert({
      user_id: req.user.id, document_type, document_number, date_found, location_found, finder_contact, description, image_path: imagePath
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  const matchedLostId = await tryAutoMatchFound(found.id, document_type, document_number);
  await logActivity(req.user.id, 'create_found', 'found_document', found.id, null);

  res.status(201).json({
    message: matchedLostId
      ? 'Found document reported. The owner has been notified!'
      : 'Found document reported successfully',
    found,
    matched: Boolean(matchedLostId),
  });
};

exports.myFound = async (req, res) => {
  const { data: rows, error } = await supabase
    .from('found_documents')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ found: rows });
};

exports.listAll = async (req, res) => {
  const { data: rows, error } = await supabase
    .from('found_documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ found: rows });
};

exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'matched', 'claimed', 'closed'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const { data: row, error: findError } = await supabase
    .from('found_documents')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (!row || findError) return res.status(404).json({ error: 'Not found' });

  if ((status === 'claimed' || status === 'closed') && row.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not allowed' });
  }

  await supabase.from('found_documents').update({ status }).eq('id', req.params.id);
  await logActivity(req.user.id, 'update_status', 'found_document', row.id, `status -> ${status}`);
  res.json({ message: 'Status updated' });
};