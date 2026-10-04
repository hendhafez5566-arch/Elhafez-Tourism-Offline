# Tourism ERP Customer + Elhafez Technology

هذه الحزمة هي **نسخة العميل**. لوحة Vendor/Owner الإدارية يتم استبعادها من Build العميل بواسطة `Dockerfile.customer` و`prepare-customer-build.mjs`.

تم تحديث التحقق من التراخيص ليقبل:
1. المفتاح العام القديم الموجود في النسخة الحالية، للحفاظ على التوافق مع أي تراخيص قديمة.
2. المفتاح العام الجديد الخاص بـ Elhafez Technology.
3. مفاتيح إضافية عبر `ERP_LICENSE_PUBLIC_KEYS_B64` عند تدوير المفاتيح مستقبلًا.

متغيرات الربط الأساسية التي يصدرها Vendor Center لكل شركة:
- `ERP_COMPANY_ID`
- `VENDOR_LICENSE_URL`
- `VENDOR_AGENT_KEY`
- `VENDOR_MODE=false`

لا يتم تخزين بيانات تشغيل العميل داخل Vendor Center؛ المركز يدير المنتج والاشتراك والترخيص والإصدار وحالة النسخة فقط.
