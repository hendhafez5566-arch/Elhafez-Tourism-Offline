# Elhafez Tourism v32.5.6 — Mobile Shell Sync Fix

سبب توقف سكربت الرفع قبل GitHub:
- اختبار Android اكتشف أن `mobile-customer/index.html` لا يطابق النسخة المضمّنة داخل APK في
  `android/app/src/main/assets/public/index.html`.
- السبب أن إصلاح كود التفعيل `TR-XXXXXXXX` تم على ملف Customer Shell فقط، ولم تتم مزامنته مع نسخة Android المضمّنة.

الإصلاح:
- مزامنة الملفين حرفيًا.
- الإبقاء على إصدار 32.5.6 لأن النسخة السابقة توقفت في QA قبل الرفع.
- اختبار Android mobile smoke أصبح ناجحًا بالكامل.
- اختبار Central Customer وCancel Integrity ناجحان.
