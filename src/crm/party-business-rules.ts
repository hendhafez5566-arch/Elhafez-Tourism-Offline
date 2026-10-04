import { EPS } from '../core/runtime';
import { BusinessValues } from '../core/business-values';
import type { BusinessMoneyPort, NettingComponent } from '../application/business-contracts';
const PartyNettingRules = {
    validatePair(payKey: string, recKey: string, p: NettingComponent, r: NettingComponent, currency: string) {
        if (!payKey || !recKey || PartyNettingRules.componentKind(p.accountId) !== 'payable' || PartyNettingRules.componentKind(r.accountId) !== 'receivable')
            throw new Error('اختر طرفي المقاصة بشكل صحيح');
        if (p.currency !== r.currency || currency !== p.currency)
            throw new Error('المقاصة المباشرة تتطلب نفس العملة');
        if (p.type === r.type)
            throw new Error('المقاصة الرسمية هنا بين دورين مختلفين لنفس الطرف؛ التسويات داخل نفس الدور تتم من مستنداتها الأصلية');
    }, validateAmount(amount: number, max: number, currency: string, moneyPort: BusinessMoneyPort) {
        if (amount <= EPS)
            throw new Error('قيمة المقاصة يجب أن تكون أكبر من صفر');
        if (amount > max + EPS)
            throw new Error(`أقصى مقاصة متاحة ${moneyPort.format(max, currency)}`);
    },
    parseComponentKey(key: string) {
        const [type, partyId, accountId, currency] = BusinessValues.text(key).split('|');
        return {
            type, partyId, accountId, currency
        };
    },
    componentKind(accountId: string) {
        return ['2100', '2200', '2400', '2410'].includes(accountId) ? 'payable' : ['1200', '1210', '1400'].includes(accountId) ? 'receivable' : '';
    }
};
interface PartyNameRepository {
    customers: {
        id: string;
        name?: string;
    }[];
    suppliers: {
        id: string;
        name?: string;
    }[];
    agents: {
        id: string;
        name?: string;
    }[];
}
const PartyBusinessRules = {
    normalizePhone(phone: string, countryCode: string) {
        let p = BusinessValues.text(phone).replace(/[^0-9+]/g, '');
        if (p.startsWith('+'))
            p = p.slice(1);
        if (p.startsWith('00'))
            p = p.slice(2);
        if (p.startsWith('0'))
            p = BusinessValues.text(countryCode || '20').replace(/\D/g, '') + p.slice(1);
        return p.replace(/\D/g, '');
    },
    name(repository: PartyNameRepository, type: string, id: string) {
        if (['customer', 'customerAdvance'].includes(type))
            return BusinessValues.find(repository.customers, id)?.name || '';
        if (['supplier', 'supplierAdvance'].includes(type))
            return BusinessValues.find(repository.suppliers, id)?.name || '';
        if (['agent', 'agentAdvance'].includes(type))
            return BusinessValues.find(repository.agents, id)?.name || '';
        return '';
    }
};
export { PartyBusinessRules, PartyNettingRules };
export type { PartyNameRepository };
