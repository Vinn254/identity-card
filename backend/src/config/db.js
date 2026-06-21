/**
 * UEAB IMS - Database Setup
 * Supabase client for database operations
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nwydgwpcxlgseofmvbyy.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_6YrEcCLuJrSs6TbnQOq2uw___cDyS1H';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

module.exports = supabase;