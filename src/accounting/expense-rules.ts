import { EPS } from '../core/runtime';
import { BusinessValues } from '../core/business-values';
import type { BusinessActor, BusinessTax, ExpenseRecord } from '../application/business-contracts';
interface ExpenseRuleTaxPort {
    amount(amount: number, id: string): number;
    require(id: string): BusinessTax;
}
const ExpenseRules = {
    postingBasis(e: ExpenseRecord, taxPort: ExpenseRuleTaxPort) {
        if (e.status !== 'draft')
            throw new Error('المصروف ليس مسودة');
        const tax = taxPort.amount(e.amount, e.taxId), total = e.amount + tax, tc = taxPort.require(e.taxId), debits = e.mode === 'prepaid' ? [{
                accountId: '1300', debit: e.amount, currency: e.currency
            }, {
                accountId: tc.inputAccount, debit: tax, currency: e.currency
            }].filter(l => l.debit > EPS) : [{
                accountId: e.expenseAccountId, debit: e.amount, currency: e.currency, costCenterId: e.costCenterId
            }, {
                accountId: tc.inputAccount, debit: tax, currency: e.currency, costCenterId: e.costCenterId
            }].filter(l => l.debit > EPS);
        return {
            tax, total, debits
        };
    }
};
const ApprovalRules = {
    needsPaymentApproval(ignore: boolean, enabled: () => boolean, actor: () => BusinessActor | undefined, amount: () => number) {
        return !ignore && enabled() && actor() && actor().role !== 'admin' && amount() > BusinessValues.number(actor().approvalLimit);
    }
};
export { ApprovalRules, ExpenseRules };
