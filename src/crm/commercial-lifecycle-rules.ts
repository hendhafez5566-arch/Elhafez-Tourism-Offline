import { BusinessValues } from '../core/business-values';
import type { BusinessClock, BusinessPurchaseFields, BusinessPurchaseOrder, BusinessQuotation, BusinessQuotationFields } from '../application/business-contracts';
// Record transitions and restrictions; persistence and authorization belong to use cases.
const CommercialLifecycleRules = {
    acceptQuotation(q: BusinessQuotation | undefined, clock: BusinessClock) {
        if (!q || !['draft', 'sent'].includes(q.status))
            throw new Error('العرض غير متاح');
        if (q.validUntil && q.validUntil < clock.today())
            throw new Error(`انتهت صلاحية عرض السعر في ${clock.formatDate(q.validUntil)}؛ أنشئ نسخة محدثة أو مدّد الصلاحية قبل القبول`);
        q.status = 'accepted';
        q.acceptedAt = clock.now();
        return q;
    },
    removableQuotation(q: BusinessQuotation | undefined) {
        if (!q)
            throw new Error('عرض السعر غير موجود');
        if (q.invoiceId || !['draft', 'sent'].includes(BusinessValues.text(q.status)))
            throw new Error('الحذف النهائي متاح لعرض السعر قبل الاعتماد فقط؛ بعد الاعتماد/الإلغاء يبقى السجل محفوظًا');
    },
    removablePurchaseOrder(po: BusinessPurchaseOrder | undefined) {
        if (!po)
            throw new Error('أمر الشراء غير موجود');
        if (po.status !== 'draft')
            throw new Error('الحذف النهائي متاح لمسودة أمر الشراء فقط؛ استخدم الإلغاء بعد الاعتماد');
        if (po.invoiceId)
            throw new Error('أمر الشراء مرتبط بفاتورة؛ لا يحذف');
    },
    voidPurchaseOrder(po: BusinessPurchaseOrder | undefined, reason: string, clock: BusinessClock) {
        if (!po)
            throw new Error('أمر الشراء غير موجود');
        if (po.sourceType === 'umrah-procurement')
            throw new Error('أمر الشراء مولد من برنامج حج/عمرة؛ ألغِ الالتزام أو البرنامج من قسم الحج والعمرة حتى تتزامن كل الآثار المرتبطة');
        if (po.invoiceId || ['converted', 'partiallyInvoiced'].includes(po.status))
            throw new Error('أمر الشراء مرتبط بفاتورة مورد؛ عالج فاتورة المورد وفق دورة الإلغاء/التسوية أولًا');
        if (!['approved', 'partiallyReceived', 'received'].includes(po.status))
            throw new Error('الإلغاء متاح لأمر شراء معتمد/منفذ غير محول فقط');
        if (!BusinessValues.text(reason).trim())
            throw new Error('سبب الإلغاء مطلوب');
        po.status = 'void';
        po.voidReason = BusinessValues.text(reason).trim();
        po.voidAt = clock.now();
        return po;
    },
    approvePurchaseOrder(po: BusinessPurchaseOrder | undefined) {
        if (!po || po.status !== 'draft')
            throw new Error('أمر الشراء غير متاح');
        po.status = 'approved';
    },
    quotationFields(input: BusinessQuotationFields) {
        if (!input.partyId || !(input.lines || []).length)
            throw new Error('العميل والبنود مطلوبة');
    },
    purchaseFields(input: BusinessPurchaseFields) {
        if (!input.supplierId || !(input.lines || []).length)
            throw new Error('المورد والبنود مطلوبة');
    },
    convertibleQuotation(q: BusinessQuotation | undefined) {
        if (!q || q.status !== 'accepted')
            throw new Error('اعتمد العرض أولًا');
    },
    convertiblePurchaseOrder(po: BusinessPurchaseOrder | undefined) {
        if (!po || !['approved', 'partiallyReceived', 'received', 'partiallyInvoiced'].includes(po.status))
            throw new Error('أمر الشراء غير معتمد');
    }
};
export { CommercialLifecycleRules };
