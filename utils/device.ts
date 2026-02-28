export function ensureDeviceKey(req: Request, res?: Response) {
  const existing = req.headers.get("cookie") ?? "";
  const match = existing.match(/device_key=([^;]+)/);
  let deviceKey = match?.[1];
  if (!deviceKey) {
    deviceKey = crypto.randomUUID();
  }
  const response = res ?? new Response(null);
  response.headers.append("set-cookie", `device_key=${deviceKey}; Path=/; SameSite=Lax`);
  return { deviceKey, response };
}
