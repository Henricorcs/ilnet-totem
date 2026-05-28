import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { C, S } from '../theme.js';
import Keyboard from '../components/Keyboard.jsx';

const STEPS = ['cpf', 'name', 'phone', 'address', 'confirm'];
const TOTAL = STEPS.length;
const ACTIVE_STATUS = new Set(['A','B','FA']);

function formatCPFDisplay(digits) {
  const d = digits.padEnd(11, '·');
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9,11)}`.replace(/·/g,'_');
}
function formatPhoneDisplay(digits) {
  const d = digits.padEnd(11, '·');
  return `(${d.slice(0,2)}) ${d.slice(2,3)} ${d.slice(3,7)}-${d.slice(7,11)}`.replace(/·/g,'_');
}

export default function VisitorForm({ go }) {
  const [step,    setStep]    = useState(0);
  const [form,    setForm]    = useState({ cpf:'', name:'', phone:'', address:'', eventId:null });
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setError('');
  };

  const stepKey = STEPS[step];
  const cpfOk     = form.cpf.length === 11 && !!form.eventId; // só ok se passou validação
  const nameOk    = form.name.trim().split(/\s+/).filter(Boolean).length >= 2;
  const phoneOk   = form.phone.length >= 10;
  const addressOk = form.address.trim().length >= 3;
  const okMap = { cpf: cpfOk, name: nameOk, phone: phoneOk, address: addressOk, confirm: consent };
  const canNext = okMap[stepKey];

  const next = () => {
    if (!canNext) return;
    if (step < TOTAL - 1) setStep(s => s + 1);
    else submit();
  };
  const prev = () => {
    if (step === 0) return go('entry');
    setStep(s => s - 1);
    setError('');
  };

  const submit = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.registerVisitor({
        cpf:     form.cpf,
        name:    form.name.trim(),
        phone:   form.phone,
        address: form.address.trim(),
      });
      go('slot', {
        cpf: form.cpf,
        eventId: res.event_id,
        visitorName: form.name.trim(),
        participantType: 'visitor',
      });
    } catch (err) {
      if (err.code === 'duplicate_cpf') {
        setError('Este CPF já se cadastrou neste evento.');
        setStep(0);
      } else {
        setError(err.message || 'Erro ao salvar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.screen}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <button style={S.back} onClick={prev}>
          <i className="ti ti-arrow-left" style={{ fontSize:18 }}/> Voltar
        </button>
        <span style={S.stepLabel}>ETAPA {step + 1} DE {TOTAL}</span>
      </div>

      {/* Logo */}
      <div style={{ textAlign:'center', marginTop:10 }}>
        <img src="/assets/logo_ilnet.svg" alt="ILNET" style={{ height:40, objectFit:'contain', animation:'floatLogo 5s ease-in-out infinite' }}/>
      </div>

      {/* Progress bar */}
      <div style={{ display:'flex', gap:6, marginTop:12, marginBottom:18 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{
            flex:1, height:6, borderRadius:3,
            background: i <= step ? C.gradBlue : 'rgba(30,124,216,0.15)',
            transition: 'background .3s',
          }}/>
        ))}
      </div>

      <style>{`@keyframes floatLogo{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>

      {/* Step content */}
      {stepKey === 'cpf' && (
        <StepCPF
          value={form.cpf}
          onChange={v => set('cpf', v)}
          onValidated={(eventId) => setForm(f => ({ ...f, eventId }))}
          go={go}
          onNext={next}
        />
      )}
      {stepKey === 'name' && (
        <StepName
          value={form.name}
          onChange={v => set('name', v)}
          onNext={next}
          ok={nameOk}
        />
      )}
      {stepKey === 'phone' && (
        <StepPhone
          value={form.phone}
          onChange={v => set('phone', v)}
          onNext={next}
          ok={phoneOk}
        />
      )}
      {stepKey === 'address' && (
        <StepAddress
          value={form.address}
          onChange={v => set('address', v)}
          onNext={next}
          ok={addressOk}
        />
      )}
      {stepKey === 'confirm' && (
        <StepConfirm
          form={form}
          consent={consent}
          setConsent={setConsent}
          onSubmit={next}
          loading={loading}
          error={error}
        />
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────── Step helpers

function StepTitle({ title, icon }) {
  return (
    <div style={{ textAlign:'center', marginBottom:18 }}>
      {icon && (
        <div style={{
          width:64, height:64, margin:'0 auto 12px',
          borderRadius:'50%',
          background:'rgba(30,124,216,0.10)',
          border:`1px solid ${C.cardBd}`,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <i className={`ti ${icon}`} style={{ fontSize:32, color:C.blue }} aria-hidden="true"/>
        </div>
      )}
      <h2 style={{ fontSize:24, fontWeight:700, color:C.text }}>{title}</h2>
    </div>
  );
}

function DisplayBox({ children, valid }) {
  return (
    <div style={{
      background:'#fff',
      border:`2px solid ${valid ? C.blue : C.cardBd}`,
      borderRadius:14, padding:'18px 16px',
      textAlign:'center',
      boxShadow:'0 4px 14px rgba(13,91,168,0.08)',
      marginBottom:14,
      transition:'border-color .2s',
      minHeight: 62,
    }}>
      {children}
    </div>
  );
}

function StepCPF({ value, onChange, onValidated, onNext, go }) {
  const [checking,  setChecking]  = useState(false);
  const [error,     setError]     = useState('');
  const [ixcClient, setIxcClient] = useState(null); // { client, eventId } se for cliente IXC

  // Validação automática quando completa 11 dígitos
  useEffect(() => {
    if (value.length !== 11) {
      setError('');
      setIxcClient(null);
      onValidated(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setChecking(true);
      setError('');
      try {
        // 1. Já jogou?
        const check = await api.checkCPF(value);
        if (cancelled) return;
        if (!check.can_participate) {
          if (check.reason === 'already_played')
            return setError('Este CPF já participou neste evento.');
          if (check.reason === 'no_active_event')
            return setError('Nenhum evento ativo no momento.');
          return setError('CPF não habilitado.');
        }
        // 2. É cliente IXC?
        const res = await api.findClient(value);
        if (cancelled) return;
        if (res.found && res.clients.length > 0) {
          setIxcClient({ client: res.clients[0], eventId: check.event_id });
          onValidated(check.event_id);
        } else {
          // OK — segue como visitante
          onValidated(check.event_id);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Erro ao validar CPF. Tente novamente.');
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, [value]);

  const continueAsClient = async () => {
    setChecking(true);
    setError('');
    try {
      const cRes = await api.getContracts(ixcClient.client.id);
      const contracts = (cRes.contracts || []).filter(c => ACTIVE_STATUS.has(c.status));
      if (contracts.length === 0) {
        // Sem contrato ativo — volta pro cadastro normal
        setIxcClient(null);
        setError('Sem contrato ativo. Continue como visitante.');
        return;
      }
      if (contracts.length > 1) {
        go('contract_select', {
          cpf: value, clientName: ixcClient.client.name, clientId: ixcClient.client.id,
          contracts, eventId: ixcClient.eventId,
        });
      } else {
        await api.registerClient({
          cpf: value, name: ixcClient.client.name,
          ixcClientId: ixcClient.client.id, ixcContractId: contracts[0]?.id,
        });
        const dRes = await api.getDebts(contracts[0]?.id);
        go('debts', {
          cpf: value, clientName: ixcClient.client.name, clientId: ixcClient.client.id,
          contractId: contracts[0]?.id, debts: dRes.debts || [], eventId: ixcClient.eventId,
        });
      }
    } catch (e) {
      setError(e.message || 'Erro ao buscar contrato');
    } finally {
      setChecking(false);
    }
  };

  // Mostra card especial se for cliente IXC
  if (ixcClient) {
    const firstName = ixcClient.client.name.split(' ')[0];
    return (
      <>
        <StepTitle icon="ti-shield-check" title={`Olá, ${firstName}!`} />
        <div style={{
          ...S.card, padding:'22px 18px', textAlign:'center',
          border:`1.5px solid ${C.green}`,
          background:'rgba(31,157,113,0.05)',
        }}>
          <i className="ti ti-user-check" style={{ fontSize:42, color:C.green, marginBottom:10 }}/>
          <div style={{ fontSize:18, fontWeight:700, color:C.text, marginBottom:6 }}>
            Você é cliente ILNET
          </div>
          <div style={{ fontSize:14, color:C.dim, lineHeight:1.4 }}>
            Encontramos seu CPF na nossa base. Vamos te identificar pelo seu contrato.
          </div>
        </div>
        {error && <div style={{ color:C.red, fontSize:13, textAlign:'center', marginTop:10 }}>{error}</div>}
        <div style={{ flex:1 }}/>
        <button
          style={{ ...S.btnPrimary, opacity: checking ? 0.7 : 1 }}
          onClick={continueAsClient}
          disabled={checking}
        >
          {checking
            ? <><i className="ti ti-loader-2" style={{ fontSize:22, animation:'spin 1s linear infinite' }}/> Carregando...</>
            : <><i className="ti ti-arrow-right" style={{ fontSize:22 }}/> Continuar como cliente</>
          }
        </button>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </>
    );
  }

  const showOk = value.length === 11 && !checking && !error;

  return (
    <>
      <StepTitle icon="ti-id" title="Qual seu CPF?" />
      <DisplayBox valid={showOk}>
        <div style={{ fontFamily:'monospace', fontSize:28, letterSpacing:3, color: showOk ? C.blue : C.text, fontWeight:700 }}>
          {formatCPFDisplay(value)}
        </div>
      </DisplayBox>

      {checking && (
        <div style={{ textAlign:'center', color:C.dim, fontSize:14, marginBottom:6 }}>
          <i className="ti ti-loader-2" style={{ fontSize:18, animation:'spin 1s linear infinite', verticalAlign:'-3px', marginRight:6 }}/>
          Validando CPF...
        </div>
      )}
      {error && (
        <div style={{ color:C.red, fontSize:13, textAlign:'center', marginBottom:6 }}>
          {error}
        </div>
      )}

      <div style={{ flex:1, display:'flex', alignItems:'flex-end' }}>
        <Keyboard
          layout="numeric"
          value={value}
          onChange={v => onChange(v.replace(/\D/g,'').slice(0,11))}
          maxLength={11}
          onSubmit={onNext}
          submitDisabled={!showOk}
        />
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}

function StepName({ value, onChange, onNext, ok }) {
  return (
    <>
      <StepTitle icon="ti-user" title="Seu nome completo" />
      <DisplayBox valid={ok}>
        <div style={{ fontSize:22, color:C.text, fontWeight:600, minHeight:30, lineHeight:1.3 }}>
          {value || ' '}
        </div>
      </DisplayBox>
      <div style={{ flex:1, display:'flex', alignItems:'flex-end' }}>
        <Keyboard
          layout="qwerty"
          value={value}
          onChange={onChange}
          maxLength={60}
          allowDigits={false}
          keepCase="title"
          onSubmit={onNext}
          submitDisabled={!ok}
        />
      </div>
    </>
  );
}

function StepPhone({ value, onChange, onNext, ok }) {
  return (
    <>
      <StepTitle icon="ti-phone" title="Seu telefone com WhatsApp" />
      <DisplayBox valid={ok}>
        <div style={{ fontFamily:'monospace', fontSize:26, letterSpacing:2, color: ok ? C.blue : C.text, fontWeight:700 }}>
          {formatPhoneDisplay(value)}
        </div>
      </DisplayBox>
      <div style={{ flex:1, display:'flex', alignItems:'flex-end' }}>
        <Keyboard
          layout="numeric"
          value={value}
          onChange={v => onChange(v.replace(/\D/g,'').slice(0,11))}
          maxLength={11}
          onSubmit={onNext}
          submitDisabled={!ok}
        />
      </div>
    </>
  );
}

function StepAddress({ value, onChange, onNext, ok }) {
  return (
    <>
      <StepTitle icon="ti-map-pin" title="Qual seu bairro/povoado?" />
      <DisplayBox valid={ok}>
        <div style={{ fontSize:18, color:C.text, fontWeight:500, minHeight:26, lineHeight:1.4, padding:'2px 0' }}>
          {value || ' '}
        </div>
      </DisplayBox>
      <div style={{ flex:1, display:'flex', alignItems:'flex-end' }}>
        <Keyboard
          layout="qwerty"
          value={value}
          onChange={onChange}
          maxLength={80}
          allowDigits={true}
          onSubmit={onNext}
          submitDisabled={!ok}
        />
      </div>
    </>
  );
}

function StepConfirm({ form, consent, setConsent, onSubmit, loading, error }) {
  const items = [
    { icon:'ti-id',      label:'CPF',              value: form.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') },
    { icon:'ti-user',    label:'Nome',             value: form.name },
    { icon:'ti-phone',   label:'Telefone',         value: form.phone.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4') },
    { icon:'ti-map-pin', label:'Bairro/Povoado',   value: form.address },
  ];

  return (
    <>
      <StepTitle icon="ti-checks" title="Tudo certo?" />

      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
        {items.map(it => (
          <div key={it.label} style={{
            ...S.card, padding:'12px 14px',
            display:'flex', alignItems:'center', gap:12,
          }}>
            <div style={{
              width:36, height:36, borderRadius:10,
              background:'rgba(30,124,216,0.08)',
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0,
            }}>
              <i className={`ti ${it.icon}`} style={{ fontSize:18, color:C.blue }}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11, color:C.fade, letterSpacing:1, textTransform:'uppercase' }}>{it.label}</div>
              <div style={{ fontSize:16, color:C.text, fontWeight:600, overflowWrap:'anywhere' }}>{it.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Consentimento */}
      <div
        onClick={() => setConsent(c => !c)}
        style={{
          display:'flex', alignItems:'flex-start', gap:12, cursor:'pointer',
          padding:'14px 16px', background: consent ? 'rgba(30,124,216,0.06)' : '#fff',
          borderRadius:14,
          border: `1.5px solid ${consent ? C.blue : C.cardBd}`,
          marginBottom:14,
          transition:'all .2s',
        }}
      >
        <div style={{
          width:26, height:26, borderRadius:7, flexShrink:0, marginTop:1,
          background: consent ? C.gradBlue : '#fff',
          border: `1.5px solid ${consent ? C.blue : C.fade}`,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          {consent && <i className="ti ti-check" style={{ fontSize:18, color:'#fff' }}/>}
        </div>
        <span style={{ fontSize:13, color:C.textSub, lineHeight:1.45 }}>
          Concordo com o uso dos meus dados pela ILNET pra contato e promoções,
          conforme a Lei 13.709/18 (LGPD).
        </span>
      </div>

      {error && <div style={{ color:C.red, fontSize:13, textAlign:'center', marginBottom:10 }}>{error}</div>}

      <div style={{ marginTop:'auto' }}>
        <button
          onClick={onSubmit}
          disabled={!consent || loading}
          style={{
            ...S.btnPrimary,
            opacity: (!consent || loading) ? 0.55 : 1,
            cursor: (!consent || loading) ? 'not-allowed' : 'pointer',
          }}
        >
          {loading
            ? <><i className="ti ti-loader-2" style={{ fontSize:22, animation:'spin 1s linear infinite' }}/> Salvando...</>
            : <><i className="ti ti-confetti" style={{ fontSize:22 }}/> Jogar a roleta</>
          }
        </button>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}
