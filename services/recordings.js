import { api } from '@/services/api';

export async function uploadPersonalRecording(formData) {
  const { data } = await api.post('/api/v1/recordings/personal', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
