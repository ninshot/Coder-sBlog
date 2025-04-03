import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getChannels = () => api.get('/channels');
export const getChannelById = (id) => api.get(`/channels/${id}`);
export const createChannel = (channelData) => api.post('/channels', channelData);

export const getMessagesByChannel = (channelId) => api.get(`/channels/${channelId}/messages`);
export const getMessageById = (messageId) => api.get(`/messages/${messageId}`);
export const createMessage = (channelId, messageData) => {
  // If messageData is FormData, don't set Content-Type header
  const headers = messageData instanceof FormData ? {} : {
    'Content-Type': 'application/json',
  };
  return api.post(`/channels/${channelId}/messages`, messageData, { 
    headers,
    transformRequest: messageData instanceof FormData ? [function (data) {
      return data; // Don't transform FormData
    }] : undefined
  });
};

export const createReply = async (messageId, formData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/messages/${messageId}/replies`, formData, {
      headers: {
        // Remove Content-Type header to let browser set it with boundary for FormData
      },
      transformRequest: [
        function (data) {
          return data; // Don't transform FormData
        }
      ]
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Vote-related API functions
export const voteMessage = (messageId, voteType) => api.post(`/messages/${messageId}/vote`, { voteType });
export const voteReply = (replyId, voteType) => api.post(`/replies/${replyId}/vote`, { voteType });
export const getMessageVoteStatus = (messageId) => api.get(`/messages/${messageId}/vote-status`);
export const getReplyVoteStatus = (replyId) => api.get(`/replies/${replyId}/vote-status`);

// Bookmark-related API functions
export const addBookmark = (messageId) => api.post('/bookmarks', { message_id: messageId });
export const removeBookmark = (messageId) => api.delete(`/bookmarks/${messageId}`);
export const getBookmarks = () => api.get('/bookmarks');
export const checkBookmarkStatus = (messageId) => api.get(`/bookmarks/check/${messageId}`);

export default api; 