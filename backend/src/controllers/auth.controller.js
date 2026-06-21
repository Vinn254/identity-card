/**
 * Auth controller: register, login, current user.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/db');

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function publicUser(u) {
  return {
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    phone: u.phone,
    registration_number: u.registration_number,
    role: u.role,
    created_at: u.created_at,
  };
}

exports.register = async (req, res) => {
  const { full_name, email, phone, registration_number, password, confirm_password } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'Full name, email and password are required' });
  }
  if (password !== confirm_password) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const { data: existing, error: checkError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const { data: user, error } = await supabase
    .from('users')
    .insert({ full_name, email, phone, registration_number, password_hash: hash, role: 'student' })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  const token = signToken(user);

  res.status(201).json({
    message: 'Account created successfully',
    token,
    user: publicUser(user),
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .or(`email.eq.${email},registration_number.eq.${email}`)
    .single();

  if (error || !user || !user.is_active) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken(user);
  res.json({ message: 'Login successful', token, user: publicUser(user) });
};

exports.me = async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: publicUser(user) });
};