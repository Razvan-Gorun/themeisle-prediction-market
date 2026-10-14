import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/database.js';

const router = Router();

// POST /auth/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hashedPassword);
  const userId = result.lastInsertRowid;

  res.cookie('userId', userId, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  res.json({ success: true, userId });
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT id, password_hash FROM users WHERE username = ?').get(username) as any;
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.cookie('userId', user.id, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  res.json({ success: true, userId: user.id });
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('userId', {
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  res.json({ success: true });
});

// GET /auth/me
router.get('/me', (req, res) => {
  const userId = req.cookies.userId;
  if (!userId) {
    return res.json({ user: null });
  }
  const user = db.prepare('SELECT id, username, balance, role FROM users WHERE id = ?').get(userId);
  res.json({ user: user || null });
});

// Ruta de test (opțional)
router.get('/test', (req, res) => {
  res.json({ message: 'auth test ok' });
});

export default router;
