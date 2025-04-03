import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChannelById, getMessagesByChannel, createMessage, createReply, voteMessage, voteReply, getMessageVoteStatus, getReplyVoteStatus } from '../services/api';
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
  const [parentReplyId, setParentReplyId] = useState(null);
  const [replyingToReplyId, setReplyingToReplyId] = useState(null);
  const [messageImagePreview, setMessageImagePreview] = useState(null);
  const [replyImagePreview, setReplyImagePreview] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [messageVotes, setMessageVotes] = useState({});
  const [replyVotes, setReplyVotes] = useState({});
  const [sortType, setSortType] = useState('date'); // 'date' or 'votes'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' or 'asc'

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
      console.log('Raw messages data:', data); // Debug log
      
      // Process the messages to organize nested replies
      const processedMessages = data.map(message => {
        if (message.replies) {
          // Parse the replies JSON string if it's a string
          const replies = typeof message.replies === 'string' ? JSON.parse(message.replies) : message.replies;
          
          // Create a map of all replies for quick lookup
          const replyMap = new Map();
          replies.forEach(reply => {
            replyMap.set(reply.id, { ...reply });
          });

          // Organize replies into a tree structure
          const organizedReplies = [];
          replies.forEach(reply => {
            if (reply.parent_reply_id) {
              // This is a nested reply, find its parent and add it
              const parentReply = replyMap.get(reply.parent_reply_id);
              if (parentReply) {
                if (!parentReply.replies) {
                  parentReply.replies = [];
                }
                parentReply.replies.push(replyMap.get(reply.id));
              } else {
                console.warn(`Parent reply ${reply.parent_reply_id} not found for reply ${reply.id}`);
              }
            } else {
              // This is a top-level reply
              organizedReplies.push(replyMap.get(reply.id));
            }
          });

          // Sort replies by creation date
          const sortReplies = (replies) => {
            replies.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            replies.forEach(reply => {
              if (reply.replies && reply.replies.length > 0) {
                sortReplies(reply.replies);
              }
            });
          };

          sortReplies(organizedReplies);
          return { ...message, replies: organizedReplies };
        }
        return message;
      });

      console.log('Processed messages with organized replies:', processedMessages); // Debug log
      setMessages(processedMessages);

      // Initialize vote status for messages and replies
      const messageVotes = {};
      const replyVotes = {};

      for (const message of processedMessages) {
        try {
          const { data } = await getMessageVoteStatus(message.id);
          messageVotes[message.id] = data.voteType;
        } catch (error) {
          console.error(`Error fetching vote status for message ${message.id}:`, error);
        }

        if (message.replies) {
          for (const reply of message.replies) {
            try {
              const { data } = await getReplyVoteStatus(reply.id);
              replyVotes[reply.id] = data.voteType;
            } catch (error) {
              console.error(`Error fetching vote status for reply ${reply.id}:`, error);
            }
          }
        }
      }

      setMessageVotes(messageVotes);
      setReplyVotes(replyVotes);
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
      
      if (!token || !user) {
        throw new Error('Not authenticated');
      }

      const formData = new FormData();
      formData.append('content', newReply.content);
      formData.append('user_id', user.id);
      formData.append('displayName', user.displayName);
      
      if (newReply.image) {
        formData.append('image', newReply.image);
      }

      // Set parent_reply_id if replying to a reply
      if (replyingToReplyId) {
        formData.append('parent_reply_id', replyingToReplyId);
        console.log('Setting parent_reply_id to:', replyingToReplyId); // Debug log
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
      console.log('Reply created with data:', data);
      
      // Reset reply form and state
      setNewReply({ content: '', image: null });
      setReplyImagePreview(null);
      setReplyingTo(null);
      setParentReplyId(null);
      setReplyingToReplyId(null);
      
      // Refresh messages to get updated nested replies structure
      fetchMessages();
    } catch (error) {
      console.error('Error creating reply:', error);
      setError(error.message);
    }
  };

  const handleReplyClick = (message, replyId = null) => {
    // Clear all reply states first
    setReplyingTo(null);
    setReplyingToReplyId(null);
    setParentReplyId(null);
    
    // Then set the appropriate state
    if (replyId) {
      setReplyingToReplyId(replyId);
      setParentReplyId(replyId);
    } else {
      setReplyingTo(message.id);
    }
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

  const handleVote = async (id, type, isMessage = true) => {
    try {
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to vote');
        setTimeout(() => setError(null), 3000);
        return;
      }

      // Make the vote API call
      if (isMessage) {
        await voteMessage(id, type);
      } else {
        await voteReply(id, type);
      }

      // Get the updated vote status
      const { data } = isMessage ? 
        await getMessageVoteStatus(id) : 
        await getReplyVoteStatus(id);

      // Update the vote status in state
      if (isMessage) {
        setMessageVotes(prev => ({ ...prev, [id]: data.voteType }));
      } else {
        setReplyVotes(prev => ({ ...prev, [id]: data.voteType }));
      }

      // Fetch messages to get updated vote counts
      await fetchMessages();
    } catch (error) {
      console.error('Error voting:', error);
      setError(error.message || 'Error voting. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const NestedReplies = ({ replies, message, user }) => {
    console.log('Rendering NestedReplies with:', replies); // Debug log
    
    if (!replies || replies.length === 0) return null;

    return (
      <div className="nested-replies-section">
        {replies.map((nestedReply) => {
          console.log('Processing nested reply:', nestedReply); // Debug log
          return (
            <div key={nestedReply.id} className="nested-reply-item">
              <div className="nested-reply-user-info">
                <div className="nested-reply-user-details">
                  <span className="nested-reply-username">{nestedReply.displayName}</span>
                  <span className="nested-reply-date">
                    {new Date(nestedReply.created_at + 'Z').toLocaleString('en-US', { 
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
                {nestedReply.user_id === user?.id && (
                  <div className="nested-reply-actions">
                    <button
                      className="delete-reply-btn"
                      onClick={() => handleDeleteReply(nestedReply.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <div className="nested-reply-content">
                {nestedReply.content}
                {nestedReply.image_url && (
                  <div className="reply-image">
                    <img src={`http://localhost:8000${nestedReply.image_url}`} alt="Reply attachment" />
                  </div>
                )}
              </div>
              <div className="vote-buttons">
                <button 
                  className={`vote-btn upvote ${replyVotes[nestedReply.id] === 'upvote' ? 'active' : ''}`}
                  onClick={() => handleVote(nestedReply.id, 'upvote', false)}
                >
                  ↑ {nestedReply.upvotes || 0}
                </button>
                <button 
                  className={`vote-btn downvote ${replyVotes[nestedReply.id] === 'downvote' ? 'active' : ''}`}
                  onClick={() => handleVote(nestedReply.id, 'downvote', false)}
                >
                  ↓ {nestedReply.downvotes || 0}
                </button>
              </div>
              {/* Recursively render nested replies */}
              {nestedReply.replies && nestedReply.replies.length > 0 && (
                <NestedReplies replies={nestedReply.replies} message={message} user={user} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const handleSortClick = () => {
    setSortOrder(prevOrder => prevOrder === 'desc' ? 'asc' : 'desc');
    const sortedMessages = [...messages].sort((a, b) => {
      if (sortType === 'date') {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        const votesA = (a.upvotes || 0) - (a.downvotes || 0);
        const votesB = (b.upvotes || 0) - (b.downvotes || 0);
        return sortOrder === 'desc' ? votesB - votesA : votesA - votesB;
      }
    });
    setMessages(sortedMessages);
  };

  const handleSortTypeChange = (e) => {
    setSortType(e.target.value);
    const sortedMessages = [...messages].sort((a, b) => {
      if (e.target.value === 'date') {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        const votesA = (a.upvotes || 0) - (a.downvotes || 0);
        const votesB = (b.upvotes || 0) - (b.downvotes || 0);
        return sortOrder === 'desc' ? votesB - votesA : votesA - votesB;
      }
    });
    setMessages(sortedMessages);
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
          <div className="sort-container">
            <select 
              value={sortType} 
              onChange={handleSortTypeChange}
              className="sort-select"
            >
              <option value="date">Date</option>
              <option value="votes">Votes</option>
            </select>
            <button 
              className="sort-btn"
              onClick={handleSortClick}
            >
              Sort {sortOrder === 'desc' ? '↓' : '↑'}
            </button>
          </div>
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
                      className="delete-message-btn"
                    >
                      Delete
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
              <div className="vote-buttons">
                <button 
                  className={`vote-btn upvote ${messageVotes[message.id] === 'upvote' ? 'active' : ''}`}
                  onClick={() => handleVote(message.id, 'upvote', true)}
                >
                  ↑ {message.upvotes || 0}
                </button>
                <button 
                  className={`vote-btn downvote ${messageVotes[message.id] === 'downvote' ? 'active' : ''}`}
                  onClick={() => handleVote(message.id, 'downvote', true)}
                >
                  ↓ {message.downvotes || 0}
                </button>
              </div>
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
                      setReplyingToReplyId(null);
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
                        <div className="vote-buttons">
                          <button 
                            className={`vote-btn upvote ${replyVotes[reply.id] === 'upvote' ? 'active' : ''}`}
                            onClick={() => handleVote(reply.id, 'upvote', false)}
                          >
                            ↑ {reply.upvotes || 0}
                          </button>
                          <button 
                            className={`vote-btn downvote ${replyVotes[reply.id] === 'downvote' ? 'active' : ''}`}
                            onClick={() => handleVote(reply.id, 'downvote', false)}
                          >
                            ↓ {reply.downvotes || 0}
                          </button>
                        </div>
                        <button 
                          onClick={() => handleReplyClick(message, reply.id)}
                          className="reply-btn"
                        >
                          Reply
                        </button>
                        {(user?.isAdmin || reply.user_id === user?.id) && (
                          <button 
                            onClick={() => handleDeleteReply(reply.id)}
                            className="delete-reply-btn"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    {reply.image_url && (
                      <div className="reply-image">
                        <img src={`http://localhost:8000${reply.image_url}`} alt="Reply attachment" />
                      </div>
                    )}
                    {replyingToReplyId === reply.id && (
                      <div className="reply-section" style={{ marginTop: '1rem' }}>
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
                              setReplyingToReplyId(null);
                              setParentReplyId(null);
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
                    {reply.replies && reply.replies.length > 0 && (
                      <NestedReplies replies={reply.replies} message={message} user={user} />
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