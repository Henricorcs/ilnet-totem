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
  const onlyDate = String(s).split('T')[0].split(' ')[0];
  let y, m, d;
  if (onlyDate.includes('/')) {
    [d, m, y] = onlyDate.split('/');
  } else {
    [y, m, d] = onlyDate.split('-');
  }
  if (!y || !m || !d) return null;
  const dt = new Date(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}T00:00:00`);
  return isNaN(dt.getTime()) ? null : dt;
}

// Débitos em aberto e VENCIDOS de um cliente (independente de contrato)
router.get('/debts/:clientId', async (req, res) => {
  try {
    const data = await listIXC('fn_areceber', {
      qtype: 'fn_areceber.id_cliente',
      query: req.params.clientId,
      rp: '100',
      sortname: 'fn_areceber.data_vencimento',
    });

    if (!data.registros) return res.json({ debts: [] });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const debts = data.registros
      .filter(d => !['C', 'R', 'CA'].includes(d.status) && d.liberado === 'S')
      .filter(d => {
        const due = parseIXCDate(d.data_vencimento);
        return due && due < today;
      })
      .map(d => ({
        id:          d.id,
        value:       parseFloat(d.valor),
        due_date:    String(d.data_vencimento).split('T')[0].split(' ')[0],
        description: d.descricao || 'Fatura',
      }));

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
