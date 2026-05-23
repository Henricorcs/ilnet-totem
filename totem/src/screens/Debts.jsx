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
        <button style={S.back} onClick={() => go(backTo)}><i className="ti ti-arrow-left"/> Voltar</button>
        <span style={S.stepLabel}>PASSO 3 DE 4</span>
      </div>

      <ClientIdentity
        clientName={clientName}
        description={hasDebts
          ? 'Encontramos pendências neste contrato. Regularize para liberar sua chance na roleta.'
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
                borderColor: overdue ? 'rgba(240,149,149,0.4)' : C.cardBd,
                background:  overdue ? 'rgba(240,149,149,0.05)' : C.card,
                display:'flex',alignItems:'center',justifyContent:'space-between',
              }}>
                <div>
                  <div style={{ fontSize:12,color:C.dim }}>{d.description}</div>
                  <div style={{ fontSize:18,fontWeight:600,color:overdue?C.red:'#fff' }}>{fmt(d.value)}</div>
                  <div style={{ fontSize:11,color:C.fade }}>Venc. {fmtDate(d.due_date)}</div>
                </div>
                {overdue && (
                  <span style={{ fontSize:9,padding:'3px 8px',borderRadius:4,background:'rgba(240,149,149,0.15)',color:C.red,border:'1px solid rgba(240,149,149,0.3)' }}>
                    VENCIDA
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop:hasDebts ? 0 : 'auto',display:'flex',flexDirection:'column',gap:10 }}>
        {hasDebts ? (
          <>
            <button
              style={S.btnPrimary}
              onClick={() => go('pix', { activeDebt: debts[0] })}
            >
              <i className="ti ti-qrcode" style={{fontSize:22}} aria-hidden="true"/>
              Pagar agora via PIX
            </button>
            <div style={{ textAlign:'center',fontSize:11,color:C.fade }}>
              Pague pra participar da roleta
            </div>
          </>
        ) : (
          <button style={S.btnPrimary} onClick={() => go('slot')}>
            <i className="ti ti-confetti" style={{fontSize:22}} aria-hidden="true"/>
            Jogar a roleta!
          </button>
        )}
      </div>
    </div>
  );
}
