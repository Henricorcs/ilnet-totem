export const C = {
  bg:'#050a18',
  card:'rgba(94,197,245,0.06)',   cardHov:'rgba(94,197,245,0.12)',
  bd:'rgba(94,197,245,0.18)',     bd2:'rgba(94,197,245,0.35)',
  blue:'#5BC5F5', cyan:'#7FD4FF', blueDark:'#1E7CD8',
  dim:'rgba(181,212,244,0.7)',    fade:'rgba(181,212,244,0.42)',
  green:'#5DCAA5', gold:'#FFC957', red:'#F09595', purple:'#B591F5',
  gradBlue:'linear-gradient(135deg,#5BC5F5 0%,#1E7CD8 100%)',
};

export const S = {
  page:  { padding:'20px 24px', flex:1 },
  card:  { background:C.card, border:`1px solid ${C.bd}`, borderRadius:10, padding:'14px 16px' },
  th:    { padding:'8px 10px', fontSize:10, color:C.fade, letterSpacing:1, textTransform:'uppercase', borderBottom:`1px solid ${C.bd}`, background:'rgba(94,197,245,0.03)' },
  td:    { padding:'9px 10px', borderBottom:`1px solid rgba(94,197,245,0.07)`, fontSize:12 },
  input: { background:C.card, border:`1px solid ${C.bd}`, borderRadius:8, padding:'8px 10px', color:'#fff', fontSize:12, outline:'none', fontFamily:'inherit' },
  btn:   { background:C.gradBlue, color:'#fff', border:'none', borderRadius:8, padding:'8px 14px', cursor:'pointer', fontWeight:500, fontSize:12, display:'inline-flex', alignItems:'center', gap:6 },
  btnG:  { background:'transparent', border:`1px solid ${C.bd2}`, color:C.cyan, borderRadius:8, padding:'7px 13px', cursor:'pointer', fontSize:12, display:'inline-flex', alignItems:'center', gap:6 },
};

export const PageHeader = ({ title, sub, action }) => (
  <div style={{ padding:'16px 24px 0', display:'flex', justifyContent:'space-between', alignItems:'flex-end', borderBottom:`1px solid ${C.bd}`, paddingBottom:14, marginBottom:20 }}>
    <div>
      {sub && <div style={{ fontSize:10, color:C.fade, letterSpacing:'1.5px', marginBottom:4 }}>{sub}</div>}
      <h1 style={{ fontSize:18, fontWeight:500 }}>{title}</h1>
    </div>
    {action}
  </div>
);

export const Tag = ({ color, children }) => (
  <span style={{ fontSize:9, padding:'2px 7px', borderRadius:4, letterSpacing:'0.5px', fontWeight:500, background:`${color}22`, color, border:`1px solid ${color}44` }}>
    {children}
  </span>
);

export const Spin = () => (
  <span style={{ display:'inline-block', animation:'spin 1s linear infinite' }}>
    <i className="ti ti-loader-2"/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </span>
);

export const fmt = v => Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
