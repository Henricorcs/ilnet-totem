import { useState } from 'react';
import { api } from '../api.js';
import { C, S } from '../theme.js';

function formatCPF(v) {
  const d = v.replace(/\D/g,'').slice(0,11);
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/,'$1.$2.$3-$4').replace(/-$/,'');
}
function formatPhone(v) {
  const d = v.replace(/\D/g,'').slice(0,11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

export default function VisitorForm({ go, goHome }) {
  const [form,    setForm]    = useState({ cpf:'', name:'', phone:'', address:'' });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(false);

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (form.cpf.replace(/\D/g,'').length !== 11) e.cpf = 'CPF inválido';
    if (form.name.trim().split(' ').length < 2)   e.name = 'Digite nome e sobrenome';
    if (form.phone.replace(/\D/g,'').length < 10) e.phone = 'Telefone inválido';
    if (!form.address.trim())                      e.address = 'Preencha o endereço';
    if (!consent)                                  e.consent = 'Aceite os termos pra continuar';
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) return setErrors(e);
    setLoading(true);
    try {
      const cleanCpf = form.cpf.replace(/\D/g,'');
      const visitorName = form.name.trim();
      const res = await api.registerVisitor({
        cpf:     cleanCpf,
        name:    visitorName,
        phone:   form.phone.replace(/\D/g,''),
        address: form.address.trim(),
      });
      go('slot', {
        cpf: cleanCpf,
        eventId: res.event_id,
        visitorName,
        participantType: 'visitor',
      });
    } catch (err) {
      if (err.code === 'duplicate_cpf')
        setErrors({ cpf:'Este CPF já se cadastrou neste evento.' });
      else
        setErrors({ form: err.message || 'Erro ao salvar. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key:'cpf',     label:'CPF',            type:'tel',  icon:'ti-id',           format: formatCPF,   placeholder:'000.000.000-00' },
    { key:'name',    label:'Nome completo',  type:'text', icon:'ti-user',         format: v=>v,        placeholder:'João Silva Souza' },
    { key:'phone',   label:'Telefone',       type:'tel',  icon:'ti-phone',        format: formatPhone, placeholder:'(98) 9 9999-9999' },
    { key:'address', label:'Endereço',       type:'text', icon:'ti-map-pin',      format: v=>v,        placeholder:'Rua, número e bairro' },
  ];

  return (
    <div style={S.screen}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
        <button style={S.back} onClick={() => go('entry')}><i className="ti ti-arrow-left"/> Voltar</button>
        <span style={S.stepLabel}>PASSO 2 DE 4</span>
      </div>

      <div style={{ marginTop:16,marginBottom:18 }}>
        <h2 style={{ fontSize:20,fontWeight:500 }}>Cadastro rápido</h2>
        <p style={{ fontSize:12,color:C.dim,marginTop:4 }}>Pra você concorrer aos prêmios</p>
      </div>

      <div style={{ display:'flex',flexDirection:'column',gap:10,flex:1 }}>
        {fields.map(f => {
          const val = form[f.key];
          const err = errors[f.key];
          const filled = val.replace(/\D/g,'').length > 0 || val.trim().length > 0;
          return (
            <div key={f.key}>
              <div style={{
                background: C.card,
                border: `1.5px solid ${err ? C.red : filled ? C.blue : C.cardBd}`,
                borderRadius:10,padding:'10px 12px',
                display:'flex',alignItems:'center',gap:10,
                transition:'border-color .2s',
              }}>
                <i className={`ti ${f.icon}`} style={{ fontSize:18,color: err?C.red:filled?C.blue:C.fade }} aria-hidden="true"/>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:9,color: err?C.red:filled?C.blue:C.fade,letterSpacing:1,textTransform:'uppercase',marginBottom:2 }}>
                    {f.label}
                  </div>
                  <input
                    type={f.type}
                    inputMode={f.type==='tel'?'numeric':'text'}
                    value={val}
                    placeholder={f.placeholder}
                    onChange={e => set(f.key, f.format(e.target.value))}
                    style={{
                      background:'none',border:'none',outline:'none',
                      color:'#fff',fontSize:14,width:'100%',
                      caretColor: C.blue,
                    }}
                  />
                </div>
                {filled && !err && (
                  <i className="ti ti-check" style={{fontSize:16,color:C.green}} aria-hidden="true"/>
                )}
              </div>
              {err && <div style={{ fontSize:11,color:C.red,marginTop:3,paddingLeft:4 }}>{err}</div>}
            </div>
          );
        })}

        {/* Consentimento LGPD */}
        <div
          onClick={() => { setConsent(c=>!c); setErrors(e=>({...e,consent:''})); }}
          style={{
            display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer',
            padding:'10px 12px',background:C.card,borderRadius:10,
            border:`1px solid ${errors.consent?C.red:C.cardBd}`,
          }}
        >
          <div style={{
            width:18,height:18,borderRadius:4,flexShrink:0,marginTop:1,
            background: consent ? C.gradBlue : 'transparent',
            border: `1.5px solid ${consent?C.blue:C.fade}`,
            display:'flex',alignItems:'center',justifyContent:'center',
          }}>
            {consent && <i className="ti ti-check" style={{fontSize:12,color:'#fff'}} aria-hidden="true"/>}
          </div>
          <span style={{ fontSize:11,color:C.dim,lineHeight:1.4 }}>
            Concordo com o uso dos meus dados pela ILNET pra fins de contato e promoções,
            conforme a Lei 13.709/18 (LGPD).
          </span>
        </div>
        {errors.consent && <div style={{ fontSize:11,color:C.red,paddingLeft:4 }}>{errors.consent}</div>}

        {errors.form && <div style={{ fontSize:12,color:C.red,textAlign:'center' }}>{errors.form}</div>}
      </div>

      <button
        style={{ ...S.btnPrimary, marginTop:16, opacity: loading?0.7:1 }}
        onClick={submit}
        disabled={loading}
      >
        {loading
          ? <><i className="ti ti-loader-2" style={{animation:'spin 1s linear infinite'}}/> Salvando...</>
          : <><i className="ti ti-arrow-right" style={{fontSize:20}}/> Continuar</>
        }
      </button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
