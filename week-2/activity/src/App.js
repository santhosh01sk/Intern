import './App.scss';
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import Login from './component/Login.jsx';
import Signup from './component/Signup.jsx';
import Home from './component/Home.jsx';
import Navbar from './component/Navbar.jsx';
import Profile from './component/Profile.jsx';
import {
  clearAuthSession,
  getStoredAuthToken,
  getStoredUsername,
  logoutAuthToken,
  storeAuthSession,
  validateAuthToken,
} from './auth';

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authStatus, setAuthStatus] = useState('checking');
  const [currentUser, setCurrentUser] = useState('');

  useEffect(() => {
    let active = true;

    async function bootstrapAuth() {
      const token = getStoredAuthToken();

      if (!token) {
        clearAuthSession();
        if (active) {
          setAuthStatus('unauthenticated');
          setCurrentUser('');
        }
        return;
      }

      try {
        const payload = await validateAuthToken(token);

        if (!active) {
          return;
        }

        const username = payload.username || getStoredUsername() || '';
        storeAuthSession(token, username);
        setCurrentUser(username);
        setAuthStatus('authenticated');
      } catch {
        if (!active) {
          return;
        }

        clearAuthSession();
        setCurrentUser('');
        setAuthStatus('unauthenticated');
      }
    }

    bootstrapAuth();

    return () => {
      active = false;
    };
  }, []);

  // Validate token on route navigation
  useEffect(() => {
    if (authStatus === 'checking') {
      return;
    }

    const token = getStoredAuthToken();
    if (!token) {
      if (authStatus === 'authenticated') {
        setCurrentUser('');
        setAuthStatus('unauthenticated');
      }
      return;
    }

    let active = true;

    async function verifyTokenOnNavigation() {
      try {
        const payload = await validateAuthToken(token);
        if (!active) return;

        if (authStatus !== 'authenticated') {
          const username = payload.username || getStoredUsername() || '';
          setCurrentUser(username);
          setAuthStatus('authenticated');
        }
      } catch (err) {
        if (!active) return;
        clearAuthSession();
        setCurrentUser('');
        setAuthStatus('unauthenticated');
        navigate('/login', { replace: true });
      }
    }

    verifyTokenOnNavigation();

    return () => {
      active = false;
    };
  }, [location.pathname, authStatus, navigate]);

  // Listen to unauthorized API response events
  useEffect(() => {
    function handleUnauthorized() {
      clearAuthSession();
      setCurrentUser('');
      setAuthStatus('unauthenticated');
      navigate('/login', { replace: true });
    }

    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
    };
  }, [navigate]);

  async function handleLogout() {
    const token = getStoredAuthToken();

    try {
      if (token) {
        await logoutAuthToken(token);
      }
    } catch {
      // Clear the local session even if the server session is already expired.
    } finally {
      clearAuthSession();
      setCurrentUser('');
      setAuthStatus('unauthenticated');
      navigate('/login', { replace: true });
    }
  }

  function handleLoginSuccess(accessToken, refreshToken, username) {
    storeAuthSession(accessToken, refreshToken, username);
    setCurrentUser(username || '');
    setAuthStatus('authenticated');
    navigate('/', { replace: true });
  }

  if (authStatus === 'checking') {
    return (
      <div className="App app-loading">
        <p>Checking your session...</p>
      </div>
    );
  }

  return (
    <>
      {location.pathname === '/' && (
        <Navbar isAuthenticated={authStatus === 'authenticated'} onLogout={handleLogout} username={currentUser} />
      )}
      <div>
        <div className="App">
          <Routes>
            <Route path="/" element={authStatus === 'authenticated' ? <Home username={currentUser} /> : <Navigate to="/login" replace />} />
            <Route path="/profile" element={authStatus === 'authenticated' ? <Profile /> : <Navigate to="/login" replace />} />
            <Route path="/login" element={authStatus === 'authenticated' ? <Navigate to="/" replace /> : <Login onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/signup" element={authStatus === 'authenticated' ? <Navigate to="/" replace /> : <Signup />} />
            <Route path="*" element={<Navigate to={authStatus === 'authenticated' ? '/' : '/login'} replace />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
