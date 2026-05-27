const defaultBase = () => {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3001';
  return 'https://api.totem.ilnet.com.br';
};

const BASE = () => window.__API_URL__ || defaultBase();
const token = () => localStorage.getItem('ilnet_admin_token');

const req = async (url, opts = {}) => {
  const r = await fetch(BASE() + url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...(opts.headers || {}),
    },
    ...opts,
  });
  if (r.status === 401) {
    const err = await r.json().catch(() => ({ error: 'Credenciais inválidas' }));
    if (url === '/api/admin/login') {
      throw new Error(err.error || 'Credenciais inválidas');
    }

    localStorage.removeItem('ilnet_admin_token');
    window.location.href = '/login';
    throw new Error('Sessão expirada');
  }
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error(err.error || 'Erro na requisição');
  }
  return r.json();
};

const get  = (url)       => req(url);
const post = (url, body) => req(url, { method:'POST', body: JSON.stringify(body) });
const put  = (url, body) => req(url, { method:'PUT',  body: JSON.stringify(body) });
const del  = (url)       => req(url, { method:'DELETE' });

const formPost = (url, formData, method = 'POST') =>
  fetch(BASE() + url, {
    method,
    headers: { Authorization: `Bearer ${token()}` },
    body: formData,
  }).then(r => r.ok ? r.json() : r.json().then(e => { throw new Error(e.error); }));

export const api = {
  // Auth
  login:     (u, p) => post('/api/admin/login', { username:u, password:p }),

  // Dashboard
  dashboard: () => get('/api/admin/dashboard'),

  // Eventos
  listEvents:   ()      => get('/api/events'),
  createEvent:  (data)  => post('/api/events', data),
  updateEvent:  (id, d) => put(`/api/events/${id}`, d),

  // Prêmios
  listPrizes:   (eventId) => get(`/api/prizes/event/${eventId}`),
  createPrize:  (fd)      => formPost('/api/prizes', fd),
  updatePrize:  (id, fd)  => formPost(`/api/prizes/${id}`, fd, 'PUT'),
  deletePrize:  (id)      => del(`/api/prizes/${id}`),

  // Participantes
  listParticipants: (params) => get('/api/participants?' + new URLSearchParams(params).toString()),
  exportCsv:        (eventId) => BASE() + `/api/participants/export/csv?eventId=${eventId}&token=${token()}`,

  // Validação
  findByCode:  (code) => get(`/api/participants/code/${code}`),
  deliver:     (code) => req(`/api/participants/deliver/${code}`, { method:'PUT', body:'{}' }),

  // Settings
  getSettings: ()     => get('/api/settings'),
  saveSettings:(data) => put('/api/settings', data),
};
