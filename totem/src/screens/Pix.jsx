import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../api.js';
import { C, S } from '../theme.js';

const TIMEOUT_SECS = 300;

function fmt(val) {
  return Number(val).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
}

export default function Pix({ session, go, goHome }) {
  const { activeDebt } = session;
  const [pixCode,   setPixCode]   = useState('');
  const [pixError,  setPixError]  = useState('');
  const [secs,      setSecs]      = useState(TIMEOUT_SECS);
  const [paid,      setPaid]      = useState(false);
  const [loading,   setLoading]   = useState(true);
  const pollRef = useRef(null);
  const countRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.generatePix(activeDebt.id);
        if (r.pix_code) setPixCode(r.pix_code);
        else setPixError(r.detail || 'IXC não retornou o código PIX. Procure o atendimento.');
      } catch (e) {
        console.error(e);
        setPixError(e.message || 'Erro ao gerar PIX. Procure o atendimento.');
      } finally {
        setLoading(false);
      }
    })();

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
    <div style={{ ...S.screen, alignItems:'center', justifyContent:'center', gap:24 }}>
      <div style={{ width:96,height:96,borderRadius:'50%',background:'rgba(31,157,113,0.10)',border:`2px solid ${C.green}`,display:'flex',alignItems:'center',justifyContent:'center' }}>
        <i className="ti ti-check" style={{fontSize:54,color:C.green}} aria-hidden="true"/>
      </div>
      <div style={{ textAlign:'center' }}>
        <h2 style={{ fontSize:26,fontWeight:700,color:C.text }}>Pagamento confirmado!</h2>
        <p style={{ color:C.dim,fontSize:15,marginTop:8 }}>Preparando sua chance na roleta...</p>
      </div>
    </div>
  );

  return (
    <div style={S.screen}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
        <button style={S.back} onClick={() => go('debts')}>
          <i className="ti ti-arrow-left" style={{ fontSize:18 }}/> Voltar
        </button>
        <span style={S.stepLabel}>PAGAMENTO</span>
      </div>

      <div style={{ marginTop:18,marginBottom:14 }}>
        <h2 style={{ fontSize:22,fontWeight:700,color:C.text }}>Pagamento via PIX</h2>
      </div>

      <div style={{
        ...S.card,borderColor:'rgba(204,71,71,0.30)',background:'rgba(204,71,71,0.04)',
        display:'flex',justifyContent:'space-between',marginBottom:16,
      }}>
        <div>
          <div style={{ fontSize:11,color:C.red,letterSpacing:1,fontWeight:700 }}>TOTAL EM ABERTO</div>
          <div style={{ fontSize:30,fontWeight:800,color:C.text }}>{fmt(activeDebt?.value)}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:11,color:C.red,letterSpacing:1,fontWeight:700 }}>VENCIMENTO</div>
          <div style={{ fontSize:15,fontFamily:'monospace',color:C.red,fontWeight:700,marginTop:6 }}>
            {activeDebt?.due_date?.split('-').reverse().join('/')}
          </div>
        </div>
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', gap:12, minHeight:0 }}>
        {loading ? (
          <div style={{ width:240,height:240,background:'#fff',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',border:`1px solid ${C.cardBd}` }}>
            <i className="ti ti-loader-2" style={{fontSize:48,color:C.blue,animation:'spin 1s linear infinite'}} aria-hidden="true"/>
          </div>
        ) : pixCode ? (
          <>
            <div style={{ background:'#fff',padding:18,borderRadius:16,border:`1px solid ${C.cardBd}`,boxShadow:'0 10px 28px rgba(13,91,168,0.12)' }}>
              <QRCodeSVG value={pixCode} size={240} level="M"/>
            </div>
            <p style={{ textAlign:'center',fontSize:14,color:C.dim,margin:0 }}>
              Aponte o app do seu banco pro QR Code
            </p>
          </>
        ) : (
          <div style={{ width:280,padding:'22px 18px',background:'rgba(204,71,71,0.06)',borderRadius:16,border:'1px solid rgba(204,71,71,0.30)',textAlign:'center' }}>
            <i className="ti ti-alert-circle" style={{fontSize:36,color:C.red}} aria-hidden="true"/>
            <div style={{ marginTop:10,fontSize:14,fontWeight:600,color:C.red,lineHeight:1.4 }}>
              {pixError || 'Não foi possível gerar o PIX.'}
            </div>
          </div>
        )}
      </div>

      <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'12px 16px',background:'#fff',border:`1px solid ${C.cardBd}`,borderRadius:12,marginTop:14 }}>
        <i className="ti ti-clock" style={{fontSize:16,color:C.blue}} aria-hidden="true"/>
        <span style={{ fontSize:14,color:C.text }}>Aguardando pagamento</span>
        <span style={{ fontFamily:'monospace',fontSize:16,color:C.blue,fontWeight:700 }}>{mm}:{ss}</span>
      </div>

      <button style={{ ...S.btnGhost,marginTop:12,borderColor:'rgba(204,71,71,0.30)',color:C.red }} onClick={goHome}>
        Cancelar
      </button>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
