# المعمار الحالي

## الصورة العامة

| الطبقة | المكان | التقنية |
|---|---|---|
| واجهة وعميل | `src/` (114 ملف TypeScript، ES modules) | TypeScript (فحص أنواع) + esbuild → ملف واحد `dist/app.js` (IIFE) |
| سيرفر | `server/src/` (15 ملف) | Node + PostgreSQL (`pg`) |
| قاعدة البيانات | `database/schema.sql` + `migrations/001..013` | PostgreSQL، حالة الشركة في `erp_state` (JSON) مع نسخة جداول `erp_entity_mirror` |
| موبايل | `android/` + Capacitor | نفس `dist` داخل WebView، يعمل Offline |

## نموذج البناء (مهم قبل أي تعديل)

- الواجهة بقت **ES modules** (`import/export`). نقطة الدخول `src/main.ts`، و`scripts/bundle-app.mjs` بيجمّعها بـ esbuild في ملف واحد classic: `dist/app.js` (صيغة IIFE). فـ `index.html` وservice worker وAndroid ما اتغيروش.
- `tsconfig.json` بقى **للفحص فقط** (`noEmit`): `module: ES2020` و`moduleResolution: bundler`. `sourceMap:false` و`removeComments:true` متروكين عمدًا لأن اختبارات قديمة بتفحصهم.
- **ترتيب التهيئة** هو ترتيب أسطر `import './...'` في `src/main.ts` (نفس ترتيب `files` القديم في tsconfig). مسجّل في `docs/refactor/part2-module-order.json` ويتأكد منه `npm run check:modules-order`. القائمة اللي بتقراها الاختبارات بتتجاب من `scripts/lib/build-model.mjs`.
- الأسماء العامة القديمة (`DB`, `Auth`, `UI`, `Actions`, ... — 310 اسم) لسه متاحة على `globalThis` كـ accessors حية (آخر `src/main.ts`)، لأن `onclick="UI...."` في `index.html` والنصوص المولّدة بتعتمد عليها. كود جديد يستورد اللي يحتاجه بدل ما يعتمد على global.
- **المراجع الأمامية** (83 اسم كان ملف بيقرأهم قبل ما يتهيّأ) بتعدّي عبر `src/core/late-bindings.ts`: صاحب الاسم بينادي `__set_X` بعد التصريح مباشرة. ملف مولّد بـ `scripts/codemods/modularize-src.cjs`.
- 3 دوال `compose*` اتنقلت من `bootstrap.ts` إلى `src/composition/early-presentation.ts` لأن كود top-level بينادي عليها قبل `bootstrap`.
- `strict: false` حاليًا.
- TypeScript مثبت على `5.9.3` وesbuild على `0.28.2` (نسخة exact). ليس مدعومًا استخدام TypeScript 6 مع إعداد السيرفر الحالي.
- أمر البناء: `tsc -p tsconfig.json` (أنواع) ← `node scripts/bundle-app.mjs` ← `node scripts/copy-static.mjs`.

## الاتجاه المستهدف

UI ← Application (use-cases) ← Domain (قواعد العمل) ← Repository ← Persistence.
الفحص `npm run architecture:check` يقيس الانتهاكات (الإجمالي الحالي 991) ولا يسمح بزيادتها. الهدف أن ينزل لصفر.

## قواعد العمل على الكود

1. ملف جديد = يتستورد في `src/main.ts` في المكان الصحيح بالنسبة لترتيب التهيئة (بعد كل ما بيقرأه وقت التحميل)، وبعدها شغّل `npm run check:modules-order` وحدّث `docs/refactor/part2-module-order.json` بقرار واعي.
2. لا تقرأ `DB` أو `Auth` من ملفات الواجهة في كود جديد؛ اعمل use-case في `src/application/`.
3. لا تعدّل `docs/refactor/*-baseline.json` يدويًا.
4. التقارير الجديدة في `docs/releases/`.

## خطة التنظيف (مراحل)

1. تنظيف الجذر والتوثيق والـCI وتثبيت النسخ (تم).
2. نقل الواجهة لـ ES modules مع bundler وإزالة الترتيب اليدوي (تم — الجزء 2، يحتاج مراجعة يدوية على المتصفح والـAPK قبل الاعتماد).
3. Prettier وESLint وتقسيم الأسطر والملفات الكبيرة، وتفعيل `strict` تدريجيًا.
4. إنزال مخالفات الطبقات لصفر.
5. توحيد نموذج التخزين (جداول بدل JSON واحد) وحذف الوضع القديم.
6. تأمين `innerHTML` وفصل نسخة المالك عن العميل وتجهيز البيع.


