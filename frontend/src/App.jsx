import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Channels from './pages/Channels';
import ChannelDetail from './pages/ChannelDetail';
import './styles/general.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/channels" element={<Channels />} />
        <Route path="/channels/:channelId" element={<ChannelDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
