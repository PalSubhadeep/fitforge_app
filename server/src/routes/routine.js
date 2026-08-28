const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/routine — items plus today's (or ?date=) completion state
router.get('/', async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const [items] = await pool.query('SELECT id, name FROM routine_items WHERE user_id = ? ORDER BY id ASC', [req.userId]);
  const [log] = await pool.query('SELECT routine_item_id, done FROM routine_log WHERE user_id = ? AND date = ?', [req.userId, date]);
  const doneMap = {};
  log.forEach(r => { doneMap[r.routine_item_id] = !!r.done; });
  res.json({ items: items.map(i => ({ ...i, done: !!doneMap[i.id] })), date });
});

// POST /api/routine  { name }
router.post('/', async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required.' });
  const [result] = await pool.query('INSERT INTO routine_items (user_id, name) VALUES (?, ?)', [req.userId, name]);
  res.json({ id: result.insertId, name });
});

// DELETE /api/routine/:id
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM routine_items WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  res.json({ ok: true });
});

// POST /api/routine/:id/toggle  { date }
router.post('/:id/toggle', async (req, res) => {
  const date = req.body.date || new Date().toISOString().slice(0, 10);
  const itemId = req.params.id;
  const [existing] = await pool.query(
    'SELECT id, done FROM routine_log WHERE user_id = ? AND routine_item_id = ? AND date = ?',
    [req.userId, itemId, date]
  );
  if (existing.length) {
    const newDone = existing[0].done ? 0 : 1;
    await pool.query('UPDATE routine_log SET done = ? WHERE id = ?', [newDone, existing[0].id]);
    return res.json({ done: !!newDone });
  }
  await pool.query(
    'INSERT INTO routine_log (user_id, routine_item_id, date, done) VALUES (?, ?, ?, 1)',
    [req.userId, itemId, date]
  );
  res.json({ done: true });
});

module.exports = router;
