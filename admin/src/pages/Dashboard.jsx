import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { C, S, PageHeader, Tag, Spin } from '../components/ui.jsx';

export default function Dashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { setData(await api.dashboard()); }
    catch (e) { console.error(e); }
    finally   { setLoading(false); }
  };

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);

  const s = data?.stats;

  const STATS = s ? [
    { label:'JOGADAS', value: s.total_plays,    icon:'ti-users',       color: C.blue  },
    { label:'GANHOS',  value: s.winners,        icon:'ti-trophy',      color: C.gold  },
    { label:'LEADS',   value: s.leads,          icon:'ti-user-plus',   color: C.cyan  },
    { label:'TAXA',    value: `${s.win_rate}%`, icon:'ti-percentage',  color: C.green },
  ] : [];

  return (
    <div>
      <PageHeader title="Painel" sub="ILNET TOTEM — EVENTO ATIVO"
        action={
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', background:'rgba(93,202,165,0.1)', border:'1px solid rgba(93,202,165,0.3)', borderRadius:8 }}>
            <span style={{ width:6,height:6,borderRadius:'50%',background:C.green,display:'inline-block',animation:'p 2s infinite' }}/>
            <span style={{ fontSize:11, color:C.green }}>Totem online</span>
            <style>{`@keyframes p{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
          </div>
        }
      />

      <div style={S.page}>
        {loading && !s && (
          <div style={{ textAlign:'center', padding:40, color:C.fade }}>
            <Spin/> Carregando...
          </div>
        )}

        {!s && !loading && (
          <div style={{ ...S.card, textAlign:'center', color:C.fade, padding:32 }}>
            <i className="ti ti-calendar-off" style={{ fontSize:36, marginBottom:8, display:'block' }}/>
            Nenhum evento ativo. Crie e ative um em <strong>Eventos</strong>.
          </div>
        )}

        {s && (
          <>
            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:18 }}>
              {STATS.map(st => (
                <div key={st.label} style={{ ...S.card }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <div style={{ fontSize:9, color:C.fade, letterSpacing:1 }}>{st.label}</div>
                    <i className={`ti ${st.icon}`} style={{ fontSize:16, color:st.color, opacity:.7 }}/>
                  </div>
                  <div style={{ fontSize:26, fontWeight:600, color:'#fff', lineHeight:1 }}>{st.value}</div>
                  {s.pending_delivery > 0 && st.label==='GANHOS' && (
                    <div style={{ fontSize:10, color:C.gold, marginTop:4 }}>{s.pending_delivery} aguardando retirada</div>
                  )}
                </div>
              ))}
            </div>

            {/* Atividade recente */}
            <div style={S.card}>
              <div style={{ fontSize:12, fontWeight:500, marginBottom:12 }}>Atividade recente</div>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    {['Hora','Nome','Tipo','Resultado','Código'].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(s.recent || []).map((r, i) => (
                    <tr key={i}>
                      <td style={{ ...S.td, fontFamily:'monospace', fontSize:11 }}>{r.hour}</td>
                      <td style={S.td}>{r.name}</td>
                      <td style={S.td}>
                        <Tag color={r.type==='client'?C.blue:C.gold}>
                          {r.type==='client'?'CLIENTE':'VISITANTE'}
                        </Tag>
                      </td>
                      <td style={S.td}>
                        {r.won
                          ? <span style={{ color:C.gold }}>● {r.prize_name}</span>
                          : <span style={{ color:C.fade }}>● Não ganhou</span>
                        }
                      </td>
                      <td style={{ ...S.td, fontFamily:'monospace', letterSpacing:2 }}>
                        {r.win_code || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!s.recent?.length) && (
                <div style={{ textAlign:'center', padding:20, color:C.fade, fontSize:12 }}>Sem atividade ainda</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
