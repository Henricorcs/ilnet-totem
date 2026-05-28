import { C, S } from '../theme.js';
import { ClientIdentity } from '../components/ClientIdentity.jsx';

function fmt(val) {
  return Number(val).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
}
function fmtDate(d) {
  if (!d) return '';
  const [y,m,day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export default function Debts({ session, go }) {
  const { debts: allDebts = [], clientName, contracts = [] } = session;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const debts = allDebts.filter(d => new Date(d.due_date) < today);
  const hasDebts = debts.length > 0;
  const totalOpen = debts.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const debtLabel = `${debts.length} fatura${debts.length > 1 ? 's' : ''}`;
  const backTo = contracts.length > 1 ? 'contract_select' : 'client_cpf';

  return (
    <div style={S.screen}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
        <button style={S.back} onClick={() => go(backTo)}>
          <i className="ti ti-arrow-left" style={{ fontSize:18 }}/> Voltar
        </button>
        <span style={S.stepLabel}>PASSO 3 DE 4</span>
      </div>

      <ClientIdentity
        clientName={clientName}
        description={hasDebts
          ? 'Encontramos pendências neste contrato. Você pode regularizar agora ou jogar mesmo assim!'
          : 'Sua conta está em dia. Sua chance na roleta está liberada.'}
        metaItems={hasDebts
          ? [
              { icon:'ti-alert-triangle', label:`${debtLabel} vencida${debts.length > 1 ? 's' : ''}`, tone:'danger' },
              { icon:'ti-cash', label:fmt(totalOpen), tone:'info' },
            ]
          : [{ icon:'ti-circle-check', label:'Conta em dia', tone:'success' }]}
      />

      {hasDebts && (
        <div style={{
          display:'flex',flexDirection:'column',gap:10,marginBottom:16,
          flex:'1 1 auto',minHeight:0,overflowY:'auto',paddingRight:2,
        }}>
          {debts.map(d => (
            <div key={d.id} style={{
              ...S.card,
              borderColor: 'rgba(204,71,71,0.40)',
              background:  'rgba(204,71,71,0.04)',
              display:'flex',alignItems:'center',justifyContent:'space-between',
            }}>
              <div>
                <div style={{ fontSize:13,color:C.fade,marginBottom:2 }}>{d.description}</div>
                <div style={{ fontSize:22,fontWeight:700,color:C.red }}>{fmt(d.value)}</div>
                <div style={{ fontSize:12,color:C.dim,marginTop:2 }}>Venc. {fmtDate(d.due_date)}</div>
              </div>
              <span style={{ fontSize:10,fontWeight:700,padding:'5px 10px',borderRadius:6,background:'rgba(204,71,71,0.10)',color:C.red,border:'1px solid rgba(204,71,71,0.30)',letterSpacing:'1px' }}>
                VENCIDA
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop:hasDebts ? 0 : 'auto',display:'flex',flexDirection:'column',gap:12 }}>
        {hasDebts ? (
          <>
            <button
              style={S.btnPrimary}
              onClick={() => go('pix', { activeDebt: debts[0] })}
            >
              <i className="ti ti-qrcode" style={{fontSize:24}} aria-hidden="true"/>
              Pagar agora via PIX
            </button>
            <button
              style={S.btnGhost}
              onClick={() => go('slot')}
            >
              <i className="ti ti-confetti" style={{fontSize:22}} aria-hidden="true"/>
              Jogar mesmo assim
            </button>
          </>
        ) : (
          <button style={S.btnPrimary} onClick={() => go('slot')}>
            <i className="ti ti-confetti" style={{fontSize:24}} aria-hidden="true"/>
            Jogar a roleta!
          </button>
        )}
      </div>
    </div>
  );
}
