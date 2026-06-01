import { api } from '@/services/api';

export async function resetDevice(deviceId) {
  const { data } = await api.post(`/api/v1/devices/${deviceId}/reset`);
  return data;
}
