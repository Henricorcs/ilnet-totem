import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const C = {
  bg:'#050a18', sidebar:'#02050d',
  bd:'rgba(94,197,245,0.1)', bdStr:'rgba(94,197,245,0.25)',
  card:'rgba(94,197,245,0.06)', cardHov:'rgba(94,197,245,0.12)',
  blue:'#5BC5F5', cyan:'#7FD4FF',
  dim:'rgba(181,212,244,0.7)', fade:'rgba(181,212,244,0.4)',
  gradBlue:'linear-gradient(135deg,#5BC5F5 0%,#1E7CD8 100%)',
};

const NAV = [
  { to:'/dashboard',    icon:'ti-chart-bar',      label:'Painel'    },
  { to:'/events',       icon:'ti-calendar-event', label:'Eventos'   },
  { to:'/prizes',       icon:'ti-gift',           label:'Prêmios'   },
  { to:'/validate',     icon:'ti-ticket',         label:'Validar'   },
  { to:'/participants', icon:'ti-users',          label:'Leads'     },
  { to:'/settings',     icon:'ti-settings',       label:'Ajustes'   },
];

const LOGO_SRC = '/assets/ilnet-logo-real.png';

function Logo() {
  return (
    <div style={{ padding:'12px 8px 8px', textAlign:'center' }}>
      <img
        src={LOGO_SRC}
        alt="ILNET"
        style={{ width:42, height:24, objectFit:'contain', display:'block', margin:'0 auto' }}
      />
    </div>
  );
}

export default function Layout() {
  const nav = useNavigate();

  const logout = () => {
    localStorage.removeItem('ilnet_admin_token');
    nav('/login');
  };

  return (
    <div style={{ display:'flex', height:'100vh', background:C.bg, color:'#fff', fontFamily:'system-ui,-apple-system,sans-serif', fontSize:13 }}>
      {/* Sidebar */}
      <div style={{ width:62, background:C.sidebar, borderRight:`1px solid ${C.bd}`, display:'flex', flexDirection:'column', padding:'4px 7px', gap:2, flexShrink:0 }}>
        <Logo/>
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:2, marginTop:4 }}>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} title={n.label}
              style={({ isActive }) => ({
                display:'flex', flexDirection:'column', alignItems:'center', gap:2,
                padding:'8px 0', borderRadius:9, textDecoration:'none',
                color: isActive ? C.cyan : C.fade,
                background: isActive ? C.cardHov : 'transparent',
                transition:'all .15s',
              })}
            >
              <i className={`ti ${n.icon}`} style={{ fontSize:20 }}/>
              <span style={{ fontSize:8.5, letterSpacing:0.2 }}>{n.label}</span>
            </NavLink>
          ))}
        </div>
        <button onClick={logout} title="Sair"
          style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'8px 0', borderRadius:9, background:'none', border:'none', color:'rgba(240,149,149,0.5)', cursor:'pointer', marginBottom:8 }}
        >
          <i className="ti ti-logout" style={{ fontSize:20 }}/>
          <span style={{ fontSize:8.5 }}>Sair</span>
        </button>
      </div>

      {/* Conteúdo */}
      <div style={{ flex:1, overflow:'auto', display:'flex', flexDirection:'column' }}>
        <Outlet/>
      </div>
    </div>
  );
}
