import { useState } from 'react';
import { api } from '../api.js';
import { C, S, PageHeader, Tag, Spin } from '../components/ui.jsx';

function maskCPF(cpf) {
  if (!cpf) return '—';
  const d = cpf.replace(/\D/g,'');
  return `***.${d.slice(3,6)}.${d.slice(6,9)}-**`;
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
}

export default function Validate() {
  const [code,     setCode]     = useState('');
  const [result,   setResult]   = useState(null);  // participante encontrado
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [delivered,setDelivered]= useState(false);

  const search = async () => {
    if (code.trim().length < 4) return;
    setLoading(true); setError(''); setResult(null); setDelivered(false);
    try {
      const r = await api.findByCode(code.trim().toUpperCase());
      setResult(r);
    } catch(e) {
      setError(e.message === 'Not Found' || e.message.includes('não encontrado')
        ? 'Código não encontrado. Verifique e tente novamente.'
        : e.message);
    } finally {
      setLoading(false);
    }
  };

  const markDelivered = async () => {
    setLoading(true);
    try {
      await api.deliver(code.trim().toUpperCase());
      setDelivered(true);
      setResult(r => ({ ...r, win_delivered: true }));
    } catch(e) { setError(e.message); }
    finally    { setLoading(false); }
  };

  const alreadyDone = result?.win_delivered || delivered;

  return (
    <div>
      <PageHeader title="Validar códigos" sub="ILNET TOTEM"/>
      <div style={S.page}>
        {/* Input de busca */}
        <div style={{ ...S.card, marginBottom:20 }}>
          <div style={{ fontSize:12, color:C.dim, marginBottom:10 }}>
            Digite o código de 4 caracteres apresentado pelo participante
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="Ex: 42K7"
              maxLength={4}
              style={{
                ...S.input, flex:1,
                fontFamily:'monospace', fontSize:22,
                letterSpacing:6, textAlign:'center',
                textTransform:'uppercase',
              }}
            />
            <button style={S.btn} onClick={search} disabled={loading || code.length < 4}>
              {loading ? <Spin/> : <i className="ti ti-search"/>}
              Buscar
            </button>
          </div>
        </div>

        {error && (
          <div style={{ ...S.card, borderColor:'rgba(240,149,149,0.3)', background:'rgba(240,149,149,0.05)', color:C.red, marginBottom:16 }}>
            <i className="ti ti-alert-circle" style={{ marginRight:8 }}/>
            {error}
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div style={{ ...S.card, borderColor: alreadyDone ? 'rgba(93,202,165,0.3)' : 'rgba(255,201,87,0.3)', background: alreadyDone ? 'rgba(93,202,165,0.04)' : 'rgba(255,201,87,0.04)', marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
              <i className={`ti ${alreadyDone ? 'ti-circle-check' : 'ti-circle-dot'}`}
                style={{ fontSize:16, color: alreadyDone ? C.green : C.gold }}/>
              <span style={{ fontSize:12, color: alreadyDone ? C.green : C.gold, fontWeight:500 }}>
                {alreadyDone ? 'Prêmio já entregue' : 'Código válido — pendente de retirada'}
              </span>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 16px', marginBottom:16 }}>
              {[
                ['CÓDIGO',    result.win_code,                                 'monospace'],
                ['GANHADOR',  result.name,                                     null],
                ['CPF',       maskCPF(result.cpf),                             'monospace'],
                ['PRÊMIO',    result.prize_name,                               null],
                ['TIPO',      result.type === 'client' ? 'Cliente' : 'Visitante', null],
                ['SORTEADO',  fmtDate(result.played_at),                       null],
                ['TELEFONE',  result.phone || '—',                             'monospace'],
                ['ENTREGUE',  result.win_delivered_at ? fmtDate(result.win_delivered_at) : '—', null],
              ].map(([l,v,ff]) => (
                <div key={l}>
                  <div style={{ fontSize:9, color:C.fade, letterSpacing:1, marginBottom:3 }}>{l}</div>
                  <div style={{ fontSize:13, fontFamily:ff||'inherit' }}>{v}</div>
                </div>
              ))}
            </div>

            {!alreadyDone && (
              <button
                style={{ ...S.btn, width:'100%', justifyContent:'center', padding:12, background:'linear-gradient(135deg,#5DCAA5,#0F6E56)' }}
                onClick={markDelivered}
                disabled={loading}
              >
                {loading ? <><Spin/>Processando...</> : <><i className="ti ti-check"/>Marcar como entregue</>}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
