import { useEffect, useRef, useState, useCallback } from 'react';
import { C } from '../theme.js';

const LOGO_SRC = '/assets/logo_ilnet.svg';
const API_URL = () => window.__API_URL__ || 'http://localhost:3001';

// Pontos azuis decorativos no fundo claro
function Particles() {
  const pts = [
    [40,70],[90,110],[60,150],[140,90],[200,130],[250,80],[310,110],
    [50,280],[170,350],[290,420],[100,460],[330,300],[40,500],[230,500]
  ];
  const lines = [[0,1],[1,2],[1,3],[3,4],[4,5],[5,6],[4,6],[7,8],[8,9],[10,8],[11,9]];
  return (
    <svg style={{ position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',opacity:0.35 }}
         viewBox="0 0 360 540" aria-hidden="true">
      <style>{`
        @keyframes dp{0%,100%{opacity:.45}50%{opacity:.9}}
        @keyframes lp{0%,100%{opacity:.1}50%{opacity:.35}}
        .dp{animation:dp 3s ease-in-out infinite}
        .lp{animation:lp 4s ease-in-out infinite}
      `}</style>
      {lines.map(([a,b],i) => (
        <line key={i} className="lp" style={{animationDelay:`${i*0.5}s`}}
          x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]}
          stroke="#1E7CD8" strokeWidth="0.6"/>
      ))}
      {pts.map(([x,y],i) => (
        <circle key={i} className="dp" style={{animationDelay:`${i*0.3}s`}}
          cx={x} cy={y} r={i%3===0?3.5:2.5} fill={i%2===0?'#5BC5F5':'#1E7CD8'}/>
      ))}
    </svg>
  );
}

