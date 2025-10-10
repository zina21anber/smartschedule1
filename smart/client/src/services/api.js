// smart3/client/src/services/api.js
import axios from 'axios';

const api = axios.create({
  // ✅ جعل الـ baseURL يشير إلى جذر الخادم فقط (دون /api)
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Add token to requests if it exists
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

// ✅ Response Interceptor: Handle 401/403 errors centrally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;

    // إذا كان الرمز 401 (غير مصرح به) أو 403 (ممنوع)
    if (status === 401 || status === 403) {
      console.error("Authentication Error (401/403): Token expired or invalid. Redirecting to login.");
      
      // 1. حذف الـ Token والـ User من الذاكرة المحلية
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // 2. إعادة توجيه المستخدم إلى صفحة الدخول
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'; 
      }
    }
    return Promise.reject(error);
  }
);


// Authentication API
export const authAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  registerUser: (data) => api.post('/api/auth/register-user', data),
  registerStudent: (data) => api.post('/api/auth/register-student', data)
};

// Student API
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
  create: (data) => api.post('/api/courses', data),
  getCourseDetails: (courseId) => api.get(`/api/courses/${courseId}`),
  updateTimeSlots: (courseId, data) => api.patch(`/api/courses/${courseId}/timeslots`, data)
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

// Rules API
export const ruleAPI = {
  getAll: () => api.get('/api/rules'),
  create: (data) => api.post('/api/rules', data), 
  delete: (id) => api.delete(`/api/rules/${id}`)
};

// Notification API
export const notificationAPI = {
    getAll: () => api.get('/api/notifications'),
    publish: (data) => api.post('/api/notifications', data),
    delete: (id) => api.delete(`/api/notifications/${id}`),
};

export default api;