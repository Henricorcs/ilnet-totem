import { C, S } from '../theme.js';

export default function Entry({ go, goHome, event }) {
  return (
    <div style={S.screen}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
        <button style={S.back} onClick={goHome}>
          <i className="ti ti-arrow-left" aria-hidden="true"/> Voltar
        </button>
        <span style={S.stepLabel}>PASSO 1 DE 4</span>
      </div>

      <div style={{ flex:1,display:'flex',flexDirection:'column',justifyContent:'center',gap:28 }}>
        <div>
          {event && <div style={{ fontSize:12,color:C.fade,marginBottom:6 }}>{event.name}</div>}
          <h1 style={{ fontSize:26,fontWeight:500,color:'#fff',lineHeight:1.2 }}>
            Você já é cliente<br/>
            <span style={{ background:C.gradText,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',fontWeight:700 }}>
              ILNET
            </span>?
          </h1>
        </div>

        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          {/* Sim — cliente */}
          <button
            style={{ ...S.btnPrimary, padding:'20px 24px', borderRadius:16 }}
            onClick={() => go('client_cpf')}
          >
            <i className="ti ti-user-check" style={{fontSize:26}} aria-hidden="true"/>
            <div style={{ textAlign:'left' }}>
              <div style={{ fontSize:15,fontWeight:600 }}>Sim, sou cliente</div>
              <div style={{ fontSize:12,opacity:0.85,fontWeight:400 }}>Identificar pelo CPF</div>
            </div>
          </button>

          {/* Não — visitante */}
          <button
            style={{
              ...S.btnGhost, padding:'20px 24px', borderRadius:16,
              justifyContent:'flex-start', gap:14,
            }}
            onClick={() => go('visitor_form')}
          >
            <i className="ti ti-user-plus" style={{fontSize:26,color:C.cyan}} aria-hidden="true"/>
            <div style={{ textAlign:'left' }}>
              <div style={{ fontSize:15,fontWeight:600,color:'#fff' }}>Ainda não sou</div>
              <div style={{ fontSize:12,color:C.dim }}>Quero conhecer a ILNET</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
