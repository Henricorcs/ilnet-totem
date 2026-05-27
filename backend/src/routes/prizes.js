const express     = require('express');
const multer      = require('multer');
const path        = require('path');
const db          = require('../db');
const requireAuth = require('../middleware/auth');
const router      = express.Router();

const storage = multer.diskStorage({
  destination: '/app/uploads/',
  filename:    (_req, file, cb) => cb(null, `prize-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Lista prêmios de um evento (público — totem usa)
router.get('/event/:eventId', async (req, res) => {
  try {
    const r = await db.query(
      'SELECT * FROM prizes WHERE event_id=$1 ORDER BY weight DESC, id',
      [req.params.eventId]
    );
    res.json({ prizes: r.rows });
  } catch (err) {
    res.status(500).json({ error: 'Erro' });
  }
});

// Cria prêmio (admin)
router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { event_id, name, stock, weight } = req.body;
    if (!event_id || !name) return res.status(400).json({ error: 'event_id e name são obrigatórios' });

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    const s = parseInt(stock) || -1;
    const w = Math.max(1, Math.min(100, parseInt(weight) || 10));

    const r = await db.query(
      `INSERT INTO prizes (event_id, name, image_url, stock, stock_initial, weight)
       VALUES ($1,$2,$3,$4,$4,$5) RETURNING *`,
      [event_id, name, image_url, s, w]
    );
    res.json({ prize: r.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar prêmio' });
  }
});

// Atualiza prêmio (admin)
router.put('/:id', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, stock, weight } = req.body;

    let image_url;
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    } else {
      const cur = await db.query('SELECT image_url FROM prizes WHERE id=$1', [req.params.id]);
      image_url = cur.rows[0]?.image_url || null;
    }

    const s = parseInt(stock) || -1;
    const w = Math.max(1, Math.min(100, parseInt(weight) || 10));

    const r = await db.query(
      `UPDATE prizes SET name=$1, image_url=$2, stock=$3, stock_initial=$3, weight=$4
       WHERE id=$5 RETURNING *`,
      [name, image_url, s, w, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Prêmio não encontrado' });
    res.json({ prize: r.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar prêmio' });
  }
});

// Remove prêmio (admin)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM prizes WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover prêmio' });
  }
});

module.exports = router;
