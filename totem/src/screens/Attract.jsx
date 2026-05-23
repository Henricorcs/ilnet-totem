import { useEffect, useState } from 'react';
import { C } from '../theme.js';

const LOGO_SRC = '/assets/logo_ilnet.svg';
const API_URL = () => window.__API_URL__ || 'http://localhost:3001';

// Constelação de partículas no fundo
function Particles() {
  const pts = [
    [40,70],[90,110],[60,150],[140,90],[200,130],[250,80],[310,110],
    [50,280],[170,350],[290,420],[100,460],[330,300],[40,500],[230,500]
  ];
  const lines = [[0,1],[1,2],[1,3],[3,4],[4,5],[5,6],[4,6],[7,8],[8,9],[10,8],[11,9]];
  return (
    <svg style={{ position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',opacity:0.55 }}
         viewBox="0 0 360 540" aria-hidden="true">
      <style>{`
        @keyframes dp{0%,100%{opacity:.55}50%{opacity:1}}
        @keyframes lp{0%,100%{opacity:.15}50%{opacity:.5}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
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

// Faíscas douradas subindo do CTA
function Sparkles() {
  return (
    <svg style={{ position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:1 }}
         viewBox="0 0 360 540" aria-hidden="true">
      <style>{`
        @keyframes spark{
          0%{opacity:0;transform:translate(0,0) scale(.4)}
          20%{opacity:1}
          100%{opacity:0;transform:translate(var(--dx),-180px) scale(1)}
        }
        .sp{animation:spark 3.6s ease-out infinite}
      `}</style>
      {[...Array(7)].map((_,i) => (
        <circle key={i} className="sp"
          style={{
            animationDelay:`${i*0.5}s`,
            '--dx': `${(i%2?1:-1) * (8 + (i*3))}px`,
            transformOrigin: `${120 + i*18}px 460px`,
          }}
          cx={120 + i*18} cy={460} r={i%2 ? 2.2 : 1.6}
          fill={i%3===0 ? '#FFC957' : '#7FD4FF'}/>
      ))}
    </svg>
  );
}

export default function Attract({ go, event, prizes = [] }) {
  const featuredPrizes = prizes.slice(0, 4);
  const [time, setTime] = useState(new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}));
  const [tick, setTick] = useState(0);

  // Relógio
  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})), 30000);
    return () => clearInterval(id);
  }, []);

  // Rotação do carrossel
  useEffect(() => {
    if (!featuredPrizes.length) return;
    const id = setInterval(() => setTick(t => t + 1), 2800);
    return () => clearInterval(id);
  }, [featuredPrizes.length]);

  const featured = featuredPrizes.length ? featuredPrizes[tick % featuredPrizes.length] : null;

  return (
    <div style={{
      position:'absolute',inset:0,
      background: C.bgGrad,
      display:'flex',flexDirection:'column',
      alignItems:'center',justifyContent:'space-between',
      padding:'28px 24px',
      cursor:'pointer',
      overflow:'hidden',
    }} onClick={() => go('entry')}>
      <Particles/>
      <Sparkles/>

      {/* Aura central */}
      <div style={{
        position:'absolute', top:'18%', left:'50%', transform:'translate(-50%,-50%)',
        width:'120vw', height:'120vw', maxWidth:520, maxHeight:520,
        background:'radial-gradient(circle, rgba(91,197,245,0.18) 0%, rgba(91,197,245,0.05) 35%, transparent 70%)',
        pointerEvents:'none', zIndex:0,
        animation:'aurabeat 4s ease-in-out infinite',
      }}/>

      {/* Status totem */}
      <div style={{ width:'100%',display:'flex',justifyContent:'space-between',zIndex:2,fontSize:10,color:'rgba(181,212,244,0.4)',fontFamily:'monospace' }}>
        <span>ILN-TOTEM-01</span>
        <span>{time}</span>
      </div>

      {/* Logo + título */}
      <div style={{ textAlign:'center',zIndex:2,display:'flex',flexDirection:'column',alignItems:'center',gap:18,marginTop:8 }}>
        <img
          src={LOGO_SRC}
          alt="ILNET"
          style={{
            width:'min(62vw, 380px)',
            height:'auto',
            display:'block',
            objectFit:'contain',
            filter:'drop-shadow(0 0 24px rgba(91,197,245,0.35))',
            animation:'floatLogo 5s ease-in-out infinite',
          }}
        />

        {event && (
          <div style={{ marginTop:2 }}>
            <div style={{ fontSize:11,color:C.dim,letterSpacing:'3px',marginBottom:6 }}>BEM-VINDO AO</div>
            <div style={{
              fontSize:24,fontWeight:700,
              background:C.gradText,
              WebkitBackgroundClip:'text',backgroundClip:'text',
              WebkitTextFillColor:'transparent',
              letterSpacing:'0.5px',
            }}>
              {event.name}
            </div>
          </div>
        )}
      </div>

      {/* Carrossel de prêmios em destaque */}
      <div style={{ zIndex:2, width:'100%', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
        {featured ? (
          <div key={featured.id} style={{
            display:'flex',alignItems:'center',gap:14,
            padding:'12px 18px',
            background:'rgba(255,201,87,0.08)',
            border:'1px solid rgba(255,201,87,0.35)',
            borderRadius:18,
            boxShadow:'0 10px 30px rgba(255,201,87,0.12)',
            animation:'prizeIn .6s ease-out',
            maxWidth: 320,
          }}>
            <div style={{
              width:56,height:56,borderRadius:14,
              background:'rgba(255,201,87,0.15)',
              display:'flex',alignItems:'center',justifyContent:'center',
              flexShrink:0,
              border:'1px solid rgba(255,201,87,0.3)',
            }}>
              {featured.image_url
                ? <img src={API_URL() + featured.image_url} alt={featured.name} style={{ width:42,height:42,objectFit:'contain' }}/>
                : <i className="ti ti-gift" style={{ fontSize:28, color:C.gold }} aria-hidden="true"/>}
            </div>
            <div style={{ textAlign:'left',flex:1,minWidth:0 }}>
              <div style={{ fontSize:10,letterSpacing:'1.5px',color:C.gold,marginBottom:2 }}>PRÊMIO EM JOGO</div>
              <div style={{ fontSize:15,fontWeight:600,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                {featured.name}
              </div>
            </div>
            <i className="ti ti-sparkles" style={{ fontSize:22,color:C.gold }} aria-hidden="true"/>
          </div>
        ) : (
          <div style={{ fontSize:13,color:C.fade,lineHeight:1.5,padding:'0 12px',textAlign:'center' }}>
            Cadastre-se, jogue a sorte e leve um prêmio pra casa
          </div>
        )}

        {featuredPrizes.length > 1 && (
          <div style={{ display:'flex',gap:6,marginTop:2 }}>
            {featuredPrizes.map((_,i) => (
              <span key={i} style={{
                width:6,height:6,borderRadius:'50%',
                background: i === (tick % featuredPrizes.length) ? C.blue : 'rgba(91,197,245,0.25)',
                transition:'background .3s',
              }}/>
            ))}
          </div>
        )}
      </div>

      {/* CTA pulsante */}
      <div style={{ zIndex:2,width:'100%',textAlign:'center' }}>
        <button
          style={{
            background: C.gradBlue,
            color:'#fff',border:'none',borderRadius:20,
            padding:'20px 32px',fontSize:19,fontWeight:700,
            cursor:'pointer',width:'100%',maxWidth:340,
            display:'inline-flex',alignItems:'center',justifyContent:'center',gap:12,
            animation:'pulse 2s ease-in-out infinite',
            boxShadow:'0 14px 36px rgba(30,124,216,0.45), 0 0 0 1px rgba(127,212,255,0.4) inset',
            letterSpacing:'0.5px',
          }}
          onClick={e => { e.stopPropagation(); go('entry'); }}
          aria-label="Toque para começar"
        >
          <i className="ti ti-hand-finger" style={{fontSize:24}} aria-hidden="true"/>
          Toque para começar
        </button>
        <div style={{ marginTop:14,fontSize:10,color:'rgba(181,212,244,0.4)',letterSpacing:'2px' }}>
          ILNET TELECOM · SÃO MATEUS / MA
        </div>
      </div>

      <style>{`
        @keyframes pulse{
          0%,100%{transform:scale(1);box-shadow:0 14px 36px rgba(30,124,216,0.45), 0 0 0 1px rgba(127,212,255,0.4) inset}
          50%{transform:scale(1.04);box-shadow:0 18px 48px rgba(91,197,245,0.6), 0 0 0 1px rgba(127,212,255,0.7) inset}
        }
        @keyframes floatLogo{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes aurabeat{0%,100%{opacity:.8}50%{opacity:1}}
        @keyframes prizeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}
