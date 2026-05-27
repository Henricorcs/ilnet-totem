const express    = require('express');
const db         = require('../db');
const requireAuth = require('../middleware/auth');
const router     = express.Router();

// Evento ativo (público — totem usa)
router.get('/active', async (_req, res) => {
  try {
    const r = await db.query("SELECT * FROM events WHERE status = 'active' LIMIT 1");
    res.json({ event: r.rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: 'Erro' });
  }
});

// Lista eventos (admin)
router.get('/', requireAuth, async (_req, res) => {
  try {
    const r = await db.query(`
      SELECT e.*,
        COUNT(DISTINCT p.id)                                    AS total_participants,
        COUNT(DISTINCT CASE WHEN p.won THEN p.id END)           AS total_winners,
        COUNT(DISTINCT CASE WHEN p.type='visitor' THEN p.id END) AS total_leads
      FROM events e
      LEFT JOIN participants p ON p.event_id = e.id
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `);
    res.json({ events: r.rows });
  } catch (err) {
    res.status(500).json({ error: 'Erro' });
  }
});

// Cria evento (admin)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, starts_at, ends_at } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome obrigatório' });
    const r = await db.query(
      `INSERT INTO events (name, starts_at, ends_at, status)
       VALUES ($1, $2, $3, 'scheduled') RETURNING *`,
      [name, starts_at || null, ends_at || null]
    );
    res.json({ event: r.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar evento' });
  }
});

// Atualiza evento (admin)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name, starts_at, ends_at, status } = req.body;

    // Só pode ter 1 ativo: encerra o anterior
    if (status === 'active') {
      await db.query("UPDATE events SET status = 'closed' WHERE status = 'active' AND id != $1", [req.params.id]);
    }

    const r = await db.query(
      `UPDATE events SET name=$1, starts_at=$2, ends_at=$3, status=$4 WHERE id=$5 RETURNING *`,
      [name, starts_at || null, ends_at || null, status, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Evento não encontrado' });
    res.json({ event: r.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar evento' });
  }
});

module.exports = router;
