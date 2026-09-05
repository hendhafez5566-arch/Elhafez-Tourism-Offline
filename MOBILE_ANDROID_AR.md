## v32.5.44 — إصلاح إرسال PDF عبر واتساب

- إنشاء PDF Native مباشرة مع WebView متصل مؤقتًا بالـActivity قبل الرندر.
- FileProvider + ClipData + grantUriPermission.
- المحاولة بالترتيب: WhatsApp ثم WhatsApp Business ثم قائمة المشاركة.
- الواجهة تستقبل نجاح/فشل حقيقي بدل بقاء رسالة «جاري تجهيز».

## v32.5.44 — إصلاح Native PDF Share

تم إصلاح مسار تحويل المطبوع إلى PDF ومشاركته من تطبيق Android، مع lifecycle كامل للطباعة، تحقق من الملف، صلاحيات FileProvider، ورسائل نجاح/فشل حقيقية.

# تطبيق Elhafez Tourism ERP للعميل — v32.5.44

هذه الحزمة هي **Customer Android فقط**. لوحة المالك لم تعد جزءًا من تطبيق السياحة؛ الإدارة المركزية أصبحت داخل **Elhafez Technology** المستقل.

## هوية التطبيق
- App ID: `com.elhafez.tourism.erp.customer`
- Android Version: `32.5.44` (`versionCode 32544`)
- `capacitor.config.json` يستخدم `mobile-customer` كـResolver Shell فقط، ولا يحتوي رابط Runtime ثابت لشركة بعينها.

## ربط Elhafez Technology
عند بناء APK يجب تحديد:
`ELHAFEZ_TECHNOLOGY_URL=https://<domain-of-owner-center>`

يتم وضع الرابط داخل Android `BuildConfig` وقت البناء، ويقرأه Resolver عبر `NativeShell`. لا يتم تخزين Railway API Token أو Private License Key داخل تطبيق العميل.

في GitHub Actions أضف Repository Variable باسم `ELHAFEZ_TECHNOLOGY_URL`. مفتاح توقيع Android يبقى في GitHub Secrets كالمعتاد.

## تشغيل العميل
1. التطبيق يفتح شاشة كود الشركة.
2. يرسل الكود إلى Elhafez Technology عبر `/api/vendor/mobile/resolve/:code`.
3. المركز يعيد Runtime URL الخاص بالشركة إذا كان الاشتراك والنسخة صالحين.
4. NativeShell يفتح Runtime الشركة عبر HTTPS.
5. نفس APK يخدم كل شركات السياحة؛ لا نحتاج APK مختلف لكل عميل.

## التحديثات
تحديثات Web/Server اليومية تصل من Railway Runtime الخاص بالعميل ولا تحتاج APK جديدًا. APK جديد مطلوب فقط عند تغيير Android/Capacitor/NativeShell نفسه، مع الحفاظ على نفس `applicationId` ونفس Release Signing Key وزيادة `versionCode`.


## v32.5.44 — مشاركة مستندات PDF عبر واتساب
- زر واتساب يظهر للمطبوعات المرتبطة بطرف واحد له رقم واتساب مسجل.
- `NativePrint.sharePdf` ينشئ PDF من نفس HTML المستخدم في الطباعة ثم يشاركه عبر WhatsApp/WhatsApp Business باستخدام `FileProvider`.
- التقارير العامة أو متعددة الأطراف لا تُشارك تلقائيًا ولا يتم تخمين المستلم.
- لا يحتاج هذا التحديث Database Migration.

## v32.5.6 — تحسين إدخال النماذج
- زر التالي في لوحة مفاتيح الهاتف ينتقل للحقل التالي ولا يحفظ النموذج مبكرًا.
- آخر حقل فقط يستخدم إجراء تم، مع الحفاظ على Enter كسطر جديد في حقول الملاحظات.
## v32.5.41 — مزامنة Android بعد الرجوع من الخلفية
- عند Resume أو عودة الشبكة يتم إبطال حالة الاتصال القديمة وفحص الخادم فورًا.
- أي Pending Save تتم محاولة مزامنته قبل Refresh؛ لا يتم إسقاطه صامتًا.
- تحديثات الحالة من Party360 تظهر مباشرة في القائمة والمودال بدون Reload يدوي.

