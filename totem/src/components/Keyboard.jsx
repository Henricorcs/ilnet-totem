import { useState, useCallback } from 'react';
import { C } from '../theme.js';

// Layouts
const LAYOUTS = {
  qwerty: [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L','Ç'],
    ['Z','X','C','V','B','N','M','-',"'"],
  ],
  numeric: [
    ['1','2','3'],
    ['4','5','6'],
    ['7','8','9'],
    ['',  '0', '←'],
  ],
};

/**
 * Teclado in-app pro totem.
 *
 * Props:
 *  - layout: 'qwerty' (texto) | 'numeric' (CPF/telefone)
 *  - value: string atual
 *  - onChange: (newValue) => void
 *  - maxLength: int (default Infinity)
 *  - allowDigits: boolean (qwerty mostra linha de dígitos no topo)
 *  - keepCase: 'upper' | 'lower' | 'title' | null — força transform na saída
 *  - onSubmit: () => void  (opcional — habilita botão ✓)
 *  - submitDisabled: boolean
 */
export default function Keyboard({
  layout = 'qwerty',
  value = '',
  onChange,
  maxLength = Infinity,
  allowDigits = true,
  keepCase = null,
  onSubmit,
  submitDisabled = false,
}) {
  const [shift, setShift] = useState(false);
  const [showDigits, setShowDigits] = useState(false);

  const append = useCallback((ch) => {
    if (value.length >= maxLength) return;
    let out = ch;
    if (keepCase === 'upper') out = out.toUpperCase();
    else if (keepCase === 'lower') out = out.toLowerCase();
    else if (!shift && layout === 'qwerty') out = out.toLowerCase();
    onChange(value + out);
    if (shift) setShift(false);
  }, [value, maxLength, shift, layout, keepCase, onChange]);

  const back = useCallback(() => onChange(value.slice(0, -1)), [value, onChange]);
  const space = useCallback(() => {
    if (value.length >= maxLength) return;
    onChange(value + ' ');
  }, [value, maxLength, onChange]);

  if (layout === 'numeric') {
    return (
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, width:'100%' }}>
        {LAYOUTS.numeric.flat().map((k, i) => {
          if (!k) return <div key={i}/>;
          const isBack = k === '←';
          return (
            <button
              key={i}
              onClick={() => isBack ? back() : append(k)}
              style={keyStyle({ kind: isBack ? 'back' : 'num' })}
            >
              {isBack ? <i className="ti ti-backspace" style={{ fontSize: 26 }}/> : k}
            </button>
          );
        })}
        {onSubmit && (
          <button
            onClick={onSubmit}
            disabled={submitDisabled}
            style={{
              ...keyStyle({ kind:'submit', disabled: submitDisabled }),
              gridColumn: '1 / -1', marginTop: 6,
            }}
          >
            <i className="ti ti-check" style={{ fontSize: 26 }}/> Confirmar
          </button>
        )}
      </div>
    );
  }

  // QWERTY
  const rows = LAYOUTS.qwerty;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, width:'100%' }}>
      {allowDigits && (
        <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
          {'0123456789'.split('').map(d => (
            <button key={d} onClick={() => append(d)} style={keyStyle({ kind:'num', small:true })}>{d}</button>
          ))}
        </div>
      )}
      {rows.map((row, idx) => (
        <div key={idx} style={{
          display:'flex', gap:6, justifyContent:'center',
          paddingLeft: idx === 1 ? 16 : idx === 2 ? 32 : 0,
          paddingRight: idx === 1 ? 16 : idx === 2 ? 32 : 0,
        }}>
          {idx === 2 && (
            <button onClick={() => setShift(s => !s)} style={keyStyle({ kind: shift ? 'modActive' : 'mod' })}>
              <i className={`ti ${shift ? 'ti-arrow-big-up-filled' : 'ti-arrow-big-up'}`} style={{ fontSize: 22 }}/>
            </button>
          )}
          {row.map(k => (
            <button key={k} onClick={() => append(k)} style={keyStyle({ kind:'letter' })}>
              {shift ? k.toUpperCase() : k.toLowerCase()}
            </button>
          ))}
          {idx === 2 && (
            <button onClick={back} style={keyStyle({ kind:'back' })}>
              <i className="ti ti-backspace" style={{ fontSize: 22 }}/>
            </button>
          )}
        </div>
      ))}
      <div style={{ display:'flex', gap:6, justifyContent:'center', marginTop:2 }}>
        <button onClick={space} style={{ ...keyStyle({ kind:'space' }), flex: 4 }}>espaço</button>
        {onSubmit && (
          <button
            onClick={onSubmit}
            disabled={submitDisabled}
            style={{ ...keyStyle({ kind:'submit', disabled: submitDisabled }), flex: 2 }}
          >
            <i className="ti ti-check" style={{ fontSize: 22 }}/> OK
          </button>
        )}
      </div>
    </div>
  );
}

function keyStyle({ kind, disabled, small }) {
  const base = {
    background: '#ffffff',
    color: C.text,
    border: `1px solid ${C.cardBd}`,
    borderRadius: 10,
    fontSize: small ? 18 : 22,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    touchAction: 'manipulation',
    boxShadow: '0 2px 0 rgba(13,91,168,0.10), 0 4px 10px rgba(13,91,168,0.06)',
    transition: 'transform .05s, background .15s',
    userSelect: 'none',
    minHeight: small ? 48 : 56,
    minWidth: small ? 40 : 44,
    flex: 1,
  };

  if (kind === 'submit') return {
    ...base,
    background: disabled ? '#cad6e6' : 'linear-gradient(135deg,#5BC5F5 0%,#1E7CD8 100%)',
    color: '#fff',
    border: 'none',
    boxShadow: disabled ? 'none' : '0 4px 0 rgba(13,91,168,0.4), 0 8px 18px rgba(30,124,216,0.30)',
    gap: 8,
    opacity: disabled ? 0.7 : 1,
  };
  if (kind === 'back') return {
    ...base,
    background: '#fff5f5',
    color: C.red,
    border: `1px solid rgba(204,71,71,0.25)`,
    flex: kind === 'back' ? 1.4 : 1,
  };
  if (kind === 'mod') return { ...base, background: '#eef4fb', color: C.blueDark, flex: 1.2 };
  if (kind === 'modActive') return { ...base, background: C.gradBlue, color: '#fff', border: 'none', flex: 1.2 };
  if (kind === 'space') return { ...base, fontSize: 16, color: C.dim };
  return base;
}
