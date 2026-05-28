const express = require('express');
const fetch   = require('node-fetch');
const router  = express.Router();

const BASE = () => process.env.IXC_BASE_URL;
const AUTH = () =>
  'Basic ' + Buffer.from(`${process.env.IXC_USER}:${process.env.IXC_PASS}`).toString('base64');

const hdr = (extra = {}) => ({
  Authorization: AUTH(),
  'Content-Type': 'application/json',
  ...extra,
});
const listHdr = () => hdr({ ixcsoft: 'listar' });

function formatCPFForIXC(cpf) {
  const digits = (cpf || '').replace(/\D/g, '');
  if (digits.length !== 11) return digits;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

async function parseIXCResponse(response, context) {
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`${context}: resposta inválida do IXC`);
  }
  if (data?.type === 'error') {
    throw new Error(`${context}: ${data.message || 'erro retornado pelo IXC'}`);
  }
  return data;
}

async function listIXC(resource, params) {
  const response = await fetch(`${BASE()}/webservice/v1/${resource}`, {
    method: 'POST',
    headers: listHdr(),
    body: JSON.stringify({
      page: '1',
      rp: '20',
      sortorder: 'asc',
      ...params,
      oper: params.oper || '=',
    }),
  });
  return parseIXCResponse(response, `IXC ${resource}`);
}

// Verifica se o backend consegue autenticar e listar dados no IXC.
router.get('/health', async (_req, res) => {
  try {
    if (!BASE() || !process.env.IXC_USER || !process.env.IXC_PASS) {
      return res.json({ status: 'error', ixc: 'missing_config' });
    }

    const data = await listIXC('cliente', {
      qtype: 'cliente.id',
      query: '1',
      rp: '1',
      sortname: 'cliente.id',
    });

    const validList = data && (Array.isArray(data.registros) || data.total !== undefined);
    if (!validList) {
      return res.json({
        status: 'error',
        ixc: 'error',
        message: data?.message || data?.error || 'Resposta inesperada do IXC',
      });
    }

    res.json({ status: 'ok', ixc: 'ok' });
  } catch (err) {
    console.error('IXC /health', err.message);
    res.json({ status: 'error', ixc: 'unreachable' });
  }
});

// Busca cliente por CPF
router.post('/client', async (req, res) => {
  try {
    const cpf = (req.body.cpf || '').replace(/\D/g, '');
    if (!cpf) return res.status(400).json({ error: 'CPF obrigatório' });

    const data = await listIXC('cliente', {
      qtype: 'cliente.cnpj_cpf',
      query: formatCPFForIXC(cpf),
      rp: '10',
      sortname: 'cliente.id',
    });

    if (!data.registros || data.registros.length === 0)
      return res.json({ found: false });

    const clients = data.registros.map(c => ({
      id:     c.id,
      name:   c.razao,
      cpf:    c.cnpj_cpf,
      active: c.ativo,
    }));

    return res.json({ found: true, clients });
  } catch (err) {
    console.error('IXC /client', err.message);
    res.status(500).json({ error: 'Erro ao consultar IXC' });
  }
});

// Contratos de um cliente
router.get('/contracts/:clientId', async (req, res) => {
  try {
    const data = await listIXC('cliente_contrato', {
      qtype: 'cliente_contrato.id_cliente',
      query: req.params.clientId,
      rp: '30',
      sortname: 'cliente_contrato.id',
    });

    if (!data.registros) return res.json({ contracts: [] });

    const contracts = data.registros.map(c => ({
      id:            c.id,
      address:       [c.endereco, c.numero, c.complemento, c.bairro]
        .filter(Boolean).join(', '),
      city:          c.cidade || '',
      status:        c.status,           // status do contrato: A/I/C
      statusInternet: c.status_internet, // status de acesso: A/B/FA
      plan:          c.descricao_plano || '',
    }));

    return res.json({ contracts });
  } catch (err) {
    console.error('IXC /contracts', err.message);
    res.status(500).json({ error: 'Erro ao buscar contratos' });
  }
});

function parseIXCDate(s) {
  if (!s) return null;
  const str = String(s).trim();
  const iso = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const [, y, m, d] = iso;
    return new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0);
  }
  const br = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (br) {
    const [, d, m, y] = br;
    return new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0);
  }
  const dt = new Date(str);
  return isNaN(dt.getTime()) ? null : dt;
}

