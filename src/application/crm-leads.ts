// Legacy order and return timing preserved; dependencies are supplied by composition.
const CrmLeadWorkflows = {
    addLead(d: CrmWorkflowDeps, o: CrmLeadFields) {
        const x = {
            id: d.clock.id(), no: d.clock.next('lead'), name: BusinessValues.text(o.name).trim(), phone: o.phone || '', source: o.source || '', service: o.service || '', value: BusinessValues.number(o.value), currency: o.currency || d.repository.baseCurrency(), status: o.status || 'new', agentId: o.agentId || '', notes: o.notes || '', customerId: '', createdAt: d.clock.now(), active: true
        };
        CrmLeadRules.created(x);
        d.repository.leads.unshift(x);
        return x;
    },
    updateLead(d: CrmWorkflowDeps, id: string, o: CrmLeadFields) {
        const x = BusinessValues.find(d.repository.leads, id);
        if (!x)
            throw new Error('العميل المحتمل غير موجود');
        Object.assign(x, o, {
            id: x.id, no: x.no, updatedAt: d.clock.now()
        });
    },
    convertLead(d: CrmWorkflowDeps, id: string) {
        const l = BusinessValues.find(d.repository.leads, id);
        CrmLeadRules.convertible(l);
        const c = d.parties.addCustomer({
            name: l.name, phone: l.phone, agentId: l.agentId, notes: `محول من ${l.no}`
        });
        CrmLeadRules.converted(l, c.id);
        return c;
    },
    addFollowup(d: CrmWorkflowDeps, o: CrmFollowupFields) {
        const lead = BusinessValues.find(d.repository.leads, o.leadId);
        if (!lead)
            throw new Error('اختر العميل المحتمل');
        const f = {
            id: d.clock.id(), leadId: lead.id, date: o.date || d.clock.today(), type: o.type || 'call', result: o.result || '', nextDate: o.nextDate || '', userId: d.actor()?.id || '', createdAt: d.clock.now()
        };
        d.repository.followups.unshift(f);
        return f;
    },
    updateFollowup(d: CrmWorkflowDeps, id: string, o: CrmFollowupFields) {
        const f = BusinessValues.find(d.repository.followups, id);
        if (!f)
            throw new Error('المتابعة غير موجودة');
        if (o.leadId && !BusinessValues.find(d.repository.leads, o.leadId))
            throw new Error('العميل المحتمل غير موجود');
        Object.assign(f, {
            leadId: o.leadId || f.leadId, date: o.date || f.date, type: o.type || f.type, result: o.result || '', nextDate: o.nextDate || '', updatedAt: d.clock.now()
        });
        return f;
    },
    removeFollowup(d: CrmWorkflowDeps, id: string) {
        d.repository.followups = d.repository.followups.filter(x => x.id !== id);
    },
    removeLead(d: CrmWorkflowDeps, id: string) {
        const l = BusinessValues.find(d.repository.leads, id);
        CrmLeadRules.removable(l);
        d.repository.followups = d.repository.followups.filter(x => x.leadId !== id);
        d.repository.leads = d.repository.leads.filter(x => x.id !== id);
    }
};
