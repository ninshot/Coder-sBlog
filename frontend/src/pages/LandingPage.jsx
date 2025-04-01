import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/landing.css';

function LandingPage() {
  return (
    <div className="landing-page">
      <div className="container">
        <h1 className="title">Welcome to CodeConnect</h1>
        <p className="subtitle">A dedicated platform for programmers to connect, share knowledge, and solve problems together</p>
      </div>

      <div className="features-section">
        <div className="container">
          <h2 className="section-title">What is CodeConnect?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>Programming Community</h3>
              <p>Join a vibrant community of developers where you can ask questions, share solutions, and learn from others.</p>
            </div>
            <div className="feature-card">
              <h3>Topic-Based Channels</h3>
              <p>Organize discussions into channels based on programming languages, frameworks, or specific topics.</p>
            </div>
            <div className="feature-card">
              <h3>Rich Content Sharing</h3>
              <p>Share code snippets, screenshots, and detailed explanations to better communicate your questions and solutions.</p>
            </div>
            <div className="feature-card">
              <h3>Interactive Discussions</h3>
              <p>Engage in meaningful discussions with threaded replies and real-time updates.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <div className="container">
          <h2 className="section-title">Ready to Start?</h2>
          <p className="cta-text">Join our community and start exploring programming channels today!</p>
          <Link to="/channels" className="btn btn-primary">
            Explore Channels
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LandingPage; 