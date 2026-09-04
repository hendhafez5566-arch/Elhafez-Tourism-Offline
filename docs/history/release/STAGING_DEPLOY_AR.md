# Railway Vendor Staging v32.4.9

هذه الحزمة آمنة للرفع إلى GitHub Private: لا تحتوي على `vendor-private` أو `.env`.

## Vendor service variables
- `DATABASE_URL`: Neon الخاصة بالـVendor.
- `ERP_COMPANY_ID`: مثال `VENDOR-STAGING`.
- `ERP_TENANT`: مثال `vendor_staging`.
- `VENDOR_MODE=true`.
- `VENDOR_PRIVATE_KEY_B64`: مطلوب فقط لإصدار/توقيع تراخيص العملاء؛ ليس شرطًا لتشغيل نسخة المالك نفسها أو ظهور مركز Vendor.
- `SESSION_HOURS=12`.
- `PG_POOL_MAX=5`.
- `ALLOW_TENANT_HEADER=false`.
- `ALLOW_FACTORY_RESET=false`.
- `VENDOR_OWNER_USERS`: اختياري. إذا تُرك فارغًا يظهر مركز المالك لمدير نسخة Vendor؛ وإذا تم ضبطه يقصر المركز على المستخدمين المذكورين.

لا تضع `VENDOR_LICENSE_URL` على خدمة Vendor نفسها.

## Customer services
تستخدم نفس GitHub Repo، لكن `VENDOR_MODE=false`، وتنسخ لها إعدادات التشغيل من زر **مفاتيح التشغيل** في Vendor Center، ثم تستبدل `DATABASE_URL` برابط Neon الخاص بالشركة.


### قاعدة Vendor Owner
خدمة Vendor يجب أن تستخدم `VENDOR_MODE=true`. هذه النسخة لا تحتاج `ERP_LICENSE_TOKEN` لنفسها؛ الترخيص يخص نسخ العملاء فقط.

## تجهيز العملاء تلقائيًا — v32.4.87
أضف مرة واحدة على خدمة Vendor:
- `CUSTOMER_GITHUB_REPO=mhafez300300-byte/tourism-erp-staging`
- `CUSTOMER_GITHUB_BRANCH=main`
- `RAILWAY_API_TOKEN=<account token>` لإنشاء Project/Services للعملاء تلقائيًا.
- `CUSTOMER_RAILWAY_PROJECT_ID` اختياري إذا أردت استخدام Project موجود بدل إنشاء Project مستقل لكل شركة.
- يجب أن يبقى `VENDOR_MODE=true` و`ERP_PUBLIC_URL` صحيحًا، ويلزم `VENDOR_PRIVATE_KEY_B64` لتوقيع وربط تراخيص العملاء.

خدمة العميل تستخدم `Dockerfile.customer` تلقائيًا، لذلك Vendor Center وVendor Admin API لا يدخلان Runtime العميل.
