# v32.4.80 — QA تحديثات الموبايل الحية

## ما تم التحقق منه
- TypeScript للواجهة تم تجميعه بنجاح بفحص مستقل مطابق لقائمة ملفات المشروع.
- Android mobile smoke: ناجح بالكامل، بما في ذلك الاتصال، Pull-to-Refresh، زر التحديث، الرجوع، حفظ حالة التنقل، والطباعة.
- Android connectivity smoke: ناجح بالكامل.
- الدورة المحاسبية: ناجحة، بدون قيود غير متوازنة في اختبار المحاسبة.
- Hajj & Umrah workflow smoke: ناجح، بدون قيود غير متوازنة.
- Accounting lifecycle smoke: ناجح.
- Integrity/Cleanup smoke: ناجح.
- System UX smoke: ناجح.
- Core suite integration smoke: ناجح.
- تم التأكد أن Workflow بناء APK لا يعمل عند كل تعديل `src/**`؛ يعمل فقط عند تغييرات Android/Capacitor الأصلية أو التشغيل اليدوي.
- تم التأكد من وجود صفحة محلية لحالة تعذر تحميل الخادم مع زر إعادة المحاولة.

## قيد بيئة الاختبار
تعذر تشغيل Gradle APK محليًا داخل بيئة الفحص لأن Gradle Wrapper احتاج تنزيل Gradle من `services.gradle.org` بينما بيئة التنفيذ لا تسمح بهذا الاتصال. لذلك البناء الفعلي للـAPK يظل مسؤولية GitHub Actions، بينما فحوص السورس/TypeScript/الدورة/Android static smoke نجحت.
