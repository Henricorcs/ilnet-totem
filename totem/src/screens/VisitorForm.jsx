import { useState } from 'react';
import { api } from '../api.js';
import { C, S } from '../theme.js';
import Keyboard from '../components/Keyboard.jsx';

const STEPS = ['cpf', 'name', 'phone', 'address', 'confirm'];
const TOTAL = STEPS.length;

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
  const [form,    setForm]    = useState({ cpf:'', name:'', phone:'', address:'' });
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setError('');
  };

  const stepKey = STEPS[step];
  const cpfOk     = form.cpf.length === 11;
  const nameOk    = form.name.trim().split(/\s+/).filter(Boolean).length >= 2;
  const phoneOk   = form.phone.length >= 10;
  const addressOk = form.address.trim().length >= 5;
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

      {/* Progress bar */}
      <div style={{ display:'flex', gap:6, marginTop:14, marginBottom:18 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{
            flex:1, height:6, borderRadius:3,
            background: i <= step ? C.gradBlue : 'rgba(30,124,216,0.15)',
            transition: 'background .3s',
          }}/>
        ))}
      </div>

      {/* Step content */}
      {stepKey === 'cpf' && (
        <StepCPF
          value={form.cpf}
          onChange={v => set('cpf', v)}
          onNext={next}
          ok={cpfOk}
          error={error}
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

function StepTitle({ title, sub, icon }) {
  return (
    <div style={{ textAlign:'center', marginBottom:14 }}>
      {icon && (
        <div style={{
          width:64, height:64, margin:'0 auto 10px',
          borderRadius:'50%',
          background:'rgba(30,124,216,0.10)',
          border:`1px solid ${C.cardBd}`,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <i className={`ti ${icon}`} style={{ fontSize:32, color:C.blue }} aria-hidden="true"/>
        </div>
      )}
      <h2 style={{ fontSize:24, fontWeight:700, color:C.text }}>{title}</h2>
      {sub && <p style={{ fontSize:14, color:C.dim, marginTop:6 }}>{sub}</p>}
    </div>
  );
}

function DisplayBox({ children, valid, hint }) {
  return (
    <div style={{
      background:'#fff',
      border:`2px solid ${valid ? C.blue : C.cardBd}`,
      borderRadius:14, padding:'18px 16px',
      textAlign:'center',
      boxShadow:'0 4px 14px rgba(13,91,168,0.08)',
      marginBottom: hint ? 6 : 16,
      transition:'border-color .2s',
    }}>
      {children}
    </div>
  );
}

function StepCPF({ value, onChange, onNext, ok, error }) {
  return (
    <>
      <StepTitle icon="ti-id" title="Qual seu CPF?" sub="Pra você não jogar duas vezes" />
      <DisplayBox valid={ok}>
        <div style={{ fontFamily:'monospace', fontSize:28, letterSpacing:3, color: ok ? C.blue : C.text, fontWeight:700 }}>
          {formatCPFDisplay(value)}
        </div>
      </DisplayBox>
      {error && <div style={{ color:C.red, fontSize:13, textAlign:'center', marginBottom:10 }}>{error}</div>}
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

function StepName({ value, onChange, onNext, ok }) {
  return (
    <>
      <StepTitle icon="ti-user" title="Seu nome completo" sub="Pra colocar no certificado do prêmio" />
      <DisplayBox valid={ok}>
        <div style={{ fontSize:22, color: value ? C.text : C.fade, fontWeight:600, minHeight:30, lineHeight:1.3 }}>
          {value || 'João Silva Souza'}
        </div>
      </DisplayBox>
      <p style={{ fontSize:12, color:C.fade, textAlign:'center', marginBottom:14 }}>
        {ok ? '✓ Nome e sobrenome preenchidos' : 'Digite nome e sobrenome (no mínimo)'}
      </p>
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
      <StepTitle icon="ti-phone" title="Seu telefone com WhatsApp" sub="Pra avisar se você ganhar" />
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
      <StepTitle icon="ti-map-pin" title="Onde você mora?" sub="Bairro ou rua já basta" />
      <DisplayBox valid={ok}>
        <div style={{ fontSize:18, color: value ? C.text : C.fade, fontWeight:500, minHeight:26, lineHeight:1.4, padding:'2px 0' }}>
          {value || 'Bairro Centro'}
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
    { icon:'ti-id',      label:'CPF',       value: form.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') },
    { icon:'ti-user',    label:'Nome',      value: form.name },
    { icon:'ti-phone',   label:'Telefone',  value: form.phone.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4') },
    { icon:'ti-map-pin', label:'Endereço',  value: form.address },
  ];

  return (
    <>
      <StepTitle icon="ti-checks" title="Tudo certo?" sub="Confira seus dados antes de continuar" />

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
