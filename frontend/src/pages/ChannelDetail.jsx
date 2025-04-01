import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChannelById, getMessagesByChannel, createMessage, createReply } from '../services/api';
import '../styles/channelDetail.css';

const ChannelDetail = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const [channel, setChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState({ title: '', content: '' });
  const [newReply, setNewReply] = useState({ content: '' });
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);

  useEffect(() => {
    fetchChannelDetails();
    fetchMessages();
  }, [channelId]);

  const fetchChannelDetails = async () => {
    try {
      const { data } = await getChannelById(channelId);
      setChannel(data);
    } catch (error) {
      console.error('Error fetching channel details:', error);
      navigate('/channels');
    }
  };

  const fetchMessages = async () => {
    try {
      const { data } = await getMessagesByChannel(channelId);
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleCreateMessage = async (e) => {
    e.preventDefault();
    try {
      const { data } = await createMessage(channelId, newMessage);
      setMessages([data, ...messages]);
      setIsMessageModalOpen(false);
      setNewMessage({ title: '', content: '' });
    } catch (error) {
      console.error('Error creating message:', error);
    }
  };

  const handleCreateReply = async (e) => {
    e.preventDefault();
    try {
      const { data } = await createReply(selectedMessage.id, newReply);
      setMessages(messages.map(msg => 
        msg.id === selectedMessage.id 
          ? { ...msg, replies: [...(msg.replies || []), data] }
          : msg
      ));
      setIsReplyModalOpen(false);
      setNewReply({ content: '' });
    } catch (error) {
      console.error('Error creating reply:', error);
    }
  };

  const handleReplyClick = (message) => {
    setSelectedMessage(message);
    setIsReplyModalOpen(true);
  };

  if (!channel) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="channel-detail-page">
      <div className="channel-header-bar">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/channels')}>
            ← Back
          </button>
        </div>
        <div className="header-center">
          <h1>{channel.name}</h1>
        </div>
        <div className="header-right">
          <button 
            className="new-message-btn"
            onClick={() => setIsMessageModalOpen(true)}
          >
            New Message
          </button>
        </div>
      </div>

      <div className="channel-description">
        <h2>Channel Description</h2>
        <p>{channel.description}</p>
      </div>

      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className="message-card">
            <div className="message-header">
              <h3 className="message-title">{message.title}</h3>
              <span className="message-meta">
                {new Date(message.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="message-content">
              {message.content}
            </div>
            <div className="message-actions">
              <button className="reply-btn">
                Reply
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Message Modal */}
      {isMessageModalOpen && (
        <div className="modal-overlay" onClick={() => setIsMessageModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Create New Message</h2>
            <form onSubmit={handleCreateMessage} className="message-form">
              <div className="form-group">
                <label htmlFor="messageTitle">Title</label>
                <input
                  type="text"
                  id="messageTitle"
                  value={newMessage.title}
                  onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
                  placeholder="Enter message title"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="messageContent">Content</label>
                <textarea
                  id="messageContent"
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                  placeholder="Enter message content"
                  required
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setIsMessageModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="create-btn">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {isReplyModalOpen && (
        <div className="modal-overlay" onClick={() => setIsReplyModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Reply to Message</h2>
            <form onSubmit={handleCreateReply} className="message-form">
              <div className="form-group">
                <label htmlFor="replyContent">Your Reply</label>
                <textarea
                  id="replyContent"
                  value={newReply.content}
                  onChange={(e) => setNewReply({ content: e.target.value })}
                  placeholder="Enter your reply"
                  required
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setIsReplyModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="create-btn">
                  Reply
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