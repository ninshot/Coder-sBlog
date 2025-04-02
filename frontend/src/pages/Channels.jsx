import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChannels, createChannel, getMessagesByChannel, createMessage } from '../services/api';
import '../styles/channels.css';

const Channels = () => {
  const [channels, setChannels] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChannel, setNewChannel] = useState({ name: '', description: '' });
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState({ 
    title: '', 
    content: '',
    image: null 
  });
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      fetchMessages(selectedChannel.id);
    }
  }, [selectedChannel]);

  const fetchChannels = async () => {
    try {
      const { data } = await getChannels();
      // Fetch message counts for each channel
      const channelsWithCounts = await Promise.all(
        data.map(async (channel) => {
          const { data: messages } = await getMessagesByChannel(channel.id);
          return {
            ...channel,
            message_count: messages.length,
            member_count: channel.members?.length || 0
          };
        })
      );
      setChannels(channelsWithCounts);
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  const fetchMessages = async (channelId) => {
    try {
      const { data } = await getMessagesByChannel(channelId);
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setNewChannel({ name: '', description: '' });
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    try {
      await createChannel(newChannel);
      setNewChannel({ name: '', description: '' });
      setIsModalOpen(false);
      fetchChannels();
    } catch (error) {
      console.error('Error creating channel:', error);
      alert('Failed to create channel. Please try again.');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        e.target.value = ''; // Clear the input
        return;
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only JPEG, JPG, PNG, and GIF files are allowed');
        e.target.value = ''; // Clear the input
        return;
      }

      setNewMessage(prev => ({ ...prev, image: file }));
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateMessage = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', newMessage.title);
      formData.append('content', newMessage.content);
      if (newMessage.image) {
        formData.append('image', newMessage.image);
      }
      
      const { data } = await createMessage(selectedChannel.id, formData);
      setMessages([...messages, data]);
      // Update the message count for the selected channel
      setChannels(channels.map(channel => 
        channel.id === selectedChannel.id
          ? { ...channel, message_count: (channel.message_count || 0) + 1 }
          : channel
      ));
      setIsMessageModalOpen(false);
      setNewMessage({ title: '', content: '', image: null });
      setImagePreview(null);
    } catch (error) {
      console.error('Error creating message:', error);
      alert('Failed to create message. Please try again.');
    }
  };

  const handleChannelClick = (channel) => {
    navigate(`/channels/${channel.id}`);
  };

  return (
    <div className="channels-page">
      <div className="channels-header-bar">
        <div className="header-left">
          <h1>Channels</h1>
        </div>
        <div className="header-right">
          <button 
            className="new-channel-btn"
            onClick={() => setIsModalOpen(true)}
          >
            New Channel
          </button>
        </div>
      </div>

      <div className="channels-content">
        <div className="channels-grid">
          {channels.map((channel) => (
            <div 
              key={channel.id} 
              className="channel-card"
              onClick={() => handleChannelClick(channel)}
            >
              <h2 className="channel-name">{channel.name}</h2>
              <p className="description">{channel.description}</p>
              <div className="channel-meta">
                <span>{channel.message_count || 0} messages</span>
                <span>{channel.member_count || 0} members</span>
              </div>
            </div>
          ))}
        </div>

        {selectedChannel && (
          <div className="messages-section">
            <div className="messages-header">
              <h2>{selectedChannel.name}</h2>
              <button 
                className="channels-btn"
                onClick={() => setIsMessageModalOpen(true)}
              >
                New Message
              </button>
            </div>
            <div className="messages-list">
              {messages.map((message) => (
                <div key={message.id} className="message-card">
                  <h3>{message.title}</h3>
                  <p>{message.content}</p>
                  <div className="message-meta">
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
                  </div>
                  <div className="message-actions">
                    <button className="reply-btn">Reply</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Channel Modal */}
      <div className={`modal-overlay ${isModalOpen ? 'active' : ''}`}>
        <div className="modal-content">
          <h2 className="modal-title">Create New Channel</h2>
          <form className="channel-form" onSubmit={handleCreateChannel}>
            <div className="form-group">
              <label htmlFor="name">Channel Name</label>
              <input
                type="text"
                id="name"
                value={newChannel.name}
                onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={newChannel.description}
                onChange={(e) => setNewChannel({ ...newChannel, description: e.target.value })}
                required
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="create-btn">
                Create
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Message Creation Modal */}
      {isMessageModalOpen && (
        <div className="modal-overlay" onClick={() => setIsMessageModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Create New Message</h2>
            <form onSubmit={handleCreateMessage} className="channel-form">
              <div className="form-group">
                <label htmlFor="messageTitle">Title</label>
                <input
                  type="text"
                  id="messageTitle"
                  value={newMessage.title}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter message title"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="messageContent">Content</label>
                <textarea
                  id="messageContent"
                  value={newMessage.content}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter message content"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="image" className="file-input-label">
                  Add Screenshot
                  <input
                    type="file"
                    id="image"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleImageChange}
                    className="file-input"
                  />
                </label>
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
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
                    setImagePreview(null);
                  }}
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
    </div>
  );
};

export default Channels; 