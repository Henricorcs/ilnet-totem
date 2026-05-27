import { useState } from 'react';
import { api } from '../api.js';
import { C, S } from '../theme.js';
import Keyboard from '../components/Keyboard.jsx';

function formatCPFDisplay(digits) {
  const d = digits.padEnd(11, '·');
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9,11)}`.replace(/·/g,'_');
}

export default function ClientCPF({ go }) {
  const [digits,  setDigits]  = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const ok = digits.length === 11;

  const submit = async () => {
    if (!ok) return;
    setError('');
    setLoading(true);
    try {
      const check = await api.checkCPF(digits);
      if (!check.can_participate) {
        if (check.reason === 'already_played')
          return setError('Este CPF já participou neste evento.');
        if (check.reason === 'no_active_event')
          return setError('Não há evento ativo no momento.');
      }

      const res = await api.findClient(digits);
      if (!res.found)
        return setError('CPF não encontrado como cliente ILNET. Volte e cadastre-se como visitante.');

      const client  = res.clients[0];
      const eventId = check.event_id;

      const cRes = await api.getContracts(client.id);
      const allContracts = cRes.contracts || [];
      const ACTIVE_STATUS = new Set(['A','B','FA']);
      const contracts = allContracts.filter(c => ACTIVE_STATUS.has(c.status));

      if (contracts.length === 0) {
        return setError('Nenhum contrato ativo encontrado. Volte e cadastre-se como visitante.');
      }

      if (contracts.length > 1) {
        go('contract_select', {
          cpf: digits, clientName: client.name, clientId: client.id,
          contracts, eventId,
        });
      } else {
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

  return (
    <div style={S.screen}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <button style={S.back} onClick={() => go('entry')}>
          <i className="ti ti-arrow-left" style={{ fontSize:18 }}/> Voltar
        </button>
        <span style={S.stepLabel}>PASSO 2 DE 4</span>
      </div>

      <div style={{ textAlign:'center', marginTop:24, marginBottom:14 }}>
        <div style={{
          width:64, height:64, margin:'0 auto 12px', borderRadius:'50%',
          background:'rgba(30,124,216,0.10)', border:`1px solid ${C.cardBd}`,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <i className="ti ti-id" style={{ fontSize:32, color:C.blue }}/>
        </div>
        <h2 style={{ fontSize:24, fontWeight:700, color:C.text }}>Digite seu CPF</h2>
        <p style={{ fontSize:14, color:C.dim, marginTop:6 }}>Pra identificarmos sua conta na ILNET</p>
      </div>

      {/* Display CPF */}
      <div style={{
        background:'#fff',
        border:`2px solid ${ok ? C.blue : C.cardBd}`,
        borderRadius:14, padding:'18px 16px', textAlign:'center', marginBottom:6,
        boxShadow:'0 4px 14px rgba(13,91,168,0.08)',
        transition:'border-color .2s',
      }}>
        <div style={{ fontFamily:'monospace', fontSize:28, letterSpacing:3, color: ok ? C.blue : C.text, fontWeight:700 }}>
          {formatCPFDisplay(digits)}
        </div>
      </div>

      {error && (
        <div style={{ color:C.red, fontSize:13, textAlign:'center', padding:'8px 0', whiteSpace:'pre-line' }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign:'center', marginTop:6, color:C.dim, fontSize:14 }}>
          <i className="ti ti-loader-2" style={{ fontSize:20, animation:'spin 1s linear infinite', verticalAlign:'-3px', marginRight:6 }}/>
          Consultando IXC...
        </div>
      )}

      {/* Teclado */}
      <div style={{ flex:1, display:'flex', alignItems:'flex-end', marginTop:10 }}>
        <Keyboard
          layout="numeric"
          value={digits}
          onChange={v => setDigits(v.replace(/\D/g,'').slice(0,11))}
          maxLength={11}
          onSubmit={submit}
          submitDisabled={!ok || loading}
        />
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
