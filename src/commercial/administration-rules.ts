import { BusinessValues } from '../core/business-values';
import type { BusinessActor, BusinessApproval, BusinessBranch, BusinessMoneyPort } from '../application/business-contracts';
const AdministrationRules = {
    allowedBranchIds(branches: BusinessBranch[], user: BusinessActor | undefined) {
        const active = new Set((branches || []).filter(x => x.active !== false).map(x => x.id));
        if (!user || user.role === 'admin' || user.permissions?.all)
            return [...active];
        const ids = Array.isArray(user.allowedBranchIds) ? user.allowedBranchIds.filter(id => id && active.has(id)) : [];
        if (ids.length)
            return ids;
        return user.branchId && active.has(user.branchId) ? [user.branchId] : [];
    },
    canViewCosts(user: BusinessActor | undefined) {
        return user?.role === 'admin' || user?.permissions?.all || user?.viewCosts !== false;
    },
    maxDiscountPct(user: BusinessActor | undefined) {
        if (user?.role === 'admin' || user?.permissions?.all)
            return 100;
        return Math.max(0, Math.min(100, BusinessValues.number(user?.maxDiscountPct ?? 0)));
    },
    approvalAllowed(request: BusinessApproval, actor: () => BusinessActor | undefined, allowSelf: () => boolean, moneyPort: BusinessMoneyPort, baseCurrency: () => string) {
        if (!request || request.status !== 'pending')
            throw new Error('الطلب غير متاح');
        if (allowSelf() !== true && request.requestedBy && actor()?.id === request.requestedBy)
            throw new Error('لا يجوز لطالب العملية اعتماد طلبه بنفسه؛ استخدم مستخدمًا مخولًا آخر');
        if (actor()?.role !== 'admin' && !actor()?.permissions?.all && BusinessValues.number(request.baseAmount) > BusinessValues.number(actor()?.approvalLimit))
            throw new Error(`قيمة الطلب تتجاوز حد اعتمادك ${moneyPort.format(BusinessValues.number(actor()?.approvalLimit), baseCurrency())}`);
    }
};
export { AdministrationRules };
