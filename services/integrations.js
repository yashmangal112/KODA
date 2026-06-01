import { api } from '@/services/api';

export async function getIntegrations() {
  const { data } = await api.get('/api/v1/integrations');
  return data;
}

export async function connectIntegration(service, credentials) {
  const { data } = await api.post(`/api/v1/integrations/${service}/connect`, credentials);
  return data;
}