// Endpoint de debug: devolve a resposta crua do IXC fn_areceber por cliente
router.get('/debts-raw/:clientId', async (req, res) => {
  try {
    const data = await listIXC('fn_areceber', {
      qtype: 'fn_areceber.id_cliente',
      query: req.params.clientId,
      rp: '100',
      sortname: 'fn_areceber.data_vencimento',
    });
    return res.json({
      total: data.total || (data.registros?.length || 0),
      sample: data.registros?.[0] || null,
      registros: data.registros || [],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Débitos em aberto e VENCIDOS — consulta o ID tanto como cliente quanto
// como contrato pra tolerar mismatch entre versão do totem e do backend.
router.get('/debts/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const [byClient, byContract] = await Promise.all([
      listIXC('fn_areceber', {
        qtype: 'fn_areceber.id_cliente',
        query: id, rp: '100', sortname: 'fn_areceber.data_vencimento',
      }).catch(() => ({ registros: [] })),
      listIXC('fn_areceber', {
        qtype: 'fn_areceber.id_contrato',
        query: id, rp: '100', sortname: 'fn_areceber.data_vencimento',
      }).catch(() => ({ registros: [] })),
    ]);

    const merged = new Map();
    for (const r of (byClient.registros || []))   merged.set(r.id, r);
    for (const r of (byContract.registros || [])) merged.set(r.id, r);

    // Defesa contra totem antigo: se o id passado era contrato, descobre o
    // id_cliente real dos registros achados e refaz a busca pra capturar
    // faturas orfas (sem id_contrato atual).
    const realClientIds = new Set();
    for (const r of merged.values()) {
      if (r.id_cliente && String(r.id_cliente) !== String(id)) {
        realClientIds.add(String(r.id_cliente));
      }
    }
    if (realClientIds.size > 0) {
      const extras = await Promise.all([...realClientIds].map(cid =>
        listIXC('fn_areceber', {
          qtype: 'fn_areceber.id_cliente',
          query: cid, rp: '100', sortname: 'fn_areceber.data_vencimento',
        }).catch(() => ({ registros: [] }))
      ));
      for (const ex of extras) {
        for (const r of (ex.registros || [])) merged.set(r.id, r);
      }
      console.log(`IXC /debts id=${id} cruzou cliente_ids=[${[...realClientIds].join(',')}] total_apos_cruzamento=${merged.size}`);
    }

    const registros = [...merged.values()];

    if (registros.length === 0) {
      console.log(`IXC /debts id=${id}: nada por cliente (${byClient.registros?.length||0}) nem por contrato (${byContract.registros?.length||0})`);
      return res.json({ debts: [] });
    }

    console.log(`IXC /debts id=${id} amostra=`, JSON.stringify(registros[0]).slice(0, 600));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let excludedByStatus = 0, excludedByLiberado = 0, excludedByDate = 0;

    const debts = registros
      .filter(d => {
        if (['C', 'R', 'CA'].includes(d.status)) { excludedByStatus++; return false; }
        return true;
      })
      .filter(d => {
        if (d.liberado === 'N') { excludedByLiberado++; return false; }
        return true;
      })
      .filter(d => {
        const dateStr = d.data_vencimento || d.data_vencto || d.vencimento;
        const due = parseIXCDate(dateStr);
        if (!due || due >= today) { excludedByDate++; return false; }
        return true;
      })
      .map(d => {
        const dateStr = d.data_vencimento || d.data_vencto || d.vencimento || '';
        return {
          id:          d.id,
          value:       parseFloat(d.valor),
          due_date:    String(dateStr).split('T')[0].split(' ')[0],
          description: d.descricao || 'Fatura',
        };
      });

    console.log(`IXC /debts id=${id}: total=${registros.length} status_excl=${excludedByStatus} liberado_excl=${excludedByLiberado} nao_vencidas=${excludedByDate} retornadas=${debts.length}`);

    return res.json({ debts });
  } catch (err) {
    console.error('IXC /debts', err.message);
    res.status(500).json({ error: 'Erro ao buscar débitos' });
  }
});

// Gera PIX para um boleto
router.post('/pix', async (req, res) => {
  try {
    const { debtId } = req.body;
    if (!debtId) return res.status(400).json({ error: 'debtId obrigatório' });

    const r = await fetch(`${BASE()}/webservice/v1/get_pix`, {
      method:  'POST',
      headers: hdr(),
      body:    JSON.stringify({ id_areceber: debtId }),
    });
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = {}; }

    // IXC retorna a chave em vários formatos dependendo da versão/configuração
    const pixCode =
      data.pix_copia_cola ||
      data.pixCopiaECola  ||
      data.pix_copia_e_cola ||
      data.brcode         ||
      data.qrcode         ||
      data.qr_code        ||
      data.pix?.pixCopiaECola ||
      data.pix?.pix_copia_cola ||
      data.pix?.qrCode ||
      data.payload        ||
      null;

    if (!pixCode) {
      console.error('IXC /pix sem código:', text.slice(0, 500));
      return res.status(502).json({
        error: 'IXC não retornou código PIX',
        detail: data.message || data.error || data.mensagem || null,
      });
    }

    return res.json({
      pix_code: pixCode,
      expires_at: data.expiracao || data.data_expiracao || null,
    });
  } catch (err) {
    console.error('IXC /pix', err.message);
    res.status(500).json({ error: 'Erro ao gerar PIX' });
  }
});

// Verifica se um boleto foi pago (polling do totem)
router.get('/debt-status/:debtId', async (req, res) => {
  try {
    const data = await listIXC('fn_areceber', {
      qtype: 'fn_areceber.id',
      query: req.params.debtId,
      rp: '1',
      sortname: 'fn_areceber.id',
    });
    const debt = data.registros?.[0];
    return res.json({ paid: debt?.status === 'R', status: debt?.status || null });
  } catch (err) {
    console.error('IXC /debt-status', err.message);
    res.status(500).json({ error: 'Erro ao verificar pagamento' });
  }
});

module.exports = router;
