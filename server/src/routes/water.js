const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/water — capacity + recent logs
router.get('/', async (req, res) => {
  const [userRows] = await pool.query('SELECT bottle_capacity FROM users WHERE id = ?', [req.userId]);
  const [logs] = await pool.query(
    'SELECT date, bottles FROM water_logs WHERE user_id = ? ORDER BY date DESC LIMIT 30',
    [req.userId]
  );
  res.json({ capacity: userRows[0]?.bottle_capacity ?? null, logs });
});

// POST /api/water/capacity  { capacity }
router.post('/capacity', async (req, res) => {
  const { capacity } = req.body || {};
  const num = parseFloat(capacity);
  if (!num || num <= 0) return res.status(400).json({ error: 'Enter a valid bottle size in liters.' });
  await pool.query('UPDATE users SET bottle_capacity = ? WHERE id = ?', [num, req.userId]);
  res.json({ capacity: num });
});

// POST /api/water/log  { date, delta }  — delta is +1 or -1
router.post('/log', async (req, res) => {
  const date = req.body.date || new Date().toISOString().slice(0, 10);
  const delta = parseInt(req.body.delta, 10) || 0;
  await pool.query(
    `INSERT INTO water_logs (user_id, date, bottles) VALUES (?, ?, GREATEST(0, ?))
     ON DUPLICATE KEY UPDATE bottles = GREATEST(0, bottles + ?)`,
    [req.userId, date, delta, delta]
  );
  const [rows] = await pool.query('SELECT bottles FROM water_logs WHERE user_id = ? AND date = ?', [req.userId, date]);
  res.json({ date, bottles: rows[0]?.bottles ?? 0 });
});

module.exports = router;
