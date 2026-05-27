import { useEffect } from 'react';
import { C, S } from '../theme.js';

const API_URL = () => window.__API_URL__ || 'http://localhost:3001';

export default function Won({ session, goHome }) {
  const { prize, winCode } = session;

  useEffect(() => {
    const t = setTimeout(goHome, 60000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      ...S.screen,
      alignItems:'center',
      background:'radial-gradient(ellipse 100% 60% at 50% 25%,#fff8e6 0%,#fff 55%,#eaf2fb 100%)',
    }}>
      {/* Confete */}
      <svg style={{ position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none' }} aria-hidden="true">
        <style>{`
          @keyframes fall{0%{opacity:0;transform:translateY(-20px) rotate(0)}10%{opacity:1}90%{opacity:1}100%{opacity:0;transform:translateY(80px) rotate(360deg)}}
          .cf{animation:fall 3s ease-in-out infinite}
        `}</style>
        {[
          [30,30,'#C7861A',0],[80,20,'#1E7CD8',0.4],[140,35,'#CC4747',0.8],[200,25,'#C7861A',0.2],
          [260,15,'#5BC5F5',0.6],[310,40,'#9B6BC7',1],[50,60,'#1E7CD8',1.4],[290,65,'#C7861A',1.8],
        ].map(([x,y,c,d],i) => (
          <rect key={i} className="cf" x={x} y={y} width={7} height={11} rx={2}
            fill={c} style={{ transformOrigin:`${x}px ${y}px`,animationDelay:`${d}s` }}/>
        ))}
      </svg>

      {/* Fechar */}
      <button
        onClick={goHome}
        style={{ position:'absolute',top:20,right:20,width:40,height:40,borderRadius:'50%',background:'#fff',border:`1px solid ${C.cardBd}`,color:C.dim,fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(13,91,168,0.10)' }}
      >
        <i className="ti ti-x" aria-hidden="true"/>
      </button>

      <div style={{ textAlign:'center',zIndex:2,marginTop:20 }}>
        <div style={{ fontSize:13,color:C.gold,letterSpacing:'4px',fontWeight:800,marginBottom:8 }}>
          ★ PARABÉNS ★
        </div>
        <h1 style={{
          fontSize:36,fontWeight:900,
          background:'linear-gradient(135deg,#C7861A 0%,#E0A52F 50%,#A66614 100%)',
          WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',
          marginBottom:24,
        }}>Você ganhou!</h1>
      </div>

      <div style={{ textAlign:'center',zIndex:2,marginBottom:24,animation:'bounce 2s ease-in-out infinite' }}>
        <div style={{
          width:140,height:140,margin:'0 auto',borderRadius:'50%',
          background:'radial-gradient(circle, rgba(199,134,26,0.20),rgba(199,134,26,0.04))',
          border:`2px solid rgba(199,134,26,0.55)`,
          display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:'0 16px 40px rgba(199,134,26,0.25)',
        }}>
          {prize?.image_url ? (
            <img src={API_URL() + prize.image_url} alt={prize.name}
              style={{ width:96,height:96,objectFit:'contain' }}/>
          ) : (
            <i className="ti ti-gift" style={{fontSize:68,color:C.gold}} aria-hidden="true"/>
          )}
        </div>
        <div style={{ fontSize:20,fontWeight:800,marginTop:16,color:C.text }}>
          {prize?.name || 'Prêmio'}
        </div>
      </div>

      <div style={{
        ...S.card, width:'100%', maxWidth:320, textAlign:'center',
        marginBottom:14, zIndex:2,
        border:`1.5px solid rgba(199,134,26,0.40)`,
        background:'#fffaf0',
      }}>
        <div style={{ fontSize:11,color:C.gold,letterSpacing:'2px',marginBottom:8,fontWeight:700 }}>
          SEU CÓDIGO DE RETIRADA
        </div>
        <div style={{ fontFamily:'monospace',fontSize:44,fontWeight:900,letterSpacing:10,color:C.blueDark }}>
          {winCode}
        </div>
      </div>

      <div style={{
        display:'flex',alignItems:'flex-start',gap:10,padding:'12px 16px',
        background:'rgba(199,134,26,0.08)',borderRadius:12,width:'100%',maxWidth:320,zIndex:2,
        marginBottom:'auto', border:'1px solid rgba(199,134,26,0.25)',
      }}>
        <i className="ti ti-info-circle" style={{fontSize:18,color:C.gold,flexShrink:0,marginTop:1}} aria-hidden="true"/>
        <span style={{ fontSize:13,color:C.textSub,lineHeight:1.45 }}>
          Mostre este código no estande pra retirar seu prêmio
        </span>
      </div>

      <button style={{ ...S.btnPrimary, marginTop:18, zIndex:2 }} onClick={goHome}>
        <i className="ti ti-check" style={{fontSize:22}} aria-hidden="true"/>Finalizar
      </button>

      <style>{`@keyframes bounce{0%,100%{transform:scale(1) translateY(0)}50%{transform:scale(1.04) translateY(-6px)}}`}</style>
    </div>
  );
}
