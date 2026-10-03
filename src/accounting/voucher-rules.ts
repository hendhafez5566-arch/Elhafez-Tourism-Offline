import { EPS } from '../core/runtime';
import { BusinessValues } from '../core/business-values';
import type { BusinessAllocation, BusinessJournalLine, BusinessPaymentMeta, BusinessTreasury, BusinessVoucherFields, VoucherLineDeps } from '../application/business-contracts';
// Payment metadata and voucher invariants have one source of truth, independent of presentation.
const VoucherRules = {
    paymentMeta(o: BusinessVoucherFields) {
        const m = o.paymentMethod || 'cash', ref = BusinessValues.text(o.referenceNo).trim(), bank = BusinessValues.text(o.bankName).trim(), valueDate = o.valueDate || '';
        if (m === 'bank' && !ref)
            throw new Error('رقم التحويل البنكي مطلوب');
        if (m === 'card' && !ref)
            throw new Error('رقم عملية البطاقة / نقطة البيع مطلوب');
        if (m === 'wallet' && !ref)
            throw new Error('رقم عملية المحفظة مطلوب');
        if (m === 'cheque') {
            if (!ref)
                throw new Error('رقم الشيك مطلوب');
            if (!bank)
                throw new Error('اسم البنك مطلوب');
            if (!valueDate)
                throw new Error('تاريخ استحقاق الشيك مطلوب');
        }
        return {
            paymentMethod: m, referenceNo: ref, bankName: bank, valueDate
        };
    },
    validateReceipt(amount: number, type: string, id: string, input: BusinessVoucherFields) {
        const partyNeeded = ['customer', 'agent', 'supplierAdvance'].includes(type);
        if (amount <= 0)
            throw new Error('المبلغ غير صحيح');
        if (partyNeeded && !id)
            throw new Error('اختر الطرف');
        if (type === 'other' && !input.creditAccountId)
            throw new Error('اختر الحساب المقابل');
        if (!['customer', 'agent', 'supplierAdvance', 'other'].includes(type))
            throw new Error('نوع الطرف غير صحيح');
    },
    validatePayment(amount: number, type: string, id: string, input: BusinessVoucherFields) {
        const partyNeeded = ['supplier', 'agent', 'customerAdvance', 'agentAdvance'].includes(type);
        if (amount <= 0)
            throw new Error('المبلغ غير صحيح');
        if (partyNeeded && !id)
            throw new Error('اختر الطرف');
        if (type === 'other' && !input.debitAccountId && !Array.isArray(input.debitLines))
            throw new Error('اختر الحساب المقابل');
        if (!['supplier', 'agent', 'customerAdvance', 'agentAdvance', 'other'].includes(type))
            throw new Error('نوع الطرف غير صحيح');
    },
    receiptLines(d: VoucherLineDeps, o: BusinessVoucherFields, amt: number, ptype: string, pid: string, date: string, cur: string, meta: BusinessPaymentMeta, t: BusinessTreasury, cashBase: number, cashAccount: string, allocations: BusinessAllocation[]) {
        const lines: BusinessJournalLine[] = [];
        if (meta.paymentMethod === 'cheque')
            lines.push({
                accountId: cashAccount, debit: amt, currency: cur
            });
        else {
            const tAmt = cashBase / d.money.rate(t.currency, date);
            lines.push({
                accountId: cashAccount, debit: tAmt, currency: t.currency, treasuryId: t.id
            });
        }
        if (ptype === 'other')
            lines.push({
                accountId: o.creditAccountId, credit: amt, currency: cur, employeeId: o.employeeId || '', costCenterId: o.costCenterId || ''
            });
        else if (ptype === 'supplierAdvance') {
            const available = BusinessValues.number(d.accounting.supplierAdvance(pid)[cur]);
            if (available + EPS < amt)
                throw new Error(`المتاح كدفعة مقدمة لدى المورد ${d.money.format(available, cur)}`);
            lines.push({
                accountId: '1400', credit: amt, currency: cur, partyType: 'supplier', partyId: pid
            });
        }
        else {
            const ar = ptype === 'agent' ? '1210' : '1200', adv = ptype === 'agent' ? '2410' : '2400';
            let usedCashBase = 0;
            for (const a of allocations) {
                const inv = BusinessValues.find(d.repository.invoices, a.invoiceId);
                lines.push({
                    accountId: ar, credit: a.invoiceAmount, currency: inv.currency, rate: BusinessValues.number(inv.baseRate) || d.money.rate(inv.currency, inv.date), partyType: ptype, partyId: pid
                });
                usedCashBase += a.paymentBase;
                if (a.realizedFx > 0)
                    lines.push({
                        accountId: '4500', credit: a.realizedFx, currency: d.repository.baseCurrency(), baseCredit: a.realizedFx, baseOnly: true
                    });
                else if (a.realizedFx < 0)
                    lines.push({
                        accountId: '5500', debit: -a.realizedFx, currency: d.repository.baseCurrency(), baseDebit: -a.realizedFx, baseOnly: true
                    });
            }
            const left = Math.max(0, cashBase - usedCashBase);
            if (left > 0.01) {
                const units = left / d.money.rate(cur, date);
                lines.push({
                    accountId: adv, credit: units, currency: cur, partyType: ptype, partyId: pid
                });
            }
        }
        return lines;
    },
    paymentLines(d: VoucherLineDeps, o: BusinessVoucherFields, amt: number, ptype: string, pid: string, date: string, cur: string, meta: BusinessPaymentMeta, t: BusinessTreasury, cashBase: number, allocations: BusinessAllocation[]) {
        const lines: BusinessJournalLine[] = [];
        if (ptype === 'supplier') {
            let usedCashBase = 0;
            for (const a of allocations) {
                const inv = BusinessValues.find(d.repository.invoices, a.invoiceId);
                lines.push({
                    accountId: '2100', debit: a.invoiceAmount, currency: inv.currency, rate: BusinessValues.number(inv.baseRate) || d.money.rate(inv.currency, inv.date), partyType: 'supplier', partyId: pid
                });
                usedCashBase += a.paymentBase;
                if (a.realizedFx > 0)
                    lines.push({
                        accountId: '5500', debit: a.realizedFx, currency: d.repository.baseCurrency(), baseDebit: a.realizedFx, baseOnly: true
                    });
                else if (a.realizedFx < 0)
                    lines.push({
                        accountId: '4500', credit: -a.realizedFx, currency: d.repository.baseCurrency(), baseCredit: -a.realizedFx, baseOnly: true
                    });
            }
            const left = Math.max(0, cashBase - usedCashBase);
            if (left > 0.01) {
                const units = left / d.money.rate(cur, date);
                lines.push({
                    accountId: '1400', debit: units, currency: cur, partyType: 'supplier', partyId: pid
                });
            }
        }
        else if (ptype === 'agent') {
            const st = o.agentSettlement;
            if (!st)
                throw new Error('سداد عمولة المندوب يجب أن يتم من شاشة العمولات');
            const liabilityAmount = BusinessValues.number(st.amount), liabilityRate = BusinessValues.number(st.rate) || d.money.rate(st.currency, date), carrying = liabilityAmount * liabilityRate;
            if (liabilityAmount <= 0)
                throw new Error('قيمة تسوية العمولة غير صحيحة');
            lines.push({
                accountId: '2200', debit: liabilityAmount, currency: st.currency, rate: liabilityRate, partyType: 'agent', partyId: pid
            });
            const diff = cashBase - carrying;
            if (diff > 0.01)
                lines.push({
                    accountId: '5500', debit: diff, currency: d.repository.baseCurrency(), baseDebit: diff, baseOnly: true
                });
            else if (diff < -0.01)
                lines.push({
                    accountId: '4500', credit: -diff, currency: d.repository.baseCurrency(), baseCredit: -diff, baseOnly: true
                });
        }
        else if (ptype === 'customerAdvance') {
            const available = BusinessValues.number(d.accounting.customerAdvance('customer', pid)[cur]);
            if (available + EPS < amt)
                throw new Error(`الرصيد المقدم للعميل ${d.money.format(available, cur)}`);
            lines.push({
                accountId: '2400', debit: amt, currency: cur, partyType: 'customer', partyId: pid
            });
        }
        else if (ptype === 'agentAdvance') {
            const available = BusinessValues.number(d.accounting.customerAdvance('agent', pid)[cur]);
            if (available + EPS < amt)
                throw new Error(`الرصيد المقدم للمندوب ${d.money.format(available, cur)}`);
            lines.push({
                accountId: '2410', debit: amt, currency: cur, partyType: 'agent', partyId: pid
            });
        }
        else if (Array.isArray(o.debitLines) && o.debitLines.length)
            lines.push(...o.debitLines);
        else
            lines.push({
                accountId: o.debitAccountId, debit: amt, currency: cur
            });
        if (meta.paymentMethod === 'cheque')
            lines.push({
                accountId: '2150', credit: amt, currency: cur
            });
        else {
            const tAmt = cashBase / d.money.rate(t.currency, date);
            lines.push({
                accountId: d.accounting.ensureTreasuryAccount(t), credit: tAmt, currency: t.currency, treasuryId: t.id
            });
        }
        return lines;
    }
};
export { VoucherRules };
