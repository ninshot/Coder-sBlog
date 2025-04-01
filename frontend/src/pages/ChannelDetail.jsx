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
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');

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
      setMessages([...messages, data]);
      setIsMessageModalOpen(false);
      setNewMessage({ title: '', content: '' });
    } catch (error) {
      console.error('Error creating message:', error);
    }
  };

  const handleCreateReply = async (messageId) => {
    if (!replyContent.trim()) return;
    
    try {
      const { data } = await createReply(messageId, { content: replyContent });
      console.log('Reply data received:', data);
      
      // Update messages state with the new reply
      setMessages(messages.map(msg => {
        if (msg.id === messageId) {
          console.log('Current message:', msg);
          console.log('Current replies:', msg.replies);
          const updatedReplies = [...(msg.replies || []), {
            id: data.id,
            content: data.content,
            created_at: data.created_at
          }];
          console.log('Updated replies:', updatedReplies);
          return {
            ...msg,
            replies: updatedReplies
          };
        }
        return msg;
      }));
      
      setReplyContent('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error creating reply:', error);
    }
  };

  const handleReplyClick = (message) => {
    setReplyingTo(message.id);
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
              <span className="message-date">
                {new Date(message.created_at).toLocaleString()}
              </span>
            </div>
            <div className="message-content">
              {message.content}
              {message.image_url && (
                <div className="message-image">
                  <img src={message.image_url} alt="Message attachment" />
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
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write your reply..."
                  className="reply-textarea"
                />
                <div className="reply-actions">
                  <button 
                    className="cancel-reply-btn"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent('');
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
                    <div className="reply-content">{reply.content}</div>
                    <div className="reply-meta">
                      {new Date(reply.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Message Modal */}
      <div className={`modal-overlay ${isMessageModalOpen ? 'active' : ''}`}>
        <div className="modal-content">
          <h2 className="modal-title">New Message</h2>
          <form className="message-form" onSubmit={handleCreateMessage}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                value={newMessage.title}
                onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="content">Content</label>
              <textarea
                id="content"
                value={newMessage.content}
                onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                required
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="cancel-btn" onClick={() => setIsMessageModalOpen(false)}>
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