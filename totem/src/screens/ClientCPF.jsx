import { useState } from 'react';
import { api } from '../api.js';
import { C, S } from '../theme.js';

function formatCPF(digits) {
  const d = digits.padEnd(11, ' ');
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9,11)}`;
}

const KEYS = ['1','2','3','4','5','6','7','8','9','←','0','✓'];

export default function ClientCPF({ go, session }) {
  const [digits,  setDigits]  = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleKey = async (k) => {
    if (k === '←') return setDigits(d => d.slice(0,-1));
    if (k === '✓') return submit();
    if (digits.length < 11) setDigits(d => d + k);
  };

  const submit = async () => {
    if (digits.length !== 11) return setError('Digite os 11 dígitos do CPF');
    setError('');
    setLoading(true);
    try {
      // Verifica se já jogou
      const check = await api.checkCPF(digits);
      if (!check.can_participate) {
        if (check.reason === 'already_played')
          return setError('Este CPF já participou neste evento.');
        if (check.reason === 'no_active_event')
          return setError('Não há evento ativo no momento.');
      }

      // Busca no IXC
      const res = await api.findClient(digits);
      if (!res.found)
        return setError('CPF não encontrado como cliente ILNET.\nDeseja se cadastrar como visitante?');

      const client  = res.clients[0];
      const eventId = check.event_id;

      // Se tiver mais de 1 registro (mesmo CPF, clientes dif) ou mais de 1 contrato, ir pra seleção
      // Aqui buscamos contratos do primeiro cliente
      const cRes = await api.getContracts(client.id);
      const allContracts = cRes.contracts || [];
      const ACTIVE_STATUS = new Set(['A','B','FA']);
      const contracts = allContracts.filter(c => ACTIVE_STATUS.has(c.status));

      if (contracts.length === 0) {
        return setError('Nenhum contrato ativo encontrado.\nDeseja se cadastrar como visitante?');
      }

      if (contracts.length > 1) {
        go('contract_select', {
          cpf: digits, clientName: client.name, clientId: client.id,
          contracts, eventId,
        });
      } else {
        // Registra e vai pra débitos
        await api.registerClient({ cpf: digits, name: client.name, ixcClientId: client.id, ixcContractId: contracts[0]?.id });
        const dRes = await api.getDebts(contracts[0]?.id);
        go('debts', {
          cpf: digits, clientName: client.name, clientId: client.id,
          contractId: contracts[0]?.id, debts: dRes.debts || [], eventId,
        });
      }
    } catch (e) {
      setError(e.message || 'Erro ao consultar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const displayCPF = formatCPF(digits);

  return (
    <div style={S.screen}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
        <button style={S.back} onClick={() => go('entry')}><i className="ti ti-arrow-left"/> Voltar</button>
        <span style={S.stepLabel}>PASSO 2 DE 4</span>
      </div>

      <div style={{ textAlign:'center',marginTop:20,marginBottom:16 }}>
        <h2 style={{ fontSize:20,fontWeight:500 }}>Digite seu CPF</h2>
        <p style={{ fontSize:12,color:C.dim,marginTop:4 }}>Para identificarmos sua conta</p>
      </div>

      {/* Display CPF */}
      <div style={{
        background:C.card,border:`1.5px solid ${digits.length===11?C.blue:C.cardBd}`,
        borderRadius:12,padding:'14px 16px',textAlign:'center',marginBottom:4,
        transition:'border-color .2s',
      }}>
        <div style={{ fontFamily:'monospace',fontSize:22,letterSpacing:2,color:'#fff' }}>
          {displayCPF.slice(0,7)}
          <span style={{ color: digits.length >= 7 ? '#fff' : C.fade }}>
            {displayCPF.slice(7)}
          </span>
        </div>
      </div>

      {error && (
        <div style={{ color:C.red,fontSize:12,textAlign:'center',padding:'6px 0',whiteSpace:'pre-line' }}>
          {error}
        </div>
      )}

      {/* Teclado numérico */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:12,flex:1 }}>
        {KEYS.map(k => (
          <button
            key={k}
            disabled={loading || (k==='✓' && digits.length<11)}
            onClick={() => handleKey(k)}
            style={{
              background: k==='✓' ? (digits.length===11 ? C.gradBlue : C.card) : C.card,
              border: `1px solid ${k==='←' ? 'rgba(240,149,149,0.3)' : C.cardBd}`,
              borderRadius:10,
              color: k==='←' ? C.red : '#fff',
              fontSize: k==='✓'||k==='←' ? 22 : 22,
              fontWeight: 500,
              cursor: 'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',
              touchAction:'manipulation',
              opacity: loading ? 0.6 : 1,
              minHeight: 60,
            }}
          >
            {k === '✓' ? <i className="ti ti-check" style={{fontSize:22}} aria-hidden="true"/>
              : k === '←' ? <i className="ti ti-backspace" style={{fontSize:22}} aria-hidden="true"/>
              : k}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign:'center',marginTop:12,color:C.dim,fontSize:13 }}>
          <i className="ti ti-loader-2" style={{fontSize:20,animation:'spin 1s linear infinite'}}/> Consultando...
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}
    </div>
  );
}
