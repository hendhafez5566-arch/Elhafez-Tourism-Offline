# v32.4.79 — Login Hotfix

## السبب الجذري
في v32.4.78 تم فصل موديول Vendor من نسخة العميل، لكن بقي مرجعان إلى `vendorPublicStatus()` داخل مساري إنشاء الشركة وتسجيل الدخول. لذلك كان الخادم يرمي `ReferenceError: vendorPublicStatus is not defined` بعد إرسال بيانات الدخول.

## الإصلاح
- استبدال المرجعين المتبقيين بحالة Vendor الآمنة لنسخة العميل: `{ enabled: false }`.
- عدم إعادة موديول Vendor إلى نسخة العميل.
- لا توجد Migration ولا تغيير في قاعدة البيانات أو بيانات الشركة أو كلمات المرور.
- تحديث رقم الإصدار إلى 32.4.79.

## تحقق ثابت
- لا توجد أي إشارة متبقية إلى `vendorPublicStatus` في السورس.
- مسارات bootstrap / vendor status / login أصبحت متسقة مع Customer build.
