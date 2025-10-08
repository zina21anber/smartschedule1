// smart3/client/src/services/api.js
import axios from 'axios';

const api = axios.create({
  // ✅ التعديل: جعل الـ baseURL يشير إلى جذر الخادم فقط (دون /api)
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  registerUser: (data) => api.post('/api/auth/register-user', data),
  registerStudent: (data) => api.post('/api/auth/register-student', data)
};

// Student API (تم التعديل لإضافة /api إلى كل مسار لضمان الوصول)
export const studentAPI = {
  getAll: () => api.get('/api/students'),
  create: (data) => api.post('/api/students', data), 
  update: (studentId, data) => api.put(`/api/students/${studentId}`, data), 
  delete: (studentId) => api.delete(`/api/students/${studentId}`)
};

// Course API
export const courseAPI = {
  getAll: () => api.get('/api/courses'),
  getElective: () => api.get('/api/courses/elective'),
  create: (data) => api.post('/api/courses', data)
};

// Voting API
export const voteAPI = {
  vote: (data) => api.post('/api/vote', data),
  getVotesByCourse: (courseId) => api.get(`/api/votes/course/${courseId}`)
};

// Schedule API
export const scheduleAPI = {
  getAll: () => api.get('/api/schedules'),
  create: (data) => api.post('/api/schedules', data)
};

// Section API
export const sectionAPI = {
  getAll: () => api.get('/api/sections')
};

// Statistics API
export const statisticsAPI = {
  getStats: () => api.get('/api/statistics')
};

export default api;