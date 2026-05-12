import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../api.js';
import { C, S } from '../theme.js';

const TIMEOUT_SECS = 300; // 5 minutos

function fmt(val) {
  return Number(val).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
}

export default function Pix({ session, go, goHome }) {
  const { activeDebt } = session;
  const [pixCode,   setPixCode]   = useState('');
  const [secs,      setSecs]      = useState(TIMEOUT_SECS);
  const [paid,      setPaid]      = useState(false);
  const [loading,   setLoading]   = useState(true);
  const pollRef = useRef(null);
  const countRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.generatePix(activeDebt.id);
        setPixCode(r.pix_code || '');
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();

    // Polling de pagamento a cada 5s
    pollRef.current = setInterval(async () => {
      try {
        const r = await api.checkDebt(activeDebt.id);
        if (r.paid) {
          clearInterval(pollRef.current);
          clearInterval(countRef.current);
          setPaid(true);
          setTimeout(() => go('slot'), 2000);
        }
      } catch {}
    }, 5000);

    // Contador regressivo
    countRef.current = setInterval(() => {
      setSecs(s => {
        if (s <= 1) {
          clearInterval(pollRef.current);
          clearInterval(countRef.current);
          goHome();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      clearInterval(pollRef.current);
      clearInterval(countRef.current);
    };
  }, []);

  const mm = String(Math.floor(secs / 60)).padStart(2,'0');
  const ss = String(secs % 60).padStart(2,'0');

  if (paid) return (
    <div style={{ ...S.screen, alignItems:'center', justifyContent:'center', gap:20 }}>
      <div style={{ width:80,height:80,borderRadius:'50%',background:'rgba(93,202,165,0.15)',border:`1.5px solid ${C.green}`,display:'flex',alignItems:'center',justifyContent:'center' }}>
        <i className="ti ti-check" style={{fontSize:42,color:C.green}} aria-hidden="true"/>
      </div>
      <div style={{ textAlign:'center' }}>
        <h2 style={{ fontSize:22,fontWeight:500 }}>Pagamento confirmado!</h2>
        <p style={{ color:C.dim,fontSize:13,marginTop:6 }}>Preparando sua chance na roleta...</p>
      </div>
    </div>
  );

  return (
    <div style={S.screen}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
        <button style={S.back} onClick={() => go('debts')}><i className="ti ti-arrow-left"/> Voltar</button>
        <span style={S.stepLabel}>PAGAMENTO</span>
      </div>

      <div style={{ marginTop:16,marginBottom:12 }}>
        <h2 style={{ fontSize:18,fontWeight:500 }}>Pagamento via PIX</h2>
        <p style={{ fontSize:12,color:C.dim,marginTop:4 }}>Quite pra liberar sua chance</p>
      </div>

      {/* Valor */}
      <div style={{ ...S.card,borderColor:'rgba(240,149,149,0.3)',background:'rgba(240,149,149,0.05)',display:'flex',justifyContent:'space-between',marginBottom:16 }}>
        <div>
          <div style={{ fontSize:10,color:'rgba(240,149,149,0.7)',letterSpacing:1 }}>TOTAL EM ABERTO</div>
          <div style={{ fontSize:26,fontWeight:600,color:'#fff' }}>{fmt(activeDebt?.value)}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:10,color:'rgba(240,149,149,0.7)',letterSpacing:1 }}>VENCIMENTO</div>
          <div style={{ fontSize:13,fontFamily:'monospace',color:C.red }}>
            {activeDebt?.due_date?.split('-').reverse().join('/')}
          </div>
        </div>
      </div>

      {/* QR Code */}
      <div style={{ display:'flex',justifyContent:'center',marginBottom:14 }}>
        {loading ? (
          <div style={{ width:180,height:180,background:'#fff',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <i className="ti ti-loader-2" style={{fontSize:36,color:'#1E7CD8',animation:'spin 1s linear infinite'}} aria-hidden="true"/>
          </div>
        ) : pixCode ? (
          <div style={{ background:'#fff',padding:12,borderRadius:12 }}>
            <QRCodeSVG value={pixCode} size={160} level="M"/>
          </div>
        ) : (
          <div style={{ width:180,height:180,background:'#fff',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',color:'#666',fontSize:12,textAlign:'center',padding:16 }}>
            Aponte seu banco<br/>pra pagar
          </div>
        )}
      </div>

      <p style={{ textAlign:'center',fontSize:12,color:C.dim,marginBottom:12 }}>
        Aponte o app do seu banco pro QR Code acima
      </p>

      {/* Timer */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'10px 14px',background:C.card,borderRadius:10,marginBottom:'auto' }}>
        <i className="ti ti-clock" style={{fontSize:14,color:C.blue}} aria-hidden="true"/>
        <span style={{ fontSize:13,color:'#fff' }}>Aguardando pagamento</span>
        <span style={{ fontFamily:'monospace',fontSize:14,color:C.blue,fontWeight:600 }}>{mm}:{ss}</span>
      </div>

      <button style={{ ...S.btnGhost,marginTop:16,borderColor:'rgba(240,149,149,0.3)',color:C.red }} onClick={goHome}>
        Cancelar
      </button>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
