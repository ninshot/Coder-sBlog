import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChannelById, getMessagesByChannel, createMessage, createReply } from '../services/api';
import '../styles/channelDetail.css';

const ChannelDetail = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const [channel, setChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState({
    title: '',
    content: '',
    image: null
  });
  const [newReply, setNewReply] = useState({ 
    content: '',
    image: null 
  });
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [messageImagePreview, setMessageImagePreview] = useState(null);
  const [replyImagePreview, setReplyImagePreview] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchChannelDetails();
    fetchMessages();
    fetchUser();
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
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/channels/${channelId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      console.log('Fetched messages data:', data); // Debug log
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError(error.message);
    }
  };

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
      setError(error.message);
    }
  };

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        e.target.value = ''; // Clear the input
        return;
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only JPEG, JPG, PNG, and GIF files are allowed');
        e.target.value = ''; // Clear the input
        return;
      }

      console.log('Selected file:', file);
      console.log('File size:', file.size);
      console.log('File type:', file.type);

      setError(null);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        console.log('FileReader loaded successfully');
        if (type === 'message') {
          setNewMessage(prev => ({ ...prev, image: file }));
          setMessageImagePreview(event.target.result);
          console.log('Message preview set:', event.target.result);
        } else {
          setNewReply(prev => ({ ...prev, image: file }));
          setReplyImagePreview(event.target.result);
          console.log('Reply preview set:', event.target.result);
        }
      };
      
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        setError('Error reading file. Please try again.');
      };

      reader.readAsDataURL(file);
    }
  };

  const handleCreateMessage = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!token || !user) {
        throw new Error('Not authenticated');
      }

      const formData = new FormData();
      formData.append('title', newMessage.title);
      formData.append('content', newMessage.content);
      formData.append('user_id', user.id);
      formData.append('displayName', user.displayName);
      
      if (newMessage.image) {
        formData.append('image', newMessage.image);
      }

      const response = await fetch(`http://localhost:8000/api/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create message');
      }

      const data = await response.json();
      console.log('Message created:', data);
      
      // Reset form
      setNewMessage({ title: '', content: '', image: null });
      setMessageImagePreview(null);
      setIsMessageModalOpen(false);
      
      // Refresh messages
      fetchMessages();
    } catch (error) {
      console.error('Error creating message:', error);
      setError(error.message);
    }
  };

  const handleCreateReply = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      console.log('User data from localStorage:', user); // Debug log
      
      if (!token || !user) {
        throw new Error('Not authenticated');
      }

      const formData = new FormData();
      formData.append('content', newReply.content);
      formData.append('user_id', user.id);
      formData.append('displayName', user.displayName);
      
      console.log('FormData entries:'); // Debug log
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }
      
      if (newReply.image) {
        formData.append('image', newReply.image);
      }

      const response = await fetch(`http://localhost:8000/api/messages/${messageId}/replies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create reply');
      }

      const data = await response.json();
      console.log('Reply created with data:', data); // Debug log
      
      // Reset reply form
      setNewReply({ content: '', image: null });
      setReplyImagePreview(null);
      setReplyingTo(null);
      
      // Refresh messages
      fetchMessages();
    } catch (error) {
      console.error('Error creating reply:', error);
      setError(error.message);
    }
  };

  const handleReplyClick = (message) => {
    setReplyingTo(message.id);
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`http://localhost:8000/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete message');
      }

      // Refresh messages
      fetchMessages();
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Error deleting message:', error);
      setError(error.message);
      // Show error message for 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteReply = async (replyId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`http://localhost:8000/api/replies/${replyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete reply');
      }

      // Refresh messages
      fetchMessages();
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Error deleting reply:', error);
      setError(error.message);
      // Show error message for 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  };

  if (!channel) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="channel-detail-page" style={{ marginTop: '60px' }}>
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
            type="button"
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
              <div className="message-user-info">
                <div className="message-user-details">
                  <span className="message-username" style={{ fontWeight: 'bold' }}>{message.displayName || 'Anonymous'}</span>
                  <h3 className="message-title">{message.title}</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className="message-date">
                    {new Date(message.created_at + 'Z').toLocaleString('en-US', { 
                      timeZone: 'America/Regina',
                      hour12: true,
                      hour: '2-digit',
                      minute: '2-digit',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                  {(user?.isAdmin || message.user_id === user?.id) && (
                    <button 
                      onClick={() => handleDeleteMessage(message.id)}
                      style={{
                        padding: '0.5rem',
                        background: 'red',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.color = 'red';
                        e.currentTarget.style.border = '2px solid red';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'red';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.border = 'none';
                      }}
                    >
                      Delete Message
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="message-content">
              <p>{message.content}</p>
              {message.image_url && (
                <div className="message-image">
                  <img src={`http://localhost:8000${message.image_url}`} alt="Message attachment" />
                </div>
              )}
            </div>
            <div className="message-actions">
              <button 
                className="reply-btn"
                onClick={() => handleReplyClick(message)}
              >
                Reply
              </button>
            </div>
            
            {replyingTo === message.id && (
              <div className="reply-section">
                <textarea
                  value={newReply.content}
                  onChange={(e) => setNewReply({ ...newReply, content: e.target.value })}
                  placeholder="Write your reply..."
                  className="reply-textarea"
                />
                <div className="form-group">
                  <label htmlFor="replyImage" className="file-input-label">
                    Upload Image
                    <input
                      type="file"
                      id="replyImage"
                      name="image"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 'reply')}
                      className="file-input"
                    />
                  </label>
                  {replyImagePreview && (
                    <div className="image-preview">
                      <img src={replyImagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                    </div>
                  )}
                </div>
                <div className="reply-actions">
                  <button 
                    className="cancel-reply-btn"
                    onClick={() => {
                      setReplyingTo(null);
                      setNewReply({ content: '', image: null });
                      setReplyImagePreview(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="submit-reply-btn"
                    onClick={() => handleCreateReply(message.id)}
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}

            {message.replies && message.replies.length > 0 && (
              <div className="replies-section">
                {message.replies.map((reply) => (
                  <div key={reply.id} className="reply-card">
                    <div className="reply-user-info">
                      <div className="reply-user-details">
                        <span className="reply-username" style={{ fontWeight: 'bold' }}>{reply.displayName || 'Anonymous'}</span>
                        <div className="reply-content">{reply.content}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span className="reply-date">
                          {new Date(reply.created_at + 'Z').toLocaleString('en-US', { 
                            timeZone: 'America/Regina',
                            hour12: true,
                            hour: '2-digit',
                            minute: '2-digit',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        {(user?.isAdmin || reply.user_id === user?.id) && (
                          <button 
                            onClick={() => handleDeleteReply(reply.id)}
                            style={{
                              padding: '0.5rem',
                              background: 'red',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.9rem',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = 'white';
                              e.currentTarget.style.color = 'red';
                              e.currentTarget.style.border = '2px solid red';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = 'red';
                              e.currentTarget.style.color = 'white';
                              e.currentTarget.style.border = 'none';
                            }}
                          >
                            Delete Reply
                          </button>
                        )}
                      </div>
                    </div>
                    {reply.image_url && (
                      <div className="reply-image">
                        <img src={`http://localhost:8000${reply.image_url}`} alt="Reply attachment" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Message Modal */}
      <div className={`modal-overlay ${isMessageModalOpen ? 'active' : ''}`} onClick={() => setIsMessageModalOpen(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h2>New Message</h2>
          <form onSubmit={handleCreateMessage} encType="multipart/form-data">
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                value={newMessage.title}
                onChange={(e) => setNewMessage(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="content">Content</label>
              <textarea
                id="content"
                value={newMessage.content}
                onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="messageImage" className="file-input-label">
                Upload Image
                <input
                  type="file"
                  id="messageImage"
                  name="image"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, 'message')}
                  className="file-input"
                />
              </label>
              {messageImagePreview && (
                <div className="image-preview">
                  <img 
                    src={messageImagePreview} 
                    alt="Preview" 
                    style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                  />
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={() => {
                  setIsMessageModalOpen(false);
                  setNewMessage({ title: '', content: '', image: null });
                  setMessageImagePreview(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="create-btn">
                Send
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Reply Modal */}
      <div className={`modal-overlay ${isReplyModalOpen ? 'active' : ''}`} onClick={() => setIsReplyModalOpen(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h2 className="modal-title">Reply to Message</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleCreateReply(replyingTo);
          }} className="message-form" encType="multipart/form-data">
            <div className="form-group">
              <label htmlFor="replyContent">Your Reply</label>
              <textarea
                id="replyContent"
                value={newReply.content}
                onChange={(e) => setNewReply(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter your reply"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="replyImage" className="file-input-label">
                Upload Image
                <input
                  type="file"
                  id="replyImage"
                  name="image"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, 'reply')}
                  className="file-input"
                />
              </label>
              {replyImagePreview && (
                <div className="image-preview">
                  <img 
                    src={replyImagePreview} 
                    alt="Preview" 
                    style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                  />
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={() => {
                  setIsReplyModalOpen(false);
                  setNewReply({ content: '', image: null });
                  setReplyImagePreview(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="create-btn">
                Send Reply
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChannelDetail; 