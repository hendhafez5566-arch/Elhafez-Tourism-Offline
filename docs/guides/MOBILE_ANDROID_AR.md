# Elhafez Tourism Offline Android — v32.5.48

## هوية التطبيق
- App ID: `com.elhafez.tourism.erp.offline`
- Version: `32.5.48`
- Version Code: `32548`
- Web bundle: `dist` كامل داخل التطبيق.
- لا Company Code ولا Owner Center ولا Railway أثناء التشغيل.

## التخزين والتشغيل
- ERP يعمل محليًا من IndexedDB / WebView storage.
- البيانات لا تتزامن تلقائيًا بين أجهزة متعددة.
- Backup/Restore المحلي هو وسيلة نقل/حماية البيانات.

## واتساب PDF
- زر واتساب يظهر فقط للمطبوع المرتبط بطرف واحد له رقم صالح.
- Android يستخدم Chromium/WebView `PrintDocumentAdapter` لإنتاج PDF A4 مباشرة؛ لا يتم تحويل المستند الكامل إلى Bitmap أو Screenshot.
- اتجاه Portrait/Landscape يمر إلى PrintAttributes، وتقسيم الصفحات يتم بواسطة محرك الطباعة نفسه.
- HTML الخاص بالطباعة لا يعتمد على Google Fonts أثناء التشغيل الأوفلاين.
- المشاركة تحاول WhatsApp ثم WhatsApp Business ثم Share chooser.
- FileProvider وURI read grant مستخدمان للمشاركة الآمنة.

## القائمة الجانبية
- الـAccordion يغلق العناصر الشقيقة داخل مجموعته فقط، ولا يغلق مجموعات أخرى مثل «اختصاراتي».
- فتح القائمة لا يعيد `scrollTop` ولا ينفذ Scroll إضافيًا؛ تم تثبيت طبقة الزخرفة داخل القائمة لتقليل الوميض في Android WebView.

## اختصاراتي
- يمكن لكل مستخدم تثبيت حتى 12 صفحة في «اختصاراتي».
- لا توجد «آخر استخدام» منعًا للتكرار والزحمة.

## التحديثات
- أي تغيير في كود التطبيق الأوفلاين يحتاج إصدار APK/AAB جديد بنفس App ID ونفس مفتاح التوقيع مع زيادة `versionCode`.
- بيانات التطبيق تبقى مع التحديث طالما لم يتغير App ID أو يتم مسح بيانات التطبيق.
