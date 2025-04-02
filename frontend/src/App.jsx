import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Logout from './components/auth/Logout';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Channels from './pages/Channels';
import ChannelDetail from './pages/ChannelDetail';
import './styles/general.css';

const App = () => {
  const isAuthenticated = localStorage.getItem('token') && localStorage.getItem('user');

  return (
    <Router>
      <div>
        <nav>
          {isAuthenticated ? (
            <Logout />
          ) : (
            <div>
              <Link to="/login">Login</Link> | <Link to="/register">Register</Link>
            </div>
          )}
        </nav>

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
    </Router>
  );
};

export default App;
