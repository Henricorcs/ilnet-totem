import { useEffect } from 'react';
import { C, S } from '../theme.js';

const API_URL = () => window.__API_URL__ || 'http://localhost:3001';

export default function Won({ session, goHome }) {
  const { prize, winCode } = session;

  // Auto-volta em 60s
  useEffect(() => {
    const t = setTimeout(goHome, 60000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ ...S.screen, alignItems:'center', background:'radial-gradient(ellipse 100% 60% at 50% 30%,#1a3d5c 0%,#0a1a3a 50%,#02050d 100%)' }}>
      {/* Confete SVG */}
      <svg style={{ position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none' }} aria-hidden="true">
        <style>{`
          @keyframes fall{0%{opacity:0;transform:translateY(-20px) rotate(0)}10%{opacity:1}90%{opacity:1}100%{opacity:0;transform:translateY(80px) rotate(360deg)}}
          .cf{animation:fall 3s ease-in-out infinite}
        `}</style>
        {[
          [30,30,'#FFC957',0],[80,20,'#5BC5F5',0.4],[140,35,'#F09595',0.8],[200,25,'#FFC957',0.2],
          [260,15,'#7FD4FF',0.6],[310,40,'#B591F5',1],[50,60,'#5BC5F5',1.4],[290,65,'#FFC957',1.8],
        ].map(([x,y,c,d],i) => (
          <rect key={i} className="cf" x={x} y={y} width={6} height={9} rx={2}
            fill={c} style={{ transformOrigin:`${x}px ${y}px`,animationDelay:`${d}s` }}/>
        ))}
      </svg>

      {/* Fechar */}
      <button
        onClick={goHome}
        style={{ position:'absolute',top:20,right:20,width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,0.08)',border:'none',color:C.fade,fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}
        aria-label="Fechar"
      >
        <i className="ti ti-x" aria-hidden="true"/>
      </button>

      <div style={{ textAlign:'center',zIndex:2 }}>
        <div style={{ fontSize:12,color:C.gold,letterSpacing:'3px',fontWeight:500,marginBottom:6 }}>
          PARABÉNS
        </div>
        <h1 style={{ fontSize:30,fontWeight:700,marginBottom:20 }}>Você ganhou!</h1>
      </div>

      {/* Prêmio */}
      <div style={{ textAlign:'center',zIndex:2,marginBottom:20,animation:'bounce 2s ease-in-out infinite' }}>
        <div style={{
          width:120,height:120,margin:'0 auto',borderRadius:'50%',
          background:'radial-gradient(circle,rgba(255,201,87,0.2),rgba(255,201,87,0.05))',
          border:`1.5px solid rgba(255,201,87,0.5)`,
          display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:'0 0 30px rgba(255,201,87,0.2)',
        }}>
          {prize?.image_url ? (
            <img src={API_URL() + prize.image_url} alt={prize.name}
              style={{ width:80,height:80,objectFit:'contain' }}/>
          ) : (
            <i className="ti ti-gift" style={{fontSize:58,color:C.gold}} aria-hidden="true"/>
          )}
        </div>
        <div style={{ fontSize:17,fontWeight:600,marginTop:14,color:'#fff' }}>
          {prize?.name || 'Prêmio'}
        </div>
      </div>

      {/* Código */}
      <div style={{
        ...S.card, width:'100%', maxWidth:280, textAlign:'center',
        marginBottom:14, zIndex:2,
      }}>
        <div style={{ fontSize:10,color:C.dim,letterSpacing:'2px',marginBottom:6 }}>
          SEU CÓDIGO DE RETIRADA
        </div>
        <div style={{ fontFamily:'monospace',fontSize:36,fontWeight:700,letterSpacing:8,color:'#fff' }}>
          {winCode}
        </div>
      </div>

      {/* Instrução */}
      <div style={{
        display:'flex',alignItems:'flex-start',gap:8,padding:'10px 14px',
        background:'rgba(255,201,87,0.07)',borderRadius:10,width:'100%',maxWidth:280,zIndex:2,
        marginBottom:'auto',
      }}>
        <i className="ti ti-info-circle" style={{fontSize:14,color:C.gold,flexShrink:0,marginTop:2}} aria-hidden="true"/>
        <span style={{ fontSize:11,color:'rgba(255,230,180,0.9)',lineHeight:1.4 }}>
          Mostre este código no estande pra retirar seu prêmio
        </span>
      </div>

      <button style={{ ...S.btnPrimary, marginTop:16, zIndex:2 }} onClick={goHome}>
        <i className="ti ti-check" style={{fontSize:20}} aria-hidden="true"/>Finalizar
      </button>

      <style>{`@keyframes bounce{0%,100%{transform:scale(1) translateY(0)}50%{transform:scale(1.04) translateY(-4px)}}`}</style>
    </div>
  );
}
