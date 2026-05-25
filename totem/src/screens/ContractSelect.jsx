import { useState } from 'react';
import { api } from '../api.js';
import { C, S } from '../theme.js';
import { ClientIdentity } from '../components/ClientIdentity.jsx';

const STATUS_MAP = {
  A:  { label:'Ativo',     color: C.green },
  B:  { label:'Bloqueado', color: C.red   },
  FA: { label:'Em atraso', color: C.gold  },
};

export default function ContractSelect({ session, go }) {
  const { contracts = [], cpf, clientName, clientId } = session;
  const [loading, setLoading] = useState(false);
  const contractLabel = `${contracts.length} contrato${contracts.length === 1 ? '' : 's'}`;

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
        <button style={S.back} onClick={() => go('client_cpf')}>
          <i className="ti ti-arrow-left" style={{ fontSize:18 }}/> Voltar
        </button>
        <span style={S.stepLabel}>PASSO 2 DE 4</span>
      </div>

      <ClientIdentity
        clientName={clientName}
        description={`Encontramos ${contractLabel} vinculado${contracts.length === 1 ? '' : 's'} ao seu CPF.`}
        metaItems={[{ icon:'ti-file-description', label:contractLabel, tone:'info' }]}
      />

      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12 }}>
        <div style={{ fontSize:15,fontWeight:700,color:C.text }}>Escolha o contrato</div>
        <div style={{ fontSize:12,color:C.fade }}>Toque em uma opção</div>
      </div>

      <div style={{
        display:'flex',flexDirection:'column',gap:12,
        flex:'1 1 auto',minHeight:0,overflowY:'auto',paddingRight:2,
      }}>
        {contracts.map(c => {
          const st = STATUS_MAP[c.status] || { label: c.status, color: C.dim };
          const address = c.address || 'Endereço não informado';
          const isCommercial = address.toLowerCase().includes('av.') || address.toLowerCase().includes('avenida');
          return (
            <button
              key={c.id}
              disabled={loading}
              onClick={() => pick(c)}
              style={{
                background:'#fff',border:`1.5px solid ${C.cardBd}`,borderRadius:14,
                padding:'16px 18px',cursor:'pointer',
                display:'flex',alignItems:'center',gap:14,textAlign:'left',
                opacity: loading ? 0.7 : 1,
                boxShadow:'0 6px 18px rgba(13,91,168,0.08)',
              }}
            >
              <div style={{ width:48,height:48,borderRadius:12,background:`${st.color}1A`,border:`1px solid ${st.color}44`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                <i className={isCommercial ? 'ti ti-building-store' : 'ti ti-home'} style={{fontSize:24,color:st.color}} aria-hidden="true"/>
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
                  <span style={{ fontSize:16,fontWeight:700,color:C.text }}>
                    {isCommercial ? 'Comercial' : 'Residencial'}
                  </span>
                  <span style={{ fontSize:10,padding:'3px 8px',borderRadius:4,background:`${st.color}1A`,color:st.color,border:`1px solid ${st.color}44`,letterSpacing:'1px',fontWeight:700 }}>
                    {st.label.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize:13,color:C.dim,lineHeight:1.35,overflowWrap:'anywhere' }}>{address}</div>
                {c.city && <div style={{ fontSize:12,color:C.fade,marginTop:2 }}>{c.city}</div>}
              </div>
              <i className="ti ti-chevron-right" style={{fontSize:22,color:C.fade}} aria-hidden="true"/>
            </button>
          );
        })}
      </div>

      <div style={{ textAlign:'center',marginTop:'auto',paddingTop:18,fontSize:13,color:C.fade }}>
        Não é você?{' '}
        <span style={{ color:C.blue,cursor:'pointer',textDecoration:'underline',fontWeight:600 }} onClick={() => go('entry')}>
          Voltar
        </span>
      </div>
    </div>
  );
}
