import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/channel-detail.css';

const ChannelDetail = () => {
  const { channelId } = useParams();
  const [channel, setChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState({ title: '', content: '' });
  const [isCreatingMessage, setIsCreatingMessage] = useState(false);

  useEffect(() => {
    fetchChannelDetails();
    fetchMessages();
  }, [channelId]);

  const fetchChannelDetails = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/channels/${channelId}`);
      const data = await response.json();
      setChannel(data);
    } catch (error) {
      console.error('Error fetching channel details:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/channels/${channelId}/messages`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleCreateMessage = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:3001/api/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMessage),
      });
      
      if (response.ok) {
        const createdMessage = await response.json();
        setMessages([...messages, createdMessage]);
        setIsCreatingMessage(false);
        setNewMessage({ title: '', content: '' });
      }
    } catch (error) {
      console.error('Error creating message:', error);
    }
  };

  if (!channel) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="channel-detail">
      <div className="channel-header">
        <h1 className="channel-title">{channel.name}</h1>
        <p className="channel-description">{channel.description}</p>
        <button 
          className="create-message-btn"
          onClick={() => setIsCreatingMessage(true)}
        >
          Post New Question
        </button>
      </div>

      <div className="messages-section">
        <h2 className="section-title">Questions</h2>
        <div className="messages-grid">
          {messages.map((message) => (
            <div key={message.id} className="message-card">
              <h3 className="message-title">{message.title}</h3>
              <p className="message-content">{message.content}</p>
              <div className="message-meta">
                <span className="message-date">
                  {new Date(message.created_at).toLocaleDateString()}
                </span>
                <span className="message-replies">
                  {message.reply_count || 0} replies
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isCreatingMessage && (
        <div className="modal-overlay" onClick={() => setIsCreatingMessage(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Post New Question</h2>
            <form onSubmit={handleCreateMessage}>
              <div className="form-group">
                <label htmlFor="messageTitle">Question Title</label>
                <input
                  type="text"
                  id="messageTitle"
                  value={newMessage.title}
                  onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="messageContent">Question Details</label>
                <textarea
                  id="messageContent"
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setIsCreatingMessage(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="create-btn">
                  Post Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelDetail; 