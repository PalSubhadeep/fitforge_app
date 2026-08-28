const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/leaderboard
router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT username, full_name AS fullName, points FROM users ORDER BY points DESC, username ASC'
  );
  res.json({ leaderboard: rows });
});

module.exports = router;
