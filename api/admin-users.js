const { getDb, send, requireAdmin } = require('./_lib/admin');
const crypto = require('node:crypto');
const hash = value => crypto.createHash('sha256').update(String(value)).digest('hex');

module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  try {
    const db = getDb();
    const ref = db.collection('abuAmjadSite').doc('adminUsers');
    if (req.method === 'GET') {
      const snap = await ref.get();
      return send(res, 200, { ok: true, users: snap.exists && Array.isArray(snap.data().users) ? snap.data().users : [] });
    }
    if (req.method === 'POST') {
      const username = String((req.body || {}).username || '').trim();
      const password = String((req.body || {}).password || '');
      if (!/^[\p{L}\p{N}_.-]{3,40}$/u.test(username) || password.length < 8)
        return send(res, 400, { ok: false, error: 'اسم المستخدم 3-40 حرفاً، وكلمة المرور 8 أحرف على الأقل.' });
      const snap = await ref.get();
      const users = snap.exists && Array.isArray(snap.data().users) ? snap.data().users : [];
      if (users.some(u => u && u.username === username)) return send(res, 409, { ok: false, error: 'اسم المستخدم موجود بالفعل.' });
      users.push({ username, passwordHash: hash(password) });
      await ref.set({ users, updatedAt: new Date().toISOString() });
      return send(res, 200, { ok: true, users });
    }
    if (req.method === 'DELETE') {
      const username = String((req.body || {}).username || '').trim();
      const snap = await ref.get();
      const users = snap.exists && Array.isArray(snap.data().users) ? snap.data().users : [];
      if (!username) return send(res, 400, { ok: false, error: 'اسم المستخدم مطلوب للحذف.' });
      // Authentication is controlled by ADMIN_USERNAME / ADMIN_PASSWORD in Vercel.
      // The Firestore adminUsers list is a legacy/device account list, so it may be empty.
      const next = users.filter(u => u && u.username !== username);
      await ref.set({ users: next, updatedAt: new Date().toISOString() });
      return send(res, 200, { ok: true, users: next });
    }
    return send(res, 405, { ok: false, error: 'Method not allowed' });
  } catch (e) {
    console.error('admin-users:', e);
    return send(res, 500, { ok: false, error: 'تعذر تحديث حسابات المدير في Firestore.' });
  }
};
