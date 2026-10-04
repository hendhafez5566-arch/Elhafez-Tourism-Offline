import { BusinessValues } from '../core/business-values';
import { AdministrationRules } from '../commercial/administration-rules';
import type { ApprovalWorkflowDeps, BusinessApprovalPayload } from './business-contracts';
const ApprovalWorkflows = {
    create(d: ApprovalWorkflowDeps, type: string, payload: BusinessApprovalPayload, baseAmount = 0) {
        const x = {
            id: d.clock.id(), no: d.clock.next('approval'), type, payload: d.clock.clone(payload), baseAmount, status: 'pending', requestedAt: d.clock.now(), requestedBy: d.actor()?.id || '', approvedAt: '', approvedBy: '', rejectedAt: '', rejectedBy: '', reason: ''
        };
        d.repository.approvals.unshift(x);
        d.persistence.log('request', 'approval', x.id, `${type} ${baseAmount}`);
        return x;
    },
    approve(d: ApprovalWorkflowDeps, id: string) {
        const x = BusinessValues.find(d.repository.approvals, id);
        AdministrationRules.approvalAllowed(x, () => d.actor(), () => d.repository.allowSelfApproval(), d.money, () => d.repository.baseCurrency());
        if (x.type === 'payment')
            d.operations.addPayment(x.payload, {
                ignoreApproval: true
            });
        else if (x.type === 'expense') {
            const e = BusinessValues.find(d.repository.expenses, x.payload.expenseId);
            if (!e || e.status !== 'draft')
                throw new Error('مسودة المصروف غير متاحة');
            d.operations.postExpense(e, {
                ...(x.payload.options || {}), _approved: true
            });
            e.approvalId = '';
        }
        else if (x.type === 'commission') {
            const c = BusinessValues.find(d.repository.commissions, x.payload.commissionId);
            if (!c || c.status !== 'pending')
                throw new Error('العمولة غير متاحة');
            d.operations.approveCommission(c.id);
        }
        x.status = 'approved';
        x.approvedAt = d.clock.now();
        x.approvedBy = d.actor()?.id || '';
        d.persistence.log('approve', 'approval', id, x.no);
    },
    reject(d: ApprovalWorkflowDeps, id: string, reason: string) {
        const x = BusinessValues.find(d.repository.approvals, id);
        if (!x || x.status !== 'pending')
            throw new Error('الطلب غير متاح');
        if (x.type === 'commission') {
            const c = BusinessValues.find(d.repository.commissions, x.payload.commissionId);
            if (c?.status === 'pending')
                d.operations.rejectCommission(c.id, reason);
        }
        x.status = 'rejected';
        x.reason = reason;
        x.rejectedAt = d.clock.now();
        x.rejectedBy = d.actor()?.id || '';
        d.persistence.log('reject', 'approval', id, reason);
    }
};
export { ApprovalWorkflows };
