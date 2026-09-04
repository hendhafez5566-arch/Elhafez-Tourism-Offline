# v32.4.87 — إنشاء العميل بضغطة واحدة + معمارية تطبيق العميل

## ما تم تنفيذه
- إضافة تجهيز تلقائي من مركز المالك بعد إنشاء الشركة والاشتراك.
- عند تفعيل التجهيز التلقائي ينشئ النظام بنية Railway للعميل: Project/Environment حسب إعداد المالك، خدمة PostgreSQL مع Volume دائم، وخدمة ERP من Customer build.
- كل شركة تحصل على Company ID ورابط تشغيل مستقل وكود قصير لتطبيق العميل.
- حالة التجهيز تظهر في ملف الشركة ويمكن إعادة المحاولة إذا فشل جزء من التجهيز.
- بعد وصول Health إلى حالة سليمة تتحول حالة التجهيز إلى Ready ويتم دفع Entitlement الحالي للعميل.

## عزل نسخة العميل
`Dockerfile.customer` يشغّل `scripts/prepare-customer-build.mjs` قبل الـCompile. السكربت يستبدل Vendor Admin server/UI بـ stubs غير إدارية، ثم صورة التشغيل النهائية تنقل الـcompiled runtime فقط. لذلك Vendor Center وVendor Admin API وRailway admin logic لا تكون موجودة في Runtime العميل، وليست مجرد عناصر مخفية بالواجهة.

## الموبايل
المعمارية المستهدفة لا تحتاج APK مختلف لكل شركة:
1. تطبيق Vendor/Owner منفصل للمالك.
2. تطبيق Customer واحد موحد لكل العملاء.
3. العميل يدخل Company ID أو كود التطبيق الصادر من Vendor Center.
4. التطبيق الموحد يستعلم من Vendor resolver عن رابط Runtime الخاص بهذه الشركة ثم يفتح سيرفر الشركة المعزول.

في v32.4.87 تم تجهيز كود الشركة والـresolver في السيرفر. تحويل APK العميل إلى شاشة الربط الموحدة هو تغيير Android Native منفصل يُبنى مرة واحدة، وليس APK لكل عميل.

## إعداد مرة واحدة على Vendor Railway
- `VENDOR_MODE=true`
- `VENDOR_PRIVATE_KEY_B64=<owner signing key>`
- `ERP_PUBLIC_URL=<vendor public https url>`
- `CUSTOMER_GITHUB_REPO=mhafez300300-byte/tourism-erp-staging`
- `CUSTOMER_GITHUB_BRANCH=main`
- يفضّل `RAILWAY_API_TOKEN` بصلاحية إنشاء مشاريع/خدمات لعزل Project لكل عميل.
- `CUSTOMER_RAILWAY_PROJECT_ID` اختياري لو أردت تجميع العملاء في Project محدد بدل Project مستقل لكل شركة.

## اختبارات
- Build للـVendor source.
- Static provisioning/security checks.
- Customer hardened build في شجرة منفصلة للتحقق أن Vendor Admin code لا يدخل الناتج.
- اختبارات المحاسبة والحج والعمرة ودورة البيانات ضمن Verify.

## نتيجة التحقق الفعلي
- `npm run verify`: ناجح بالكامل.
- Accounting smoke: 31 قيدًا في السيناريو، `imbalanced = 0`.
- Umrah workflow: ناجح، `imbalanced = 0`.
- v32.4.87 provisioning/security checks: 17/17.
- Customer hardened build تم بناؤه في شجرة منفصلة بنجاح؛ البحث في `server/dist/vendor.js` و`dist/app.js` أعطى 0 markers لمنطق Vendor Admin (`client-provision`, `vendor_clients`, `railwayGraphql`, `quickOnboard`).
