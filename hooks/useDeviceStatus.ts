import { useState, useEffect, useCallback } from 'react';
import { GetActivePaired } from '@/services/devices';

export function useDeviceStatus() {
  const [paired, setPaired] = useState(null);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    try {
      const data = await GetActivePaired();
      console.log("here data",data);
      setPaired(data?.devices ?? null);
    } catch {
      setPaired(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { check(); }, []);

  return { paired, loading, refresh: check };
}