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
  const { debts = [], clientName, contracts = [] } = session;
  const hasDebts = debts.length > 0;
  const overdueCount = debts.filter(d => new Date(d.due_date) < new Date()).length;
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
              {
                icon: overdueCount > 0 ? 'ti-alert-triangle' : 'ti-file-invoice',
                label: overdueCount > 0 ? `${overdueCount} vencida${overdueCount > 1 ? 's' : ''}` : `${debtLabel} em aberto`,
                tone: overdueCount > 0 ? 'danger' : 'warning',
              },
              { icon:'ti-cash', label:fmt(totalOpen), tone:'info' },
            ]
          : [{ icon:'ti-circle-check', label:'Conta em dia', tone:'success' }]}
      />

      {hasDebts && (
        <div style={{
          display:'flex',flexDirection:'column',gap:10,marginBottom:16,
          flex:'1 1 auto',minHeight:0,overflowY:'auto',paddingRight:2,
        }}>
          {debts.map(d => {
            const overdue = new Date(d.due_date) < new Date();
            return (
              <div key={d.id} style={{
                ...S.card,
                borderColor: overdue ? 'rgba(204,71,71,0.40)' : C.cardBd,
                background:  overdue ? 'rgba(204,71,71,0.04)' : '#fff',
                display:'flex',alignItems:'center',justifyContent:'space-between',
              }}>
                <div>
                  <div style={{ fontSize:13,color:C.fade,marginBottom:2 }}>{d.description}</div>
                  <div style={{ fontSize:22,fontWeight:700,color:overdue?C.red:C.text }}>{fmt(d.value)}</div>
                  <div style={{ fontSize:12,color:C.dim,marginTop:2 }}>Venc. {fmtDate(d.due_date)}</div>
                </div>
                {overdue && (
                  <span style={{ fontSize:10,fontWeight:700,padding:'5px 10px',borderRadius:6,background:'rgba(204,71,71,0.10)',color:C.red,border:'1px solid rgba(204,71,71,0.30)',letterSpacing:'1px' }}>
                    VENCIDA
                  </span>
                )}
              </div>
            );
          })}
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
