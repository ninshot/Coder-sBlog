import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChannels, createChannel } from '../services/api';
import '../styles/channels.css';

const Channels = () => {
  const [channels, setChannels] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChannel, setNewChannel] = useState({ name: '', description: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const { data } = await getChannels();
      setChannels(data);
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    try {
      const { data } = await createChannel(newChannel);
      setChannels([...channels, data]);
      setIsModalOpen(false);
      setNewChannel({ name: '', description: '' });
    } catch (error) {
      console.error('Error creating channel:', error);
    }
  };

  const handleChannelClick = (channelId) => {
    navigate(`/channels/${channelId}`);
  };

  return (
    <div className="channels-page">
      <div className="channels-content">
        <div className="channels-header">
          <div className="channels-header-text">
            <h1 className="channels-title">Programming Channels</h1>
          </div>
          <div className="channels-header-actions">
            <button 
              className="channels-btn"
              onClick={() => setIsModalOpen(true)}
            >
              New Channel
            </button>
          </div>
        </div>

        <div className="channels-grid">
          {channels.map((channel) => (
            <div 
              key={channel.id} 
              className="channel-card"
              onClick={() => handleChannelClick(channel.id)}
            >
              <div className="channel-name-div">
                <h2 className="channel-name">{channel.name}</h2>
              </div>
              <div className="channel-description-div">
                <p className="channel-description">{channel.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Create New Channel</h2>
            <form onSubmit={handleCreateChannel} className="channel-form">
              <div className="form-group">
                <label htmlFor="channelName">Name</label>
                <input
                  type="text"
                  id="channelName"
                  value={newChannel.name}
                  onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                  placeholder="Enter channel name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="channelDescription">Description</label>
                <textarea
                  id="channelDescription"
                  value={newChannel.description}
                  onChange={(e) => setNewChannel({ ...newChannel, description: e.target.value })}
                  placeholder="Enter channel description"
                  required
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setIsModalOpen(false)}
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