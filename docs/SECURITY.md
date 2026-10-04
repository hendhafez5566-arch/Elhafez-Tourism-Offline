# الأمان — الجزء 6

## الحصر (innerHTML وأخواتها) — `docs/refactor/part6/sink-inventory.csv`
- المنافذ الفعلية في `src/`: **186** تعيين/استدعاء (innerHTML=109 سطر، insertAdjacentHTML=8، outerHTML=2 كأسطر grep؛ العدد المذكور سابقًا ~181 غير دقيق). `document.write`/`eval`/`new Function` = **0**.
- الكود كان أصلًا بيستخدم `esc()` (510 استخدام) في `src/core/runtime.ts` و`UmrahCore_esc` في `src/core/umrah/runtime.ts`. بيحوّل `& < > " '` فيصلح للنص ولـattribute المقتبس.
- اللي كان ناقص: **356** مكان بيحط حقل سجل خام (`id/page/key/type/value/no/status/kind/code`) جوه attribute بدون escape (مثلًا `value="${t.id}"`)، ومعرّفات من استيراد ملفات ممكن تحتوي `"`. اتحوّلوا كلهم لـ`esc()` (37 ملف). للبيانات العادية الناتج مطابق حرفيًا.
- إصلاحات إضافية: `name="qty_${l.id}"`، `perm_…`، `branch_…`، رقم المستند وكود العملة في قوائم الاختيار، `data-party-*` في party360، و`<img src="${c.logo}">`.
- اتسابت عمدًا: `data-ui-search-result="${x.page}"` (مفتاح صفحة داخلي، واختبار v32514 بيتحقق من نصه الحرفي)، وقيم ثابتة من الكود (`today()`، أسماء أنواع الغرف، `c` في فلتر الإشعارات).

## القرار على onclick المضمن
24 معالج مضمّن فقط (الباقي `el.onclick=` كخاصية، وهي آمنة). واحد بس فيه interpolation (`opts.onchange` في forms.ts، نص من المطوّر مش من المستخدم). **ما اتحوّلش لـdata-action**: مخاطرته صفر وتغييره من غير تشغيل الواجهة يعرّض شغل شغال للكسر.

## ما اتعملش
- ما اتضافتش دالة `html\`\`` / `raw()`: `esc()` الموجودة بتغطي الحالة ومعتمد عليها 510 مكان. تحويل كل القوالب لـtagged template كان محتاج تشغيل الواجهة بالكامل للتأكد إن المسافات والشكل ما اتغيروش، وده مش متاح عندي.

## السيرفر (قراءة كود)
| البند | الحالة |
|---|---|
| تجزئة كلمات المرور | PBKDF2-SHA256، 210000 تكرار، salt لكل مستخدم، مقارنة ثابتة الزمن. سليم |
| Rate limit للدخول | جدول `erp_login_attempts` مع حظر مؤقت (429). سليم، لم يُختبر عدديًا |
| حقن SQL | كل الاستعلامات parameterized؛ الاستثناءات (`windowSql`, `lockSql`) أجزاء ثابتة من الكود. سليم |
| الكوكي | HttpOnly + SameSite=Lax + Secure خلف https. سليم |
| CORS | قائمة بيضاء (localhost/capacitor) مع credentials. سليم |
| ALLOW_TENANT_HEADER / ALLOW_FACTORY_RESET | افتراضيهم false أصلًا |
| **رفع الملفات** | **ثغرة اتقفلت:** الـMIME بيجي من العميل وكان بيتعرض `inline` من نفس الدومين (ملف HTML/SVG مرفوع = stored XSS). دلوقتي HTML/SVG/XML/JS/CSS بيتعرضوا `attachment` + `application/octet-stream` (`fileResponseHeaders` في context.ts). باقي الأنواع كما هي |
| رؤوس الأمان | أُضيف HSTS (180 يوم، بدون includeSubDomains/preload) وCSP **مفروضة** محدودة: `frame-ancestors 'self'; base-uri 'self'; form-action 'self'` |
| CSP كاملة | **Report-Only فقط** (`default-src 'self'; script-src 'self'; …`). متاخدش enforce قبل ما تجرّب |
| مدة الجلسة | 12 ساعة للويب و720 ساعة (30 يوم) للموبايل. اتسابت كما هي (قرارك) |
| الحجم/النوع عند الرفع | الحد 21MB موجود، لكن مفيش فحص نوع عند الرفع. اتعالج وقت العرض فقط |

## CSP على PWA/الأندرويد
**ما اتضافتش.** الـmeta لا يدعم Report-Only، والـenforce من غير تجربة على جهاز حقيقي ممكن يوقف الطباعة أو الاستيراد. الـCSP الكاملة بتتبعت من السيرفر فقط. لو عايز تحميها داخل الأندرويد لازم تجربها على جهاز.

## الاختبارات
- `scripts/xss-safety-smoke.mjs`: اختبار ثابت+وحدة (بدون متصفح). بيجرّب payloads خبيثة على دالتي esc، ويمنع رجوع أي attribute فيه حقل خام، ويمنع document.write/eval، ويثبّت عدد المعالجات المضمنة. **بيفشل على كود 4B الأصلي وبينجح على الجديد.**
- `scripts/server-hardening-smoke.mjs`: بيتحقق من الرؤوس وتحويل أنواع الملفات الخطرة.
- **مش اختبار حقيقي في متصفح**: مفيش متصفح عندي. الشاشات والطباعة والتصدير ما اتشغلتش مع payloads فعلية.