export default function Attract({ go, event, prizes = [] }) {
  const featuredPrizes = prizes;
  const [time, setTime] = useState(new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}));
  const [tick, setTick] = useState(0);
  const touchX = useRef(null);
  const cycleRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})), 30000);
    return () => clearInterval(id);
  }, []);

  // Auto-cycle dos prêmios — reinicia a cada interação manual pra evitar
  // disparo duplo logo após swipe.
  const startCycle = useCallback(() => {
    clearInterval(cycleRef.current);
    if (!featuredPrizes.length) return;
    cycleRef.current = setInterval(() => setTick(t => t + 1), 2800);
  }, [featuredPrizes.length]);

  useEffect(() => {
    startCycle();
    return () => clearInterval(cycleRef.current);
  }, [startCycle]);

  const currentIdx = featuredPrizes.length ? ((tick % featuredPrizes.length) + featuredPrizes.length) % featuredPrizes.length : 0;
  const featured = featuredPrizes.length ? featuredPrizes[currentIdx] : null;

  const handleTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(diff) > 40) {
      setTick(t => t + (diff < 0 ? 1 : -1));
      startCycle(); // reset do timer pra dar 2.8s a partir do toque
    }
    touchX.current = null;
  };

  return (
    <div style={{
      position:'absolute',inset:0,
      background: C.bgGrad,
      display:'flex',flexDirection:'column',
      alignItems:'center',justifyContent:'space-between',
      padding:'32px 28px',
      cursor:'pointer',
      overflow:'hidden',
    }} onClick={() => go('entry')}>
      <Particles/>

      {/* Aura central */}
      <div style={{
        position:'absolute', top:'22%', left:'50%', transform:'translate(-50%,-50%)',
        width:'120vw', height:'120vw', maxWidth:560, maxHeight:560,
        background:'radial-gradient(circle, rgba(91,197,245,0.20) 0%, rgba(91,197,245,0.05) 35%, transparent 70%)',
        pointerEvents:'none', zIndex:0,
        animation:'aurabeat 4s ease-in-out infinite',
      }}/>

      {/* Status totem */}
      <div style={{ width:'100%',display:'flex',justifyContent:'space-between',zIndex:2,fontSize:11,color:C.fade,fontFamily:'monospace' }}>
        <span>ILN-TOTEM-01</span>
        <span>{time}</span>
      </div>

      {/* Logo + título */}
      <div style={{ textAlign:'center',zIndex:2,display:'flex',flexDirection:'column',alignItems:'center',gap:20 }}>
        <img
          src={LOGO_SRC}
          alt="ILNET"
          style={{
            width:'min(64vw, 400px)',
            height:'auto',
            display:'block',
            objectFit:'contain',
            filter:'drop-shadow(0 12px 28px rgba(13,91,168,0.25))',
            animation:'floatLogo 5s ease-in-out infinite',
          }}
        />

        {event && (
          <div>
            <div style={{ fontSize:12,color:C.fade,letterSpacing:'3px',marginBottom:6,fontWeight:600 }}>BEM-VINDO AO</div>
            <div style={{
              fontSize:28,fontWeight:800,
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

      {/* Carrossel — 3 prêmios visíveis */}
      <div style={{ zIndex:2, width:'100%', display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
        {featured ? (
          <>
            <div style={{ fontSize:12,letterSpacing:'3px',color:C.gold,fontWeight:800,marginBottom:2 }}>
              ★ PRÊMIOS EM JOGO ★
            </div>
            <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
              style={{
                display:'flex',alignItems:'center',justifyContent:'center',gap:10,
                width:'100%',maxWidth:480,
              }}
            >
              {[-1, 0, 1].map(offset => {
                const len = featuredPrizes.length;
                const idx = ((currentIdx + offset) % len + len) % len;
                const p = featuredPrizes[idx];
                const isCenter = offset === 0;
                const isSide = !isCenter && len > 1;
                if (isSide && len < 3) return null;
                return (
                  <div key={`${p.id}-${offset}`} style={{
                    flex: isCenter ? '1 1 60%' : '0 1 22%',
                    display:'flex',flexDirection:'column',alignItems:'center',
                    padding: isCenter ? '18px 14px' : '12px 8px',
                    background:'#fff',
                    border: isCenter ? '1.5px solid rgba(199,134,26,0.45)' : '1px solid rgba(199,134,26,0.20)',
                    borderRadius: isCenter ? 22 : 16,
                    boxShadow: isCenter
                      ? '0 14px 36px rgba(199,134,26,0.22), 0 0 0 1px rgba(199,134,26,0.10) inset'
                      : '0 6px 16px rgba(13,91,168,0.08)',
                    transform: isCenter ? 'scale(1)' : 'scale(0.92)',
                    opacity: isCenter ? 1 : 0.55,
                    transition: 'transform .5s ease, opacity .5s ease',
                  }}>
                    <div style={{
                      width: isCenter ? 96 : 56, height: isCenter ? 96 : 56,
                      borderRadius: isCenter ? 20 : 12,
                      background:'rgba(199,134,26,0.12)',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      border:'1px solid rgba(199,134,26,0.30)',
                      transition:'all .5s ease',
                    }}>
                      {p.image_url
                        ? <img src={API_URL() + p.image_url} alt={p.name}
                            style={{ width: isCenter ? 74 : 42, height: isCenter ? 74 : 42, objectFit:'contain', transition:'all .5s ease' }}/>
                        : <i className="ti ti-gift" style={{ fontSize: isCenter ? 48 : 28, color:C.gold }} aria-hidden="true"/>}
                    </div>
                    {isCenter && (
                      <div style={{
                        fontSize:18,fontWeight:800,color:C.text,
                        marginTop:10,textAlign:'center',
                        overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                        maxWidth:'100%',
                      }}>
                        {p.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ fontSize:15,color:C.dim,lineHeight:1.5,padding:'0 12px',textAlign:'center' }}>
            Cadastre-se, jogue a sorte e leve um prêmio pra casa
          </div>
        )}

        {featuredPrizes.length > 1 && (
          <div style={{ display:'flex',gap:6 }}>
            {featuredPrizes.map((_,i) => (
              <span key={i} style={{
                width:7,height:7,borderRadius:'50%',
                background: i === currentIdx ? C.blue : 'rgba(30,124,216,0.25)',
                transition:'background .3s',
              }}/>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ zIndex:2,width:'100%',textAlign:'center' }}>
        <button
          style={{
            background: C.gradBlue,
            color:'#fff',border:'none',borderRadius:22,
            padding:'24px 32px',fontSize:21,fontWeight:800,
            cursor:'pointer',width:'100%',maxWidth:360,
            display:'inline-flex',alignItems:'center',justifyContent:'center',gap:12,
            animation:'pulse 2s ease-in-out infinite',
            boxShadow:'0 18px 40px rgba(30,124,216,0.40), 0 0 0 1.5px rgba(91,197,245,0.45) inset',
            letterSpacing:'0.5px',
          }}
          onClick={e => { e.stopPropagation(); go('entry'); }}
        >
          <i className="ti ti-hand-finger" style={{fontSize:26}} aria-hidden="true"/>
          Toque para começar
        </button>
        <div style={{ marginTop:16,fontSize:11,color:C.fade,letterSpacing:'2px',fontWeight:600 }}>
          ILNET TELECOM · SÃO MATEUS / MA
        </div>
      </div>

      <style>{`
        @keyframes pulse{
          0%,100%{transform:scale(1);box-shadow:0 18px 40px rgba(30,124,216,0.40), 0 0 0 1.5px rgba(91,197,245,0.45) inset}
          50%{transform:scale(1.04);box-shadow:0 22px 52px rgba(91,197,245,0.55), 0 0 0 1.5px rgba(91,197,245,0.75) inset}
        }
        @keyframes floatLogo{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes aurabeat{0%,100%{opacity:.75}50%{opacity:1}}
        @keyframes prizeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}
