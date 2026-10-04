import { BusinessValues } from '../core/business-values';
import type { BusinessJournalLine, TransferFields, TransferWorkflowDeps } from './business-contracts';
const TransferWorkflows = {
    transfer(d: TransferWorkflowDeps, o: TransferFields) {
        return d.transactions.atomic('transfer', () => {
            const from = BusinessValues.find(d.repository.treasuries, o.from), to = BusinessValues.find(d.repository.treasuries, o.to);
            if (!from || !to || from.id === to.id)
                throw new Error('اختر خزنتين مختلفتين');
            if (from.active === false || to.active === false)
                throw new Error('الخزنة موقوفة');
            const amt = BusinessValues.number(o.amount), date = o.date || d.clock.today();
            if (amt <= 0)
                throw new Error('المبلغ غير صحيح');
            d.accounting.validateTreasury(from.id, amt);
            const tr = {
                id: d.clock.id(), no: d.clock.next('transfer', date), date, from: from.id, to: to.id, amount: amt, sourceCurrency: from.currency, received: from.currency === to.currency ? amt : (BusinessValues.number(o.received) || d.money.convert(amt, from.currency, to.currency, date)), targetCurrency: to.currency, note: o.note || '', status: 'posted'
            }, lines: BusinessJournalLine[] = [{
                    accountId: d.accounting.ensureTreasuryAccount(to), debit: tr.received, currency: to.currency, treasuryId: to.id
                }, {
                    accountId: d.accounting.ensureTreasuryAccount(from), credit: amt, currency: from.currency, treasuryId: from.id
                }], diff = d.money.toBase(amt, from.currency, date) - d.money.toBase(tr.received, to.currency, date);
            if (Math.abs(diff) > 0.01)
                lines.push(diff > 0 ? {
                    accountId: '5500', debit: diff, currency: d.repository.baseCurrency(), baseDebit: diff, baseOnly: true
                } : {
                    accountId: '4500', credit: -diff, currency: d.repository.baseCurrency(), baseCredit: -diff, baseOnly: true
                });
            d.accounting.post({
                date, memo: tr.note || `تحويل ${tr.no}`, refType: 'transfer', refId: tr.id, lines
            });
            d.repository.transfers.unshift(tr);
            d.repository.documents.unshift({
                id: d.clock.id(), no: tr.no, date, type: 'transfer', refId: tr.id, refNo: tr.no, title: `تحويل ${tr.no}`, status: 'posted'
            });
            return tr;
        });
    },
    reverseTransfer(d: TransferWorkflowDeps, id: string, reason: string) {
        const tr = BusinessValues.find(d.repository.transfers, id);
        if (!tr || !BusinessValues.live(tr))
            throw new Error('التحويل غير متاح');
        if (!BusinessValues.text(reason).trim())
            throw new Error('سبب عكس التحويل مطلوب');
        tr.status = 'void';
        tr.voidReason = reason;
        d.accounting.documentStatus('transfer', tr.id, 'void');
        d.accounting.reverse('transfer', tr.id, reason);
    }
};
export { TransferWorkflows };
