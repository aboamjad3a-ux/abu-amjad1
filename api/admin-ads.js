const { getDb, send, requireAdmin } = require('./_lib/admin');

module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  try {
    const db = getDb();
    const slot = String((req.body || {}).slot || '');
    if (!['1', '2'].includes(slot)) return send(res, 400, { ok: false, error: 'رقم المربع الإعلاني غير صحيح.' });
    const imageRef = db.collection('abuAmjadSite').doc(`adImage${slot}`);
    const contentRef = db.collection('abuAmjadSite').doc('content');
    if (req.method === 'DELETE') {
      await imageRef.delete();
      const snap = await contentRef.get();
      const data = snap.exists ? (snap.data() || {}) : {};
      const ads = Array.isArray(data.ads) ? data.ads.filter(a => String(a.slot) !== slot) : [];
      await contentRef.set({ ads, updatedAt: new Date().toISOString() }, { merge: true });
      return send(res, 200, { ok: true, ads });
    }
    if (req.method === 'POST') {
      const title = String((req.body || {}).title || 'إعلان').slice(0, 120);
      const imageData = String((req.body || {}).imageData || '');
      if (!/^data:image\/(jpeg|png|webp);base64,/i.test(imageData) || imageData.length > 260000)
        return send(res, 400, { ok: false, error: 'الصورة غير صالحة أو أكبر من الحد المسموح.' });
      await imageRef.set({ slot, title, imageData, bytes: Math.round(imageData.length * 0.75), updatedAt: new Date().toISOString() });
      const snap = await contentRef.get();
      const data = snap.exists ? (snap.data() || {}) : {};
      const ads = (Array.isArray(data.ads) ? data.ads : []).filter(a => String(a.slot) !== slot);
      ads.push({ slot, title, updatedAt: new Date().toISOString() });
      await contentRef.set({ ads, updatedAt: new Date().toISOString() }, { merge: true });
      return send(res, 200, { ok: true, ads });
    }
    return send(res, 405, { ok: false, error: 'Method not allowed' });
  } catch (e) {
    console.error('admin-ads:', e);
    return send(res, 500, { ok: false, error: 'تعذر حفظ أو حذف الإعلان في Firestore.' });
  }
};
