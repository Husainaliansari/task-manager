import { api } from './client';
import { todayISO } from '../utils/format';

/** Every endpoint the app uses, in one place. */

export const authApi = {
  register: (form) => api('POST', '/register', { body: form }),
  login: (email, password) => api('POST', '/login', { body: { email, password } }),
  logout: () => api('POST', '/logout'),
  me: () => api('GET', '/user'),
};

export const tasksApi = {
  list: (filters) => api('GET', '/tasks', { query: filters }),
  stats: (filters) => api('GET', '/tasks/stats', { query: filters }),
  create: (task) => api('POST', '/tasks', { body: task }),
  update: (id, task) => api('PUT', `/tasks/${id}`, { body: task }),
  updateStatus: (id, status) => api('PATCH', `/tasks/${id}`, { body: { status } }),
  remove: (id) => api('DELETE', `/tasks/${id}`),
};

export const assistantApi = {
  status: () => api('GET', '/assistant'),
  suggest: (text) => api('POST', '/assistant/suggest', { body: { text, today: todayISO() } }),
};

export const adminApi = {
  users: () => api('GET', '/admin/users'),
  changeRole: (userId, role) => api('PATCH', `/admin/users/${userId}/role`, { body: { role } }),
  activity: () => api('GET', '/admin/activity'),
};
