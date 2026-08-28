const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { sendVerificationCode } = require('../mailer');
require('dotenv').config();

const router = express.Router();

function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit code
}

function issueToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
}

function publicUser(user) {
  return { id: user.id, username: user.username, fullName: user.full_name, email: user.email, points: user.points };
}

// POST /api/auth/signup
// body: { username, fullName, email, password }
// Creates a pending_verifications row and emails a 6-digit code. No account exists yet.
router.post('/signup', async (req, res) => {
  try {
    const { username, fullName, email, password } = req.body || {};
    if (!username || !fullName || !email || !password) {
      return res.status(400).json({ error: 'username, fullName, email, and password are all required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const emailNorm = String(email).trim().toLowerCase();
    const usernameNorm = String(username).trim();

    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [usernameNorm, emailNorm]
    );
    if (existingUsers.length) {
      return res.status(409).json({ error: 'That username or email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const code = genCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // One pending signup per email — a repeat signup attempt just refreshes the code.
    await pool.query(
      `INSERT INTO pending_verifications (username, full_name, email, password_hash, code, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE username = VALUES(username), full_name = VALUES(full_name),
         password_hash = VALUES(password_hash), code = VALUES(code), expires_at = VALUES(expires_at)`,
      [usernameNorm, fullName.trim(), emailNorm, passwordHash, code, expiresAt]
    );

    await sendVerificationCode(emailNorm, fullName.trim(), code);

    res.json({ message: 'Verification code sent to your email.', email: emailNorm });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not start signup. Please try again.' });
  }
});

// POST /api/auth/verify
// body: { email, code }
// Confirms the code, creates the real user account, returns a JWT.
router.post('/verify', async (req, res) => {
  try {
    const { email, code } = req.body || {};
    if (!email || !code) return res.status(400).json({ error: 'email and code are required.' });
    const emailNorm = String(email).trim().toLowerCase();

    const [rows] = await pool.query('SELECT * FROM pending_verifications WHERE email = ?', [emailNorm]);
    if (!rows.length) return res.status(400).json({ error: 'No pending signup found for that email.' });
    const pending = rows[0];

    if (new Date(pending.expires_at) < new Date()) {
      return res.status(400).json({ error: 'That code has expired. Please request a new one.' });
    }
    if (String(pending.code) !== String(code).trim()) {
      return res.status(400).json({ error: 'Incorrect code.' });
    }

    const [result] = await pool.query(
      `INSERT INTO users (username, full_name, email, password_hash) VALUES (?, ?, ?, ?)`,
      [pending.username, pending.full_name, pending.email, pending.password_hash]
    );
    await pool.query('DELETE FROM pending_verifications WHERE email = ?', [emailNorm]);

    const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    const user = userRows[0];
    const token = issueToken(user);

    res.json({ token, user: publicUser(user) });
  } catch (e) {
    console.error(e);
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'That username or email is already registered.' });
    }
    res.status(500).json({ error: 'Could not verify account. Please try again.' });
  }
});

// POST /api/auth/resend
// body: { email }
router.post('/resend', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email is required.' });
    const emailNorm = String(email).trim().toLowerCase();

    const [rows] = await pool.query('SELECT * FROM pending_verifications WHERE email = ?', [emailNorm]);
    if (!rows.length) return res.status(400).json({ error: 'No pending signup found for that email.' });
    const pending = rows[0];

    const code = genCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await pool.query('UPDATE pending_verifications SET code = ?, expires_at = ? WHERE email = ?', [code, expiresAt, emailNorm]);
    await sendVerificationCode(emailNorm, pending.full_name, code);

    res.json({ message: 'A new code has been sent.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not resend code. Please try again.' });
  }
});

// POST /api/auth/login
// body: { username, password }
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username and password are required.' });

    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [String(username).trim()]);
    if (!rows.length) return res.status(401).json({ error: 'Wrong username or password.' });
    const user = rows[0];

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Wrong username or password.' });

    const token = issueToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not log in. Please try again.' });
  }
});

// GET /api/auth/me — used by the app on launch to check if a stored token is still valid
const { requireAuth } = require('../middleware/auth');
router.get('/me', requireAuth, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.userId]);
  if (!rows.length) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: publicUser(rows[0]) });
});

module.exports = router;
