const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { foodPoints } = require('../utils/points');

const router = express.Router();
router.use(requireAuth);

// GET /api/food
router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, date, food, had, points FROM food_entries WHERE user_id = ? ORDER BY date DESC, id DESC',
    [req.userId]
  );
  res.json({ food: rows });
});

// POST /api/food  { date, food, had: 'yes'|'no' }
router.post('/', async (req, res) => {
  const { date, food, had } = req.body || {};
  if (!date || !food || (had !== 'yes' && had !== 'no')) {
    return res.status(400).json({ error: 'date, food, and had ("yes" or "no") are required.' });
  }
  const points = foodPoints(had);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO food_entries (user_id, date, food, had, points) VALUES (?, ?, ?, ?, ?)',
      [req.userId, date, food, had, points]
    );
    await conn.query('UPDATE users SET points = points + ? WHERE id = ?', [points, req.userId]);
    await conn.commit();
    res.json({ id: result.insertId, date, food, had, points });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ error: 'Could not save food entry.' });
  } finally {
    conn.release();
  }
});

module.exports = router;
