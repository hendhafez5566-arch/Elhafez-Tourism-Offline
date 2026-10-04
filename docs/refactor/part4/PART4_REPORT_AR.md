# تقرير الجزء الرابع (نسخة نهائية)

## الأرقام
- architecture-check: **951 ← 543** (-408). الـratchet اتقفل على 543 بـ`--update` الرسمي (رفض أي زيادة).
- Node smokes: 47/60 قبل وبعد، والـ13 فاشلين نفسهم بالاسم (أسبابهم في baseline-node-smokes.log، وبعضها بيئي: ملف mobile-customer/index.html ناقص، اختبارات معتمدة على التاريخ).
- Browser smokes: 6/6 بعد التعديل (لم تُجرَّب قبله؛ شغالة بعد التعديل فقط).
- build الواجهة + typecheck + module:check: ناجحين. بناء السيرفر لم يُجرَّب فعليًا (TS 6 في بيئتي بدل 5.9.3 يطلع خطأ rootDir بيئي).

## اللي اتعمل (كله نقل بدون تغيير منطق)
1. `src/crm/party360.ts` ← `src/ui/party360.ts` (نمط ج: كان بيستدعي UI/Print من مسار domain).
2. `src/commercial/actions.ts` ← `src/ui/commercial-actions.ts` (نمط ج: toast/closeModal).
3. تحديث imports و`late-bindings.ts` و`main.ts` و`part2-module-order.json` (نفس الترتيب بالظبط).
4. `DB.factoryReset()` ← دالة `factoryResetOfflineEdition` في `persistence/browser-store.ts` (نفس الاستدعاء بالحرف).

## الدفعة الثانية: واجهة الصلاحيات
- أنشأت `src/security/access-control.ts` (وحدة بلا imports): `AccessControl.can/require` تفويض حرفي لـ`Auth.can/require` بنفس المعاملات والافتراضات والأخطاء. `auth.ts` يربطها بـAuth لحظة تعريفه، فترتيب التحميل ما اتغيرش (أضفت الوحدة الجديدة فقط في part2-module-order.json، و`module:check` PASS).
- استبدلت 207 استدعاء `Auth.can/require` بـ`AccessControl.*` في 26 ملف خارج security/bootstrap (ARCH003: 266 → 60). ملف `ui/data-table.ts` رجّعته كما هو لأن تعديله كان هيغيّر توقيع مخالفة قديمة (ARCH004) ويطلعها «جديدة» للـratchet.
- بعد الدفعة: build ناجح، Node smokes 47/60 والـ13 الفاشلين نفسهم، Browser smokes 6/6، module:check وarchitecture PASS.
- ملاحظة: الدفعة دي نقلت المخالفات لطبقة security (المسموح بها) بدل ما تبقى متناثرة؛ `Auth.user` (44 استخدام) لسه مباشر.

## الدفعة الثالثة: قراءة المستخدم الحالي
- أضفت `AccessControl.currentUser()` (قراءة حيّة من `Auth.user` كل مرة، بدون تخزين، لأنه بيتغير مع الدخول والخروج).
- استبدلت قراءات `Auth.user` و`Auth?.user` في 20 ملف (ARCH003: 60 → 14). المتبقي: `typeof Auth` وكتابة `Auth.user=` في mobile.ts وAuth.logout/passwordStrength/Auth.can في data-table.
- استثنيت: `ui/data-table.ts` (توقيع ARCH004 قديم) وسطر mobile.ts اللي بيعمل `Auth.user=...` (ARCH004).
- موضع `access-control.ts` في part2-module-order.json اتحرّك قبل browser-store (وحدة بلا imports ولا آثار جانبية، فمفيش أثر على السلوك؛ module:check PASS).
- بعد الدفعة: build ناجح، Node smokes 47/60 بنفس الـ13، Browser smokes 6/6.

