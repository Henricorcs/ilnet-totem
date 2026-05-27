import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout     from './components/Layout.jsx';
import Login      from './pages/Login.jsx';
import Dashboard  from './pages/Dashboard.jsx';
import Events     from './pages/Events.jsx';
import Prizes     from './pages/Prizes.jsx';
import Validate   from './pages/Validate.jsx';
import Participants from './pages/Participants.jsx';
import Settings   from './pages/Settings.jsx';

function RequireAuth({ children }) {
  const token = localStorage.getItem('ilnet_admin_token');
  const loc   = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: loc }} replace/>;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login/>}/>
      <Route path="/" element={
        <RequireAuth>
          <Layout/>
        </RequireAuth>
      }>
        <Route index         element={<Navigate to="/dashboard" replace/>}/>
        <Route path="dashboard"    element={<Dashboard/>}/>
        <Route path="events"       element={<Events/>}/>
        <Route path="prizes"       element={<Prizes/>}/>
        <Route path="validate"     element={<Validate/>}/>
        <Route path="participants" element={<Participants/>}/>
        <Route path="settings"     element={<Settings/>}/>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
    </Routes>
  );
}
