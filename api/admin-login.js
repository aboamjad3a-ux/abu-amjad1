const { send, sign, timingSafeStringEqual, getDb } = require('./_lib/admin');
const crypto = require('node:crypto');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Method not allowed' });
  try {
    const username = String((req.body || {}).username || '').trim();
    const password = String((req.body || {}).password || '');
    const expectedUser = process.env.ADMIN_USERNAME;
    const expectedPass = process.env.ADMIN_PASSWORD;
    let valid = Boolean(expectedUser && expectedPass &&
      timingSafeStringEqual(username, expectedUser) &&
      timingSafeStringEqual(password, expectedPass));

    // Also accept accounts created from the admin panel.
    if (!valid) {
      const db = getDb();
      const snap = await db.collection('abuAmjadSite').doc('adminUsers').get();
      const rows = snap.exists && Array.isArray(snap.data().users) ? snap.data().users : [];
      const digest = crypto.createHash('sha256').update(password).digest('hex');
      valid = rows.some(u => u && u.username === username &&
        typeof u.passwordHash === 'string' &&
        u.passwordHash.length === digest.length &&
        timingSafeStringEqual(u.passwordHash, digest));
    }
    if (!valid) return send(res, 401, { ok: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة.' });
    const now = Math.floor(Date.now() / 1000);
    const token = sign({ role: 'admin', sub: username, iat: now, exp: now + 8 * 60 * 60 });
    return send(res, 200, { ok: true, token, expiresIn: 28800 });
  } catch (e) {
    console.error('admin-login:', e);
    return send(res, 500, { ok: false, error: 'تعذر إتمام تسجيل الدخول على الخادم.' });
  }
};
