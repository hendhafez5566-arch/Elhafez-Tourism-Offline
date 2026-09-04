# إصلاح بناء Android — Elhafez Tourism v32.5.0

سبب الفشل كان تعارض اسم Secret الخاص بمفتاح التوقيع:
- التوثيق القديم يستخدم `ANDROID_KEYSTORE_BASE64`
- الـWorkflow كان يقرأ فقط `ANDROID_KEYSTORE_B64`

لذلك خطوة Restore release signing key كانت تُتخطى، ثم Gradle قد يحاول استخدام مسار Keystore غير موجود إذا كانت بقية أسرار التوقيع موجودة.

تم الإصلاح كالتالي:
- دعم الاسمين `ANDROID_KEYSTORE_BASE64` و `ANDROID_KEYSTORE_B64`.
- Gradle لا يعتبر التوقيع جاهزًا إلا إذا كان ملف الـKeystore موجودًا فعليًا.
- إذا لم تتوفر أسرار Release كاملة، يبني GitHub APK Debug قابلًا للتثبيت بدل فشل الـWorkflow.
- عند وجود مفتاح Release الصحيح، يبني Signed Release APK كالمعتاد.

تحذيرات Node.js 20 و setup-java v4 الظاهرة في GitHub Actions ليست سبب الفشل الرئيسي.
