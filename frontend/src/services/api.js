import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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


export const createReply = (messageId, replyData) => {
  // If replyData is FormData, don't set Content-Type header
  const headers = replyData instanceof FormData ? {} : {
    'Content-Type': 'application/json',
  };
  return api.post(`/messages/${messageId}/replies`, replyData, { headers });
};

export default api; 