import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChannels, createChannel, getMessagesByChannel, createMessage } from '../services/api';
import '../styles/Channels.css';

const Channels = () => {
  const [channels, setChannels] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChannel, setNewChannel] = useState({ name: '', description: '' });
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState({ title: '', content: '' });
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
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

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    try {
      const { data } = await createChannel(newChannel);
      // Add initial counts to the new channel
      const newChannelWithCounts = {
        ...data,
        message_count: 0,
        member_count: 1 // Initial member count is 1 (the creator)
      };
      setChannels([...channels, newChannelWithCounts]);
      setNewChannel({ name: '', description: '' });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating channel:', error);
    }
  };

  const handleCreateMessage = async (e) => {
    e.preventDefault();
    try {
      const { data } = await createMessage(selectedChannel.id, newMessage);
      setMessages([...messages, data]);
      // Update the message count for the selected channel
      setChannels(channels.map(channel => 
        channel.id === selectedChannel.id
          ? { ...channel, message_count: (channel.message_count || 0) + 1 }
          : channel
      ));
      setIsMessageModalOpen(false);
      setNewMessage({ title: '', content: '' });
    } catch (error) {
      console.error('Error creating message:', error);
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
              <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>
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
    </div>
  );
};

export default Channels; 