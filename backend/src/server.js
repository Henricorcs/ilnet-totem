require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/ixc',          require('./routes/ixc'));
app.use('/api/events',       require('./routes/events'));
app.use('/api/prizes',       require('./routes/prizes'));
app.use('/api/participants',  require('./routes/participants'));
app.use('/api/admin',        require('./routes/admin'));
app.use('/api/settings',     require('./routes/settings'));

app.get('/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', db: 'ok' });
  } catch (err) {
    console.error('Health check failed:', err.message);
    res.status(503).json({ status: 'error', db: 'error' });
  }
});

db.init().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ILNET Totem backend rodando na porta ${PORT}`);
  });
}).catch(err => {
  console.error('Falha ao inicializar banco:', err);
  process.exit(1);
});
