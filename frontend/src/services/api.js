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
export const createMessage = (channelId, messageData) => 
  api.post(`/channels/${channelId}/messages`, messageData);


export const createReply = (messageId, replyData) => 
  api.post(`/messages/${messageId}/replies`, replyData);

export default api; 