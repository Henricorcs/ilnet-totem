import { useState, useEffect, useRef } from 'react';
import { api } from '../api.js';
import { C, S, PageHeader, Spin } from '../components/ui.jsx';

const API_URL = () => window.__API_URL__ || 'http://localhost:3001';

export default function Prizes() {
  const [events,  setEvents]  = useState([]);
  const [eventId, setEventId] = useState('');
  const [prizes,  setPrizes]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState({ name:'', stock:'-1', weight:'5' });
  const [imgFile, setImgFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const fileRef = useRef();

  useEffect(() => {
    api.listEvents().then(r => {
      const evs = r.events || [];
      setEvents(evs);
      const active = evs.find(e => e.status === 'active');
      if (active) { setEventId(String(active.id)); loadPrizes(active.id); }
    }).catch(console.error);
  }, []);

  const loadPrizes = async (id) => {
    setLoading(true);
    try { const r = await api.listPrizes(id); setPrizes(r.prizes || []); }
    catch(e) { console.error(e); }
    finally  { setLoading(false); }
  };

  const changeEvent = (id) => { setEventId(id); if (id) loadPrizes(id); };

  const totalWeight = prizes.reduce((s,p) => s + Number(p.weight || 0), 0);
  const losePct     = Math.max(0, 100 - totalWeight);
  const overflow    = totalWeight > 100;

  const openNew = () => {
    setForm({ name:'', stock:'-1', weight:'5' });
    setImgFile(null); setPreview(''); setError('');
    setModal('new');
  };
  const openEdit = (p) => {
    setForm({ name:p.name, stock:String(p.stock), weight:String(p.weight) });
    setImgFile(null); setPreview(p.image_url ? API_URL()+p.image_url : ''); setError('');
    setModal(p);
  };

  const pickFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImgFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const save = async () => {
    if (!form.name.trim()) return setError('Nome obrigatório');
    if (!eventId)          return setError('Selecione um evento');
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      fd.append('name',     form.name);
      fd.append('stock',    form.stock);
      fd.append('weight',   form.weight);
      fd.append('event_id', eventId);
      if (imgFile) fd.append('image', imgFile);

      if (modal === 'new') await api.createPrize(fd);
      else                 await api.updatePrize(modal.id, fd);
      setModal(null);
      loadPrizes(eventId);
    } catch(e) { setError(e.message); }
    finally    { setSaving(false); }
  };

  const remove = async (p) => {
    if (!confirm(`Remover "${p.name}"?`)) return;
    try { await api.deletePrize(p.id); loadPrizes(eventId); }
    catch(e) { alert(e.message); }
  };

  return (
    <div>
      <PageHeader title="Prêmios" sub="ILNET TOTEM"
        action={
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <span style={{ fontSize:11, color: overflow ? C.red : C.dim, textAlign:'right', lineHeight:1.35 }}>
              {overflow
                ? <>Soma {totalWeight}% &gt; 100% ⚠</>
                : <>Soma {totalWeight}% · Não ganhar {losePct}%</>
              }
            </span>
            <button style={S.btn} onClick={openNew}><i className="ti ti-plus"/>Novo prêmio</button>
          </div>
        }
      />
      <div style={S.page}>
        {/* Seletor de evento */}
        <div style={{ marginBottom:16 }}>
          <select value={eventId} onChange={e => changeEvent(e.target.value)} style={{ ...S.input }}>
            <option value="">— Selecione um evento —</option>
            {events.map(e => <option key={e.id} value={e.id}>{e.name} ({e.status})</option>)}
          </select>
        </div>

        {loading && <div style={{ color:C.fade }}><Spin/> Carregando...</div>}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 }}>
          {prizes.map(p => (
            <div key={p.id} style={{ ...S.card, padding:0, overflow:'hidden' }}>
              <div style={{ width:'100%', paddingTop:'70%', position:'relative', background:'rgba(94,197,245,0.05)' }}>
                {p.image_url ? (
                  <img src={API_URL()+p.image_url} alt={p.name}
                    style={{ position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'contain',padding:12 }}
                  />
                ) : (
                  <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center' }}>
                    <i className="ti ti-gift" style={{ fontSize:40, color:C.blue, opacity:.5 }}/>
                  </div>
                )}
              </div>
              <div style={{ padding:'10px 12px' }}>
                <div style={{ fontSize:12, fontWeight:500, marginBottom:4 }}>{p.name}</div>
                <div style={{ fontSize:11, color:C.dim, marginBottom:6 }}>
                  Estoque: {p.stock === -1 ? 'ilimitado' : `${p.stock} de ${p.stock_initial}`}
                </div>
                {/* Barra de peso */}
                <div style={{ height:3, background:'rgba(94,197,245,0.1)', borderRadius:2, marginBottom:6 }}>
                  <div style={{ height:'100%', width:`${p.weight}%`, background:C.gradBlue, borderRadius:2 }}/>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:11, color:C.blue }}>{p.weight}% chance</span>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => openEdit(p)} style={{ background:'none',border:'none',color:C.fade,cursor:'pointer',fontSize:16 }}>
                      <i className="ti ti-edit"/>
                    </button>
                    <button onClick={() => remove(p)} style={{ background:'none',border:'none',color:'rgba(240,149,149,0.5)',cursor:'pointer',fontSize:16 }}>
                      <i className="ti ti-trash"/>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Botão novo */}
          {eventId && (
            <button onClick={openNew} style={{
              border:`1.5px dashed ${C.bd}`, borderRadius:10, background:'none',
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              gap:8, color:C.fade, cursor:'pointer', minHeight:220,
            }}>
              <i className="ti ti-plus" style={{ fontSize:28 }}/>
              <span style={{ fontSize:12 }}>Novo prêmio</span>
            </button>
          )}
        </div>

        {/* Card "Não ganhou" — sobra explícita */}
        {eventId && prizes.length > 0 && !overflow && (
          <div style={{
            marginTop:20, padding:'14px 16px',
            background:'rgba(240,149,149,0.05)',
            border:'1px dashed rgba(240,149,149,0.3)',
            borderRadius:10,
            display:'flex', alignItems:'center', justifyContent:'space-between', gap:14,
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <i className="ti ti-mood-empty" style={{ fontSize:22, color:'rgba(240,149,149,0.8)' }}/>
              <div>
                <div style={{ fontSize:13, fontWeight:500 }}>Sobra para "Não ganhou"</div>
                <div style={{ fontSize:11, color:C.dim, marginTop:2 }}>
                  Quem cair aqui vê a tela de tentativa frustrada
                </div>
              </div>
            </div>
            <div style={{ fontSize:18, fontWeight:600, color:'rgba(240,149,149,0.9)' }}>{losePct}%</div>
          </div>
        )}
        {overflow && (
          <div style={{
            marginTop:20, padding:'14px 16px',
            background:'rgba(240,149,149,0.1)',
            border:'1px solid rgba(240,149,149,0.5)',
            borderRadius:10,
            color:C.red, fontSize:13,
          }}>
            <i className="ti ti-alert-triangle" style={{ fontSize:18, marginRight:8, verticalAlign:'-3px' }}/>
            A soma das chances passou de 100%. Reduza alguns prêmios pra ficar coerente — caso contrário os últimos prêmios da lista nunca caem.
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(2,5,13,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:20 }}>
          <div style={{ background:'#0d1b33',border:`1px solid ${C.bd}`,borderRadius:14,padding:24,width:'100%',maxWidth:400 }}>
            <h3 style={{ fontSize:16, marginBottom:20 }}>{modal==='new'?'Novo prêmio':'Editar prêmio'}</h3>

            {/* Preview imagem */}
            <div onClick={() => fileRef.current.click()} style={{
              width:'100%',height:120,background:'rgba(94,197,245,0.05)',border:`1.5px dashed ${C.bd}`,
              borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',marginBottom:14,overflow:'hidden',
            }}>
              {preview
                ? <img src={preview} alt="preview" style={{ width:'100%',height:'100%',objectFit:'contain' }}/>
                : <div style={{ textAlign:'center',color:C.fade }}>
                    <i className="ti ti-upload" style={{ fontSize:28, display:'block', marginBottom:4 }}/>
                    <span style={{ fontSize:11 }}>Clique pra escolher PNG</span>
                  </div>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp"
              onChange={pickFile} style={{ display:'none' }}/>

            {[
              { key:'name',   label:'Nome do prêmio', type:'text' },
              { key:'stock',  label:'Estoque (-1 = ilimitado)', type:'number' },
              { key:'weight', label:'Chance de cair este prêmio (% — ex: 5 = 5% das pessoas ganham)', type:'number' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:12 }}>
                <div style={{ fontSize:10, color:C.fade, letterSpacing:1, marginBottom:4, textTransform:'uppercase' }}>{f.label}</div>
                <input type={f.type} value={form[f.key]}
                  onChange={e => setForm(x=>({...x,[f.key]:e.target.value}))}
                  style={{ ...S.input, width:'100%' }}
                />
              </div>
            ))}

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
