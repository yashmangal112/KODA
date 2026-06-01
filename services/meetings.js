import { api } from '@/services/api';

export async function getMeetings(params = {}) {
  const { data } = await api.get('/api/v1/meetings', { params });
  return data;
}

export async function getMeeting(id) {
  const { data } = await api.get(`/api/v1/meetings/${id}`);
  return data;
}

export async function askMeeting(id, payload) {
  const { data } = await api.post(`/api/v1/meetings/${id}/ask`, payload);
  return data;
}
