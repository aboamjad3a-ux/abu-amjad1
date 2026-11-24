const crypto = require('node:crypto');
const admin = require('firebase-admin');

function getDb() {
  if (!admin.apps.length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT');
    let serviceAccount;
    try { serviceAccount = JSON.parse(raw); }
    catch { throw new Error('FIREBASE_SERVICE_ACCOUNT must be valid JSON'); }
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
  return admin.firestore();
}

function send(res, status, body) {
  res.status(status).setHeader('Cache-Control', 'no-store').json(body);
}

function sign(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const input = `${header}.${body}`;
  const sig = crypto.createHmac('sha256', secret).update(input).digest('base64url');
  return `${input}.${sig}`;
}

function verifyToken(req) {
  const value = String(req.headers.authorization || '');
  if (!value.startsWith('Bearer ')) return false;
  const token = value.slice(7);
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const input = `${parts[0]}.${parts[1]}`;
  const expected = crypto.createHmac('sha256', process.env.JWT_SECRET || '').update(input).digest();
  let actual;
  try { actual = Buffer.from(parts[2], 'base64url'); } catch { return false; }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return payload.role === 'admin' && Number(payload.exp) > Math.floor(Date.now() / 1000);
  } catch { return false; }
}

function requireAdmin(req, res) {
  if (!verifyToken(req)) {
    send(res, 401, { ok: false, error: 'غير مصرح. سجل دخول المدير من جديد.' });
    return false;
  }
  return true;
}

function timingSafeStringEqual(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

module.exports = { getDb, send, sign, requireAdmin, timingSafeStringEqual };
