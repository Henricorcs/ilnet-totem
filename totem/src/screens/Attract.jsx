import { useEffect, useRef } from 'react';
import { C } from '../theme.js';

const LOGO_SRC = '/assets/ilnet-logo-clean.svg';

// Partículas SVG animadas (fundo)
function Particles() {
  const pts = [
    [40,70],[90,110],[60,150],[140,90],[200,130],[250,80],[310,110],[50,280],[170,350],[290,420],[100,460]
  ];
  const lines = [[0,1],[1,2],[1,3],[3,4],[4,5],[5,6],[4,6]];
  return (
    <svg style={{ position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',opacity:0.45 }}
         viewBox="0 0 360 540" aria-hidden="true">
      <style>{`
        @keyframes dp{0%,100%{opacity:.55}50%{opacity:1}}
        @keyframes lp{0%,100%{opacity:.2}50%{opacity:.6}}
        .dp{animation:dp 3s ease-in-out infinite}
        .lp{animation:lp 4s ease-in-out infinite}
      `}</style>
      {lines.map(([a,b],i) => (
        <line key={i} className="lp" style={{animationDelay:`${i*0.5}s`}}
          x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]}
          stroke="#5BC5F5" strokeWidth="0.6"/>
      ))}
      {pts.map(([x,y],i) => (
        <circle key={i} className="dp" style={{animationDelay:`${i*0.3}s`}}
          cx={x} cy={y} r={i%3===0?3.5:2.5} fill={i%2===0?'#7FD4FF':'#5BC5F5'}/>
      ))}
    </svg>
  );
}

export default function Attract({ go, event }) {
  const videoRef = useRef(null);

  useEffect(() => {
    // Tenta reproduzir o vídeo (muted = permite autoplay)
    videoRef.current?.play().catch(() => {});
  }, []);

  return (
    <div style={{
      position:'absolute',inset:0,
      background: C.bgGrad,
      display:'flex',flexDirection:'column',
      alignItems:'center',justifyContent:'space-between',
      padding:'32px 28px',
      cursor:'pointer',
    }} onClick={() => go('entry')}>

      {/* Vídeo de fundo (fica atrás de tudo) */}
      <video
        ref={videoRef}
        src="/assets/video.mp4"
        autoPlay loop muted playsInline
        style={{
          position:'absolute',inset:0,width:'100%',height:'100%',
          objectFit:'cover',opacity:0.12,zIndex:0,
        }}
      />

      <Particles/>

      {/* Status totem — discreto */}
      <div style={{ width:'100%',display:'flex',justifyContent:'space-between',zIndex:2,fontSize:10,color:'rgba(181,212,244,0.4)',fontFamily:'monospace' }}>
        <span>ILN-TOTEM-01</span>
        <span>{new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span>
      </div>

      {/* Logo + evento */}
      <div style={{ textAlign:'center',zIndex:2,flex:1,display:'flex',flexDirection:'column',justifyContent:'center',gap:24 }}>
        <img
          src={LOGO_SRC}
          alt="ILNET"
          style={{
            width:'min(58vw, 360px)',
            height:'auto',
            display:'block',
            margin:'0 auto',
            objectFit:'contain',
            filter:'drop-shadow(0 0 18px rgba(91,197,245,0.22))',
          }}
        />

        {event && (
          <div style={{ marginTop:8 }}>
            <div style={{ fontSize:13,color:C.dim,letterSpacing:'2px',marginBottom:4 }}>BEM-VINDO AO</div>
            <div style={{ fontSize:22,color:'#fff',fontWeight:500 }}>{event.name}</div>
          </div>
        )}

        <div style={{ fontSize:14,color:C.fade,lineHeight:1.5,padding:'0 12px' }}>
          Cadastre-se, jogue a sorte e leve um prêmio pra casa
        </div>
      </div>

      {/* CTA pulsante */}
      <div style={{ zIndex:2,width:'100%',textAlign:'center' }}>
        <button
          style={{
            background: C.gradBlue,
            color:'#fff',border:'none',borderRadius:18,
            padding:'18px 32px',fontSize:18,fontWeight:600,
            cursor:'pointer',width:'100%',maxWidth:320,
            display:'inline-flex',alignItems:'center',justifyContent:'center',gap:10,
            animation:'pulse 2.2s ease-in-out infinite',
          }}
          onClick={e => { e.stopPropagation(); go('entry'); }}
          aria-label="Toque para começar"
        >
          <i className="ti ti-hand-finger" style={{fontSize:22}} aria-hidden="true"/>
          Toque para começar
        </button>
        <div style={{ marginTop:14,fontSize:10,color:'rgba(181,212,244,0.35)',letterSpacing:'1px' }}>
          ILNET TELECOM · SÃO MATEUS / MA
        </div>
      </div>

      <style>{`
        @keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.04);opacity:.88}}
      `}</style>
    </div>
  );
}
