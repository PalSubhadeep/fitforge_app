require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const activityRoutes = require('./routes/activities');
const foodRoutes = require('./routes/food');
const leaderboardRoutes = require('./routes/leaderboard');
const routineRoutes = require('./routes/routine');
const waterRoutes = require('./routes/water');
const weightRoutes = require('./routes/weight');
const goalsRoutes = require('./routes/goals');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN === '*' ? true : (process.env.CORS_ORIGIN || '').split(',') }));
app.use(express.json());

app.get('/', (req, res) => res.json({ ok: true, service: 'fitforge-server' }));
app.get('/health', (req, res) => res.json({ status: 'healthy' }));

app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/routine', routineRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/weight', weightRoutes);
app.use('/api/goals', goalsRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found.' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`FitForge server listening on port ${PORT}`));
