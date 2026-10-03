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
