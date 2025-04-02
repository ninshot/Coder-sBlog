import React from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <button 
      onClick={handleLogout}
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
      Logout
    </button>
  );
};

export default Logout; 