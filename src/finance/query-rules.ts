import { EPS } from '../core/runtime';
import { BusinessValues } from '../core/business-values';
import type { FinancialQueryDeps } from '../application/business-contracts';
const FinancialQueryRules = {
    balanceBase(d: FinancialQueryDeps, map: Record<string, number>, positiveOnly: boolean = false) {
        let total = 0;
        for (const [c, v] of Object.entries(map || {}))
            total += d.money.toBase(positiveOnly ? Math.max(0, BusinessValues.number(v)) : BusinessValues.number(v), c);
        return total;
    },
    customerReceivablesBase(d: FinancialQueryDeps) {
        return d.repository.customers.reduce((s, x) => s + FinancialQueryRules.balanceBase(d, d.ledger.partyReceivable('customer', x.id), true), 0);
    },
    agentReceivablesBase(d: FinancialQueryDeps) {
        return d.repository.agents.reduce((s, x) => s + FinancialQueryRules.balanceBase(d, d.ledger.partyReceivable('agent', x.id), true), 0);
    },
    supplierPayablesBase(d: FinancialQueryDeps) {
        return d.repository.suppliers.reduce((s, x) => s + FinancialQueryRules.balanceBase(d, d.ledger.supplierPayable(x.id), true), 0);
    },
    agentPayablesBase(d: FinancialQueryDeps) {
        return d.repository.agents.reduce((s, x) => s + FinancialQueryRules.balanceBase(d, d.ledger.agentPayable(x.id), true), 0);
    },
    customerAdvancesBase(d: FinancialQueryDeps, to: string = '') {
        return d.repository.customers.reduce((s, x) => s + FinancialQueryRules.balanceBase(d, d.ledger.customerAdvance('customer', x.id, '', to), true), 0) + d.repository.agents.reduce((s, x) => s + FinancialQueryRules.balanceBase(d, d.ledger.customerAdvance('agent', x.id, '', to), true), 0);
    },
    supplierAdvancesBase(d: FinancialQueryDeps, to: string = '') {
        return d.repository.suppliers.reduce((s, x) => s + FinancialQueryRules.balanceBase(d, d.ledger.supplierAdvance(x.id, '', to), true), 0);
    },
    treasuryBase(d: FinancialQueryDeps, to: string = '') {
        return d.repository.treasuries.filter(x => x.active !== false).reduce((s, t) => s + d.money.toBase(d.ledger.treasuryBalance(t.id, to), t.currency, to || d.today()), 0);
    },
    rangePnL(d: FinancialQueryDeps, from: string = '', to: string = '') {
        const ls = d.ledger.lines(from, to).filter(x => !['year-close', 'year-reopen'].includes(x.refType));
        let revenue = 0, expense = 0;
        for (const l of ls) {
            const a = d.ledger.account(l.accountId);
            if (a?.type === 'revenue')
                revenue += l.baseCredit - l.baseDebit;
            if (a?.type === 'expense')
                expense += l.baseDebit - l.baseCredit;
        }
        return {
            revenue, expense, profit: revenue - expense
        };
    },
    currentMonth(d: FinancialQueryDeps) {
        const m = d.today().slice(0, 7), ls = d.ledger.lines().filter(x => x.date.startsWith(m) && x.refType !== 'year-close');
        let revenue = 0, expense = 0;
        for (const l of ls) {
            const a = d.ledger.account(l.accountId);
            if (a?.type === 'revenue')
                revenue += l.baseCredit - l.baseDebit;
            if (a?.type === 'expense')
                expense += l.baseDebit - l.baseCredit;
        }
        return {
            revenue, expense, profit: revenue - expense
        };
    },
    overdueInvoices(d: FinancialQueryDeps, kind: string = '') {
        const invoices = (d.repository.invoices || []).filter(x => !kind || x.kind === kind), metrics = d.invoices.listMetrics(invoices);
        return invoices.filter(x => BusinessValues.live(x) && x.status !== 'draft' && BusinessValues.number(metrics.get(x.id)?.remaining) > EPS && d.daysBetween(x.dueDate || x.date, d.today()) > 0);
    },
    aging(d: FinancialQueryDeps, kind: string = 'customer') {
        const bands = {
            '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0
        }, invoices = (d.repository.invoices || []).filter(i => i.kind === kind), metrics = d.invoices.listMetrics(invoices);
        for (const x of invoices.filter(i => BusinessValues.live(i) && i.status !== 'draft' && BusinessValues.number(metrics.get(i.id)?.remaining) > EPS)) {
            const days = Math.max(0, d.daysBetween(x.dueDate || x.date, d.today())), v = d.money.toBase(BusinessValues.number(metrics.get(x.id)?.remaining), x.currency);
            if (days <= 30)
                bands['0-30'] += v;
            else if (days <= 60)
                bands['31-60'] += v;
            else if (days <= 90)
                bands['61-90'] += v;
            else
                bands['90+'] += v;
        }
        return bands;
    },
    programProfit(d: FinancialQueryDeps, p: {
        id: string;
        costCenterId?: string;
    }) {
        const ls = d.ledger.lines().filter(l => l.costCenterId === p.costCenterId && !['year-close', 'year-reopen'].includes(l.refType)), rev = ls.filter(l => d.ledger.account(l.accountId)?.type === 'revenue').reduce((s, l) => s + l.baseCredit - l.baseDebit, 0), exp = ls.filter(l => d.ledger.account(l.accountId)?.type === 'expense').reduce((s, l) => s + l.baseDebit - l.baseCredit, 0);
        return {
            revenue: rev, expense: exp, profit: rev - exp
        };
    },
    programCommitted(d: FinancialQueryDeps, p: {
        id: string;
        costCenterId?: string;
    }) {
        return d.repository.purchaseOrders.filter(po => po.programId === p.id && BusinessValues.live(po) && ['approved', 'partiallyReceived', 'received', 'partiallyInvoiced'].includes(po.status)).reduce((sum, po) => {
            const remaining = (po.lines || []).reduce((z, l) => {
                const qty = Math.max(0, BusinessValues.number(l.qty) - BusinessValues.number(l.invoicedQty));
                return z + d.lineTotal({
                    ...l, qty
                });
            }, 0);
            return sum + d.money.toBase(remaining, po.currency, po.date);
        }, 0);
    }
};
export { FinancialQueryRules };
