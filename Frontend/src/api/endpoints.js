import api from './axios';

export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const userApi = {
  getAll: () => api.get('/users'),
  delete: (id) => api.delete(`/users/${id}`),
};

export const projectApi = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.patch(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addMember: (id, userId) => api.post(`/projects/${id}/members`, { userId }),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
};

export const taskApi = {
  getAll: (params) => api.get('/tasks', { params }),
  getMy: (params) => api.get('/tasks/my', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  getByProject: (projectId, params) => api.get(`/tasks/project/${projectId}`, { params }),
  create: (projectId, data) => api.post(`/tasks/project/${projectId}`, data),
  update: (id, data) => api.patch(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  addComment: (id, data) => api.post(`/tasks/${id}/comments`, data),
  reassign: (id, assigneeId) => api.patch(`/tasks/${id}/assign`, { assigneeId }),
  startWork: (id) => api.post(`/tasks/${id}/start`),
  stopWork: (id) => api.post(`/tasks/${id}/stop`),
};

export const dashboardApi = {
  get: () => api.get('/dashboard'),
};

export const worklogApi = {
  // Member
  getMyDaily: (date) => api.get('/worklogs/my/daily', { params: { date } }),
  getMyChart: (from, to) => api.get('/worklogs/my/chart', { params: { from, to } }),
  getMyTimeline: (from, to) => api.get('/worklogs/my/timeline', { params: { from, to } }),
  getMyHeatmap: (months) => api.get('/worklogs/my/heatmap', { params: { months } }),
  getMyTaskLogs: (date, project) => api.get('/worklogs/my/task-logs', { params: { date, project } }),
  // Admin
  getUserDaily: (userId, date) => api.get(`/worklogs/user/${userId}/daily`, { params: { date } }),
  getUserChart: (userId, from, to) => api.get(`/worklogs/user/${userId}/chart`, { params: { from, to } }),
  getUserTimeline: (userId, from, to) => api.get(`/worklogs/user/${userId}/timeline`, { params: { from, to } }),
  getUserHeatmap: (userId, months) => api.get(`/worklogs/user/${userId}/heatmap`, { params: { months } }),
  getUserTaskLogs: (userId, date, project) => api.get(`/worklogs/user/${userId}/task-logs`, { params: { date, project } }),
  getUserSummary: (userId) => api.get(`/worklogs/user/${userId}/summary`),
  getLive: () => api.get('/worklogs/live'),
  addSession: (userId, data) => api.post(`/worklogs/user/${userId}/sessions`, data),
  editSession: (sessionId, data) => api.patch(`/worklogs/sessions/${sessionId}`, data),
  deleteSession: (sessionId) => api.delete(`/worklogs/sessions/${sessionId}`),
};
