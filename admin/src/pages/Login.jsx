import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

const C = {
  bgGrad:'radial-gradient(ellipse 80% 60% at 50% 20%,#0e1a3d 0%,#050a18 60%,#02050d 100%)',
  card:'rgba(94,197,245,0.06)', bd:'rgba(94,197,245,0.2)', bd2:'rgba(94,197,245,0.4)',
  blue:'#5BC5F5', cyan:'#7FD4FF', dim:'rgba(181,212,244,0.7)', red:'#F09595',
  gradBlue:'linear-gradient(135deg,#5BC5F5 0%,#1E7CD8 100%)',
};

const LOGO_SRC = '/assets/ilnet-logo-clean.svg';

export default function Login() {
  const nav = useNavigate();
  const [form,    setForm]    = useState({ username:'admin', password:'' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const r = await api.login(form.username, form.password);
      localStorage.setItem('ilnet_admin_token', r.token);
      nav('/dashboard');
    } catch (err) {
      setError(err.message || 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:C.bgGrad, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:360 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <img
            src={LOGO_SRC}
            alt="ILNET"
            style={{ width:180, maxWidth:'70%', height:'auto', display:'block', margin:'0 auto' }}
          />
          <div style={{ fontSize:13, color:C.dim, marginTop:8, letterSpacing:'1px' }}>PAINEL ADMINISTRATIVO</div>
        </div>

        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {['username','password'].map(k => (
            <div key={k} style={{ background:C.card, border:`1.5px solid ${C.bd}`, borderRadius:10, padding:'10px 14px' }}>
              <div style={{ fontSize:9, color:C.dim, letterSpacing:1, textTransform:'uppercase', marginBottom:4 }}>
                {k==='username'?'Usuário':'Senha'}
              </div>
              <input
                type={k==='password'?'password':'text'}
                value={form[k]}
                onChange={e => setForm(f=>({...f,[k]:e.target.value}))}
                autoComplete={k==='password'?'current-password':'username'}
                style={{ background:'none', border:'none', outline:'none', color:'#fff', fontSize:14, width:'100%' }}
              />
            </div>
          ))}

          {error && <div style={{ color:C.red, fontSize:12, textAlign:'center' }}>{error}</div>}

          <button type="submit" disabled={loading}
            style={{ background:C.gradBlue, color:'#fff', border:'none', borderRadius:10, padding:'14px', fontSize:14, fontWeight:600, cursor:'pointer', marginTop:4 }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
