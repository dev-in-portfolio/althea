import 'server-only';
import crypto from 'node:crypto';

const SECRET = process.env.PASS_SIGNING_SECRET || '';

type Payload = {
  passId: string;
  uid: string;
  issuedAt: number;
};

export function signPass(payload: Payload) {
  if (!SECRET) return null;
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}
