const express     = require('express');
const db          = require('../db');
const requireAuth = require('../middleware/auth');
const router      = express.Router();

// Gera código único de 4 chars (sem 0,O,I,1,L)
const CHARS = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
function genCode() {
  return Array.from({ length: 4 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
}
async function uniqueCode() {
  let code, exists;
  do {
    code = genCode();
    const r = await db.query('SELECT id FROM participants WHERE win_code=$1', [code]);
    exists = r.rows.length > 0;
  } while (exists);
  return code;
}

// ── Público (totem) ──────────────────────────────────────────────────────────

// Verifica se CPF já participou no evento ativo
router.post('/check', async (req, res) => {
  try {
    const cpf = (req.body.cpf || '').replace(/\D/g, '');
    const ev  = await db.query("SELECT id FROM events WHERE status='active' LIMIT 1");
    if (!ev.rows.length) return res.json({ can_participate: false, reason: 'no_active_event' });

    const eventId = ev.rows[0].id;
    const ex = await db.query(
      'SELECT played_at FROM participants WHERE event_id=$1 AND cpf=$2',
      [eventId, cpf]
    );

    if (ex.rows.length && ex.rows[0].played_at)
      return res.json({ can_participate: false, reason: 'already_played', event_id: eventId });

    return res.json({ can_participate: true, event_id: eventId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao verificar CPF' });
  }
});

// Registra visitante
router.post('/register-visitor', async (req, res) => {
  try {
    const { cpf, name, phone, address } = req.body;
    if (!cpf || !name || !phone || !address)
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });

    const cleanCpf = cpf.replace(/\D/g, '');
    const ev = await db.query("SELECT id FROM events WHERE status='active' LIMIT 1");
    if (!ev.rows.length) return res.status(400).json({ error: 'Nenhum evento ativo' });
    const eventId = ev.rows[0].id;

    try {
      await db.query(
        `INSERT INTO participants (event_id, cpf, name, phone, address, type)
         VALUES ($1,$2,$3,$4,$5,'visitor')`,
        [eventId, cleanCpf, name, phone, address]
      );
    } catch (e) {
      if (e.code === '23505')
        return res.status(409).json({ error: 'CPF já cadastrado neste evento', code: 'duplicate_cpf' });
      throw e;
    }

    return res.json({ ok: true, event_id: eventId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar visitante' });
  }
});

// Registra participação de cliente IXC
router.post('/register-client', async (req, res) => {
  try {
    const { cpf, name, ixcClientId, ixcContractId } = req.body;
    const cleanCpf = cpf.replace(/\D/g, '');

    const ev = await db.query("SELECT id FROM events WHERE status='active' LIMIT 1");
    if (!ev.rows.length) return res.status(400).json({ error: 'Nenhum evento ativo' });
    const eventId = ev.rows[0].id;

    await db.query(
      `INSERT INTO participants (event_id, cpf, name, type, ixc_client_id, ixc_contract_id)
       VALUES ($1,$2,$3,'client',$4,$5)
       ON CONFLICT (event_id, cpf) DO UPDATE SET
         ixc_client_id=EXCLUDED.ixc_client_id,
         ixc_contract_id=EXCLUDED.ixc_contract_id`,
      [eventId, cleanCpf, name, ixcClientId || null, ixcContractId || null]
    );

    return res.json({ ok: true, event_id: eventId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar cliente' });
  }
});

// Executa o sorteio do caça-níquel
router.post('/spin', async (req, res) => {
  try {
    const { cpf, eventId } = req.body;
    const cleanCpf = cpf.replace(/\D/g, '');

    const part = await db.query(
      'SELECT id, played_at FROM participants WHERE event_id=$1 AND cpf=$2',
      [eventId, cleanCpf]
    );
    if (!part.rows.length)
      return res.status(400).json({ error: 'Participante não registrado' });
    if (part.rows[0].played_at)
      return res.status(409).json({ error: 'Já jogou neste evento' });

    // Chance de ganhar (config)
    const cfg = await db.query("SELECT value FROM settings WHERE key='win_chance'");
    const chance = parseInt(cfg.rows[0]?.value || '40');

    // Prêmios disponíveis
    const pRes = await db.query(
      `SELECT id, name, image_url, weight FROM prizes
       WHERE event_id=$1 AND (stock=-1 OR stock>0) ORDER BY id`,
      [eventId]
    );
    const prizes = pRes.rows;

    const won = Math.random() * 100 < chance && prizes.length > 0;
    let prize = null;

    if (won) {
      const total = prizes.reduce((s, p) => s + p.weight, 0);
      let rand = Math.random() * total;
      for (const p of prizes) {
        rand -= p.weight;
        if (rand <= 0) { prize = p; break; }
      }
      if (!prize) prize = prizes[prizes.length - 1];
    }

    const winCode = won ? await uniqueCode() : null;

    if (won && prize) {
      await db.query(
        `UPDATE participants SET played_at=NOW(), won=true, prize_id=$1, win_code=$2
         WHERE event_id=$3 AND cpf=$4`,
        [prize.id, winCode, eventId, cleanCpf]
      );
      if (prize.stock > 0)
        await db.query('UPDATE prizes SET stock=stock-1 WHERE id=$1', [prize.id]);
    } else {
      await db.query(
        'UPDATE participants SET played_at=NOW(), won=false WHERE event_id=$1 AND cpf=$2',
        [eventId, cleanCpf]
      );
    }

    return res.json({
      won,
      prize: prize ? { id: prize.id, name: prize.name, image_url: prize.image_url } : null,
      win_code: winCode,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no sorteio' });
  }
});

// ── Admin ────────────────────────────────────────────────────────────────────

// Busca ganhador por código
router.get('/code/:code', requireAuth, async (req, res) => {
  try {
    const r = await db.query(
      `SELECT p.*, pr.name AS prize_name
       FROM participants p LEFT JOIN prizes pr ON p.prize_id=pr.id
       WHERE p.win_code=$1`,
      [req.params.code.toUpperCase()]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Código não encontrado' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro' });
  }
});

// Marca prêmio como entregue
router.put('/deliver/:code', requireAuth, async (req, res) => {
  try {
    const r = await db.query(
      `UPDATE participants SET win_delivered=true, win_delivered_at=NOW()
       WHERE win_code=$1 RETURNING id`,
      [req.params.code.toUpperCase()]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Código não encontrado' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro' });
  }
});

// Lista participantes
router.get('/', requireAuth, async (req, res) => {
  try {
    const { eventId, page = 1, search } = req.query;
    const limit  = 20;
    const offset = (parseInt(page) - 1) * limit;

    const conditions = [];
    const params     = [];

    if (eventId) { params.push(eventId); conditions.push(`p.event_id=$${params.length}`); }
    if (search)  {
      params.push(`%${search}%`);
      conditions.push(`(p.name ILIKE $${params.length} OR p.cpf LIKE $${params.length})`);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    params.push(limit, offset);
    const r = await db.query(
      `SELECT p.id, p.cpf, p.name, p.phone, p.address, p.type,
              p.won, p.win_code, p.win_delivered, p.played_at, p.created_at,
              pr.name AS prize_name
       FROM participants p LEFT JOIN prizes pr ON p.prize_id=pr.id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countParams = params.slice(0, -2);
    const cnt = await db.query(
      `SELECT COUNT(*) FROM participants p ${where}`, countParams
    );

    res.json({ participants: r.rows, total: parseInt(cnt.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro' });
  }
});

// Exportar CSV
router.get('/export/csv', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.query;
    const where = eventId ? `WHERE p.event_id=${parseInt(eventId)}` : '';

    const r = await db.query(
      `SELECT p.cpf, p.name, p.phone, p.address, p.type,
              CASE WHEN p.won THEN 'Ganhou' ELSE 'Não ganhou' END AS resultado,
              pr.name AS premio, p.win_code,
              TO_CHAR(p.created_at AT TIME ZONE 'America/Fortaleza', 'DD/MM/YYYY HH24:MI') AS data
       FROM participants p LEFT JOIN prizes pr ON p.prize_id=pr.id
       ${where} ORDER BY p.created_at DESC`
    );

    const cols = ['CPF','Nome','Telefone','Endereço','Tipo','Resultado','Prêmio','Código','Data'];
    const rows = r.rows.map(row =>
      [row.cpf, row.name, row.phone, row.address, row.type,
       row.resultado, row.premio||'', row.win_code||'', row.data]
        .map(v => `"${String(v||'').replace(/"/g,'""')}"`)
        .join(',')
    );

    const csv = [cols.join(','), ...rows].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=participantes.csv');
    res.send('\uFEFF' + csv);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao exportar' });
  }
});

module.exports = router;
