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

// Verifica se o backend consegue autenticar e listar dados no IXC.
router.get('/health', async (_req, res) => {
  try {
    if (!BASE() || !process.env.IXC_USER || !process.env.IXC_PASS) {
      return res.json({ status: 'error', ixc: 'missing_config' });
    }

    const url =
      `${BASE()}/webservice/v1/cliente` +
      `?qtype=cliente.cnpj_cpf&query=00000000000&oper==&page=1&rp=1` +
      `&sortname=cliente.id&sortorder=asc`;

    const r = await fetch(url, { headers: hdr({ ixcsoft: 'listar' }) });
    const text = await r.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.json({ status: 'error', ixc: 'invalid_response' });
    }

    const validList = data && (Array.isArray(data.registros) || data.total !== undefined);
    if (!r.ok || !validList) {
      return res.json({
        status: 'error',
        ixc: 'error',
        http_status: r.status,
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

    const url =
      `${BASE()}/webservice/v1/cliente` +
      `?qtype=cliente.cnpj_cpf&query=${cpf}&oper==&page=1&rp=10` +
      `&sortname=cliente.id&sortorder=asc`;

    const r    = await fetch(url, { headers: hdr({ ixcsoft: 'listar' }) });
    const data = await r.json();

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
    const url =
      `${BASE()}/webservice/v1/cliente_contrato` +
      `?qtype=cliente_contrato.id_cliente&query=${req.params.clientId}` +
      `&oper==&page=1&rp=30&sortname=cliente_contrato.id&sortorder=asc`;

    const r    = await fetch(url, { headers: hdr({ ixcsoft: 'listar' }) });
    const data = await r.json();

    if (!data.registros) return res.json({ contracts: [] });

    const contracts = data.registros.map(c => ({
      id:     c.id,
      address: [c.endereco, c.numero, c.complemento, c.bairro]
        .filter(Boolean).join(', '),
      city:   c.cidade || '',
      status: c.status_internet,
      plan:   c.descricao_plano || '',
    }));

    return res.json({ contracts });
  } catch (err) {
    console.error('IXC /contracts', err.message);
    res.status(500).json({ error: 'Erro ao buscar contratos' });
  }
});

// Débitos em aberto de um contrato
router.get('/debts/:contractId', async (req, res) => {
  try {
    const url =
      `${BASE()}/webservice/v1/fn_areceber` +
      `?qtype=fn_areceber.id_contrato&query=${req.params.contractId}` +
      `&oper==&page=1&rp=50&sortname=fn_areceber.data_vencimento&sortorder=asc`;

    const r    = await fetch(url, { headers: hdr({ ixcsoft: 'listar' }) });
    const data = await r.json();

    if (!data.registros) return res.json({ debts: [] });

    const debts = data.registros
      .filter(d => !['C', 'R', 'CA'].includes(d.status) && d.liberado === 'S')
      .map(d => ({
        id:          d.id,
        value:       parseFloat(d.valor),
        due_date:    d.data_vencimento,
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
    const data = await r.json();

    return res.json({
      pix_code: data.pix_copia_cola || data.brcode || data.pixCopiaECola || null,
      expires_at: data.expiracao || null,
    });
  } catch (err) {
    console.error('IXC /pix', err.message);
    res.status(500).json({ error: 'Erro ao gerar PIX' });
  }
});

// Verifica se um boleto foi pago (polling do totem)
router.get('/debt-status/:debtId', async (req, res) => {
  try {
    const r = await fetch(
      `${BASE()}/webservice/v1/fn_areceber/${req.params.debtId}`,
      { headers: hdr({ ixcsoft: 'listar' }) }
    );
    const data = await r.json();
    return res.json({ paid: data.status === 'R', status: data.status });
  } catch (err) {
    console.error('IXC /debt-status', err.message);
    res.status(500).json({ error: 'Erro ao verificar pagamento' });
  }
});

module.exports = router;
