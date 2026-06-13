/**
 * UEAB IMS - Seed Script
 * Run with:  npm run seed
 *
 * Creates default accounts and sample data so you can log in immediately.
 */

const bcrypt = require('bcryptjs');
const supabase = require('../config/db');

async function seed() {
  console.log('🌱 Seeding UEAB IMS database...\n');

  const users = [
    {
      full_name: 'System Administrator',
      email: 'admin@ueab.ac.ke',
      registration_number: 'UEAB/ADMIN/001',
      phone: '+254700000001',
      role: 'admin',
    },
    {
      full_name: 'John Doe',
      email: 'john@ueab.ac.ke',
      registration_number: 'UEAB/23/00123',
      phone: '+254712345678',
      role: 'student',
    },
    {
      full_name: 'Security Officer',
      email: 'security@ueab.ac.ke',
      registration_number: 'UEAB/STAFF/0042',
      phone: '+254711222333',
      role: 'security',
    },
    {
      full_name: 'Jane Smith',
      email: 'jane@ueab.ac.ke',
      registration_number: 'UEAB/22/00087',
      phone: '+254798765432',
      role: 'student',
    },
  ];

  const userIds = {};
  for (const u of users) {
    const hash = bcrypt.hashSync(u.password || (u.email.includes('admin') ? 'admin123' : 'student123'), 10);
    const { data: existing } = await supabase.from('users').select('id').eq('email', u.email).single();
    if (!existing) {
      const { data, error } = await supabase.from('users').insert({ ...u, password_hash: hash }).select().single();
      if (error) {
        console.log('  ✗ ' + u.email + ' - ' + error.message);
        continue;
      }
      userIds[u.role === 'admin' ? 'admin' : u.email] = data.id;
      console.log(`  ✓ ${u.role.padEnd(8)} | ${u.email}  |  password: ${u.password || 'admin123'}`);
    } else {
      userIds[u.role === 'admin' ? 'admin' : u.email] = existing.id;
      console.log(`  - ${u.role.padEnd(8)} | ${u.email}  |  already exists`);
    }
  }

  console.log('\n✅ Seed complete. Default accounts above are ready to use.\n');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});