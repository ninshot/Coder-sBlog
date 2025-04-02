import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [replies, setReplies] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.isAdmin) {
      navigate('/channels');
      return;
    }

    fetchAllData();
  }, [navigate]);

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [usersRes, channelsRes] = await Promise.all([
        fetch('http://localhost:8000/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch('http://localhost:8000/api/channels', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);

      if (!usersRes.ok || !channelsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const usersData = await usersRes.json();
      const channelsData = await channelsRes.json();

      setUsers(usersData);
      setChannels(channelsData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8000/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete user');
        }

        setUsers(users.filter(user => user.id !== userId));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleDeleteChannel = async (channelId) => {
    if (window.confirm('Are you sure you want to delete this channel? This will also delete all messages and replies in this channel.')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8000/api/admin/channels/${channelId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete channel');
        }

        setChannels(channels.filter(channel => channel.id !== channelId));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Are you sure you want to delete this message? This will also delete all replies to this message.')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8000/api/admin/messages/${messageId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete message');
        }

        setMessages(messages.filter(message => message.id !== messageId));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (window.confirm('Are you sure you want to delete this reply?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8000/api/admin/replies/${replyId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete reply');
        }

        setReplies(replies.filter(reply => reply.id !== replyId));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ marginTop: '60px', padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Admin Dashboard</h1>
      {error && <div style={{ color: 'red' }}>{error}</div>}

      <div style={{ marginBottom: '40px' }}>
        <h2>Users</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Display Name</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.displayName}</td>
                <td>{new Date(user.created_at).toLocaleString()}</td>
                <td>
                  <button 
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={user.id === 1} // Prevent deleting admin
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2>Channels</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Description</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {channels.map(channel => (
              <tr key={channel.id}>
                <td>{channel.id}</td>
                <td>{channel.name}</td>
                <td>{channel.description}</td>
                <td>{new Date(channel.created_at).toLocaleString()}</td>
                <td>
                  <button onClick={() => handleDeleteChannel(channel.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2>Messages</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Content</th>
              <th>Channel</th>
              <th>User</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages.map(message => (
              <tr key={message.id}>
                <td>{message.id}</td>
                <td>{message.title}</td>
                <td>{message.content}</td>
                <td>{message.channel_id}</td>
                <td>{message.displayName}</td>
                <td>{new Date(message.created_at).toLocaleString()}</td>
                <td>
                  <button onClick={() => handleDeleteMessage(message.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h2>Replies</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Content</th>
              <th>Message</th>
              <th>User</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {replies.map(reply => (
              <tr key={reply.id}>
                <td>{reply.id}</td>
                <td>{reply.content}</td>
                <td>{reply.message_id}</td>
                <td>{reply.displayName}</td>
                <td>{new Date(reply.created_at).toLocaleString()}</td>
                <td>
                  <button onClick={() => handleDeleteReply(reply.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard; 