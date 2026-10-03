// Shared advanced accounting arithmetic. Callers retain original mutation and ID allocation order.
interface DepreciationRuleRecord {
    cost: number;
    salvage: number;
    depreciated?: BusinessNumber;
    lifeMonths: number;
    currency: string;
}
interface PrepaidRuleRecord {
    date: string;
    amount: number;
    months: number;
}
const AdvancedAccountingRules = {
    depreciation(x: DepreciationRuleRecord, round: (value: number, currency: string) => number) {
        const depreciable = Math.max(0, x.cost - x.salvage), remaining = Math.max(0, depreciable - BusinessValues.number(x.depreciated));
        if (remaining <= EPS)
            throw new Error('تم إهلاك الأصل بالكامل');
        const monthly = round(depreciable / x.lifeMonths, x.currency), amount = round(Math.min(monthly, remaining), x.currency);
        return amount;
    },
    prepaidPart(e: PrepaidRuleRecord, index: number) {
        const cents = Math.round(e.amount * 100), base = Math.floor(cents / e.months), rem = cents - base * e.months, src = new Date(`${e.date}T00:00:00Z`), day = src.getUTCDate(), dt = new Date(Date.UTC(src.getUTCFullYear(), src.getUTCMonth() + index, 1)), last = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0)).getUTCDate();
        dt.setUTCDate(Math.min(day, last));
        return {
            date: dt.toISOString().slice(0, 10), amount: (base + (index === e.months - 1 ? rem : 0)) / 100
        };
    },
    loanPayment(principal: number, annualRate: number, months: number) {
        const monthlyRate = annualRate / 1200, payment = monthlyRate > 0 ? principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months)) : principal / months;
        return {
            monthlyRate, payment
        };
    },
    loanPart(balance: number, monthlyRate: number, payment: number, index: number, months: number, currency: string, round: (value: number, currency: string) => number) {
        const interest = round(balance * monthlyRate, currency), principalPart = round(index === months ? balance : Math.min(balance, payment - interest), currency);
        return {
            interest, principalPart
        };
    },
    payroll(gross: number, deductions: number, currency: string, round: (value: number, currency: string) => number) {
        const net = round(gross - deductions, currency);
        if (gross <= 0 || net < 0)
            throw new Error('بيانات مسير الرواتب غير صحيحة');
        return net;
    }
};
