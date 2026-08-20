require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const sheetsRoutes = require('./routes/sheets');
const videosRoutes = require('./routes/videos');
const usersRoutes = require('./routes/users');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Bootstrap mode: no login. The app opens straight into the user (client)
// roster below. /api/auth is kept around unused for now, in case per-user
// login is reintroduced later.
app.use('/api/auth', authRoutes);
app.use('/api/sheets', sheetsRoutes);
app.use('/api/videos', videosRoutes);
app.use('/api/users', usersRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Auto Media backend running on port ${PORT}`);
});
