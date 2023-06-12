import { createHmac } from 'crypto';

const secret = process.env.SECRET_KEY ?? '';
if (!secret) {
  throw new Error('Environment variable SECRET_KEY not found');
}

function getSignature(text: string) {
  const hmac = createHmac('sha256', secret);
  hmac.update(text);
  const hex = hmac.digest('hex').slice(0, 10);
  return parseInt(hex, 16).toString(36).padStart(8, '0');
}

export function sign(text: string) {
  return text + getSignature(text);
}

export function verify(input: string) {
  if (input.length < 9) {
    return false;
  }
  const text = input.slice(0, -8);
  const signature = input.slice(-8);
  return signature === getSignature(text);
}
