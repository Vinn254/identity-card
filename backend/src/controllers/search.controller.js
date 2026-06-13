/**
 * Search controller
 * Public-ish: anyone authenticated can search both lost + found reports.
 */

const supabase = require('../config/db');

exports.search = async (req, res) => {
  const { q = '', type = '', doc_number = '', status = '' } = req.query;

  let lostQuery = supabase.from('lost_documents').select('*, user_id');
  let foundQuery = supabase.from('found_documents').select('*, user_id');

  if (q) {
    lostQuery = lostQuery.or(`document_type.ilike.%${q}%,document_number.ilike.%${q}%,location_lost.ilike.%${q}%`);
    foundQuery = foundQuery.or(`document_type.ilike.%${q}%,document_number.ilike.%${q}%,location_found.ilike.%${q}%`);
  }
  if (type) {
    lostQuery = lostQuery.eq('document_type', type);
    foundQuery = foundQuery.eq('document_type', type);
  }
  if (doc_number) {
    lostQuery = lostQuery.ilike('document_number', `%${doc_number}%`);
    foundQuery = foundQuery.ilike('document_number', `%${doc_number}%`);
  }
  if (status) {
    lostQuery = lostQuery.eq('status', status);
    foundQuery = foundQuery.eq('status', status);
  }

  const [lostResult, foundResult, users] = await Promise.all([
    lostQuery.order('created_at', { ascending: false }).limit(100),
    foundQuery.order('created_at', { ascending: false }).limit(100),
    supabase.from('users').select('id, full_name').order('id')
  ]);

  const userMap = {};
  (users.data || []).forEach(u => userMap[u.id] = u.full_name);

  const lost = (lostResult.data || []).map(d => ({
    ...d,
    owner_name: d.user_id ? userMap[d.user_id] || 'Unknown' : null
  }));

  const found = (foundResult.data || []).map(d => ({
    ...d,
    finder_name: d.user_id ? userMap[d.user_id] || 'Unknown' : null
  }));

  res.json({ lost, found });
};