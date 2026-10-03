const ExpenseWorkflows = {
    addExpense(d: ExpenseWorkflowDeps, o: ExpenseFields) {
        return d.transactions.atomic('addExpense', () => {
            const amt = BusinessValues.number(o.amount), cur = o.currency || d.repository.baseCurrency(), date = o.date || d.clock.today(), requestedStatus = o.status || 'draft';
            if (amt <= 0)
                throw new Error('المبلغ غير صحيح');
            const e = {
                id: d.clock.id(), no: d.clock.next('expense', date), date, category: o.category || 'مصروف تشغيلي', amount: amt, currency: cur, mode: o.mode || 'paid', treasuryId: o.treasuryId || '', supplierId: o.supplierId || '', description: o.description || '', costCenterId: o.costCenterId || '', status: 'draft', months: Math.max(1, BusinessValues.number(o.months) || 1), expenseAccountId: o.expenseAccountId || '5200', taxId: o.taxId || 'TAX0', createdAt: d.clock.now()
            };
            d.repository.expenses.unshift(e);
            if (requestedStatus !== 'draft')
                ExpenseWorkflows.postExpense(d, e, o);
            d.persistence.log('create', 'expense', e.id, e.no);
            return e;
        });
    },
    postExpense(d: ExpenseWorkflowDeps, e: ExpenseRecord, o: ExpenseApprovalOptions = {}) {
        const { tax, total, debits } = ExpenseRules.postingBasis(e, d.tax);
        if (['paid', 'prepaid'].includes(e.mode) && !o._approved && ApprovalRules.needsPaymentApproval(false, () => d.repository.approvalPayments(), () => d.actor(), () => d.money.toBase(total, e.currency, e.date))) {
            const existing = e.approvalId && BusinessValues.find(d.repository.approvals, e.approvalId);
            if (existing?.status === 'pending')
                return {
                    pendingApproval: true, approval: existing
                };
            const ap = d.approval.create('expense', {
                expenseId: e.id, options: {
                    paymentMethod: o.paymentMethod || 'cash', referenceNo: o.referenceNo || '', bankName: o.bankName || '', valueDate: o.valueDate || '', dueDate: o.dueDate || ''
                }
            }, d.money.toBase(total, e.currency, e.date));
            e.approvalId = ap.id;
            return {
                pendingApproval: true, approval: ap
            };
        }
        if (e.mode === 'paid') {
            const p = d.vouchers.addPayment({
                date: e.date, partyType: 'other', partyId: '', treasuryId: e.treasuryId, amount: total, currency: e.currency, debitAccountId: e.expenseAccountId, debitLines: debits, note: e.description || e.category, paymentMethod: o.paymentMethod || 'cash', referenceNo: o.referenceNo || '', bankName: o.bankName || '', valueDate: o.valueDate || ''
            }, {
                ignoreApproval: true
            });
            if (p.pendingApproval)
                throw new Error('تعذر ترحيل المصروف قبل اعتماد الدفع');
            e.paymentId = p.id;
        }
        else if (e.mode === 'accrued') {
            if (!e.supplierId)
                throw new Error('المورد مطلوب');
            const inv: BusinessInvoice = d.invoices.create({
                kind: 'supplier', partyId: e.supplierId, partyType: 'supplier', currency: e.currency, date: e.date, dueDate: o.dueDate || e.date, description: e.description || e.category, sourceType: 'expense', sourceId: e.id, costCenterId: e.costCenterId, lines: [{
                        description: e.description || e.category, qty: 1, price: e.amount, discount: 0, taxId: e.taxId, accountId: e.expenseAccountId, costCenterId: e.costCenterId
                    }], status: 'draft'
            });
            inv.expenseAccountId = e.expenseAccountId;
            d.invoices.post(inv);
            e.invoiceId = inv.id;
        }
        else if (e.mode === 'prepaid') {
            const p = d.vouchers.addPayment({
                date: e.date, partyType: 'other', partyId: '', treasuryId: e.treasuryId, amount: total, currency: e.currency, debitAccountId: '1300', debitLines: debits, note: `مصروف مقدم — ${e.category}`, paymentMethod: o.paymentMethod || 'cash', referenceNo: o.referenceNo || '', bankName: o.bankName || '', valueDate: o.valueDate || ''
            }, {
                ignoreApproval: true
            });
            e.paymentId = p.id;
            d.buildPrepaidSchedule(e);
        }
        e.status = 'posted';
        d.repository.documents.unshift({
            id: d.clock.id(), no: e.no, date: e.date, type: 'expense', refId: e.id, refNo: e.no, title: `مصروف ${e.no}`, status: 'posted'
        });
        return e;
    },
    updateExpense(d: ExpenseWorkflowDeps, id: string, o: ExpenseFields) {
        const e = BusinessValues.find(d.repository.expenses, id);
        if (!e || e.status !== 'draft')
            throw new Error('يمكن تعديل المصروف المسودة فقط');
        if (e.approvalId) {
            const ap = BusinessValues.find(d.repository.approvals, e.approvalId);
            if (ap?.status === 'pending') {
                ap.status = 'rejected';
                ap.reason = 'تم تعديل مسودة المصروف';
                ap.rejectedAt = d.clock.now();
                ap.rejectedBy = d.actor()?.id || '';
            }
            e.approvalId = '';
        }
        const amount = BusinessValues.number(o.amount);
        if (amount <= 0)
            throw new Error('قيمة المصروف يجب أن تكون أكبر من صفر');
        Object.assign(e, {
            date: o.date || e.date, category: o.category || e.category, amount, currency: o.currency || e.currency, mode: o.mode || e.mode, treasuryId: o.treasuryId || '', supplierId: o.supplierId || '', description: o.description || '', costCenterId: o.costCenterId || '', months: Math.max(1, BusinessValues.number(o.months) || 1), expenseAccountId: o.expenseAccountId || e.expenseAccountId, taxId: o.taxId || e.taxId
        });
        return e;
    },
    deleteExpense(d: ExpenseWorkflowDeps, id: string) {
        const e = BusinessValues.find(d.repository.expenses, id);
        if (!e || e.status !== 'draft')
            throw new Error('الحذف للمسودة فقط');
        if (e.approvalId) {
            const ap = BusinessValues.find(d.repository.approvals, e.approvalId);
            if (ap?.status === 'pending') {
                ap.status = 'rejected';
                ap.reason = 'تم حذف مسودة المصروف';
            }
        }
        d.repository.expenses = d.repository.expenses.filter(x => x.id !== id);
    },
    voidExpense(d: ExpenseWorkflowDeps, id: string, reason: string) {
        return d.transactions.atomic('voidExpense', () => {
            const e = BusinessValues.find(d.repository.expenses, id);
            if (!e || e.status !== 'posted')
                throw new Error('المصروف غير متاح');
            if (!BusinessValues.text(reason).trim())
                throw new Error('سبب إلغاء المصروف مطلوب');
            if (e.paymentId)
                d.vouchers.voidPayment(e.paymentId, reason);
            if (e.invoiceId) {
                const inv = BusinessValues.find(d.repository.invoices, e.invoiceId);
                if (d.invoices.allocations(inv.id) > EPS)
                    throw new Error('اعكس سداد فاتورة المورد أولًا');
                d.invoices.cancel(inv.id, reason);
            }
            for (const s of d.repository.prepaidSchedules.filter(s => s.expenseId === e.id && s.status === 'posted'))
                d.accounting.reverse('prepaid-recognition', s.id, reason);
            d.repository.prepaidSchedules.filter(s => s.expenseId === e.id).forEach(s => s.status = 'void');
            e.status = 'void';
            e.voidReason = reason;
            d.accounting.documentStatus('expense', e.id, 'void');
        });
    },
    recognizePrepaid(d: ExpenseWorkflowDeps, id: string) {
        return d.transactions.atomic('prepaid', () => {
            const s = BusinessValues.find(d.repository.prepaidSchedules, id);
            if (!s || s.status !== 'pending')
                throw new Error('القسط غير متاح');
            const e = BusinessValues.find(d.repository.expenses, s.expenseId);
            d.accounting.post({
                date: s.date, memo: `استهلاك مصروف مقدم ${e?.no || ''}`, refType: 'prepaid-recognition', refId: s.id, costCenterId: e?.costCenterId || '', lines: [{
                        accountId: e?.expenseAccountId || '5200', debit: s.amount, currency: s.currency, rate: d.money.rate(s.currency, e?.date || s.date)
                    }, {
                        accountId: '1300', credit: s.amount, currency: s.currency, rate: d.money.rate(s.currency, e?.date || s.date)
                    }]
            });
            s.status = 'posted';
            s.journalRef = true;
        });
    },
    reversePrepaid(d: ExpenseWorkflowDeps, id: string, reason: string) {
        const s = BusinessValues.find(d.repository.prepaidSchedules, id);
        if (!s || s.status !== 'posted')
            throw new Error('القسط غير مرحل');
        d.accounting.reverse('prepaid-recognition', s.id, reason);
        s.status = 'pending';
        s.journalRef = false;
    }
};
