import api from './api.js';

export const getPRs = () => api.get('/progress/prs');
export const getReport = (params = {}) => api.get('/progress/report', { params });
export const getDailyProgress = (params = {}) => api.get('/progress/daily', { params });
export const getWeeklyProgress = (params = {}) => api.get('/progress/weekly', { params });
export const getMonthlyProgress = (params = {}) => api.get('/progress/monthly', { params });
export const getYearlyProgress = (params = {}) => api.get('/progress/yearly', { params });
