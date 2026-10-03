const InvoiceRules = {
    cancelable(inv: BusinessInvoice | undefined, reason: string, allocated: () => number, hasAdjustments: () => boolean) {
        if (!inv || !BusinessValues.live(inv))
            throw new Error('الفاتورة غير متاحة');
        if (!BusinessValues.text(reason).trim())
            throw new Error('سبب الإلغاء مطلوب');
        if (allocated() > EPS)
            throw new Error('يجب عكس السداد/التحصيل المرتبط قبل إلغاء الفاتورة');
        if (hasAdjustments())
            throw new Error('يجب عكس الإشعارات المرتبطة أولًا');
    },
    lineCalc(d: InvoiceRuleDeps, l: BusinessLine, currency = '') {
        const qtyRaw = l?.qty == null || BusinessValues.text(l.qty) === '' ? 1 : Number(l.qty), qty = Number.isFinite(qtyRaw) ? Math.max(0, qtyRaw) : 0, priceRaw = Number(l?.price), price = Number.isFinite(priceRaw) ? Math.max(0, priceRaw) : 0, gross = d.round(qty * price, currency), discount = d.round(l.discountMode === 'percent' ? gross * Math.min(100, Math.max(0, BusinessValues.number(l.discount))) / 100 : Math.max(0, BusinessValues.number(l.discount)), currency), net = d.round(Math.max(0, gross - discount), currency), tax = d.tax.amount(net, l.taxId || 'TAX0', l.taxRate == null ? null : l.taxRate, currency), total = d.round(net + tax, currency);
        return {
            qty, price, gross, discount, net, tax, total
        };
    }, postingLines(d: InvoicePostingRuleDeps, inv: BusinessInvoice, control: string, partyType: string, total: number) {
        const lines: BusinessJournalLine[] = [];
        if (inv.kind === 'customer') {
            if (inv.partyType !== 'agent') {
                const cust = BusinessValues.find(d.repository.customers, inv.partyId), limit = BusinessValues.number(cust?.creditLimit);
                if (limit > 0) {
                    const current = d.balanceBase(d.accounting.partyReceivable('customer', inv.partyId), true), newDue = d.money.toBase(total, inv.currency, inv.date);
                    if (current + newDue > limit + EPS)
                        throw new Error(`العملية تتجاوز حد ائتمان العميل ${d.money.format(limit, d.repository.baseCurrency())}`);
                }
            }
            lines.push({
                accountId: control, debit: total, currency: inv.currency, rate: inv.baseRate, partyType, partyId: inv.partyId
            });
            for (const l of inv.lines) {
                const c = d.math.lineCalc(l, inv.currency), accountId = l.accountId || inv.revenueAccountId || '4200', cc = l.costCenterId || inv.costCenterId || '';
                if (c.net > EPS)
                    lines.push({
                        accountId, credit: c.net, currency: inv.currency, rate: inv.baseRate, costCenterId: cc
                    });
                if (c.tax > EPS) {
                    const tc = d.tax.require(l.taxId);
                    lines.push({
                        accountId: l.taxOutputAccount || tc.outputAccount, credit: c.tax, currency: inv.currency, rate: inv.baseRate, costCenterId: cc, taxId: tc.id, taxDirection: 'output', sourceInvoiceId: inv.id, sourceLineId: l.id
                    });
                }
            }
        }
        else {
            for (const l of inv.lines) {
                const c = d.math.lineCalc(l, inv.currency), accountId = l.accountId || inv.expenseAccountId || '5100', cc = l.costCenterId || inv.costCenterId || '';
                if (c.net > EPS)
                    lines.push({
                        accountId, debit: c.net, currency: inv.currency, rate: inv.baseRate, costCenterId: cc
                    });
                if (c.tax > EPS) {
                    const tc = d.tax.require(l.taxId);
                    lines.push({
                        accountId: l.taxInputAccount || tc.inputAccount, debit: c.tax, currency: inv.currency, rate: inv.baseRate, costCenterId: cc, taxId: tc.id, taxDirection: 'input', sourceInvoiceId: inv.id, sourceLineId: l.id
                    });
                }
            }
            lines.push({
                accountId: control, credit: total, currency: inv.currency, rate: inv.baseRate, partyType: 'supplier', partyId: inv.partyId
            });
        }
        return lines;
    }
};
