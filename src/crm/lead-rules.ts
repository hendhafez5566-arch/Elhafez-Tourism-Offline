import type { CrmLead } from '../application/business-contracts';
const CrmLeadRules = {
    created(lead: CrmLead) {
        if (!lead.name)
            throw new Error('اسم العميل المحتمل مطلوب');
    },
    convertible(lead: CrmLead | undefined) {
        if (!lead || lead.customerId)
            throw new Error('العميل المحتمل غير متاح');
    },
    converted(lead: CrmLead, customerId: string) {
        lead.customerId = customerId;
        lead.status = 'won';
    },
    removable(lead: CrmLead | undefined) {
        if (!lead)
            throw new Error('العميل المحتمل غير موجود');
        if (lead.customerId)
            throw new Error('تم تحويل Lead إلى عميل؛ لا يحذف حتى لا يضيع أثر التحويل');
    }
};
export { CrmLeadRules };
