const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { activityPoints, MAX_HOURS } = require('../utils/points');

const router = express.Router();
router.use(requireAuth);

// GET /api/activities
router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, date, type, detail, duration, points FROM activities WHERE user_id = ? ORDER BY date DESC, id DESC',
    [req.userId]
  );
  res.json({ activities: rows });
});

// POST /api/activities  { date, type, detail, duration }
router.post('/', async (req, res) => {
  const { date, type, detail, duration } = req.body || {};
  if (!date || !type || !detail || !duration) {
    return res.status(400).json({ error: 'date, type, detail, and duration are required.' });
  }
  const durNum = parseFloat(duration);
  if (!durNum || durNum <= 0) return res.status(400).json({ error: 'Duration must be a positive number.' });
  if (durNum > MAX_HOURS) return res.status(400).json({ error: `Max ${MAX_HOURS} hours allowed per workout entry.` });

  const points = activityPoints(durNum);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO activities (user_id, date, type, detail, duration, points) VALUES (?, ?, ?, ?, ?, ?)',
      [req.userId, date, type, detail, durNum, points]
    );
    await conn.query('UPDATE users SET points = points + ? WHERE id = ?', [points, req.userId]);
    await conn.commit();
    res.json({ id: result.insertId, date, type, detail, duration: durNum, points });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ error: 'Could not save workout.' });
  } finally {
    conn.release();
  }
});

module.exports = router;
