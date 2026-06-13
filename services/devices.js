import { api } from '@/services/api';

export async function resetDevice(deviceId) {
  const { data } = await api.post(`/api/v1/devices/${deviceId}/reset`);
  return data;
}

export async function pairDevice(payload){
  const { data } = await api.post(`/api/v1/devices/pair`, payload)
  return data;
}

export async function listDevice(){
  const { data } = await api.get(`/api/v1/devices`)
  return data;
}

export async function GetActivePaired(){
  const { data } = await api.get(`/api/v1/devices/active_paired`)
  return data;
}

export async function GetNearbyDevices(){
  const { data } = await api.get(`/api/v1/devices/nearby`)
  return data;
}