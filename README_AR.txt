ملفات API للوحة تحكم أبو أمجد
============================

هذه ملفات الخادم فقط. لا تستبدل index.html أو admin.html بهذه الحزمة؛ يلزم ربط الواجهة بهذه المسارات قبل أن تعمل الأزرار من خلالها.

الملفات:
- api/admin-login.js: تسجيل دخول مدير وإصدار رمز جلسة لمدة 8 ساعات.
- api/admin-users.js: قراءة وإضافة وحذف حسابات المدير.
- api/admin-ads.js: حفظ/حذف إعلانات المربعين 1 و2.
- api/_lib/admin.js: تهيئة Firebase Admin والتحقق من رمز الجلسة.
- package.json: اعتماد firebase-admin.

متغيرات البيئة المطلوبة في Vercel (Production، وأي بيئة تريد اختبارها):
1) FIREBASE_SERVICE_ACCOUNT = محتوى JSON كامل لحساب خدمة Firebase Admin (Secret).
2) JWT_SECRET = سلسلة عشوائية قوية لا تقل عن 32 حرفاً (Secret).
3) ADMIN_USERNAME = اسم مدير الدخول الأول.
4) ADMIN_PASSWORD = كلمة مرور مدير الدخول الأول (يفضل 12 حرفاً أو أكثر).

مهم جداً:
- هذه الحزمة لا تجعل الواجهة الحالية تستخدم API تلقائياً؛ يجب تعديل admin.html لاستدعاء /api/admin-login و /api/admin-users و /api/admin-ads وإرسال Authorization: Bearer <token>.
- تسجيل الدخول في هذه الحزمة يعتمد بيانات ADMIN_USERNAME وADMIN_PASSWORD من Vercel، وليس بيانات Firebase Authentication.
- قبل تفعيلها على الموقع يجب استكمال ربط الواجهة واختبار تسجيل الدخول والإضافة والحذف.
- لا تضع ملف خدمة Firebase JSON في GitHub أو داخل ملفات HTML.
- لا تفتح قواعد Firestore للعامة. Firebase Admin SDK يعمل من الخادم ويتجاوز قواعد Firestore مع حماية الوصول على API.
