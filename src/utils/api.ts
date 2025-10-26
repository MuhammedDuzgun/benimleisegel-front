import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token'ı localStorage'dan alıp her istekte ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // Token zaten "Bearer " ile başlıyorsa direkt kullan, yoksa ekle
    config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }
  return config;
});

