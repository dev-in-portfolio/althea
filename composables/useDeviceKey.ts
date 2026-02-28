export const useDeviceKey = () => {
  if (process.server) return '';
  const key = useState<string>('device-key', () => {
    const existing = localStorage.getItem('viewvault_device_key');
    if (existing) return existing;
    const generated = crypto.randomUUID();
    localStorage.setItem('viewvault_device_key', generated);
    return generated;
  });
  return key.value;
};
