const express     = require('express');
const db          = require('../db');
const requireAuth = require('../middleware/auth');
const router      = express.Router();

router.get('/', async (_req, res) => {
  try {
    const r = await db.query('SELECT key, value FROM settings');
    const obj = {};
    r.rows.forEach(row => { obj[row.key] = row.value; });
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: 'Erro' });
  }
});

router.put('/', requireAuth, async (req, res) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      await db.query(
        'INSERT INTO settings (key,value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=$2',
        [key, String(value)]
      );
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
});

module.exports = router;
