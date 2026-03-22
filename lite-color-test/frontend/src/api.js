const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  health: () => request('/health'),
  listProjects: () => request('/projects'),
  createProject: (payload) =>
    request('/projects', { method: 'POST', body: JSON.stringify(payload) }),
  duplicateProject: (projectId) =>
    request(`/projects/${projectId}/duplicate`, { method: 'POST' }),
  updateProject: (projectId, payload) =>
    request(`/projects/${projectId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProject: (projectId) => request(`/projects/${projectId}`, { method: 'DELETE' }),

  getConcepts: (projectId) => request(`/projects/${projectId}/concepts`),
  saveConcepts: (projectId, concepts) =>
    request(`/projects/${projectId}/concepts`, {
      method: 'PUT',
      body: JSON.stringify({ concepts }),
    }),

  getPalette: (projectId) => request(`/projects/${projectId}/palette`),
  savePalette: (projectId, palette) =>
    request(`/projects/${projectId}/palette`, {
      method: 'PUT',
      body: JSON.stringify({ palette }),
    }),

  getMetrics: (projectId) => request(`/projects/${projectId}/metrics`),
  createMetric: (projectId, payload) =>
    request(`/projects/${projectId}/metrics`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateMetric: (projectId, metricId, payload) =>
    request(`/projects/${projectId}/metrics/${metricId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteMetric: (projectId, metricId) =>
    request(`/projects/${projectId}/metrics/${metricId}`, {
      method: 'DELETE',
    }),
  saveMetricsOrder: (projectId, metricIds) =>
    request(`/projects/${projectId}/metrics-order`, {
      method: 'PUT',
      body: JSON.stringify({ metric_ids: metricIds }),
    }),

  listSyntheticUsers: () => request('/synthetic-users'),
  createSyntheticUser: (payload) =>
    request('/synthetic-users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteSyntheticUser: (userId) =>
    request(`/synthetic-users/${userId}`, {
      method: 'DELETE',
    }),

  submitSurveyRun: (projectId, payload) =>
    request(`/projects/${projectId}/survey-runs`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  listSurveyRuns: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    return request(`/survey-runs${query.toString() ? `?${query.toString()}` : ''}`);
  },
  listUserResults: () => request('/results/users'),
  downloadUserResultsCsv: () => fetch(`${API_BASE}/results/users.csv`),
};
