import { useState, useRef, useEffect } from 'react';
import { api } from '../api.js';
import { C, S } from '../theme.js';
import { ClientPill } from '../components/ClientIdentity.jsx';

const API_URL = () => window.__API_URL__ || 'http://localhost:3001';
const SH = 120;
const IMG_SIZE = Math.round(SH * 0.7); // 84px fixo — não muda durante o giro

function resolveImg(image_url) {
  if (!image_url) return null;
  if (/^https?:\/\//i.test(image_url)) return image_url;
  return API_URL() + image_url;
}

// Um reel: rola suavemente a cada tick
function Reel({ prizes, currentIdx, spinning, stopped }) {
  const len = prizes.length || 1;
  const get = (off) => prizes[((currentIdx + off) % len + len) % len];

  const Symbol = ({ p, scale = 1, opacity = 1 }) => {
    const src = resolveImg(p?.image_url);
    return (
      <div style={{ height:SH, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <div style={{
          width:IMG_SIZE, height:IMG_SIZE,
          display:'flex', alignItems:'center', justifyContent:'center',
          transform:`scale(${scale})`,
          transformOrigin:'center center',
          transition:'transform .15s ease',
          opacity,
          willChange:'transform, opacity',
        }}>
          {src ? (
            <img src={src} alt={p.name} draggable={false} decoding="sync" loading="eager"
              style={{ width:IMG_SIZE, height:IMG_SIZE, objectFit:'contain', pointerEvents:'none', userSelect:'none',
                filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.45))' }}
            />
          ) : (
            <i className="ti ti-gift" style={{ fontSize:IMG_SIZE*0.78, color:C.blue }} aria-hidden="true"/>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      width:SH, height:SH*3, overflow:'hidden', position:'relative',
      background:'linear-gradient(180deg,#040d22 0%,#071636 30%,#0a1e48 50%,#071636 70%,#040d22 100%)',
      border:`2px solid ${stopped ? '#5BC5F5' : 'rgba(30,124,216,0.45)'}`,
      borderRadius:14,
      transition:'border-color 0.35s, box-shadow 0.35s',
      boxShadow: stopped
        ? '0 0 22px rgba(91,197,245,0.60), inset 0 0 16px rgba(91,197,245,0.20)'
        : 'inset 0 0 18px rgba(0,0,0,0.55), 0 6px 18px rgba(0,0,0,0.4)',
    }}>
      {/* Reflexo de vidro */}
      <div style={{ position:'absolute',inset:0, zIndex:3, pointerEvents:'none',
        background:'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.05) 100%)'
      }}/>
      {/* Fade topo/fundo */}
      <div style={{ position:'absolute',top:0,left:0,right:0,height:SH,zIndex:2,pointerEvents:'none',
        background:'linear-gradient(to bottom,rgba(4,13,34,0.96) 0%,transparent 100%)' }}/>
      <div style={{ position:'absolute',bottom:0,left:0,right:0,height:SH,zIndex:2,pointerEvents:'none',
        background:'linear-gradient(to top,rgba(4,13,34,0.96) 0%,transparent 100%)' }}/>
      {/* Linha central */}
      <div style={{
        position:'absolute',top:SH,left:0,right:0,height:SH,zIndex:1,pointerEvents:'none',
        borderTop:`1px solid ${stopped ? 'rgba(91,197,245,0.55)' : 'rgba(30,124,216,0.25)'}`,
        borderBottom:`1px solid ${stopped ? 'rgba(91,197,245,0.55)' : 'rgba(30,124,216,0.25)'}`,
        background: stopped ? 'rgba(91,197,245,0.07)' : 'transparent',
        transition:'all 0.35s',
      }}/>

      {/* Strip animada: ao girar, rola para cima a cada tick */}
      <div
        key={spinning ? currentIdx : 'stopped'}
        style={{ animation: spinning ? 'reelScroll 80ms linear forwards' : 'none' }}
      >
        <Symbol p={get(-1)} scale={0.7}  opacity={0.35}/>
        <Symbol p={get(0)}  scale={1.05} opacity={1}/>
        <Symbol p={get(1)}  scale={0.7}  opacity={0.35}/>
        <Symbol p={get(2)}  scale={0.5}  opacity={0.15}/>
      </div>
    </div>
  );
}

// Luzes na moldura
function MarqueeLights({ count = 9, spinning, win }) {
  return (
    <div style={{ display:'flex',justifyContent:'space-between',gap:4,width:'100%' }}>
      {[...Array(count)].map((_,i) => {
        const color = win ? '#5BC5F5' : (spinning ? (i%2 ? '#5BC5F5' : '#1E7CD8') : C.cardBd);
        return (
          <span key={i} style={{
            width:9,height:9,borderRadius:'50%',
            background: color,
            boxShadow: win || spinning ? `0 0 8px ${color}` : 'none',
            animation: spinning || win ? `marqueeBlink .6s ease-in-out ${i*0.08}s infinite alternate` : 'none',
            transition: 'all .3s',
          }}/>
        );
      })}
    </div>
  );
}

export default function SlotMachine({ session, go, prizes }) {
  const { cpf, eventId, clientName, visitorName, participantType } = session;
  const participantName = clientName || visitorName || '';
  const name = participantName?.split(' ')[0] || '';
  const participantLabel = participantType === 'visitor'
    ? 'Visitante cadastrado'
    : 'Cliente identificado';

  const [idxs,     setIdxs]     = useState([0,0,0]);
  const [spinning, setSpinning] = useState(false);
  const [stopped,  setStopped]  = useState([false,false,false]);
  const [msg,      setMsg]      = useState('');
  const [leverDown,setLeverDown]= useState(false);
  const [imgsReady,setImgsReady]= useState(false);
  const intervals = useRef([null,null,null]);

  // Pré-carrega todas as PNGs antes de permitir o giro — evita flicker
  useEffect(() => {
    if (!prizes.length) { setImgsReady(true); return; }
    let remaining = 0;
    const loaders = [];
    prizes.forEach(p => {
      const src = resolveImg(p.image_url);
      if (!src) return;
      remaining++;
      const img = new Image();
      img.onload  = () => { remaining--; if (remaining === 0) setImgsReady(true); };
      img.onerror = () => { remaining--; if (remaining === 0) setImgsReady(true); };
      img.src = src;
      loaders.push(img);
    });
    if (remaining === 0) setImgsReady(true);
    // Timeout de segurança — libera giro mesmo se alguma PNG falhar
    const safety = setTimeout(() => setImgsReady(true), 3000);
    return () => clearTimeout(safety);
  }, [prizes]);

  const safeLen = prizes.length || 1;
  const allStopped = stopped.every(Boolean);
  const allMatch = allStopped && idxs[0] === idxs[1] && idxs[1] === idxs[2];

  const spin = async () => {
    if (spinning || !prizes.length || !imgsReady) return;
    if (!cpf || !eventId) {
      setMsg('Cadastro incompleto. Volte ao inicio e tente novamente.');
      return;
    }

    setLeverDown(true);
    setTimeout(() => setLeverDown(false), 450);

    setSpinning(true);
    setStopped([false,false,false]);
    setMsg('');

    for (let r = 0; r < 3; r++) {
      intervals.current[r] = setInterval(() => {
        setIdxs(prev => {
          const n = [...prev];
          n[r] = (n[r] + 1) % safeLen;
          return n;
        });
      }, 80);
    }

    let result;
    try {
      result = await api.spin(cpf, eventId);
    } catch (e) {
      for (let r = 0; r < 3; r++) clearInterval(intervals.current[r]);
      setSpinning(false);
      setMsg(e.message || 'Erro ao sortear. Tente novamente.');
      return;
    }

    let targets;
    if (result.won) {
      const wi = prizes.findIndex(p => p.id === result.prize.id);
      const ti = wi >= 0 ? wi : 0;
      targets = [ti, ti, ti];
    } else {
      const i1 = Math.floor(Math.random() * safeLen);
      const i2 = (i1 + 1 + Math.floor(Math.random() * Math.max(safeLen - 1, 1))) % safeLen;
      targets = [i1, i1, i2];
    }

    for (let r = 0; r < 3; r++) {
      await new Promise(res => setTimeout(res, 600 * (r + 1)));
      clearInterval(intervals.current[r]);
      setIdxs(prev => { const n=[...prev]; n[r]=targets[r]; return n; });
      setStopped(prev => { const n=[...prev]; n[r]=true; return n; });
    }

    setSpinning(false);

    setTimeout(() => {
      if (result.won) go('won', { prize: result.prize, winCode: result.win_code });
      else            go('lost');
    }, 1300);
  };

  return (
    <div style={{ ...S.screen, padding:'20px 16px' }}>
      {/* Header */}
      <div style={{ display:'flex',justifyContent:'flex-end',alignItems:'center' }}>
        <div style={{
          display:'flex',alignItems:'center',gap:8,fontSize:13,color:C.blue,fontWeight:700,
          padding:'8px 14px',borderRadius:999,
          background:'#fff',
          border:`1.5px solid rgba(30,124,216,0.40)`,
          boxShadow:'0 4px 14px rgba(30,124,216,0.15)',
        }}>
          <i className="ti ti-ticket" style={{fontSize:15}} aria-hidden="true"/>1 chance
        </div>
      </div>

      <div style={{ textAlign:'center',marginTop:6 }}>
        {name && (
          <div style={{ display:'flex',justifyContent:'center',marginBottom:10 }}>
            <ClientPill clientName={participantName} label={participantLabel} />
          </div>
        )}
        <div style={S.stepLabel}>PASSO 4 DE 4</div>
        <h1 style={{
          fontSize:30,fontWeight:900,marginTop:6,
          background: C.gradText,
          WebkitBackgroundClip:'text',backgroundClip:'text',
          WebkitTextFillColor:'transparent',
          letterSpacing:'2px',
        }}>BOA SORTE!</h1>
        <p style={{ fontSize:13,color:C.dim,marginTop:4,letterSpacing:'.5px' }}>3 iguais e o prêmio é seu</p>
      </div>

      {/* Máquina de cassino */}
      <div style={{
        marginTop:18,
        flex:1,
        display:'flex',
        flexDirection:'column',
        alignItems:'center',
        justifyContent:'center',
      }}>
        <div style={{
          position:'relative',
          padding:'18px 14px 14px',
          borderRadius:24,
          background:'linear-gradient(180deg,#040d22 0%,#071a40 100%)',
          border:'2px solid rgba(30,124,216,0.55)',
          boxShadow:`
            0 24px 60px rgba(0,0,0,0.55),
            0 0 28px rgba(30,124,216,0.28),
            inset 0 1px 0 rgba(255,255,255,0.08),
            inset 0 -8px 18px rgba(0,0,0,0.4)
          `,
          width:'100%',
          maxWidth: 380,
        }}>
          {/* Marquise topo */}
          <div style={{
            position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)',
            padding:'4px 18px',
            borderRadius:14,
            background:'linear-gradient(180deg,#5BC5F5 0%,#1E7CD8 100%)',
            color:'#fff',
            fontSize:10, fontWeight:800, letterSpacing:'3px',
            boxShadow:'0 4px 14px rgba(255,201,87,0.45)',
            whiteSpace:'nowrap',
          }}>
            ★ ILNET LUCKY ★
          </div>

          {/* Luzes topo */}
          <div style={{ padding:'4px 4px 10px' }}>
            <MarqueeLights count={11} spinning={spinning} win={allMatch && allStopped && !spinning}/>
          </div>

          {/* Reels */}
          <div style={{
            display:'flex',justifyContent:'center',gap:8,
            padding:10,
            borderRadius:14,
            background:'linear-gradient(180deg,#04060f 0%,#071224 100%)',
            border:'1px solid rgba(30,124,216,0.30)',
            boxShadow:'inset 0 2px 10px rgba(0,0,0,0.7)',
          }}>
            {[0,1,2].map(r => (
              <Reel
                key={r}
                prizes={prizes.length ? prizes : [{ id:0,name:'?',image_url:null }]}
                currentIdx={idxs[r] % (prizes.length||1)}
                spinning={spinning && !stopped[r]}
                stopped={stopped[r]}
              />
            ))}
          </div>

          {/* Linha indicadora */}
          <div style={{
            display:'flex',justifyContent:'center',alignItems:'center',gap:6,
            marginTop:6,fontSize:9,color:C.blueLight,letterSpacing:'2px',opacity:.8,
          }}>
            <i className="ti ti-chevron-right" style={{ fontSize:10 }}/>
            LINHA DA SORTE
            <i className="ti ti-chevron-left" style={{ fontSize:10 }}/>
          </div>

          {/* Luzes base */}
          <div style={{ padding:'8px 4px 0' }}>
            <MarqueeLights count={11} spinning={spinning} win={allMatch && allStopped && !spinning}/>
          </div>

          {/* Alavanca lateral */}
          <div style={{
            position:'absolute', right:-26, top:'42%',
            display:'flex', flexDirection:'column', alignItems:'center',
          }}>
            <div style={{
              width:6, height:60,
              background:'linear-gradient(180deg,#8a8a8a 0%,#3a3a3a 100%)',
              borderRadius:3,
              transformOrigin:'center bottom',
              transform: leverDown ? 'rotate(35deg) translateY(8px)' : 'rotate(0deg)',
              transition:'transform .35s cubic-bezier(.4,1.6,.6,1)',
              boxShadow:'inset -1px 0 0 rgba(255,255,255,0.2)',
            }}/>
            <div style={{
              width:22, height:22, borderRadius:'50%',
              marginTop:-8,
              background:'radial-gradient(circle at 30% 30%, #ff6b6b 0%, #c62828 60%, #5a0d0d 100%)',
              boxShadow:'0 4px 8px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.4)',
              transform: leverDown ? 'translateY(12px)' : 'translateY(0)',
              transition:'transform .35s cubic-bezier(.4,1.6,.6,1)',
            }}/>
          </div>
        </div>

        {msg && <div style={{ color:C.red,fontSize:13,textAlign:'center',padding:'12px 16px 0' }}>{msg}</div>}
      </div>

      {/* Botão girar */}
      <button
        style={{
          ...S.btnPrimary,
          marginTop:14,
          background: spinning
            ? 'linear-gradient(135deg,#777 0%,#444 100%)'
            : C.gradBlue,
          color: '#fff',
          fontWeight:800,
          letterSpacing:'1.5px',
          fontSize:17,
          padding:'18px 24px',
          borderRadius:18,
          boxShadow: spinning
            ? 'none'
            : '0 14px 32px rgba(30,124,216,0.50), inset 0 1px 0 rgba(255,255,255,0.30), inset 0 -3px 0 rgba(0,0,0,0.15)',
          opacity: spinning || !prizes.length || !imgsReady ? 0.75 : 1,
          cursor:  spinning || !imgsReady ? 'not-allowed' : 'pointer',
          textTransform:'uppercase',
        }}
        onClick={spin}
        disabled={spinning || !prizes.length || !imgsReady}
        aria-label="Girar"
      >
        {spinning
          ? <><i className="ti ti-loader-2" style={{fontSize:22,animation:'spin 1s linear infinite'}} aria-hidden="true"/>Girando...</>
          : !imgsReady
          ? <><i className="ti ti-loader-2" style={{fontSize:22,animation:'spin 1s linear infinite'}} aria-hidden="true"/>Preparando...</>
          : <><i className="ti ti-player-play-filled" style={{fontSize:22}} aria-hidden="true"/>Girar a sorte</>
        }
      </button>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes marqueeBlink{from{opacity:.35;transform:scale(.85)}to{opacity:1;transform:scale(1.15)}}
        @keyframes reelScroll{from{transform:translateY(0)}to{transform:translateY(-${SH}px)}}
      `}</style>
    </div>
  );
}
