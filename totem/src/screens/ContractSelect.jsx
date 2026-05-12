import { useState } from 'react';
import { api } from '../api.js';
import { C, S } from '../theme.js';

const STATUS_MAP = {
  A:  { label:'Ativo',     color: C.green },
  B:  { label:'Bloqueado', color: C.red   },
  CM: { label:'Cancelado', color: '#777'  },
  FA: { label:'Em atraso', color: C.gold  },
};

export default function ContractSelect({ session, go }) {
  const { contracts = [], cpf, clientName, clientId, eventId } = session;
  const [loading, setLoading] = useState(false);

  const pick = async (contract) => {
    setLoading(true);
    try {
      await api.registerClient({ cpf, name: clientName, ixcClientId: clientId, ixcContractId: contract.id });
      const dRes = await api.getDebts(contract.id);
      go('debts', { ...session, contractId: contract.id, debts: dRes.debts || [] });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.screen}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
        <button style={S.back} onClick={() => go('client_cpf')}><i className="ti ti-arrow-left"/> Voltar</button>
        <span style={S.stepLabel}>PASSO 2 DE 4</span>
      </div>

      <div style={{ textAlign:'center',marginTop:20,marginBottom:24 }}>
        <div style={{ width:52,height:52,margin:'0 auto 12px',borderRadius:'50%',background:C.cardHov,border:`1px solid ${C.cardBd}`,display:'flex',alignItems:'center',justifyContent:'center' }}>
          <i className="ti ti-user-check" style={{fontSize:26,color:C.cyan}} aria-hidden="true"/>
        </div>
        <h2 style={{ fontSize:19,fontWeight:500 }}>Olá, {clientName?.split(' ')[0]}!</h2>
        <p style={{ fontSize:13,color:C.dim,marginTop:6,lineHeight:1.4 }}>
          Encontramos {contracts.length} contratos no seu CPF.<br/>Qual deles você quer tratar?
        </p>
      </div>

      <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
        {contracts.map(c => {
          const st = STATUS_MAP[c.status] || { label: c.status, color: C.dim };
          const isCommercial = c.address.toLowerCase().includes('av.') || c.address.toLowerCase().includes('avenida');
          return (
            <button
              key={c.id}
              disabled={loading}
              onClick={() => pick(c)}
              style={{
                background:C.card,border:`1px solid ${C.cardBd}`,borderRadius:14,
                padding:'14px 16px',cursor:'pointer',
                display:'flex',alignItems:'center',gap:12,textAlign:'left',
                opacity: loading ? 0.7 : 1,
              }}
            >
              <div style={{ width:40,height:40,borderRadius:10,background:`${st.color}22`,border:`1px solid ${st.color}44`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                <i className={isCommercial ? 'ti ti-building-store' : 'ti ti-home'} style={{fontSize:20,color:st.color}} aria-hidden="true"/>
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:3 }}>
                  <span style={{ fontSize:14,fontWeight:500,color:'#fff' }}>
                    {isCommercial ? 'Comercial' : 'Residencial'}
                  </span>
                  <span style={{ fontSize:9,padding:'2px 7px',borderRadius:4,background:`${st.color}22`,color:st.color,border:`1px solid ${st.color}44`,letterSpacing:'0.5px' }}>
                    {st.label.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize:12,color:C.dim,lineHeight:1.3 }}>{c.address}</div>
                {c.city && <div style={{ fontSize:11,color:C.fade }}>{c.city}</div>}
              </div>
              <i className="ti ti-chevron-right" style={{fontSize:18,color:C.fade}} aria-hidden="true"/>
            </button>
          );
        })}
      </div>

      <div style={{ textAlign:'center',marginTop:'auto',paddingTop:16,fontSize:11,color:C.fade }}>
        Não é você?{' '}
        <span style={{ color:C.cyan,cursor:'pointer',textDecoration:'underline' }} onClick={() => go('entry')}>
          Voltar
        </span>
      </div>
    </div>
  );
}
