const express     = require('express');
const bcrypt      = require('bcrypt');
const jwt         = require('jsonwebtoken');
const db          = require('../db');
const requireAuth = require('../middleware/auth');
const router      = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const r = await db.query('SELECT * FROM admin_users WHERE username=$1', [username]);
    if (!r.rows.length) return res.status(401).json({ error: 'Credenciais inválidas' });

    const ok = await bcrypt.compare(password, r.rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign(
      { id: r.rows[0].id, username: r.rows[0].username },
      process.env.JWT_SECRET || 'change-me',
      { expiresIn: '24h' }
    );

    res.json({ token, username: r.rows[0].username });
  } catch (err) {
    res.status(500).json({ error: 'Erro no login' });
  }
});

// Dashboard
router.get('/dashboard', requireAuth, async (_req, res) => {
  try {
    const ev = await db.query("SELECT id FROM events WHERE status='active' LIMIT 1");
    if (!ev.rows.length) return res.json({ stats: null });
    const eId = ev.rows[0].id;

    const [plays, winners, leads, pendingCodes, recent] = await Promise.all([
      db.query('SELECT COUNT(*) FROM participants WHERE event_id=$1 AND played_at IS NOT NULL', [eId]),
      db.query('SELECT COUNT(*) FROM participants WHERE event_id=$1 AND won=true', [eId]),
      db.query("SELECT COUNT(*) FROM participants WHERE event_id=$1 AND type='visitor'", [eId]),
      db.query('SELECT COUNT(*) FROM participants WHERE event_id=$1 AND won=true AND win_delivered=false', [eId]),
      db.query(`
        SELECT p.name, p.type, p.won, p.win_code, pr.name AS prize_name,
               TO_CHAR(p.played_at AT TIME ZONE 'America/Fortaleza','HH24:MI') AS hour
        FROM participants p LEFT JOIN prizes pr ON p.prize_id=pr.id
        WHERE p.event_id=$1 AND p.played_at IS NOT NULL
        ORDER BY p.played_at DESC LIMIT 8`, [eId]),
    ]);

    const total = parseInt(plays.rows[0].count);
    const wins  = parseInt(winners.rows[0].count);

    res.json({
      stats: {
        total_plays:      total,
        winners:          wins,
        leads:            parseInt(leads.rows[0].count),
        pending_delivery: parseInt(pendingCodes.rows[0].count),
        win_rate:         total > 0 ? Math.round(wins / total * 100) : 0,
        recent:           recent.rows,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no dashboard' });
  }
});

module.exports = router;
