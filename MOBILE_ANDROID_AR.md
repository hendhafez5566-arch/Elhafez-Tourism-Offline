# Elhafez Tourism Offline Android — v32.5.46

## هوية التطبيق
- App ID: `com.elhafez.tourism.erp.offline`
- Version: `32.5.46`
- Version Code: `32546`
- Web bundle: `dist` كامل داخل التطبيق.
- لا Company Code ولا Owner Center ولا Railway أثناء التشغيل.

## التخزين والتشغيل
- ERP يعمل محليًا من IndexedDB / WebView storage.
- البيانات لا تتزامن تلقائيًا بين أجهزة متعددة.
- Backup/Restore المحلي هو وسيلة نقل/حماية البيانات.

## واتساب PDF
- زر واتساب يظهر فقط للمطبوع المرتبط بطرف واحد له رقم صالح.
- Android يرندر المطبوع على عرض A4 الحقيقي داخل `PdfDocument`، ويقسم المستند الطويل على عدة صفحات.
- يتم فحص الصفحة قبل المشاركة لمنع PDF أبيض.
- المشاركة تحاول WhatsApp ثم WhatsApp Business ثم Share chooser.
- FileProvider وURI read grant مستخدمان للمشاركة الآمنة.

## اختصاراتي
- يمكن لكل مستخدم تثبيت حتى 12 صفحة في «اختصاراتي».
- لا توجد «آخر استخدام» منعًا للتكرار والزحمة.

## التحديثات
- أي تغيير في كود التطبيق الأوفلاين يحتاج إصدار APK/AAB جديد بنفس App ID ونفس مفتاح التوقيع مع زيادة `versionCode`.
- بيانات التطبيق تبقى مع التحديث طالما لم يتغير App ID أو يتم مسح بيانات التطبيق.
