const ManualJournalWorkflows = {
    createDraft(deps: ManualJournalWorkflowDeps, o: ManualJournalFields) {
        const x = {
            id: deps.clock.id(), no: deps.clock.next('journal', o.date || deps.clock.today()), date: o.date || deps.clock.today(), memo: BusinessValues.text(o.memo).trim(), lines: deps.clock.clone(o.lines || []), status: 'draft', createdAt: deps.clock.now(), createdBy: deps.actor()?.id || ''
        };
        ManualJournalRules.created(x);
        deps.repository.manualJournalDrafts.unshift(x);
        deps.persistence.log('create', 'manualJournalDraft', x.id, x.no);
        return x;
    },
    updateDraft(deps: ManualJournalWorkflowDeps, id: string, o: ManualJournalFields) {
        const x = BusinessValues.find(deps.repository.manualJournalDrafts, id);
        ManualJournalRules.editable(x);
        Object.assign(x, {
            date: o.date || x.date, memo: BusinessValues.text(o.memo || x.memo).trim(), lines: deps.clock.clone(o.lines || x.lines), updatedAt: deps.clock.now()
        });
        return x;
    },
    postDraft(deps: ManualJournalWorkflowDeps, id: string) {
        const x = BusinessValues.find(deps.repository.manualJournalDrafts, id);
        ManualJournalRules.postable(x);
        const j = deps.accounting.post({
            date: x.date, memo: x.memo, refType: 'manual', refId: x.id, lines: x.lines
        });
        x.status = 'posted';
        x.journalId = j.id;
        x.postedAt = deps.clock.now();
        x.postedBy = deps.actor()?.id || '';
        return j;
    },
    removeDraft(deps: ManualJournalWorkflowDeps, id: string) {
        const x = BusinessValues.find(deps.repository.manualJournalDrafts, id);
        ManualJournalRules.removable(x);
        deps.repository.manualJournalDrafts = deps.repository.manualJournalDrafts.filter(v => v.id !== id);
    },
    reverse(deps: ManualJournalWorkflowDeps, id: string, reason: string) {
        const x = BusinessValues.find(deps.repository.manualJournalDrafts, id);
        ManualJournalRules.reversible(x);
        deps.accounting.reverse('manual', x.id, reason);
        x.status = 'void';
        x.voidReason = reason;
        x.voidAt = deps.clock.now();
    },
    addRecurring(deps: ManualJournalWorkflowDeps, o: ManualJournalFields) {
        const r = {
            id: deps.clock.id(), name: BusinessValues.text(o.name || o.memo).trim(), memo: BusinessValues.text(o.memo).trim(), frequency: o.frequency || 'monthly', nextDate: o.nextDate || deps.clock.today(), lines: deps.clock.clone(o.lines || []), active: true, createdAt: deps.clock.now()
        };
        ManualJournalRules.recurringCreated(r);
        deps.repository.recurringJournals.unshift(r);
        return r;
    },
    toggleRecurring(deps: ManualJournalWorkflowDeps, id: string) {
        const r = BusinessValues.find(deps.repository.recurringJournals, id);
        if (!r)
            throw new Error('القالب غير موجود');
        r.active = r.active === false;
    },
    removeRecurring(deps: ManualJournalWorkflowDeps, id: string) {
        deps.repository.recurringJournals = deps.repository.recurringJournals.filter(x => x.id !== id);
    },
    runRecurring(deps: ManualJournalWorkflowDeps, id: string) {
        const r = BusinessValues.find(deps.repository.recurringJournals, id);
        if (!r || r.active === false)
            throw new Error('القالب غير متاح');
        const d = r.nextDate || deps.clock.today(), draft = ManualJournalWorkflows.createDraft(deps, {
            date: d, memo: r.memo, lines: r.lines
        });
        if (r.frequency === 'weekly') {
            const dt = new Date(`${d}T12:00:00`);
            dt.setDate(dt.getDate() + 7);
            r.nextDate = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
        }
        else
            r.nextDate = deps.dateAddMonthsClamped(d, r.frequency === 'yearly' ? 12 : 1);
        r.lastGenerated = d;
        return draft;
    }
};
