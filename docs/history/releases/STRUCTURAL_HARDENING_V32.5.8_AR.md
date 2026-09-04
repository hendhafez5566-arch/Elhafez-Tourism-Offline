# Elhafez Tourism v32.5.8 — Structural Hardened

هذه مرحلة إصلاح بنيوي تدريجية على نفس مشروع العميل الحالي، بدون إعادة بناء النظام من الصفر وبدون تغيير دورة العمل السليمة.

## ما تم تنفيذه

1. **Compact State Patch**
   - عند وجود نسخة أساس معروفة، يرسل العميل فرق الحالة فقط بدل إرسال `data` كاملة.
   - المصفوفات ذات السجلات تُرسل كـ upserts/deletes/order عند الحاجة.
   - الخادم يعيد تطبيق الـPatch ثم يمرره عبر نفس حواجز الصلاحيات ودورة المستند والمحاسبة الحالية.

2. **PostgreSQL Entity Mirror**
   - Migration `010_entity_record_mirror.sql` تنشئ `erp_entity_records`.
   - Backfill للسجلات الأساسية في السياحة والمحاسبة والحج والعمرة.
   - فهارس حسب الشركة/المجموعة/الفرع/التاريخ/الحالة/الطرف/البرنامج، بالإضافة إلى GIN JSONB.
   - الحفظ العادي يحدث السجلات المتغيرة فقط داخل نفس Transaction.

3. **Reset / Restore Safety**
   - Migration `011_pinned_state_history.sql` تضيف `reason` و`pinned`.
   - قبل Factory Reset وExternal Restore وBackup Restore تُحفظ حالة ما قبل العملية كـPinned checkpoint.
   - تنظيف history العادي لا يحذف الـPinned snapshots.

4. **TypeScript Safe Cleanup**
   - إزالة `@ts-nocheck` فقط من الملفات التي اجتازت compiler بعد الإصلاح.
   - إصلاح صريح لحساب تاريخ الاستحقاق في `src/accounting/terms.ts`.
   - إصلاح Audit في استعادة كلمة المرور بحيث يُحفظ رقم `revision` فعليًا بدل إسقاطه بصمت.
   - خفض إجمالي ملفات `@ts-nocheck` إلى 12 ملفًا؛ وعلى جهة الخادم بقي `server/src/server.ts` فقط.
   - إزالة `@ts-nocheck` من `src/core/umrah/contracts-inventory.ts` بعد إضافة Typing صريح لقواعد المخزون ونجاح اختبارات العقود والعمرة.

## قياس Patch محلي

في اختبار يحتوي على 5,000 فاتورة، تعديل حالة فاتورة واحدة أنتج Patch بحجم 147 بايت مقابل 378,956 بايت للحالة الكاملة المستخدمة في الاختبار.

## حدود هذه المرحلة

- `erp_state.payload` ما زال مصدر التوافق الرئيسي، وبالتالي كتابة JSONB المركزية لم تُلغَ بالكامل بعد.
- `erp_entity_records` مرآة انتقالية تمهيدًا لنقل القراءة/الكتابة Collection-by-Collection بعد اختبار PostgreSQL حقيقي.
- بقايا `@ts-nocheck` وCSS/inline handlers لم تُلغَ كلها؛ يتم تنظيفها تدريجيًا لتجنب كسر الواجهة أو المحاسبة.


## بوابة القبول لهذا الـCheckpoint

- Frontend TypeScript: **0 errors**.
- Node Smoke: **40/40 ناجح**.
- Browser Smoke: **6/6 ناجح** بعد جعل اختبار تنقل مجموعات العمرة ينتظر الحالة الفعلية بدل timeout ثابت.
- Runtime parity: **ناجح** ولا توجد ملفات runtime مفقودة أو stale حسب `parity-check`.
- Server `dist`: أعيد توليده من المصدر الحالي في بيئة الفحص باستخدام تعريف Type مؤقت لـ `pg` فقط بسبب عدم توفر npm cache/Internet؛ التعريف المؤقت غير موجود داخل الحزمة.
