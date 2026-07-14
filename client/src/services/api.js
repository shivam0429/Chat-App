import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Restore auth header on a full page reload, before AuthContext mounts
const existingToken = sessionStorage.getItem('chatapp_token');
if (existingToken) {
  api.defaults.headers.common.Authorization = `Bearer ${existingToken}`;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// ---- Auth ----
export const registerUser = async ({ username, email, password }) => {
  const { data } = await api.post('/auth/register', { username, email, password });
  return data.data;
};

export const loginUser = async ({ email, password }) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data.data;
};

export const fetchMe = async () => {
  const { data } = await api.get('/auth/me');
  return data.data;
};

export const forgotPassword = async ({ email }) => {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
};

export const resetPassword = async ({ token, password }) => {
  const { data } = await api.post(`/auth/reset-password/${token}`, { password });
  return data.data;
};

export const getGoogleAuthUrl = () => `${API_URL}/auth/google`;

// ---- Users ----
export const fetchUsers = async () => {
  const { data } = await api.get('/users');
  return data.data;
};

// ---- Messages ----
export const fetchMessages = async () => {
  const { data } = await api.get('/messages');
  return data.data;
};

export const sendMessageHttp = async ({ message, recipientId }) => {
  const { data } = await api.post('/messages', { message, recipientId });
  return data.data;
};

export const clearMessagesHttp = async () => {
  const { data } = await api.delete('/messages');
  return data;
};

// ---- Direct messages ----
export const fetchConversation = async (userId) => {
  const { data } = await api.get(`/messages/dm/${userId}`);
  return data.data;
};

export const clearConversationHttp = async (userId) => {
  const { data } = await api.delete(`/messages/dm/${userId}`);
  return data;
};

export default api;
