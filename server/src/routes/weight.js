const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/weight
router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT date, weight FROM weight_logs WHERE user_id = ? ORDER BY date ASC', [req.userId]);
  res.json({ weight: rows });
});

// POST /api/weight  { date, weight }
router.post('/', async (req, res) => {
  const { date, weight } = req.body || {};
  const num = parseFloat(weight);
  if (!date || !num || num <= 0) return res.status(400).json({ error: 'date and a valid weight are required.' });
  await pool.query(
    `INSERT INTO weight_logs (user_id, date, weight) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE weight = VALUES(weight)`,
    [req.userId, date, num]
  );
  res.json({ date, weight: num });
});

module.exports = router;