## الدفعة الرابعة: UiPort (نمط ج/د، عكس الاتجاه)
- `src/core/ui-port.ts` (وحدة بلا imports): `UiPort.toast/confirmAction/applyBrand/renderCurrent/renderNav/openPage/isBound`. الواجهة (`ui/ui.ts`) بتسجّل التنفيذ الحقيقي لحظة `__set_UI(UI)`، وكل استدعاء بيحلّ `UI` وقت التنفيذ بنفس المعاملات.
- اتحوّل: toast في `persistence/browser-store.ts` (تنبيه فشل المزامنة)، وconfirmAction وtoast في `core/delete-center.ts`، وapplyBrand/renderCurrent/renderNav في `commercial/product.ts` (تبديل الفرع)، وopenPage في `accounting/engine.ts`، وإزالة `(toast as any)._t` في `core/runtime.ts` (بقى متغير timer داخلي؛ نفس السلوك).
- فرق سلوك نظري واحد: لو استُدعي أي منهم أثناء تحميل الوحدات قبل `ui/ui.ts`، الـtoast كان بيشتغل (دالة runtime) والآن بيتجاهل؛ والباقي كان بيفشل أصلًا لأن UI مش معرّف. ما لقيتش استدعاء بالشكل ده، والـsmokes عدّت.
- `guard typeof UI` في product.ts بقى `UiPort.isBound()` (نفس التوقيت).
- بعد الدفعة: build ناجح، Node smokes 47/60 بنفس الـ13، Browser smokes 6/6.

## تنبيه مهم (صدق الرقم)
النقل ده تصحيح تصنيف: الملفين واجهة فعلًا. مخالفات "domain يستدعي UI" (-137) اختفت، لكن ظهر مكانها 33 استخدام `DB` من واجهة (نمط أ) و`Auth` اتحسب عند الواجهة. يعني المخالفات الحقيقية اتنقلت لنمط أ/ب ولسه محتاجة use-cases. الأداة بتقارن بـPhase 1 وبتبين `newVsPhase1: 21` (استخدامات DB في الملفين دول اللي ماكانوش محسوبين كواجهة وقتها).

## اختبارات اتعدلت
- مسارات الملفين في 14 سكريبت اختبار (استبدال نص المسار فقط، تم التحقق آليًا إن الفرق مسار بس).
- `offline-copy-smoke.mjs`: الفحص "local factory reset path exists" كان بيدوّر على `await DB.factoryReset()` حرفيًا؛ بقى يدوّر على `await factoryResetOfflineEdition()` في الفرع ويتأكد كمان إن الدالة بتستدعي `DB.factoryReset()` في browser-store. نفس القوة، لكن راجعه.

## المتبقي (815) وليه
- أ (DB من الواجهة): 459 — forms-definitions, actions-handlers-*, forms, clean-pages … محتاجة queries/commands جديدة؛ لا تُنفَّذ بدون اختبار شاشة شاشة.
- ب (Auth): 14 — `typeof Auth` (7) وAuth.logout/passwordStrength/كتابة user؛ تحتاج facade لأوامر الدخول/الخروج.
- ج/د المتبقية (~41): toast/UI في domain وpersistence (راجع violation-map.csv القديم، الأرقام تقريبية قبل النقل).
- هـ: mobile.ts و window/monkey-patch (49).
- لم أنفّذ أحداث (events) لـ ج/د لأن الملفين الرئيسيين اتحلوا بالنقل.

## لم يُجرَّب
بناء السيرفر بـTS 5.9.3؛ تشغيل التطبيق يدويًا؛ أي شاشة بعينها.

## جرّب بإيدك قبل الاعتماد
1. شاشة كشف حساب/Party 360 (عميل ومورد): فتح التبويبات (نظرة عامة، المعاملات)، الأزرار، الطباعة (Print.voucher)، إغلاق النافذة.
2. النسخ الاحتياطي/الأرشيف: إنشاء، تحقق، تثبيت، حذف، تنظيف القديم، تنزيل .erparchive، وأرشفة سنة.
3. إعادة التهيئة (factory reset) في النسخة الأوفلاين وفي نسخة السيرفر، بما فيها إلغاء الكتابة الخاطئة لكلمة RESET.
4. رسائل الأخطاء (toast) في نفس الشاشات.
5. اسم المستخدم الحالي: يظهر صح في القوائم والشريط العلوي والطباعة وسجل النشاط والمرفقات، ويتغير بعد تسجيل الخروج والدخول بمستخدم تاني.
6. تبديل الفرع (يطبّق الهوية ويحدّث الشاشة والقائمة)، حذف سجل (تأكيد ثم رسالة النجاح)، ورسالة فشل المزامنة، وفتح مشكلة من فحص التكامل.
7. الصلاحيات: دخول بأدوار مختلفة (مدير/محاسب/موظف محدود) وتأكد إن أزرار تعديل/حذف/طباعة/مرفقات بتظهر وتختفي حسب الدور، وإن العمليات الممنوعة بترمي نفس رسالة الخطأ. وانتهاء الترخيص: العمليات غير العرض لازم تتمنع.
لا تغيير في أي قيد يومية أو حساب.
