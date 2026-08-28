const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/goals
router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, text, deadline, done FROM goals WHERE user_id = ? ORDER BY done ASC, deadline ASC',
    [req.userId]
  );
  res.json({ goals: rows.map(g => ({ ...g, done: !!g.done })) });
});

// POST /api/goals  { text, deadline }
router.post('/', async (req, res) => {
  const { text, deadline } = req.body || {};
  if (!text || !deadline) return res.status(400).json({ error: 'text and deadline are required.' });
  const [result] = await pool.query('INSERT INTO goals (user_id, text, deadline) VALUES (?, ?, ?)', [req.userId, text, deadline]);
  res.json({ id: result.insertId, text, deadline, done: false });
});

// PATCH /api/goals/:id/toggle
router.patch('/:id/toggle', async (req, res) => {
  await pool.query('UPDATE goals SET done = NOT done WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  const [rows] = await pool.query('SELECT done FROM goals WHERE id = ?', [req.params.id]);
  res.json({ done: !!rows[0]?.done });
});

// DELETE /api/goals/:id
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM goals WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  res.json({ ok: true });
});

module.exports = router;
