# v32.4.86 — Vendor Owner Full Build

## قواعد النسخة
- `VENDOR_MODE=true` => نسخة المالك تعمل داخليًا `Full / Enterprise / Active` بلا Trial وبلا License ذاتي.
- `VENDOR_MODE=false` => دورة ترخيص العميل تبقى كما هي.
- مركز المالك يظهر في Vendor Mode للمستخدم الإداري حتى لو لم يتم إعداد مفتاح توقيع تراخيص العملاء بعد.
- `VENDOR_OWNER_USERS` اختياري للتشديد الأمني: إذا تم ضبطه، يقصر مركز المالك على المستخدمين المذكورين.
- مفتاح `VENDOR_PRIVATE_KEY_B64` مطلوب فقط لوظائف توقيع/إصدار تراخيص العملاء، وليس لتشغيل نسخة المالك أو إظهار مركز Vendor.
- Factory Reset لا يغير نوع النسخة لأن `VENDOR_MODE` من بيئة الخادم، ولا يحذف جداول Vendor المنفصلة، لذلك يعود مركز المالك بعد تسجيل الدخول/التهيئة.
- في Customer Mode لا يتم تشغيل Vendor schema/sync/background rollout.
- لا Migration لبيانات الشركة ولا تعديل `.env` ولا Reset إضافي.

## تحقق مطلوب
- Build + verify الكامل.
- فحص ثابت لفصل Owner license عن Customer license.
- فحص أن Vendor Center لا يعتمد على signing key كشرط ظهور.
- فحص أن Factory Reset لا يغير `VENDOR_MODE` ولا يحذف جداول Vendor.
