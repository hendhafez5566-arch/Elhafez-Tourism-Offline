import { BusinessValues } from '../core/business-values';
import type { BusinessJournalLine, JournalRuleDeps } from '../application/business-contracts';
// Used by every posting path, including advanced accounting; no accounting policy change.
const JournalRules = {
    normalize(d: JournalRuleDeps, lines: BusinessJournalLine[], date: string) {
        if (!lines.length)
            throw new Error('القيد بدون أطراف');
        const norm: (BusinessJournalLine & {
            baseDebit: number;
            baseCredit: number;
        })[] = [], baseCurrency = d.baseCurrency;
        for (const l of lines) {
            d.validateLine(l);
            const baseOnly = !!l.baseOnly, c = BusinessValues.text(l.currency || baseCurrency).toUpperCase(), rate = BusinessValues.number(l.rate) || d.rate(c, date);
            if (!baseOnly && !(rate > 0))
                throw new Error(`لا يوجد سعر صرف صالح للعملة ${c}`);
            let dr = BusinessValues.number(l.debit), cr = BusinessValues.number(l.credit), bd = BusinessValues.number(l.baseDebit), bc = BusinessValues.number(l.baseCredit);
            if (baseOnly) {
                if ((bd > 0) === (bc > 0))
                    throw new Error('طرف إعادة التقييم غير صحيح');
                dr = cr = 0;
                bd = d.round(bd, baseCurrency);
                bc = d.round(bc, baseCurrency);
            }
            else {
                if (dr < 0 || cr < 0 || (!dr && !cr) || dr && cr)
                    throw new Error('طرف قيد غير صحيح');
                bd = d.round(dr * rate, baseCurrency);
                bc = d.round(cr * rate, baseCurrency);
            }
            norm.push({
                ...l, currency: c, debit: dr, credit: cr, rate: baseOnly ? 0 : rate, baseDebit: bd, baseCredit: bc, baseOnly
            });
        }
        const td = d.round(norm.reduce((s, l) => s + l.baseDebit, 0), baseCurrency), tc = d.round(norm.reduce((s, l) => s + l.baseCredit, 0), baseCurrency);
        if (Math.abs(td - tc) > 0.01)
            throw new Error(`القيد غير متزن: ${d.format(td)} / ${d.format(tc)}`);
        return norm;
    }, reversalLines(lines: BusinessJournalLine[] = []) {
        return lines.map(l => {
            const x = {
                ...l
            };
            delete x.debit;
            delete x.credit;
            delete x.baseDebit;
            delete x.baseCredit;
            if (l.baseOnly)
                return {
                    ...x, baseDebit: l.baseCredit, baseCredit: l.baseDebit, currency: l.currency, baseOnly: true
                };
            return {
                ...x, debit: l.credit, credit: l.debit, currency: l.currency, rate: l.rate, baseOnly: false
            };
        });
    }
};
export { JournalRules };
