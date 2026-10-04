import { BusinessValues } from '../core/business-values';
import { PartyNettingRules } from '../crm/party-business-rules';
import type { NettingComponent, NettingFields, NettingRecord, NettingWorkflowDeps } from './business-contracts';
const NettingWorkflows = {
    async postNetting(d: NettingWorkflowDeps, type: string, id: string, o: NettingFields) {
        d.authorization.require('journal', 'add');
        const g = d.queries.groupFor(type, id);
        if (!g)
            throw new Error('اربط أدوار الطرف أولًا');
        const [payKey, recKey] = BusinessValues.text(o.pairRef || '').split('>>'), p = PartyNettingRules.parseComponentKey(payKey), r = PartyNettingRules.parseComponentKey(recKey), date = o.date || d.clock.today(), amount = BusinessValues.number(o.amount), currency = BusinessValues.text(o.currency || p.currency || r.currency).toUpperCase();
        PartyNettingRules.validatePair(payKey, recKey, p, r, currency);
        const entries = d.queries.allRoleEntries(g), valid = (c: NettingComponent) => entries.some(e => e.type === c.type && e.id === c.partyId);
        if (!valid(p) || !valid(r))
            throw new Error('طرفا المقاصة لا ينتميان لنفس الطرف الموحد');
        const max = Math.min(d.queries.componentAvailable(p, date), d.queries.componentAvailable(r, date));
        PartyNettingRules.validateAmount(amount, max, currency, d.money);
        return d.transactions.atomicAsync('partyNetting', () => {
            const invoiceAllocations = [...d.queries.allocateInvoices(p, amount), ...d.queries.allocateInvoices(r, amount)], x: NettingRecord = {
                id: d.clock.id(), no: d.clock.next('partyNetting', date), date, partyGroupId: g.id, payable: {
                    ...p
                }, receivable: {
                    ...r
                }, amount, currency, invoiceAllocations, note: BusinessValues.text(o.note || 'مقاصة ذمم نفس الطرف').trim(), status: 'posted', createdAt: d.clock.now(), createdBy: d.actor()?.id || ''
            };
            const j = d.accounting.post({
                date, memo: `مقاصة ${x.no} — ${g.name || 'طرف موحد'} — ${x.note}`, refType: 'party-netting', refId: x.id, lines: [{
                        accountId: p.accountId, debit: amount, currency, partyType: p.type, partyId: p.partyId
                    }, {
                        accountId: r.accountId, credit: amount, currency, partyType: r.type, partyId: r.partyId
                    }]
            });
            x.journalId = j.id;
            d.repository.nettings().unshift(x);
            d.repository.documents().unshift({
                id: d.clock.id(), no: x.no, date, type: 'partyNetting', refId: x.id, refNo: x.no, title: `مقاصة طرف ${x.no}`, status: 'posted'
            });
            d.queries.refreshNettingInvoices(x);
            d.persistence.log('post', 'partyNetting', x.id, `${g.name || ''} • ${d.money.format(amount, currency)}`);
            return x;
        }, {
            save: true, render: true, strict: true, waitForSave: true, rollback: true
        });
    },
    async reverseNetting(d: NettingWorkflowDeps, id: string, reason = 'إلغاء المقاصة') {
        d.authorization.require('journal', 'add');
        const x = BusinessValues.find(d.repository.nettings(), id);
        if (!x || x.status !== 'posted')
            throw new Error('المقاصة غير متاحة للعكس');
        if (!BusinessValues.text(reason).trim())
            throw new Error('سبب العكس مطلوب');
        return d.transactions.atomicAsync('partyNettingReverse', () => {
            d.accounting.reverse('party-netting', x.id, BusinessValues.text(reason).trim());
            x.status = 'reversed';
            x.reversedAt = d.clock.now();
            x.reverseReason = BusinessValues.text(reason).trim();
            d.accounting.documentStatus('partyNetting', x.id, 'reversed');
            d.queries.refreshNettingInvoices(x);
            d.persistence.log('reverse', 'partyNetting', x.id, x.reverseReason);
            return x;
        }, {
            save: true, render: true, strict: true, waitForSave: true, rollback: true
        });
    }
};
export { NettingWorkflows };