## Part 3 — readability tooling (status)

* Type ratchet: `npm run types:ratchet` (explicit `any`, ts suppressions, `--noImplicitAny` and `--strictNullChecks` error counts per folder; baseline `docs/refactor/type-baseline.json`; numbers may only go down).
* Golden print test: `npm run test:golden` (invoices, receipt/payment vouchers, expense, customer/supplier/treasury statements; frozen clock; byte-exact).
* Prettier / ESLint: configuration, scripts and CI job are in place but dormant until the one-time install in `docs/refactor/PART3_TOOLING_SETUP.md`.
* Not done in this pass: applying Prettier, splitting files > 40 KB, tightening types. See `docs/refactor/PART3_REPORT_AR.md`.


## src/reports (PART 3 V2)
printing.ts (كائن Print + facade) • statements.ts (كشوف الحسابات) • party-transactions.ts (تفاصيل التعاملات) • reports.ts (التقارير). الموديولات الجديدة تستورد Print من core/late-bindings لتفادي الدوائر.

## Part 4 — الطبقات الفعلية وقواعد الكود الجديد
الفحص (`scripts/architecture-check.mjs`) يصنّف الطبقة من المسار: `src/ui/**` (+ pages/forms/view/actions-print) = presentation؛ `src/application/**`؛ `src/persistence/**`؛ `src/security/**`؛ `src/accounting|finance|crm|commercial|core/**` = domain-core؛ `bootstrap.ts` = bootstrap.

تم نقل ملفين هما واجهة فعلًا من مسار domain إلى `src/ui/`: `crm/party360.ts` ← `ui/party360.ts` و`commercial/actions.ts` ← `ui/commercial-actions.ts` (نفس الكود، نفس ترتيب التحميل). استدعاء `DB.factoryReset` خرج إلى `factoryResetOfflineEdition` في `persistence/browser-store.ts`.

**الاستيراد المسموح للكود الجديد:**
- presentation (`src/ui`): يستورد من application و domain (قراءة) وutilities. ممنوع استخدام `DB` و`Auth` مباشرة — يمر عبر use-case في `src/application`.
- application: يستقبل التبعيات (DB, Auth, notifier) كـdeps محقونة؛ لا يذكر `UI/toast/Pages/Forms/window/document` ولا `DB/Auth` كمتغيرات عامة.
- domain-core: لا يستورد ولا يستدعي `UI/Pages/Forms/Print/toast/Actions`؛ يبلّغ بالنتائج أو الأخطاء/الأحداث.
- persistence: لا يستدعي أي طبقة أعلى منه. أي إشعار للمستخدم (toast/تأكيد/تحديث شاشة) من persistence أو domain يمر عبر `UiPort` من `src/core/ui-port.ts`؛ الواجهة تسجّل التنفيذ الحقيقي في `ui/ui.ts` عند تعريف `UI`.
- `Auth` مسموح فقط في security وbootstrap. أي كود آخر يسأل عن الصلاحيات عبر `AccessControl.can/require/currentUser()` من `src/security/access-control.ts` (واجهة تفويض بحتة؛ `auth.ts` يربطها بـAuth عند التحميل).
حالة الالتزام: 543 مخالفة موروثة مجمّدة في `docs/refactor/architecture-accepted.json`؛ أي زيادة ترفضها الأداة.

### Part 4B — أول دفعة use-cases لنمط (أ)
- `src/application/form-definition-workflows.ts` (`FormDefinitionQueries` للقراءة، `FormDefinitionCommands` للكتابة): تبعيات محقونة (`FormDefinitionDeps`) بلا أي استيراد لـDB/Auth/UI. التركيب الحي في `bootstrap.ts` (`composeFormDefinitionDeps`) ومسجّل في `late-bindings.ts`.
- `ui/forms-definitions.ts` بقى بلا أي لمس لـDB (73 ← 0). الأوامر المنقولة: إنشاء حساب، إنشاء مركز تكلفة، إنشاء مستخدم، تغيير كلمة المرور الذاتية.
- القاعدة: القراءة من الواجهة تتم عبر queries تُرجع بيانات جاهزة من المخازن الحية (لا نسخ)، والكتابة عبر commands بنفس الأخطاء والترتيب.
- الإجمالي في architecture-check: 543 ← 470 (ARCH001: 459 ← 386).
- دفعة 2: `ui/forms.ts` بقى بلا DB (50 ← 0) عبر نفس الوحدة (queries + commands: `saveBooking/saveService/saveManualJournalDraft/commit`). الإجمالي: 420.
