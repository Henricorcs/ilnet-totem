import { useEffect } from 'react';
import { C, S } from '../theme.js';

export default function Lost({ goHome }) {
  useEffect(() => {
    const t = setTimeout(goHome, 30000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ ...S.screen, alignItems:'center', justifyContent:'space-between' }}>
      <div style={{ width:'100%',display:'flex',justifyContent:'flex-end' }}>
        <button
          onClick={goHome}
          style={{ width:40,height:40,borderRadius:'50%',background:'#fff',border:`1px solid ${C.cardBd}`,color:C.dim,fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(13,91,168,0.08)' }}
        >
          <i className="ti ti-x" aria-hidden="true"/>
        </button>
      </div>

      <div style={{ textAlign:'center', flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:18 }}>
        <div style={{ fontSize:84, lineHeight:1 }}>😅</div>

        <div>
          <h1 style={{ fontSize:30, fontWeight:800, color:C.text }}>Não foi dessa vez</h1>
        </div>

        <div style={{
          ...S.card, width:'100%', maxWidth:300, textAlign:'center',
          padding:'18px', marginTop:10,
        }}>
          <div style={{ fontSize:13, color:C.dim, marginBottom:8 }}>
            Fique por dentro das próximas promoções
          </div>
          <div style={{
            fontSize:20, fontWeight:800,
            background: C.gradText,
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
          }}>@ilnet_smt</div>
          <div style={{ fontSize:12, color:C.fade, marginTop:4 }}>no Instagram</div>
        </div>
      </div>

      <button style={{ ...S.btnPrimary, marginBottom:8 }} onClick={goHome}>
        <i className="ti ti-arrow-left" style={{fontSize:22}} aria-hidden="true"/>
        Voltar ao início
      </button>
    </div>
  );
}
