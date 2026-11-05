import { useEffect, useState } from 'react';
import { api, ApiError, type Household, type User } from './api';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ResetPage } from './pages/ResetPage';
import { PantryPage } from './pages/PantryPage';

type Session = { user: User; households: Household[] } | null;

export function App() {
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    api
      .me()
      .then(setSession)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) setSession(null);
        else throw err;
      });
  }, []);

  const navigate = (to: string) => {
    window.history.pushState(null, '', to);
    setPath(to);
  };

  if (session === undefined) return <p className="loading">Loading…</p>;

  if (path === '/reset') return <ResetPage onDone={() => navigate('/login')} />;

  if (!session) {
    if (path === '/register') {
      return (
        <RegisterPage
          onRegistered={() => api.me().then((s) => { setSession(s); navigate('/'); })}
          onLogin={() => navigate('/login')}
        />
      );
    }
    return <LoginPage onRegister={() => navigate('/register')} />;
  }

  return (
    <PantryPage
      user={session.user}
      households={session.households}
      onHouseholdsChanged={() => api.me().then(setSession)}
      onLogout={() => api.logout().then(() => { setSession(null); navigate('/login'); })}
    />
  );
}
