import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { C, S, PageHeader, Tag, Spin } from '../components/ui.jsx';

const STATUS = {
  active:    { label:'ATIVO',     color: C.green },
  scheduled: { label:'AGENDADO',  color: C.blue  },
  closed:    { label:'ENCERRADO', color: '#888'  },
};

function toInput(d) { return d ? d.slice(0,16) : ''; }
function toISO(v)   { return v ? new Date(v).toISOString() : null; }

export default function Events() {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null); // null | 'new' | event
  const [form,    setForm]    = useState({ name:'', starts_at:'', ends_at:'', status:'scheduled' });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const load = async () => {
    try { const r = await api.listEvents(); setEvents(r.events || []); }
    catch(e) { console.error(e); }
    finally  { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setForm({ name:'', starts_at:'', ends_at:'', status:'scheduled' });
    setError('');
    setModal('new');
  };
  const openEdit = (ev) => {
    setForm({ name:ev.name, starts_at:toInput(ev.starts_at), ends_at:toInput(ev.ends_at), status:ev.status });
    setError('');
    setModal(ev);
  };

  const save = async () => {
    if (!form.name.trim()) return setError('Nome obrigatório');
    setSaving(true); setError('');
    try {
      const body = { ...form, starts_at: toISO(form.starts_at), ends_at: toISO(form.ends_at) };
      if (modal === 'new') await api.createEvent(body);
      else                 await api.updateEvent(modal.id, body);
      setModal(null);
      load();
    } catch(e) { setError(e.message); }
    finally    { setSaving(false); }
  };

  const activate = async (ev) => {
    if (!confirm(`Ativar "${ev.name}"? O evento atual será encerrado.`)) return;
    try { await api.updateEvent(ev.id, { ...ev, status:'active' }); load(); }
    catch(e) { alert(e.message); }
  };

  return (
    <div>
      <PageHeader title="Eventos" sub="ILNET TOTEM"
        action={<button style={S.btn} onClick={openNew}><i className="ti ti-plus"/>Novo evento</button>}
      />
      <div style={S.page}>
        {loading && <div style={{ color:C.fade }}><Spin/> Carregando...</div>}

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {events.map(ev => {
            const st = STATUS[ev.status] || STATUS.closed;
            return (
              <div key={ev.id} style={{ ...S.card, display:'flex', alignItems:'center', gap:14, opacity: ev.status==='closed'?0.65:1 }}>
                <div style={{ width:40,height:40,borderRadius:10,background:`${st.color}22`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  <i className="ti ti-calendar-event" style={{ fontSize:20, color:st.color }}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                    <span style={{ fontSize:14, fontWeight:500 }}>{ev.name}</span>
                    <Tag color={st.color}>{st.label}</Tag>
                  </div>
                  <div style={{ fontSize:11, color:C.dim }}>
                    {ev.starts_at ? new Date(ev.starts_at).toLocaleDateString('pt-BR') : '—'}
                    {' '}→{' '}
                    {ev.ends_at   ? new Date(ev.ends_at  ).toLocaleDateString('pt-BR') : '—'}
                    {' · '}
                    <span>{ev.total_participants} participantes · {ev.total_winners} ganhadores</span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  {ev.status !== 'active' && ev.status !== 'closed' && (
                    <button style={{ ...S.btnG, borderColor:'rgba(93,202,165,0.4)', color:C.green }} onClick={() => activate(ev)}>
                      <i className="ti ti-player-play"/>Ativar
                    </button>
                  )}
                  <button style={S.btnG} onClick={() => openEdit(ev)}>
                    <i className="ti ti-edit"/>Editar
                  </button>
                </div>
              </div>
            );
          })}
          {!loading && !events.length && (
            <div style={{ ...S.card, textAlign:'center', color:C.fade, padding:32 }}>Nenhum evento ainda</div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(2,5,13,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:20 }}>
          <div style={{ background:'#0d1b33',border:`1px solid ${C.bd}`,borderRadius:14,padding:24,width:'100%',maxWidth:420 }}>
            <h3 style={{ fontSize:16, marginBottom:20 }}>{modal==='new'?'Novo evento':'Editar evento'}</h3>
            {[
              { key:'name',      label:'Nome',      type:'text'           },
              { key:'starts_at', label:'Início',    type:'datetime-local' },
              { key:'ends_at',   label:'Encerramento', type:'datetime-local' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:12 }}>
                <div style={{ fontSize:10, color:C.fade, letterSpacing:1, marginBottom:4, textTransform:'uppercase' }}>{f.label}</div>
                <input type={f.type} value={form[f.key]}
                  onChange={e => setForm(x=>({...x,[f.key]:e.target.value}))}
                  style={{ ...S.input, width:'100%' }}
                />
              </div>
            ))}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:10, color:C.fade, letterSpacing:1, marginBottom:4, textTransform:'uppercase' }}>Status</div>
              <select value={form.status} onChange={e => setForm(x=>({...x,status:e.target.value}))}
                style={{ ...S.input, width:'100%' }}>
                <option value="scheduled">Agendado</option>
                <option value="active">Ativo</option>
                <option value="closed">Encerrado</option>
              </select>
            </div>
            {error && <div style={{ color:C.red, fontSize:12, marginBottom:12 }}>{error}</div>}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button style={S.btnG} onClick={() => setModal(null)}>Cancelar</button>
              <button style={S.btn}  onClick={save} disabled={saving}>
                {saving ? <><Spin/>Salvando...</> : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
