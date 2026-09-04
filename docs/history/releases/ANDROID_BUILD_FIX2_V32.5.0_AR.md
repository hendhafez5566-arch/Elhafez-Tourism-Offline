# Elhafez Tourism v32.5.0 — Android Build Fix 2

سبب الفشل الحقيقي كان في `android/app/build.gradle` سطر 21.
استخدام regex داخل double-quoted Groovy string بالشكل `"/+$"` جعل `$` يُفسر كبداية GString interpolation، فظهر `token recognition error`.

الإصلاح:
- تحويل regex إلى single-quoted Groovy string: `replaceAll('/+$', '')`.
- تنظيف شرط signing داخل GitHub Actions وإزالة `\n` الحرفية من shell script.
- الحفاظ على fallback: Release APK عند اكتمال أسرار التوقيع، وإلا Debug APK قابل للتثبيت.
- لم نرفع رقم إصدار النظام لأن v32.5.0 لم يتغير وظيفيًا؛ هذا إصلاح بناء Android فقط.
