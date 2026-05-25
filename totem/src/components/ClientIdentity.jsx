import { C } from '../theme.js';

const TONES = {
  info: {
    icon: 'ti-user-check',
    color: C.blue,
    bg: 'rgba(30,124,216,0.08)',
    border: 'rgba(30,124,216,0.28)',
  },
  success: {
    icon: 'ti-circle-check',
    color: C.green,
    bg: 'rgba(31,157,113,0.10)',
    border: 'rgba(31,157,113,0.30)',
  },
  warning: {
    icon: 'ti-alert-circle',
    color: C.gold,
    bg: 'rgba(199,134,26,0.10)',
    border: 'rgba(199,134,26,0.30)',
  },
  danger: {
    icon: 'ti-alert-triangle',
    color: C.red,
    bg: 'rgba(204,71,71,0.08)',
    border: 'rgba(204,71,71,0.30)',
  },
};

function firstName(clientName) {
  return clientName?.trim().split(/\s+/)[0] || 'Cliente';
}

function toneFor(tone) {
  return TONES[tone] || TONES.info;
}

export function ClientPill({ clientName, label = 'Cliente identificado', tone = 'info' }) {
  const t = toneFor(tone);

  return (
    <div style={{
      display:'inline-flex',alignItems:'center',justifyContent:'center',gap:10,
      maxWidth:'100%',padding:'10px 16px',borderRadius:999,
      background:t.bg,border:`1px solid ${t.border}`,
      color:C.text,
      fontSize:14,fontWeight:600,lineHeight:1.2,
      boxShadow:'0 4px 14px rgba(13,91,168,0.08)',
    }}>
      <i className={`ti ${t.icon}`} style={{fontSize:19,color:t.color,flexShrink:0}} aria-hidden="true"/>
      <span style={{ minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
        {label}: {firstName(clientName)}
      </span>
    </div>
  );
}

export function ClientIdentity({
  clientName,
  badge = 'Cliente encontrado no IXC',
  description,
  metaItems = [],
}) {
  const name = firstName(clientName);

  return (
    <section style={{
      position:'relative',overflow:'hidden',
      margin:'18px 0 16px',padding:'20px 18px 18px',
      textAlign:'center',
      background:'#fff',
      border:`1px solid ${C.cardBd}`,borderRadius:16,
      boxShadow:'0 10px 28px rgba(13,91,168,0.10)',
    }}>
      <div style={{ position:'absolute',top:0,left:0,right:0,height:4,background:C.gradBlue }} />

      <div style={{
        display:'inline-flex',alignItems:'center',gap:6,
        padding:'6px 12px',borderRadius:999,
        background:'rgba(30,124,216,0.08)',
        border:'1px solid rgba(30,124,216,0.20)',
        color:C.blueDark,fontSize:12,fontWeight:700,
      }}>
        <i className="ti ti-shield-check" style={{fontSize:15}} aria-hidden="true"/>
        {badge}
      </div>

      <div style={{
        width:64,height:64,margin:'14px auto 10px',
        borderRadius:'50%',
        background:'rgba(30,124,216,0.10)',
        border:`1px solid ${C.cardBd}`,
        display:'flex',alignItems:'center',justifyContent:'center',
      }}>
        <i className="ti ti-user-check" style={{fontSize:34,color:C.blue}} aria-hidden="true"/>
      </div>

      <h2 style={{
        fontSize:26,fontWeight:800,lineHeight:1.15,color:C.text,
        overflowWrap:'anywhere',
      }}>
        Olá, {name}!
      </h2>

      {clientName && clientName.trim() !== name && (
        <div style={{
          marginTop:6,fontSize:13,color:C.fade,lineHeight:1.3,
          overflowWrap:'anywhere',
        }}>
          {clientName}
        </div>
      )}

      {description && (
        <p style={{
          margin:'12px auto 0',maxWidth:340,
          fontSize:14,color:C.dim,lineHeight:1.5,
        }}>
          {description}
        </p>
      )}

      {metaItems.length > 0 && (
        <div style={{
          display:'flex',justifyContent:'center',gap:8,flexWrap:'wrap',
          marginTop:14,
        }}>
          {metaItems.map((item) => {
            const t = toneFor(item.tone);
            return (
              <span
                key={`${item.label}-${item.icon || t.icon}`}
                style={{
                  display:'inline-flex',alignItems:'center',gap:6,
                  padding:'8px 12px',borderRadius:999,
                  background:t.bg,border:`1px solid ${t.border}`,
                  color:t.color,fontSize:13,fontWeight:700,lineHeight:1.1,
                }}
              >
                <i className={`ti ${item.icon || t.icon}`} style={{fontSize:16}} aria-hidden="true"/>
                {item.label}
              </span>
            );
          })}
        </div>
      )}
    </section>
  );
}
