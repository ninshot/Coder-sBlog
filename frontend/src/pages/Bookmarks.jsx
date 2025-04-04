import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBookmarks } from '../services/api';
import '../styles/Bookmarks.css';

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const { data } = await getBookmarks();
      setBookmarks(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      setError('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = (channelId, messageId) => {
    navigate(`/channels/${channelId}#message-${messageId}`);
  };

  if (loading) {
    return <div className="bookmarks-page">Loading bookmarks...</div>;
  }

  if (error) {
    return <div className="bookmarks-page">Error: {error}</div>;
  }

  return (
    <div className="bookmarks-page">
      <div className="bookmarks-header">
        <div className="bookmarks-title">
          <h1>My Bookmarks</h1>
        </div>
      </div>
      <div className="bookmarks-list">
        {bookmarks.length === 0 ? (
          <p className="no-bookmarks">No bookmarked messages yet.</p>
        ) : (
          <div className="bookmarks-container">
            {bookmarks.map((message) => (
              <div 
                key={message.id} 
                className="bookmark-message"
                onClick={() => handleMessageClick(message.channel_id, message.id)}
              >
                <h3>{message.title}</h3>
                <p>{message.content}</p>
                <div className="bookmark-meta">
                  <span>Channel: {message.channelName}</span>
                  <span>Author: {message.authorName}</span>
                  <span>Date: {new Date(message.created_at).toLocaleString()}</span>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookmarks; 
