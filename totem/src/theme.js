export const C = {
  // Fundo
  bg:        '#f4f8fc',
  bgGrad:    'radial-gradient(ellipse 80% 60% at 50% 10%, #ffffff 0%, #eaf2fb 55%, #d9e7f6 100%)',

  // Marca
  blue:      '#1E7CD8',
  blueDark:  '#0D5BA8',
  blueLight: '#5BC5F5',
  cyan:      '#1A9FE0',

  // Texto
  text:      '#0B1830',   // principal (era branco)
  textSub:   '#46587a',   // secundário
  dim:       '#5d6f8f',
  fade:      '#8b9bb4',

  // Superfícies
  card:      '#ffffff',
  cardBd:    'rgba(30,124,216,0.18)',
  cardBd2:   'rgba(30,124,216,0.40)',
  cardHov:   '#f0f6fc',

  // Status
  green:     '#1F9D71',
  gold:      '#C7861A',
  red:       '#CC4747',

  // Gradientes
  gradBlue:  'linear-gradient(135deg,#5BC5F5 0%,#1E7CD8 100%)',
  gradText:  'linear-gradient(135deg,#1A9FE0 0%,#0D5BA8 100%)',
};

// Estilos reutilizáveis
export const S = {
  screen: {
    position: 'absolute', inset: 0,
    background: C.bgGrad,
    color: C.text,
    display: 'flex', flexDirection: 'column',
    padding: '28px 22px',
  },
  card: {
    background: C.card,
    border: `1px solid ${C.cardBd}`,
    borderRadius: 14,
    padding: '14px 16px',
    boxShadow: '0 4px 14px rgba(13,91,168,0.06)',
  },
  btnPrimary: {
    background: C.gradBlue,
    color: '#fff',
    border: 'none',
    borderRadius: 18,
    padding: '22px 28px',
    fontSize: 19,
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    boxShadow: '0 10px 28px rgba(30,124,216,0.30)',
    letterSpacing: '0.3px',
  },
  btnGhost: {
    background: '#fff',
    color: C.blueDark,
    border: `1.5px solid ${C.cardBd2}`,
    borderRadius: 16,
    padding: '20px 24px',
    fontSize: 17,
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    boxShadow: '0 4px 14px rgba(13,91,168,0.06)',
  },
  back: {
    display: 'flex', alignItems: 'center', gap: 8,
    color: C.dim, fontSize: 15, cursor: 'pointer',
    background: 'none', border: 'none', padding: '8px 4px',
    fontWeight: 500,
  },
  stepLabel: {
    fontSize: 12, color: C.fade, letterSpacing: '2px', fontWeight: 600,
  },
};
