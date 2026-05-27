import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { C, S, PageHeader, Tag, Spin } from '../components/ui.jsx';

function maskCPF(cpf) {
  const d = (cpf||'').replace(/\D/g,'');
  return `***.${d.slice(3,6)}.${d.slice(6,9)}-**`;
}

export default function Participants() {
  const [events,  setEvents]  = useState([]);
  const [eventId, setEventId] = useState('');
  const [rows,    setRows]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.listEvents().then(r => {
      const evs = r.events || [];
      setEvents(evs);
      const active = evs.find(e => e.status === 'active');
      if (active) { setEventId(String(active.id)); }
    });
  }, []);

  useEffect(() => { if (eventId) load(); }, [eventId, page, search]);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, ...(eventId && { eventId }), ...(search && { search }) };
      const r = await api.listParticipants(params);
      setRows(r.participants || []);
      setTotal(r.total || 0);
    } catch(e) { console.error(e); }
    finally    { setLoading(false); }
  };

  const pages = Math.ceil(total / 20);

  return (
    <div>
      <PageHeader title="Leads & Participantes" sub="ILNET TOTEM"
        action={
          <div style={{ display:'flex', gap:8 }}>
            {eventId && (
              <a href={api.exportCsv(eventId)} download
                style={{ ...S.btnG, textDecoration:'none' }}>
                <i className="ti ti-file-type-csv"/>Exportar CSV
              </a>
            )}
          </div>
        }
      />
      <div style={S.page}>
        {/* Filtros */}
        <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
          <select value={eventId} onChange={e => { setEventId(e.target.value); setPage(1); }}
            style={{ ...S.input }}>
            <option value="">Todos os eventos</option>
            {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <input type="text" value={search} placeholder="Buscar por nome ou CPF..."
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ ...S.input, flex:1, minWidth:200 }}
          />
        </div>

        {/* Tabela */}
        <div style={{ ...S.card, padding:0, overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  {['Nome','CPF','Telefone','Tipo','Resultado','Prêmio','Data'].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} style={{ transition:'background .1s' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(94,197,245,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background=''}
                  >
                    <td style={S.td}>{r.name || '—'}</td>
                    <td style={{ ...S.td, fontFamily:'monospace', fontSize:11 }}>{maskCPF(r.cpf)}</td>
                    <td style={{ ...S.td, fontFamily:'monospace', fontSize:11 }}>{r.phone || '—'}</td>
                    <td style={S.td}>
                      <Tag color={r.type==='client'?C.blue:C.gold}>
                        {r.type==='client'?'CLIENTE':'VISITANTE'}
                      </Tag>
                    </td>
                    <td style={S.td}>
                      {r.played_at
                        ? r.won
                          ? <span style={{ color:C.gold }}>● Ganhou <code style={{ fontSize:10, letterSpacing:1 }}>{r.win_code}</code></span>
                          : <span style={{ color:C.fade }}>● Não ganhou</span>
                        : <span style={{ color:C.dim }}>Aguardando</span>
                      }
                    </td>
                    <td style={S.td}>{r.prize_name || '—'}</td>
                    <td style={{ ...S.td, fontSize:11, color:C.fade, whiteSpace:'nowrap' }}>
                      {new Date(r.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {loading && (
            <div style={{ textAlign:'center', padding:20, color:C.fade }}><Spin/> Carregando...</div>
          )}
          {!loading && !rows.length && (
            <div style={{ textAlign:'center', padding:20, color:C.fade, fontSize:12 }}>Nenhum participante encontrado</div>
          )}
        </div>

        {/* Paginação */}
        {pages > 1 && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12, fontSize:12, color:C.dim }}>
            <span>{total} participantes no total</span>
            <div style={{ display:'flex', gap:4 }}>
              {page > 1 && <button style={S.btnG} onClick={() => setPage(p=>p-1)}>←</button>}
              {Array.from({length:Math.min(pages,5)}).map((_,i) => {
                const p = i + 1;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ ...S.btnG, background: p===page?C.cardHov:'', color: p===page?C.cyan:C.fade, minWidth:32, justifyContent:'center' }}>
                    {p}
                  </button>
                );
              })}
              {page < pages && <button style={S.btnG} onClick={() => setPage(p=>p+1)}>→</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
