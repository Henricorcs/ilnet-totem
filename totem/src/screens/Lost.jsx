import { useEffect } from 'react';
import { C, S } from '../theme.js';

export default function Lost({ session, goHome }) {
  useEffect(() => {
    const t = setTimeout(goHome, 30000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ ...S.screen, alignItems:'center', justifyContent:'space-between' }}>
      <div style={{ width:'100%',display:'flex',justifyContent:'flex-end' }}>
        <button
          onClick={goHome}
          style={{ width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,0.08)',border:'none',color:C.fade,fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}
          aria-label="Fechar"
        >
          <i className="ti ti-x" aria-hidden="true"/>
        </button>
      </div>

      <div style={{ textAlign:'center', flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14 }}>
        {/* Emoji grande */}
        <div style={{ fontSize:72, lineHeight:1 }}>😅</div>

        <div>
          <div style={{ fontSize:11, color:C.fade, letterSpacing:'2px', marginBottom:8 }}>QUASE LÁ</div>
          <h1 style={{ fontSize:26, fontWeight:600, color:'#fff' }}>Que pena desta vez!</h1>
          <p style={{ fontSize:14, color:C.dim, marginTop:8, lineHeight:1.5, maxWidth:260 }}>
            Você chegou perto — talvez no próximo evento a sorte venha junto.
          </p>
        </div>

        {/* Card incentivo */}
        <div style={{
          ...S.card, width:'100%', maxWidth:280, textAlign:'center',
          padding:'16px', marginTop:8,
        }}>
          <div style={{ fontSize:12, color:C.dim, marginBottom:6 }}>
            Fique por dentro das próximas promoções
          </div>
          <div style={{
            fontSize:18, fontWeight:600,
            background: C.gradText,
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
          }}>@ilnet_smt</div>
          <div style={{ fontSize:11, color:C.fade, marginTop:4 }}>no Instagram</div>
        </div>
      </div>

      <button style={{ ...S.btnPrimary, marginBottom:8 }} onClick={goHome}>
        <i className="ti ti-arrow-left" style={{fontSize:20}} aria-hidden="true"/>
        Voltar ao início
      </button>
    </div>
  );
}
