import axios from 'axios';

const TOKEN_KEY = 'campaign_monitoring_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 means the token is missing/expired - drop it and let ProtectedRoute
// redirect to /login on the next render.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const login = (username, password) =>
  api.post('/auth/login', { username, password }).then((res) => res.data.data);

export const fetchCurrentUser = () => api.get('/auth/me').then((res) => res.data.data);

export const fetchCampaigns = () => api.get('/campaigns').then((res) => res.data.data);

export const fetchCampaignHistory = (campaignId, limit = 100) =>
  api.get(`/campaigns/${campaignId}/history`, { params: { limit } }).then((res) => res.data.data);

export const fetchAlertHistory = (params = {}) =>
  api.get('/alerts', { params }).then((res) => res.data);

export const fetchRules = () => api.get('/rules').then((res) => res.data.data);

export const updateRule = (id, payload) => api.put(`/rules/${id}`, payload).then((res) => res.data.data);

export const assignCampaign = (campaignId, userId) =>
  api.put(`/campaigns/${campaignId}/assign`, { userId }).then((res) => res.data.data);

export const fetchMyProfile = () => api.get('/users/me').then((res) => res.data.data);

export const updateMyProfile = (payload) => api.put('/users/me', payload).then((res) => res.data.data);

export const fetchUsers = () => api.get('/users').then((res) => res.data.data);

export const createUserAccount = (payload) => api.post('/users', payload).then((res) => res.data.data);

export const updateUserAccount = (id, payload) => api.put(`/users/${id}`, payload).then((res) => res.data.data);

export const deactivateUserAccount = (id) => api.delete(`/users/${id}`).then((res) => res.data.data);

export default api;
