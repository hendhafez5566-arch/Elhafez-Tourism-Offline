# Elhafez Tourism & Umrah ERP

نظام محاسبة وإدارة شركات السياحة والحج والعمرة. نسخة العميل المستقرة: محاسبة عامة ومحاسبة سياحية مترابطة بالقيد المزدوج، برامج حج وعمرة، تعاقدات ومخزون فنادق وطيران ونقل وتأشيرات، إدارة العملاء والموردين، وتطبيق أندرويد يعمل Offline.

- رقم النسخة الحالية: في `package.json` (الحقل `version`). هو المرجع الوحيد للنسخة.
- سجل التحديثات: [`CHANGELOG_AR.md`](CHANGELOG_AR.md)
- فهرس التوثيق: [`docs/README.md`](docs/README.md)
- شرح المعمار الحالي: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## هيكل المشروع

| المجلد / الملف | الدور |
|---|---|
| `src/` | كود الواجهة والمنطق (TypeScript). يتجمع في ملف واحد `dist/app.js` |
| `server/src/` | السيرفر (Node + PostgreSQL): الجلسات، الصلاحيات، الترخيص، النسخ الاحتياطي |
| `database/` | `schema.sql` و`migrations/` (001 إلى 013) |
| `android/` + `capacitor.config.json` | تطبيق أندرويد (Capacitor) |
| `pwa/` | ملفات الـPWA (manifest وservice worker) |
| `scripts/` | البناء والاختبارات وأدوات التشغيل |
| `docs/` | التوثيق: `guides/` أدلة التشغيل، `releases/` تقارير الإصدارات، `history/` أرشيف QA، `refactor/` تقارير إعادة الهيكلة |
| `dist/`، `server/dist/` | ناتج البناء (يتولد بـ `npm run build`) |
| `*_WINDOWS.bat` | ملفات التشغيل والتحديث والنسخ الاحتياطي للعميل على ويندوز (تبقى في الجذر عمدًا ليشغلها العميل بنقرتين) |

## التشغيل

**للعميل (ويندوز + Docker):** شغّل `START_ERP_WINDOWS.bat` ثم افتح `http://localhost:8080`. التحديث بـ `INSTALL_UPDATE_WINDOWS.bat`، والنسخ الاحتياطي بـ `BACKUP_ERP_WINDOWS.bat`، والاسترجاع بـ `RESTORE_ERP_WINDOWS.bat`.

**للمطور:**
```bash
cp .env.example .env        # عدّل القيم
npm ci && npm --prefix server ci
npm run build               # الواجهة (فحص أنواع + esbuild) + السيرفر
npm start                   # يشغل server/dist/server.js
```

## الاختبارات

```bash
npm run test:all-node-smokes     # كل اختبارات Node
npm run test:browser-smokes      # اختبارات المتصفح (Python + Playwright)
npm run refactor:full-check      # فحص الهيكل والمعمارية
npm run check:modules-order      # ترتيب تقييم الـES modules
npm run verify                   # بناء + كل الاختبارات
```

## أندرويد

```bash
npm run mobile:sync     # بناء ومزامنة الأصول مع android/
npm run mobile:apk      # APK تجريبي
npm run mobile:aab      # حزمة الإصدار
```
التفاصيل في [`docs/guides/MOBILE_ANDROID_AR.md`](docs/guides/MOBILE_ANDROID_AR.md).

## نسخة العميل والمركز المركزي

هذه الحزمة هي نسخة العميل. إدارة المالك/الفيندور منفصلة في Elhafez Technology Owner Center. ربط الترخيص والتحديث يتم من خلال إعدادات Vendor Agent، ولا يجب وضع مفاتيح المالك أو Railway API Token داخل نسخة العميل. المتغيرات المطلوبة في `.env.example`.

## قواعد العمل على الكود

- لا يُرفع `.env` ولا أي مفاتيح خاصة (`.gitignore` يمنع ذلك).
- كل تغيير يمر على `npm run test:all-node-smokes` و`npm run architecture:check` قبل الإصدار.
- لا تُعدَّل أرقام المخالفات في `docs/refactor/architecture-baseline.json` يدويًا.
- أي تقرير إصدار جديد يوضع في `docs/releases/` وليس في الجذر.


## أدوات الجودة (الجزء 3)

- `npm run types:ratchet` — مقياس الأنواع (يمنع الزيادة فقط).
- `npm run test:golden` — مقارنة حرفية لمخرجات الطباعة (يحتاج `npm run build` وكروميوم).
- `npm run format:check` و`npm run lint:ratchet` — بعد التثبيت لمرة واحدة: `docs/refactor/PART3_TOOLING_SETUP.md`.


> PART 3 V2: تقسيم printing.ts منفّذ؛ باقي PART 3 غير مكتمل (انظر docs/refactor/PART3_REPORT_AR.md).
