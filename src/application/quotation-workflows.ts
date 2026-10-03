// Legacy order and return timing preserved; dependencies are supplied by composition.
const QuotationWorkflows = {
    addQuotation(d: CrmWorkflowDeps, o: BusinessQuotationFields) {
        const q = {
            id: d.clock.id(), no: d.clock.next('quotation', o.date || d.clock.today()), date: o.date || d.clock.today(), partyId: o.partyId, currency: o.currency || d.repository.baseCurrency(), status: 'draft', validUntil: o.validUntil || '', notes: o.notes || '', lines: d.clock.clone(o.lines || []), sentAt: '', acceptedAt: '', convertedAt: '', rejectedAt: '', rejectedReason: '', createdAt: d.clock.now()
        };
        if (!q.partyId || !q.lines.length)
            throw new Error('العميل والبنود مطلوبة');
        d.repository.quotations.unshift(q);
        return q;
    },
    updateQuotation(d: CrmWorkflowDeps, id: string, o: BusinessQuotationFields) {
        const q = BusinessValues.find(d.repository.quotations, id);
        if (!q)
            throw new Error('عرض السعر غير موجود');
        d.policy.requireEditable('quotation', q);
        CommercialLifecycleRules.quotationFields(o);
        Object.assign(q, {
            date: o.date || q.date, partyId: o.partyId, currency: o.currency || q.currency, validUntil: o.validUntil || '', notes: o.notes || '', lines: d.clock.clone(o.lines), status: 'draft', sentAt: '', acceptedAt: '', rejectedAt: '', rejectedReason: '', updatedAt: d.clock.now()
        });
        d.persistence.log('update', 'quotation', q.id, 'تعديل وإعادة للمسودة');
        return q;
    },
    removeQuotation(d: CrmWorkflowDeps, id: string) {
        const q = BusinessValues.find(d.repository.quotations, id);
        CommercialLifecycleRules.removableQuotation(q);
        d.repository.quotations = d.repository.quotations.filter(x => x.id !== id);
    },
    lineTotal(d: CrmWorkflowDeps, l: BusinessLine) {
        const base = BusinessValues.number(l.qty) * BusinessValues.number(l.price);
        return base + d.tax.amount(base, l.taxId || 'TAX0');
    },
    quotationTotal(d: CrmWorkflowDeps, q: BusinessQuotation) {
        return q.lines.reduce((s, l) => s + QuotationWorkflows.lineTotal(d, l), 0);
    },
    acceptQuotation(d: CrmWorkflowDeps, id: string) {
        const q = BusinessValues.find(d.repository.quotations, id);
        CommercialLifecycleRules.acceptQuotation(q, d.clock);
        d.persistence.log('approve', 'quotation', q.id, `قبول ${q.no}`);
        return q;
    },
    convertQuotation(d: CrmWorkflowDeps, id: string) {
        return d.transactions.atomic('convertQuotation', () => {
            const q = BusinessValues.find(d.repository.quotations, id);
            CommercialLifecycleRules.convertibleQuotation(q);
            if (q.invoiceId)
                return BusinessValues.find(d.repository.invoices, q.invoiceId);
            const inv: BusinessInvoice = d.invoices.create({
                kind: 'customer', partyId: q.partyId, partyType: 'customer', currency: q.currency, date: d.clock.today(), description: `تحويل عرض ${q.no}`, sourceType: 'quotation', sourceId: q.id, lines: q.lines.map(l => ({
                    description: l.description, qty: l.qty, price: l.price, discount: 0, taxId: l.taxId || 'TAX0', accountId: l.accountId || '4200'
                })), status: 'draft'
            });
            inv.revenueAccountId = '4200';
            d.invoices.post(inv);
            q.invoiceId = inv.id;
            q.status = 'converted';
            q.convertedAt = d.clock.now();
            return inv;
        });
    }
};
