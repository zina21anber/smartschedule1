// smart3/client/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
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

// ✅ إضافة interceptor للاستجابة لمعالجة الأخطاء بشكل أفضل
api.interceptors.response.use(
  (response) => {
    console.log('✅ [API Response]', response.config.url, '→', response.status);
    return response;
  },
  (error) => {
    console.error('❌ [API Error]', error.config?.url, '→', error.response?.status);
    console.error('❌ [API Error Details]', error.response?.data);
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  registerUser: (data) => api.post('/auth/register-user', data),
  registerStudent: (data) => api.post('/auth/register-student', data)
};

// Student API
export const studentAPI = {
  getAll: (options = {}) => api.get('/students', options),
  getById: (userId) => api.get(`/student/${userId}`),
  create: (data) => api.post('/auth/register-student', data),
  update: (studentId, data) => api.put(`/students/${studentId}`, data),
  delete: (studentId) => api.delete(`/students/${studentId}`)
};

// Course API
export const courseAPI = {
  getAll: (options = {}) => api.get('/courses', options),
  getByLevel: (level) => api.get(`/courses/level/${level}`), 
  getElective: () => api.get('/courses/elective'),
  create: (data) => api.post('/courses', data),
  getCourseDetails: (courseId) => api.get(`/courses/${courseId}`),
  updateTimeSlots: (courseId, data) => api.patch(`/courses/${courseId}/timeslots`, data),
};

// Voting API
export const voteAPI = {
  vote: (data) => api.post('/vote', data),
  getVotesByCourse: (courseId) => api.get(`/votes/course/${courseId}`)
};

// ✅ Comments API - النسخة المُحسّنة مع Logging
export const commentsAPI = {
  // مسار لجلب كل التعليقات (بدون فلترة)
  getAllComments: () => {
    console.log('📡 [commentsAPI] Calling: GET /comments/all');
    return api.get('/comments/all');
  },
  
  // مسار لجلب التعليقات حسب المستوى (للتصفية في ManageNotifications)
  getCommentsByLevel: (level) => {
    console.log('📡 [commentsAPI] Calling: GET /comments/level/' + level);
    if (!level || level === '' || level === 'undefined' || level === 'null') {
      console.warn('⚠️ [commentsAPI] Invalid level provided, falling back to getAllComments');
      return commentsAPI.getAllComments();
    }
    return api.get(`/comments/level/${level}`);
  },
};

// Schedule & Section API
export const scheduleAPI = {
  getAll: () => api.get('/schedules'),
  create: (data) => api.post('/schedules', data),
  getSectionsByLevel: (level) => api.get(`/sections?level=${level}`),
  getVersionsByLevel: (level) => api.get(`/schedules/versions?level=${level}`),
  generateSchedule: (level) => api.post('/schedules/generate', { level }),
  activateVersion: (versionId) => api.put(`/schedules/versions/activate/${versionId}`),
  deleteVersion: (versionId) => api.delete(`/schedules/versions/${versionId}`),
};

// Statistics API
export const statisticsAPI = {
  get: () => api.get('/statistics')
};

export default api;