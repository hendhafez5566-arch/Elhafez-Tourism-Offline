# تقرير الجزء 2 — نقل الواجهة إلى ES modules

## اللي اتعمل في الجلسة دي
1. `package.json`: `build` و`build:offline` بقوا `tsc -p tsconfig.json` ← `bundle-app.mjs` ← `copy-static.mjs` (ومعاهم `tsc -p server/tsconfig.json` في `build`). `mobile:sync` بيستخدم `build:offline` فبقى على البناء الجديد تلقائيًا. أُضيف `esbuild: 0.28.2` (exact) وسكربت `check:modules-order`.
2. Dockerfile وDockerfile.customer: **ما اتعدلوش** لأنهم بيعتمدوا على `npm run build`. `ci.yml`: أُضيفت خطوة `check:modules-order`. `android-apk.yml`: أُضيفت مسارات tsconfig والـbundle لمحفزات الـpush.
3. `release-check.mjs`: اتعدّل فحص نموذج البناء القديم فقط (module/outFile/files) ← النموذج الجديد + `module-order-check`، وفحص الـcomposers بقى بيقرأ `bootstrap.ts` و`early-presentation.ts` وأُضيفت خطوة bundle. ما اتضعّفش أي assertion محاسبي/أمني. `refactor-check.mjs` اتضاف له خطوة bundle (من غيرها `dist/app.js` كان هيفضل قديم).
4. الدوال الـ3 (compose*): بتتنادى من top-level في 3 ملفات بس (`purchase-order-fulfillment`, `server-store`, `browser-store`) وكلهم بيستوردوها مباشرة. الدوال بتبني closures وبتحل UI/Auth/DB وقت الاستدعاء عبر late-bindings، فمفيش اعتماد على hoisting.
5. TDZ / const→var: مفيش `ReferenceError` أو try/catch معتمد على TDZ. الـ`typeof X !== 'undefined'` الموجودة (11 مكان) كلها على أسماء بتتهيأ قبل وقت الاستدعاء. الأثر الوحيد: لو حصل وصول مبكر لاسم متأخر هيرجع `undefined` بدل ما يرمي خطأ. كل أسماء الـinline handlers في `index.html` والنصوص المولّدة موجودة في الـ310 اسم.
6. الوثائق: `docs/ARCHITECTURE.md`, `CHANGELOG_AR.md`, `README_AR.md`.

## قبل / بعد
| الفحص | الأصل (baseline بتاعك) | بعد التحويل (اتشغّل هنا) |
|---|---|---|
| tsc client | 0 أخطاء | 0 أخطاء (tsc 6.0.3 المتاح هنا) |
| Node smokes | 47/60 | 47/60 — نفس الـ13 فاشل بالظبط |
| Offline smokes | — | 16/17 (الفاشل contracts-inventory وهو من الـ13 المعروفين) |
| architecture-check | 991، 0 جديدة | 991، PASS |
| module-order-check | — | PASS (113 module بنفس الترتيب الأصلي) |
| dist/app.js مقابل المرفق | — | مطابق byte بـbyte بعد إعادة البناء |
| dist مقابل android assets | متطابقين | متطابقين (6 ملفات) |

## اللي ما اتشغّلش أو ما اتأكدش
- **`npm install` / lockfile:** الـnpm registry رفض كل الطلبات (403 سياسة)، فـ`package-lock.json` **ما اتحدّثش** ومخترعتش lockfile. esbuild 0.28.2 اتجرّب من نسخة موجودة محليًا بس. **لازم تشغّل `npm install` مرة عندك** قبل أي `npm ci` (Docker/CI هيفشل لحد ما تعمل كده). لو 0.28.2 مش متاحة عندك بدّلها بنسخة exact تانية.
- **release-check.mjs** كامل ما اتشغّلش: بيعتمد على git commits مش موجودة، وفيه فحوصات immutable (`same(tsconfig.json/package.json/src/...)`) هتفشل بعد الجزء 2 بطبيعتها لأنها فحوصات "المرحلة 5: تدقيق فقط". اتشغّل بس الجزء اللي عدّلته (وقف عند أول فحص git) — محتاج قرارك: إيه المرجع الجديد (commit)؟
- **application-workflow-check / business-workflow-check / presentation-platform-check**: ما اتشغّلوش (git). وفي `business-workflow-check` و`presentation-platform-check` لسه فيهم قراءة `tsconfig.json .files` (مش موجود دلوقتي) فهيحتاجوا نفس تعديل `compiledFiles()` لما تشغّلهم على الريبو الأصلي. ما لمستهمش.
- **SERVER BUILD** في refactor-check فشل هنا لأن tsc المتاح 6.0.3 (TS5011) وليس 5.9.3، السيرفر نفسه ما اتغيرش.
- **refactor-check** بيعلّم 5 smokes "NEW REGRESSION" هنا (customer-parity, mobile-android, v32483, v32510 + السيرفر) بسبب اختلاف الـfingerprint في `refactor-baseline.json` (مسار `/workspace/...` ونتيجة فحص root/server version)، مش اختلاف في السلوك. ما عدّلتش الـbaseline. على جهازك قارنه تاني.
- مفيش تشغيل فعلي للتطبيق في متصفح أو APK من جهتي (browser smokes القديمة بيعدّوا هنا لكن مش بديل عن تجربتك).

## قائمة تجربتك بإيدك
1. `npm install` ثم `npm run build` ثم `npm run refactor:full-check` على جهازك (tsc 5.9.3 الحقيقي).
2. افتح `dist/index.html` عبر `npm run preview` وجرّب: تسجيل دخول، إنشاء عميل وفاتورة وسند، كشف حساب، طباعة/PDF، نسخ احتياطي واسترجاع.
3. كل أزرار الـ`onclick` في الشريط الجانبي والقوائم (بتعتمد على الـglobals).
4. شاشات العمرة (بتستخدم `UmrahCore_*`).
5. Offline: افصل النت وأعد التحميل، وتأكد إن الـservice worker بيحدّث (cache-busting `?v=32.5.66`).
6. `npm run mobile:sync` ثم APK debug، وجرّب Offline والطباعة والمشاركة على جهاز حقيقي.
7. Docker: `docker build .` بعد تحديث lockfile.
