import { BusinessValues } from '../core/business-values';
import { InvoiceRules } from '../accounting/invoice-rules';
import type { BusinessInvoice, BusinessJournalLine, InvoiceWorkflowDeps } from './business-contracts';
const InvoiceWorkflows = {
    post(d: InvoiceWorkflowDeps, inv: BusinessInvoice) {
        if (!inv || inv.status !== 'draft')
            throw new Error('الفاتورة ليست مسودة');
        d.math.validateLines(inv);
        const party = inv.kind === 'supplier' ? BusinessValues.find(d.repository.suppliers, inv.partyId) : (inv.partyType === 'agent' ? BusinessValues.find(d.repository.agents, inv.partyId) : BusinessValues.find(d.repository.customers, inv.partyId));
        if (!party)
            throw new Error('الطرف غير موجود');
        d.periods.assertOpen(inv.date);
        inv.baseRate = d.money.rate(inv.currency, inv.date);
        if (!(inv.baseRate > 0))
            throw new Error('سعر صرف الفاتورة غير صالح');
        for (const l of inv.lines) {
            const tc = d.tax.require(l.taxId || 'TAX0');
            if (tc.active === false)
                throw new Error(`كود الضريبة ${tc.id} موقوف`);
            l.taxRate = BusinessValues.number(tc.rate);
            l.taxInputAccount = tc.inputAccount;
            l.taxOutputAccount = tc.outputAccount;
        }
        const lines: BusinessJournalLine[] = [], control = inv.kind === 'supplier' ? '2100' : (inv.partyType === 'agent' ? '1210' : '1200'), partyType = inv.kind === 'supplier' ? 'supplier' : (inv.partyType || 'customer'), total = d.math.total(inv);
        lines.push(...InvoiceRules.postingLines(d, inv, control, partyType, total));
        d.accounting.post({
            date: inv.date, memo: `${inv.kind === 'supplier' ? 'فاتورة مورد' : 'فاتورة مبيعات'} ${inv.no} — ${party.name}`, refType: 'invoice', refId: inv.id, costCenterId: inv.costCenterId, lines
        });
        inv.status = 'open';
        d.applyPending(inv);
        d.math.refresh(inv);
        if (inv.recognitionDate && inv.recognitionDate > inv.date && d.deferred.available()) {
            if (inv.kind === 'customer' && !inv.revenueDeferred)
                d.deferred.revenue(inv);
            if (inv.kind === 'supplier' && !inv.costDeferred)
                d.deferred.cost(inv);
        }
        const doc = d.repository.documents.find(d => d.refId === inv.id);
        if (doc)
            doc.status = 'posted';
        d.persistence.log('post', 'invoice', inv.id, inv.no);
        return inv;
    },
    cancel(d: InvoiceWorkflowDeps, id: string, reason: string) {
        const inv = BusinessValues.find(d.repository.invoices, id);
        InvoiceRules.cancelable(inv, reason, () => d.math.allocations(inv.id), () => d.repository.invoiceAdjustments.some(x => BusinessValues.live(x) && x.invoiceId === id));
        if (inv.status === 'draft') {
            inv.status = 'void';
            inv.voidReason = reason;
            d.accounting.documentStatus('invoice', inv.id, 'void');
            d.syncService(inv);
            d.persistence.log('void', 'invoice', inv.id, reason);
            return inv;
        }
        d.accounting.reverse('invoice', inv.id, reason);
        inv.status = 'void';
        inv.voidReason = reason;
        d.accounting.documentStatus('invoice', inv.id, 'void');
        d.syncService(inv);
        d.persistence.log('void', 'invoice', inv.id, reason);
        return inv;
    }
};
export { InvoiceWorkflows };
