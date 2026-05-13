import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { C, S, PageHeader, Spin } from '../components/ui.jsx';

export default function Settings() {
  const [cfg,    setCfg]    = useState({ win_chance:'40', idle_timeout:'30', sound_video:'true', sound_effects:'true' });
  const [loading,setLoading]= useState(true);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [ixcOk,  setIxcOk] = useState(null);

  useEffect(() => {
    api.getSettings().then(r => { setCfg(c => ({ ...c, ...r })); }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setSaved(false);
    try { await api.saveSettings(cfg); setSaved(true); setTimeout(() => setSaved(false), 2500); }
    catch(e) { alert(e.message); }
    finally  { setSaving(false); }
  };

  const testIxc = async () => {
    setIxcOk(null);
    try {
      const r = await fetch((window.__API_URL__||'http://localhost:3001') + '/api/ixc/health');
      const data = await r.json().catch(() => ({}));
      setIxcOk(r.ok && data.ixc === 'ok');
    } catch { setIxcOk(false); }
  };

  if (loading) return <div style={{ padding:40, color:C.fade }}><Spin/> Carregando...</div>;

  const Row = ({ label, sub, right }) => (
    <div style={{ ...S.card, display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
      <div>
        <div style={{ fontSize:13, fontWeight:500, marginBottom:sub?2:0 }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:C.dim }}>{sub}</div>}
      </div>
      {right}
    </div>
  );

  const Toggle = ({ val, onChange }) => (
    <div onClick={onChange} style={{ width:42,height:24,borderRadius:12,cursor:'pointer',position:'relative',background:val?C.gradBlue:'rgba(94,197,245,0.15)',transition:'background .2s' }}>
      <div style={{ position:'absolute',top:3,left:val?20:3,width:18,height:18,borderRadius:'50%',background:'#fff',transition:'left .2s' }}/>
    </div>
  );

  return (
    <div>
      <PageHeader title="Ajustes" sub="ILNET TOTEM"
        action={
          <button style={S.btn} onClick={save} disabled={saving}>
            {saving ? <><Spin/>Salvando...</>
              : saved ? <><i className="ti ti-check"/>Salvo!</>
              : 'Salvar alterações'}
          </button>
        }
      />
      <div style={S.page}>
        <Row label="Chance de ganhar" sub="Probabilidade de a roleta premiar o participante"
          right={
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <input type="range" min="0" max="100" value={cfg.win_chance}
                onChange={e => setCfg(c=>({...c,win_chance:e.target.value}))}
                style={{ width:140, accentColor:C.blue }}
              />
              <span style={{ fontSize:18, fontWeight:600, color:C.blue, minWidth:44 }}>{cfg.win_chance}%</span>
            </div>
          }
        />

        <Row label="Tempo de inatividade" sub="Totem volta à tela inicial após este tempo"
          right={
            <select value={cfg.idle_timeout} onChange={e => setCfg(c=>({...c,idle_timeout:e.target.value}))}
              style={S.input}>
              <option value="15">15 segundos</option>
              <option value="30">30 segundos</option>
              <option value="60">1 minuto</option>
              <option value="120">2 minutos</option>
            </select>
          }
        />

        <Row label="Vídeo de fundo" sub="Vídeo na tela inicial atrativa (/assets/video.mp4)"
          right={<Toggle val={cfg.sound_video==='true'} onChange={() => setCfg(c=>({...c,sound_video:c.sound_video==='true'?'false':'true'}))}/>}
        />

        <Row label="Efeitos sonoros" sub="Sons da roleta e interações"
          right={<Toggle val={cfg.sound_effects==='true'} onChange={() => setCfg(c=>({...c,sound_effects:c.sound_effects==='true'?'false':'true'}))}/>}
        />

        {/* Status da API */}
        <div style={{ ...S.card, marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:13, fontWeight:500 }}>Integração IXC</div>
              <div style={{ fontSize:11, color:C.dim }}>saomateus.cas.net.br · usuário configurado no .env</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {ixcOk !== null && (
                <div style={{ display:'flex',alignItems:'center',gap:6,padding:'4px 10px',background:ixcOk?'rgba(93,202,165,0.1)':'rgba(240,149,149,0.1)',border:`1px solid ${ixcOk?'rgba(93,202,165,0.3)':'rgba(240,149,149,0.3)'}`,borderRadius:6 }}>
                  <span style={{ width:6,height:6,borderRadius:'50%',background:ixcOk?C.green:C.red,display:'inline-block' }}/>
                  <span style={{ fontSize:10,color:ixcOk?C.green:C.red }}>{ixcOk?'Conectado':'Sem resposta'}</span>
                </div>
              )}
              <button style={S.btnG} onClick={testIxc}><i className="ti ti-refresh"/>Testar</button>
            </div>
          </div>
        </div>

        {/* Alterar senha */}
        <div style={{ ...S.card, borderColor:'rgba(255,201,87,0.2)', background:'rgba(255,201,87,0.03)' }}>
          <div style={{ fontSize:13, fontWeight:500, marginBottom:4 }}>Credenciais</div>
          <div style={{ fontSize:11, color:C.dim }}>
            Pra alterar a senha do admin, acesse o servidor e execute:<br/>
            <code style={{ color:C.blue, fontSize:11, display:'block', marginTop:6, padding:'6px 10px', background:'rgba(94,197,245,0.06)', borderRadius:6 }}>
              docker exec -it ilnet-backend node -e "require('./src/db').query(\"UPDATE admin_users SET password_hash = crypt('NOVA_SENHA', gen_salt('bf')) WHERE username='admin'\")"
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
