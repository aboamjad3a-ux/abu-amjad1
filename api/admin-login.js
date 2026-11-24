const { send, sign, timingSafeStringEqual } = require('./_lib/admin');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Method not allowed' });
  try {
    const username = String((req.body || {}).username || '').trim();
    const password = String((req.body || {}).password || '');
    const expectedUser = process.env.ADMIN_USERNAME;
    const expectedPass = process.env.ADMIN_PASSWORD;
    if (!expectedUser || !expectedPass) return send(res, 503, { ok: false, error: 'أكمل إعداد ADMIN_USERNAME و ADMIN_PASSWORD في Vercel.' });
    if (!timingSafeStringEqual(username, expectedUser) || !timingSafeStringEqual(password, expectedPass))
      return send(res, 401, { ok: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة.' });
    const now = Math.floor(Date.now() / 1000);
    const token = sign({ role: 'admin', sub: username, iat: now, exp: now + 8 * 60 * 60 });
    return send(res, 200, { ok: true, token, expiresIn: 28800 });
  } catch (e) {
    console.error('admin-login:', e);
    return send(res, 500, { ok: false, error: 'تعذر إتمام تسجيل الدخول على الخادم.' });
  }
};
