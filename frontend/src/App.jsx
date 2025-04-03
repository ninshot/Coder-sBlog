import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Logout from './components/auth/Logout';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Channels from './pages/Channels';
import ChannelDetail from './pages/ChannelDetail';
import AdminDashboard from './pages/AdminDashboard';
import SearchPage from './pages/SearchPage';
import UserAnalytics from './pages/UserAnalytics';
import './styles/general.css';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('token') && localStorage.getItem('user');
  const user = isAuthenticated ? JSON.parse(localStorage.getItem('user')) : null;
  const isAdmin = user?.isAdmin;
  const isAdminPage = location.pathname === '/admin';
  const isUserAnalyticsPage = location.pathname.includes('/users/') && location.pathname.includes('/analytics');

  if (isAuthenticated) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '0 1rem',
        width: '100%'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: '1' }}>
          {location.pathname === '/search' && (
            <button
              onClick={() => navigate('/channels')}
              style={{
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
                e.currentTarget.style.border = '1px solid black';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'black';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.border = '1px solid black';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Home
            </button>
          )}
          {(location.pathname.includes('/channels/') || isAdminPage) && (
            <Link 
              to="/channels" 
              style={{ 
                textDecoration: 'none',
                padding: '0.75rem',
                background: 'black',
                color: 'white',
                border: '1px solid black',
                borderRadius: '4px',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontWeight: '500'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = 'black';
                e.currentTarget.style.border = '1px solid black';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'black';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.border = '1px solid black';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {isAdminPage ? 'Back to Channels' : 'Home'}
            </Link>
          )}
          {isAdmin && !isAdminPage && !isUserAnalyticsPage ? (
            <Link 
              to="/admin" 
              style={{ 
                textDecoration: 'none',
                padding: '0.75rem',
                background: 'black',
                color: 'white',
                border: '1px solid black',
                borderRadius: '4px',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontWeight: '500'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = 'black';
                e.currentTarget.style.border = '1px solid black';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'black';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.border = '1px solid black';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Admin Dashboard
            </Link>
          ) : null}
          {location.pathname.includes('/users/') && location.pathname.includes('/analytics') ? (
            <Link 
              to="/channels" 
              style={{ 
                textDecoration: 'none',
                padding: '0.75rem',
                background: 'black',
                color: 'white',
                border: '1px solid black',
                borderRadius: '4px',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontWeight: '500',
                marginLeft: '1rem'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = 'black';
                e.currentTarget.style.border = '1px solid black';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'black';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.border = '1px solid black';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Home
            </Link>
          ) : (
            <Link 
              to={`/users/${user?.id}/analytics`}
              style={{ 
                textDecoration: 'none',
                padding: '0.75rem',
                background: 'black',
                color: 'white',
                border: '1px solid black',
                borderRadius: '4px',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontWeight: '500',
                marginLeft: '1rem'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = 'black';
                e.currentTarget.style.border = '1px solid black';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'black';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.border = '1px solid black';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {user?.username}
            </Link>
          )}
        </div>
        <div style={{ 
          flex: '1',
          textAlign: 'center',
          color: 'white',
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}>
          Code Connect
        </div>
        <div style={{ display: 'flex', gap: '1rem', flex: '1', justifyContent: 'flex-end' }}>
          {location.pathname !== '/search' && (
            <button
              onClick={() => navigate('/search')}
              style={{
                padding: '0.75rem',
                background: 'black',
                color: 'white',
                border: '1px solid black',
                borderRadius: '4px',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontWeight: '500'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = 'black';
                e.currentTarget.style.border = '1px solid black';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'black';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.border = '1px solid black';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Search
            </button>
          )}
          <Logout />
        </div>
      </div>
    );
  }

  // Show only Register link on login page
  if (location.pathname === '/login') {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1rem', width: '100%' }}>
        <div style={{ flex: '1' }}></div>
        <div style={{ 
          flex: '1',
          textAlign: 'center',
          color: 'white',
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}>
          Code Connect
        </div>
        <div style={{ flex: '1', textAlign: 'right' }}>
          <Link to="/register" style={{ textDecoration: 'none', color: 'white' }}>Register</Link>
        </div>
      </div>
    );
  }

  // Show only Login link on register page
  if (location.pathname === '/register') {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1rem', width: '100%' }}>
        <div style={{ flex: '1' }}></div>
        <div style={{ 
          flex: '1',
          textAlign: 'center',
          color: 'white',
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}>
          Code Connect
        </div>
        <div style={{ flex: '1', textAlign: 'right' }}>
          <Link to="/login" style={{ textDecoration: 'none', color: 'white' }}>Login</Link>
        </div>
      </div>
    );
  }

  // Show both links on other pages
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1rem', width: '100%' }}>
      <div style={{ flex: '1' }}></div>
      <div style={{ 
        flex: '1',
        textAlign: 'center',
        color: 'white',
        fontSize: '1.5rem',
        fontWeight: 'bold'
      }}>
        Code Connect
      </div>
      <div style={{ flex: '1', textAlign: 'right' }}>
        <Link to="/login" style={{ textDecoration: 'none', color: 'white', marginRight: '1rem' }}>Login</Link>
        <Link to="/register" style={{ textDecoration: 'none', color: 'white' }}>Register</Link>
      </div>
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
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/search" element={<SearchPage />} />
            <Route
              path="/users/:userId/analytics"
              element={
                <ProtectedRoute>
                  <UserAnalytics />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
