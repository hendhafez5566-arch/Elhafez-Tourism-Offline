import { BusinessValues } from '../core/business-values';
import { ApprovalRules } from '../accounting/expense-rules';
import { VoucherRules } from '../accounting/voucher-rules';
import type { BusinessJournalLine, BusinessTreasury, BusinessVoucherFields, VoucherWorkflowDeps } from './business-contracts';
const VoucherWorkflows = {
    addReceipt(d: VoucherWorkflowDeps, o: BusinessVoucherFields) {
        return d.transactions.atomic('addReceipt', () => {
            const amt = BusinessValues.number(o.amount), ptype = o.partyType || 'customer', pid = o.partyId || '', date = o.date || d.clock.today(), cur = o.currency || d.repository.baseCurrency(), meta = VoucherRules.paymentMeta(o);
            VoucherRules.validateReceipt(amt, ptype, pid, o);
            let t: BusinessTreasury | null = null;
            if (meta.paymentMethod !== 'cheque') {
                t = BusinessValues.find(d.repository.treasuries, o.treasuryId);
                if (!t || t.active === false)
                    throw new Error('اختر خزنة نشطة');
            }
            const requestedDraft = ['customer', 'agent'].includes(ptype) && o.invoiceId ? d.pendingDraftInvoice('customer', ptype, pid, cur, o.invoiceId) : null, allocRes = ['customer', 'agent'].includes(ptype) ? (o.asAdvance ? {
                allocations: [], leftBase: d.money.toBase(amt, cur, date)
            } : d.invoices.allocate('customer', pid, cur, amt, date, requestedDraft ? '' : o.invoiceId)) : {
                allocations: [], leftBase: d.money.toBase(amt, cur, date)
            }, allocations = allocRes.allocations, pendingDraft = requestedDraft || (['customer', 'agent'].includes(ptype) && !o.invoiceId && allocRes.leftBase > 0.01 ? d.pendingDraftInvoice('customer', ptype, pid, cur) : null), r = {
                id: d.clock.id(), no: d.clock.next('receipt', date), date, partyType: ptype, partyId: pid, treasuryId: t?.id || o.treasuryId || '', amount: amt, currency: cur, note: o.note || '', status: 'posted', allocations, pendingInvoiceId: pendingDraft?.id || '', ...meta, createdAt: d.clock.now()
            }, lines: BusinessJournalLine[] = [], cashBase = d.money.toBase(amt, cur, date), cashAccount = meta.paymentMethod === 'cheque' ? '1150' : d.accounting.ensureTreasuryAccount(t);
            lines.push(...VoucherRules.receiptLines(d, o, amt, ptype, pid, date, cur, meta, t, cashBase, cashAccount, allocations));
            d.accounting.post({
                date, memo: r.note || `سند قبض ${r.no}`, refType: 'receipt', refId: r.id, lines
            });
            d.repository.receipts.unshift(r);
            if (meta.paymentMethod === 'cheque')
                d.repository.cheques.unshift({
                    id: d.clock.id(), direction: 'in', voucherId: r.id, no: meta.referenceNo, bankName: meta.bankName, valueDate: meta.valueDate, currency: cur, amount: amt, carryingBase: cashBase, status: 'received', treasuryId: o.treasuryId || '', date
                });
            for (const a of allocations) {
                const inv = BusinessValues.find(d.repository.invoices, a.invoiceId);
                if (inv)
                    d.invoices.refresh(inv);
            }
            d.onReceipt(r);
            d.repository.documents.unshift({
                id: d.clock.id(), no: r.no, date: r.date, type: 'receipt', refId: r.id, refNo: r.no, title: `سند قبض ${r.no}`, status: 'posted'
            });
            d.persistence.log('create', 'receipt', r.id, r.no);
            return r;
        });
    },
    addPayment(d: VoucherWorkflowDeps, o: BusinessVoucherFields, { ignoreApproval = false }: {
        ignoreApproval?: boolean;
    } = {}) {
        return d.transactions.atomic('addPayment', () => {
            const amt = BusinessValues.number(o.amount), ptype = o.partyType || 'supplier', pid = o.partyId || '', date = o.date || d.clock.today(), cur = o.currency || d.repository.baseCurrency(), meta = VoucherRules.paymentMeta(o);
            VoucherRules.validatePayment(amt, ptype, pid, o);
            const cashBase = d.money.toBase(amt, cur, date);
            if (ApprovalRules.needsPaymentApproval(ignoreApproval, () => d.repository.approvalPayments(), () => d.actor(), () => cashBase)) {
                const ap = d.approval.create('payment', {
                    ...o
                }, cashBase);
                d.approval.requested(ap);
                return {
                    pendingApproval: true, approval: ap
                };
            }
            let t: BusinessTreasury | null = null;
            if (meta.paymentMethod !== 'cheque') {
                t = BusinessValues.find(d.repository.treasuries, o.treasuryId);
                if (!t || t.active === false)
                    throw new Error('اختر خزنة نشطة');
                const tAmt = cashBase / d.money.rate(t.currency, date);
                d.accounting.validateTreasury(t.id, tAmt);
            }
            const forceAdvance = ptype === 'supplier' && o.forceSupplierAdvance === true, requestedDraft = !forceAdvance && ptype === 'supplier' && o.invoiceId ? d.pendingDraftInvoice('supplier', 'supplier', pid, cur, o.invoiceId) : null, allocRes = ptype === 'supplier' && !forceAdvance ? d.invoices.allocate('supplier', pid, cur, amt, date, requestedDraft ? '' : o.invoiceId) : {
                allocations: [], leftBase: cashBase
            }, allocations = allocRes.allocations, pendingDraft = !forceAdvance && (requestedDraft || (ptype === 'supplier' && !o.invoiceId && allocRes.leftBase > 0.01 ? d.pendingDraftInvoice('supplier', 'supplier', pid, cur) : null)), p = {
                id: d.clock.id(), no: d.clock.next('payment', date), date, branchId: d.branchId(), partyType: ptype, partyId: pid, treasuryId: t?.id || o.treasuryId || '', amount: amt, currency: cur, note: o.note || '', status: 'posted', allocations, pendingInvoiceId: pendingDraft?.id || '', sourceType: o.sourceType || '', sourceId: o.sourceId || '', sourceScheduleId: o.sourceScheduleId || '', sourceLabel: o.sourceLabel || '', ...meta, commissionId: o.commissionId || '', agentSettlement: o.agentSettlement ? d.clock.clone(o.agentSettlement) : null, createdAt: d.clock.now()
            }, lines: BusinessJournalLine[] = [];
            lines.push(...VoucherRules.paymentLines(d, o, amt, ptype, pid, date, cur, meta, t, cashBase, allocations));
            d.accounting.post({
                date: p.date, memo: p.note || `سند صرف ${p.no}`, refType: 'payment', refId: p.id, lines
            });
            d.repository.payments.unshift(p);
            if (meta.paymentMethod === 'cheque')
                d.repository.cheques.unshift({
                    id: d.clock.id(), direction: 'out', voucherId: p.id, no: meta.referenceNo, bankName: meta.bankName, valueDate: meta.valueDate, currency: cur, amount: amt, carryingBase: cashBase, status: 'issued', treasuryId: o.treasuryId || '', date
                });
            for (const a of allocations) {
                const inv = BusinessValues.find(d.repository.invoices, a.invoiceId);
                if (inv)
                    d.invoices.refresh(inv);
            }
            d.repository.documents.unshift({
                id: d.clock.id(), no: p.no, date: p.date, type: 'payment', refId: p.id, refNo: p.no, title: `سند صرف ${p.no}`, status: 'posted'
            });
            if (p.commissionId) {
                const c = BusinessValues.find(d.repository.commissions, p.commissionId), settled = BusinessValues.number(p.agentSettlement?.amount);
                if (!c || !['approved', 'partial'].includes(c.status))
                    throw new Error('العمولة المرتبطة بسند الصرف غير متاحة');
                if (settled <= 0 || BusinessValues.number(c.paidAmount) + settled > BusinessValues.number(c.amount) + 0.0001)
                    throw new Error('قيمة تسوية العمولة غير صحيحة');
                c.paidAmount = BusinessValues.number(c.paidAmount) + settled;
                c.paymentIds = [...(c.paymentIds || []), p.id];
                c.status = c.amount - c.paidAmount <= 0.0001 ? 'paid' : 'partial';
            }
            d.persistence.log('create', 'payment', p.id, p.no);
            return p;
        });
    }
};
export { VoucherWorkflows };
