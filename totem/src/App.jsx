import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api.js';
import Attract        from './screens/Attract.jsx';
import Entry          from './screens/Entry.jsx';
import ClientCPF      from './screens/ClientCPF.jsx';
import ContractSelect from './screens/ContractSelect.jsx';
import Debts          from './screens/Debts.jsx';
import Pix            from './screens/Pix.jsx';
import VisitorForm    from './screens/VisitorForm.jsx';
import SlotMachine    from './screens/SlotMachine.jsx';
import Won            from './screens/Won.jsx';
import Lost           from './screens/Lost.jsx';

export default function App() {
  const [screen, setScreen]   = useState('attract');
  const [session, setSession] = useState({});   // dados acumulados da sessão
  const [prizes,  setPrizes]  = useState([]);
  const [event,   setEvent]   = useState(null);
  const [idleMs,  setIdleMs]  = useState(60000);
  const idleTimer = useRef(null);

  // Carrega evento ativo + prêmios + settings na montagem
  useEffect(() => {
    (async () => {
      try {
        const [evRes, cfgRes] = await Promise.all([api.getActiveEvent(), api.getSettings()]);
        if (evRes.event) {
          setEvent(evRes.event);
          const pRes = await api.getPrizes(evRes.event.id);
          setPrizes(pRes.prizes || []);
        }
        if (cfgRes.idle_timeout) setIdleMs(parseInt(cfgRes.idle_timeout) * 1000);
      } catch (e) {
        console.error('Boot error:', e);
      }
    })();
  }, []);

  // Idle timeout: volta pra tela inicial após inatividade
  const resetIdle = useCallback(() => {
    clearTimeout(idleTimer.current);
    if (screen !== 'attract' && screen !== 'won' && screen !== 'lost') {
      idleTimer.current = setTimeout(() => {
        setScreen('attract');
        setSession({});
      }, idleMs);
    }
  }, [screen, idleMs]);

  useEffect(() => {
    window.addEventListener('touchstart', resetIdle);
    window.addEventListener('click',      resetIdle);
    resetIdle();
    return () => {
      clearTimeout(idleTimer.current);
      window.removeEventListener('touchstart', resetIdle);
      window.removeEventListener('click',      resetIdle);
    };
  }, [resetIdle]);

  const go = (next, patch = {}) => {
    setSession(s => ({ ...s, ...patch }));
    setScreen(next);
  };

  const goHome = () => { setSession({}); setScreen('attract'); };

  const props = { session, event, prizes, go, goHome };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#050a18' }}>
      {screen === 'attract'         && <Attract         {...props} />}
      {screen === 'entry'           && <Entry           {...props} />}
      {screen === 'client_cpf'      && <ClientCPF       {...props} />}
      {screen === 'contract_select' && <ContractSelect  {...props} />}
      {screen === 'debts'           && <Debts           {...props} />}
      {screen === 'pix'             && <Pix             {...props} />}
      {screen === 'visitor_form'    && <VisitorForm      {...props} />}
      {screen === 'slot'            && <SlotMachine      {...props} />}
      {screen === 'won'             && <Won             {...props} />}
      {screen === 'lost'            && <Lost            {...props} />}
    </div>
  );
}
