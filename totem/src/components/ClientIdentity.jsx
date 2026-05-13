import { C } from '../theme.js';

const TONES = {
  info: {
    icon: 'ti-user-check',
    color: C.cyan,
    bg: 'rgba(127,212,255,0.12)',
    border: 'rgba(127,212,255,0.28)',
  },
  success: {
    icon: 'ti-circle-check',
    color: C.green,
    bg: 'rgba(93,202,165,0.12)',
    border: 'rgba(93,202,165,0.28)',
  },
  warning: {
    icon: 'ti-alert-circle',
    color: C.gold,
    bg: 'rgba(255,201,87,0.12)',
    border: 'rgba(255,201,87,0.28)',
  },
  danger: {
    icon: 'ti-alert-triangle',
    color: C.red,
    bg: 'rgba(240,149,149,0.12)',
    border: 'rgba(240,149,149,0.28)',
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
      display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8,
      maxWidth:'100%',padding:'8px 12px',borderRadius:999,
      background:t.bg,border:`1px solid ${t.border}`,color:'#fff',
      fontSize:13,fontWeight:600,lineHeight:1.2,
      boxShadow:'0 10px 24px rgba(3,18,45,0.22)',
    }}>
      <i className={`ti ${t.icon}`} style={{fontSize:17,color:t.color,flexShrink:0}} aria-hidden="true"/>
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
      margin:'18px 0 16px',padding:'18px 16px 16px',
      textAlign:'center',
      background:'linear-gradient(180deg, rgba(94,197,245,0.14) 0%, rgba(94,197,245,0.045) 100%)',
      border:`1px solid ${C.cardBd2}`,borderRadius:12,
      boxShadow:'0 18px 44px rgba(2, 18, 46, 0.34)',
    }}>
      <div style={{ position:'absolute',top:0,left:0,right:0,height:3,background:C.gradBlue }} />

      <div style={{
        display:'inline-flex',alignItems:'center',gap:6,
        padding:'5px 9px',borderRadius:999,
        background:'rgba(127,212,255,0.10)',
        border:'1px solid rgba(127,212,255,0.22)',
        color:C.cyan,fontSize:11,fontWeight:700,
      }}>
        <i className="ti ti-shield-check" style={{fontSize:14}} aria-hidden="true"/>
        {badge}
      </div>

      <div style={{
        width:58,height:58,margin:'14px auto 10px',
        borderRadius:'50%',background:'rgba(91,197,245,0.12)',
        border:`1px solid ${C.cardBd2}`,
        display:'flex',alignItems:'center',justifyContent:'center',
        boxShadow:'inset 0 0 20px rgba(91,197,245,0.12)',
      }}>
        <i className="ti ti-user-check" style={{fontSize:30,color:C.cyan}} aria-hidden="true"/>
      </div>

      <h2 style={{
        fontSize:24,fontWeight:700,lineHeight:1.1,color:'#fff',
        overflowWrap:'anywhere',
      }}>
        Olá, {name}!
      </h2>

      {clientName && clientName.trim() !== name && (
        <div style={{
          marginTop:5,fontSize:12,color:C.fade,lineHeight:1.25,
          overflowWrap:'anywhere',
        }}>
          {clientName}
        </div>
      )}

      {description && (
        <p style={{
          margin:'10px auto 0',maxWidth:310,
          fontSize:13,color:C.dim,lineHeight:1.45,
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
                  padding:'7px 10px',borderRadius:999,
                  background:t.bg,border:`1px solid ${t.border}`,
                  color:t.color,fontSize:12,fontWeight:700,lineHeight:1.1,
                }}
              >
                <i className={`ti ${item.icon || t.icon}`} style={{fontSize:15}} aria-hidden="true"/>
                {item.label}
              </span>
            );
          })}
        </div>
      )}
    </section>
  );
}
