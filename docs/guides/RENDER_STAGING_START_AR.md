# تشغيل Vendor Staging على Render + Neon

هذه الحزمة مخصصة **للاختبار على السيرفر فقط**. تحتوي على مركز المالك وإدارة الشركات والاشتراكات والإصدارات، لكنها لا تحتوي على المفتاح الخاص للمالك.

## الحماية
- `vendor-private/` غير موجود في الحزمة.
- لا يوجد `.env` أو كلمة مرور قاعدة بيانات داخل الحزمة.
- `DATABASE_URL` و `VENDOR_PRIVATE_KEY_B64` يجب إدخالهما كـ Secrets في Render فقط.
- المفتاح العام للتحقق من التراخيص `server/license-public.pem` موجود، وهو غير سري.
- `ALLOW_FACTORY_RESET=false` و `ALLOW_TENANT_HEADER=false` افتراضيًا.

## أول نشر
1. ارفع محتويات هذه الحزمة إلى GitHub Repository **Private**.
2. في Render استخدم Blueprint أو Web Service من نفس Repository.
3. عند طلب `DATABASE_URL` الصق Neon Connection String ولا تضعها في GitHub.
4. عند طلب `VENDOR_PRIVATE_KEY_B64` حوّل `license-private.pem` الموجود فقط في الـCommercial Master عندك إلى Base64 ثم الصق القيمة في Render Secret.
5. بعد النشر افتح `/api/health` وتأكد أن `ok=true` ثم افتح الرابط الرئيسي وأكمل إعداد الـAdmin.

## جعل بيئة الاختبار Enterprise بعد أول تشغيل
الهدف هو اختبار التفعيل الحقيقي وليس فتح الوظائف بكود خاص:
1. اعرف Company ID الحالي من صفحة الدعم/التشخيص بعد الإعداد الأول.
2. من مركز المالك أنشئ شركة اختبار بنفس Company ID.
3. أنشئ لها Full / Enterprise بدون انتهاء أو لمدة اختبار.
4. أصدر License Token من مركز المالك.
5. أضف في Render Environment:
   - `ERP_COMPANY_ID` = نفس Company ID
   - `ERP_LICENSE_TOKEN` = الـToken الصادر
6. Redeploy. بعدها نفس بيئة Staging تعمل Enterprise بكامل الوظائف.

## التحديثات
رفع Commit جديد إلى فرع GitHub المتصل يؤدي إلى Auto Deploy على Render. بيانات PostgreSQL في Neon لا تُمسح لأن الكود والقاعدة منفصلان. أي تغيير Schema يجب أن يمر عبر migrations الموجودة في الخادم.

> هذه البيئة للتجربة فقط. Render Free ينام بعد عدم النشاط، وNeon Free له حدود استخدام. قبل عميل حقيقي ننتقل إلى بيئة Production مدفوعة مع Backup خارجي ومراقبة.
