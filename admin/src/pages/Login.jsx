import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

const C = {
  bgGrad:'radial-gradient(ellipse 80% 60% at 50% 20%,#0e1a3d 0%,#050a18 60%,#02050d 100%)',
  card:'rgba(94,197,245,0.06)', bd:'rgba(94,197,245,0.2)', bd2:'rgba(94,197,245,0.4)',
  blue:'#5BC5F5', cyan:'#7FD4FF', dim:'rgba(181,212,244,0.7)', red:'#F09595',
  gradBlue:'linear-gradient(135deg,#5BC5F5 0%,#1E7CD8 100%)',
};

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
          <svg width="80" height="28" viewBox="0 0 130 38" aria-hidden="true">
            <defs><linearGradient id="lg2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#7FD4FF"/><stop offset="100%" stopColor="#1E7CD8"/>
            </linearGradient></defs>
            <circle cx="14" cy="24" r="9"  fill="url(#lg2)"/>
            <path d="M14 24Q32 4 50 20"   stroke="url(#lg2)" strokeWidth="7" fill="none" strokeLinecap="round"/>
            <circle cx="50" cy="20" r="6"  fill="url(#lg2)"/>
            <path d="M50 20Q65 32 80 20"  stroke="url(#lg2)" strokeWidth="7" fill="none" strokeLinecap="round"/>
            <circle cx="80" cy="20" r="6"  fill="url(#lg2)"/>
            <path d="M80 20Q98 4 116 24"  stroke="url(#lg2)" strokeWidth="7" fill="none" strokeLinecap="round"/>
            <circle cx="116" cy="24" r="9" fill="url(#lg2)"/>
          </svg>
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
