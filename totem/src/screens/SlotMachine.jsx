import { useState, useEffect, useRef } from 'react';
import { api } from '../api.js';
import { C, S } from '../theme.js';

const API_URL = () => window.__API_URL__ || 'http://localhost:3001';
const SH = 130; // altura por símbolo em px

// Um reel: lista de símbolos que flipa rapidamente
function Reel({ prizes, currentIdx, spinning, stopped }) {
  const prev = (currentIdx - 1 + prizes.length) % prizes.length;
  const next = (currentIdx + 1) % prizes.length;

  const Symbol = ({ p, scale = 1, opacity = 1 }) => (
    <div style={{ height:SH,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
      {p?.image_url ? (
        <img src={API_URL() + p.image_url} alt={p.name}
          style={{ width:SH*0.65*scale,height:SH*0.65*scale,objectFit:'contain',opacity,transition:'opacity .15s' }}
        />
      ) : (
        <i className="ti ti-gift" style={{ fontSize:SH*0.5*scale,color:C.blue,opacity }} aria-hidden="true"/>
      )}
    </div>
  );

  return (
    <div style={{
      width:SH,height:SH*3,overflow:'hidden',position:'relative',
      background:'linear-gradient(180deg,#0c1730 0%,#1a2a4f 50%,#0c1730 100%)',
      border:`1.5px solid ${stopped?C.blue:C.cardBd}`,
      borderRadius:12,
      transition:'border-color .3s',
      boxShadow: stopped ? `0 0 14px rgba(91,197,245,0.3)` : 'none',
    }}>
      {/* Gradientes de fade topo/fundo */}
      <div style={{ position:'absolute',top:0,left:0,right:0,height:SH,background:'linear-gradient(to bottom,rgba(12,23,48,0.9) 0%,transparent 100%)',zIndex:2,pointerEvents:'none' }}/>
      <div style={{ position:'absolute',bottom:0,left:0,right:0,height:SH,background:'linear-gradient(to top,rgba(12,23,48,0.9) 0%,transparent 100%)',zIndex:2,pointerEvents:'none' }}/>
      {/* Linha central destaque */}
      <div style={{ position:'absolute',top:SH,left:0,right:0,height:SH,border:`1px solid ${C.cardBd}`,zIndex:1,pointerEvents:'none' }}/>

      {/* Símbolos: anterior + atual + próximo */}
      <Symbol p={prizes[prev]} scale={0.8} opacity={0.45}/>
      <Symbol p={prizes[currentIdx]} scale={1} opacity={1}/>
      <Symbol p={prizes[next]} scale={0.8} opacity={0.45}/>
    </div>
  );
}

export default function SlotMachine({ session, go, prizes }) {
  const { cpf, eventId, clientName } = session;
  const name = clientName?.split(' ')[0] || '';

  const [idxs,    setIdxs]    = useState([0,0,0]);
  const [spinning,setSpinning]= useState(false);
  const [stopped, setStopped] = useState([false,false,false]);
  const [msg,     setMsg]     = useState('');
  const intervals = useRef([null,null,null]);

  // Garante prêmios disponíveis
  const safeLen = prizes.length || 1;

  const spin = async () => {
    if (spinning || !prizes.length) return;
    setSpinning(true);
    setStopped([false,false,false]);
    setMsg('');

    // Inicia giro dos 3 reels
    for (let r = 0; r < 3; r++) {
      intervals.current[r] = setInterval(() => {
        setIdxs(prev => {
          const n = [...prev];
          n[r] = (n[r] + 1) % safeLen;
          return n;
        });
      }, 90);
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

    // Calcula índices finais
    let targets;
    if (result.won) {
      const wi = prizes.findIndex(p => p.id === result.prize.id);
      const ti = wi >= 0 ? wi : 0;
      targets = [ti, ti, ti];
    } else {
      const i1 = Math.floor(Math.random() * safeLen);
      const i2 = (i1 + 1 + Math.floor(Math.random() * (safeLen - 1))) % safeLen;
      targets = [i1, i1, i2]; // 2 iguais + 1 diferente = "quase"
    }

    // Para um reel por vez (400ms de intervalo)
    for (let r = 0; r < 3; r++) {
      await new Promise(res => setTimeout(res, 500 * (r + 1)));
      clearInterval(intervals.current[r]);
      setIdxs(prev => { const n=[...prev]; n[r]=targets[r]; return n; });
      setStopped(prev => { const n=[...prev]; n[r]=true; return n; });
    }

    setSpinning(false);

    // Navega pro resultado após pausa dramática
    setTimeout(() => {
      if (result.won) go('won', { prize: result.prize, winCode: result.win_code });
      else            go('lost');
    }, 1200);
  };

  return (
    <div style={S.screen}>
      {/* Header */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
        <div style={{ display:'flex',alignItems:'center',gap:8,fontSize:12,color:C.dim }}>
          {name && <><i className="ti ti-user" style={{fontSize:13}} aria-hidden="true"/>{name}</>}
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:6,fontSize:12,color:C.gold }}>
          <i className="ti ti-ticket" style={{fontSize:13}} aria-hidden="true"/>1 chance
        </div>
      </div>

      <div style={{ textAlign:'center',marginTop:16 }}>
        <div style={S.stepLabel}>PASSO 4 DE 4</div>
        <h1 style={{ fontSize:24,fontWeight:500,marginTop:6 }}>Boa sorte!</h1>
        <p style={{ fontSize:12,color:C.dim,marginTop:4 }}>3 iguais = você ganha</p>
      </div>

      {/* Reels */}
      <div style={{ display:'flex',justifyContent:'center',gap:10,marginTop:24,flex:1,alignItems:'center' }}>
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

      {/* Luzes decorativas */}
      <div style={{ display:'flex',justifyContent:'center',gap:8,marginTop:14,marginBottom:8 }}>
        {[0,1,2,3,4].map(i => (
          <span key={i} style={{
            width:8,height:8,borderRadius:'50%',
            background: spinning ? C.gold : (stopped.every(Boolean) ? C.blue : C.cardBd),
            animation: spinning ? `blinkLight .4s ease-in-out ${i*0.12}s infinite alternate` : 'none',
            transition: 'background .3s',
          }}/>
        ))}
      </div>

      {msg && <div style={{ color:C.red,fontSize:13,textAlign:'center',padding:'0 16px' }}>{msg}</div>}

      {/* Botão girar */}
      <button
        style={{
          ...S.btnPrimary,
          marginTop:16,
          opacity: spinning || !prizes.length ? 0.6 : 1,
          cursor:  spinning ? 'not-allowed' : 'pointer',
        }}
        onClick={spin}
        disabled={spinning || !prizes.length}
        aria-label="Girar"
      >
        {spinning
          ? <><i className="ti ti-loader-2" style={{fontSize:22,animation:'spin 1s linear infinite'}} aria-hidden="true"/>Girando...</>
          : <><i className="ti ti-player-play" style={{fontSize:22}} aria-hidden="true"/>Girar</>
        }
      </button>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes blinkLight{from{opacity:.3;transform:scale(1)}to{opacity:1;transform:scale(1.3)}}
      `}</style>
    </div>
  );
}
