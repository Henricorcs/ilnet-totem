import { C, S } from '../theme.js';

export default function Entry({ go, goHome, event }) {
  return (
    <div style={S.screen}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
        <button style={S.back} onClick={goHome}>
          <i className="ti ti-arrow-left" style={{ fontSize:18 }} aria-hidden="true"/> Voltar
        </button>
        <span style={S.stepLabel}>PASSO 1 DE 4</span>
      </div>

      <div style={{ flex:1,display:'flex',flexDirection:'column',justifyContent:'center',gap:36 }}>
        <div style={{ textAlign:'center' }}>
          {event && <div style={{ fontSize:14,color:C.fade,marginBottom:10,fontWeight:600,letterSpacing:'1px' }}>{event.name}</div>}
          <h1 style={{ fontSize:32,fontWeight:700,color:C.text,lineHeight:1.15 }}>
            Você já é cliente<br/>
            <span style={{ background:C.gradText,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',fontWeight:900 }}>
              ILNET
            </span>?
          </h1>
        </div>

        <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
          {/* Sim — cliente */}
          <button
            style={{
              ...S.btnPrimary, padding:'26px 24px', borderRadius:20,
              justifyContent:'flex-start', gap:18, textAlign:'left',
            }}
            onClick={() => go('client_cpf')}
          >
            <i className="ti ti-user-check" style={{fontSize:32}} aria-hidden="true"/>
            <div>
              <div style={{ fontSize:18,fontWeight:800 }}>Sim, sou cliente</div>
              <div style={{ fontSize:13,opacity:0.85,fontWeight:500,marginTop:2 }}>Identificar pelo CPF</div>
            </div>
          </button>

          {/* Não — visitante */}
          <button
            style={{
              ...S.btnGhost, padding:'26px 24px', borderRadius:20,
              justifyContent:'flex-start', gap:18, textAlign:'left',
            }}
            onClick={() => go('visitor_form')}
          >
            <i className="ti ti-user-plus" style={{fontSize:32,color:C.blue}} aria-hidden="true"/>
            <div>
              <div style={{ fontSize:18,fontWeight:700,color:C.text }}>Ainda não sou</div>
              <div style={{ fontSize:13,color:C.dim,fontWeight:500,marginTop:2 }}>Quero conhecer a ILNET</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
