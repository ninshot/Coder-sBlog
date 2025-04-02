import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Logout from './components/auth/Logout';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Channels from './pages/Channels';
import ChannelDetail from './pages/ChannelDetail';
import './styles/general.css';

const Navigation = () => {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('token') && localStorage.getItem('user');

  if (isAuthenticated) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        padding: '0 1rem',
        width: '100%'
      }}>
        {location.pathname.includes('/channels/') && (
          <Link 
            to="/channels" 
            style={{ 
              textDecoration: 'none',
              padding: '0.75rem',
              background: 'black',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontWeight: '500'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = 'black';
              e.currentTarget.style.border = '2px solid black';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'black';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.border = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Home
          </Link>
        )}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Logout />
        </div>
      </div>
    );
  }

  // Show only Register link on login page
  if (location.pathname === '/login') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 1rem' }}>
        <Link to="/register" style={{ textDecoration: 'none', color: 'white' }}>Register</Link>
      </div>
    );
  }

  // Show only Login link on register page
  if (location.pathname === '/register') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 1rem' }}>
        <Link to="/login" style={{ textDecoration: 'none', color: 'white' }}>Login</Link>
      </div>
    );
  }

  // Show both links on other pages
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 1rem' }}>
      <Link to="/login" style={{ textDecoration: 'none', color: 'white' }}>Login</Link>
      <Link to="/register" style={{ textDecoration: 'none', color: 'white', marginLeft: '1rem' }}>Register</Link>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <div>
        <nav style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          padding: '1rem 0',
          zIndex: 1000,
          backgroundColor: 'black',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          width: '100%'
        }}>
          <Navigation />
        </nav>

        <div style={{ marginTop: '60px' }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/channels"
              element={
                <ProtectedRoute>
                  <Channels />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<LandingPage />} />
            <Route path="/channels/:channelId" element={<ChannelDetail />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
