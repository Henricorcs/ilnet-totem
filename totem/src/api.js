const defaultBase = () => {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3001';
  return 'https://api.totem.ilnet.com.br';
};

const BASE = () => window.__API_URL__ || defaultBase();

const json = async (url, opts = {}) => {
  const r = await fetch(BASE() + url, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: r.statusText }));
    throw Object.assign(new Error(err.error || 'Erro'), { code: err.code, status: r.status });
  }
  return r.json();
};

const post = (url, body) => json(url, { method: 'POST', body: JSON.stringify(body) });

export const api = {
  // IXC
  findClient:   (cpf)        => post('/api/ixc/client', { cpf }),
  getContracts: (clientId)   => json(`/api/ixc/contracts/${clientId}`),
  getDebts:     (contractId) => json(`/api/ixc/debts/${contractId}`),
  generatePix:  (debtId)     => post('/api/ixc/pix', { debtId }),
  checkDebt:    (debtId)     => json(`/api/ixc/debt-status/${debtId}`),

  // Participantes
  checkCPF:        (cpf)  => post('/api/participants/check', { cpf }),
  registerVisitor: (data) => post('/api/participants/register-visitor', data),
  registerClient:  (data) => post('/api/participants/register-client', data),
  spin:            (cpf, eventId) => post('/api/participants/spin', { cpf, eventId }),

  // Evento + prêmios
  getActiveEvent: () => json('/api/events/active'),
  getPrizes:      (eventId) => json(`/api/prizes/event/${eventId}`),

  // Configurações
  getSettings: () => json('/api/settings'),
};
