import api from './api.js';
import { buildLocalPRs, buildLocalProgress, buildLocalReport, localResponse, shouldUseOffline } from './offlineData.js';

const cached = async (request, fallback) => { try { return await request(); } catch (error) { if (shouldUseOffline(error)) return localResponse(await fallback()); throw error; } };
export const getPRs = () => cached(() => api.get('/progress/prs'), buildLocalPRs);
export const getReport = (params = {}) => cached(() => api.get('/progress/report', { params }), () => buildLocalReport(params.period || 'month').then((report) => ({ report })));
export const getDailyProgress = (params = {}) => cached(() => api.get('/progress/daily', { params }), () => buildLocalProgress('daily', params));
export const getWeeklyProgress = (params = {}) => cached(() => api.get('/progress/weekly', { params }), () => buildLocalProgress('weekly', params));
export const getMonthlyProgress = (params = {}) => cached(() => api.get('/progress/monthly', { params }), () => buildLocalProgress('monthly', params));
export const getYearlyProgress = (params = {}) => cached(() => api.get('/progress/yearly', { params }), () => buildLocalProgress('yearly', params));
