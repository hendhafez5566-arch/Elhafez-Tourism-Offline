import { BusinessValues } from '../core/business-values';
import { CommercialLifecycleRules } from '../crm/commercial-lifecycle-rules';
import { QuotationWorkflows } from './quotation-workflows';
import type { BusinessInvoice, BusinessPurchaseFields, BusinessPurchaseOrder, CrmWorkflowDeps } from './business-contracts';
// Legacy order and return timing preserved; dependencies are supplied by composition.
const PurchaseWorkflows = {
    addPO(d: CrmWorkflowDeps, o: BusinessPurchaseFields) {
        const pr = o.programId ? BusinessValues.find(d.repository.programs, o.programId) : null, po = {
            id: d.clock.id(), no: d.clock.next('purchaseOrder', o.date || d.clock.today()), date: o.date || d.clock.today(), supplierId: o.supplierId, programId: pr?.id || '', costCenterId: pr?.costCenterId || o.costCenterId || '', currency: o.currency || d.repository.baseCurrency(), status: 'draft', expectedDate: o.expectedDate || '', externalRef: o.externalRef || '', notes: o.notes || '', lines: d.fulfillment.normalizeLines(d.clock.clone(o.lines || [])), createdAt: d.clock.now()
        };
        if (!po.supplierId || !po.lines.length)
            throw new Error('المورد والبنود مطلوبة');
        d.repository.purchaseOrders.unshift(po);
        return po;
    },
    updatePO(d: CrmWorkflowDeps, id: string, o: BusinessPurchaseFields) {
        const po = BusinessValues.find(d.repository.purchaseOrders, id);
        if (!po)
            throw new Error('أمر الشراء غير موجود');
        d.policy.requireEditable('purchaseOrder', po);
        const pr = o.programId ? BusinessValues.find(d.repository.programs, o.programId) : null;
        CommercialLifecycleRules.purchaseFields(o);
        Object.assign(po, {
            date: o.date || po.date, supplierId: o.supplierId, programId: pr?.id || '', costCenterId: pr?.costCenterId || '', currency: o.currency || po.currency, expectedDate: o.expectedDate || '', externalRef: o.externalRef || '', notes: o.notes || '', lines: d.fulfillment.normalizeLines(d.clock.clone(o.lines), po.lines), status: 'draft', updatedAt: d.clock.now()
        });
        d.persistence.log('update', 'purchaseOrder', po.id, 'تعديل وإعادة للمسودة');
        return po;
    },
    removePO(d: CrmWorkflowDeps, id: string) {
        const po = BusinessValues.find(d.repository.purchaseOrders, id);
        CommercialLifecycleRules.removablePurchaseOrder(po);
        d.repository.purchaseOrders = d.repository.purchaseOrders.filter(x => x.id !== id);
        d.persistence.log('delete', 'purchaseOrder', po.id, po.no);
        return po;
    },
    voidPO(d: CrmWorkflowDeps, id: string, reason: string = 'إلغاء أمر شراء') {
        const po = BusinessValues.find(d.repository.purchaseOrders, id);
        CommercialLifecycleRules.voidPurchaseOrder(po, reason, d.clock);
        d.persistence.log('void', 'purchaseOrder', po.id, po.voidReason);
        return po;
    },
    poTotal(d: CrmWorkflowDeps, po: BusinessPurchaseOrder) {
        return po.lines.reduce((s, l) => s + QuotationWorkflows.lineTotal(d, l), 0);
    },
    approvePO(d: CrmWorkflowDeps, id: string) {
        const po = BusinessValues.find(d.repository.purchaseOrders, id);
        CommercialLifecycleRules.approvePurchaseOrder(po);
    },
    receivePO(d: CrmWorkflowDeps, id: string) {
        const po = BusinessValues.find(d.repository.purchaseOrders, id);
        return d.fulfillment.receiveAll(po);
    },
    receivePOLines(d: CrmWorkflowDeps, id: string, quantities: Record<string, number>) {
        const po = BusinessValues.find(d.repository.purchaseOrders, id);
        return d.fulfillment.record(po, quantities);
    },
    convertPO(d: CrmWorkflowDeps, id: string) {
        return d.transactions.atomic('convertPO', () => {
            const po = BusinessValues.find(d.repository.purchaseOrders, id);
            CommercialLifecycleRules.convertiblePurchaseOrder(po);
            const billLines = d.fulfillment.uninvoicedLines(po, {
                legacyFull: true
            });
            if (!billLines.length) {
                const current = po.invoiceId && BusinessValues.find(d.repository.invoices, po.invoiceId);
                if (current && BusinessValues.live(current))
                    return current;
                throw new Error('لا توجد كمية منفذة جديدة قابلة للفوترة');
            }
            const invoiceSeq = (po.invoiceIds || []).filter(x => {
                const i = BusinessValues.find(d.repository.invoices, x);
                return i && BusinessValues.live(i);
            }).length + 1, externalBase = po.externalRef || po.no, generatedExternalNo = invoiceSeq > 1 ? `${externalBase}-P${invoiceSeq}` : externalBase, inv: BusinessInvoice = d.invoices.create({
                kind: 'supplier', partyId: po.supplierId, partyType: 'supplier', currency: po.currency, date: d.clock.today(), recognitionDate: po.expectedDate || '', externalNo: generatedExternalNo, description: `تحويل أمر شراء ${po.no}${invoiceSeq > 1 ? ` — دفعة ${invoiceSeq}` : ''}`, sourceType: 'purchaseOrder', sourceId: po.id, costCenterId: po.costCenterId || '', lines: billLines.map(l => ({
                    description: l.description, qty: l.qty, price: l.price, discount: 0, taxId: l.taxId || 'TAX0', accountId: l.accountId || '5100', costCenterId: l.costCenterId || po.costCenterId || '', purchaseOrderLineId: l.id
                })), status: 'draft'
            });
            inv.expenseAccountId = '5100';
            d.invoices.post(inv);
            inv.integrationSourceType = po.integrationSourceType || '';
            inv.integrationSourceId = po.integrationSourceId || '';
            if (po.advancePaymentSourceType && po.advancePaymentSourceId)
                d.parties.applyPendingInvoiceAdvances(inv, {
                    sourceType: po.advancePaymentSourceType, sourceId: po.advancePaymentSourceId
                });
            po.invoiceId = inv.id;
            po.invoiceIds = [...new Set([...(po.invoiceIds || []), inv.id])];
            d.fulfillment.markInvoiced(po, billLines);
            return inv;
        });
    }
};
export { PurchaseWorkflows };
