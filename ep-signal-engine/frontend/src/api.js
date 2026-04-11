import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: BASE_URL });

export const getWatchlist = () => api.get('/watchlist').then(r => r.data);
export const addTicker = (ticker, company_name = '') =>
  api.post('/watchlist', { ticker, company_name }).then(r => r.data);
export const removeTicker = (ticker) =>
  api.delete(`/watchlist/${ticker}`).then(r => r.data);

export const getSignals = (limit = 50) =>
  api.get('/signals', { params: { limit } }).then(r => r.data);
export const getAllNews = (limit = 100) =>
  api.get('/news', { params: { limit } }).then(r => r.data);

export const runEngine = () => api.post('/run').then(r => r.data);
export const sendDigest = () => api.post('/send-digest').then(r => r.data);
export const getTodaySignals = () => api.get('/signals/today').then(r => r.data);
export const getStats = () => api.get('/stats').then(r => r.data);
