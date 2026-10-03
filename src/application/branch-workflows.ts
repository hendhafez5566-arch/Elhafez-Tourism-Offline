import { BusinessValues } from '../core/business-values';
import { BranchRules } from '../commercial/branch-rules';
import type { BranchWorkflowDeps, BusinessBranchFields } from './business-contracts';
const BranchWorkflows = {
    createBranch(d: BranchWorkflowDeps, o: BusinessBranchFields) {
        d.authorization.require('branches', 'add');
        const max = d.branchLimit();
        if ((d.repository.branches || []).filter(x => x.active !== false).length >= max)
            throw new Error(`الترخيص يسمح بحد أقصى ${max} فرعًا`);
        const name = BusinessValues.text(o.name).trim(), code = BusinessValues.text(o.code || `BR${String((d.repository.branches || []).length + 1).padStart(2, '0')}`).trim().toUpperCase();
        if (!name)
            throw new Error('اسم الفرع مطلوب');
        if (!code)
            throw new Error('كود الفرع مطلوب');
        if ((d.repository.branches || []).some(x => BusinessValues.text(x.code).toUpperCase() === code))
            throw new Error('كود الفرع مستخدم بالفعل');
        if ((d.repository.branches || []).some(x => BusinessValues.text(x.name).trim().toLowerCase() === name.toLowerCase()))
            throw new Error('اسم الفرع مستخدم بالفعل');
        const first = (d.repository.branches || []).length === 0, b = {
            id: d.clock.id(), code, name, address: BusinessValues.text(o.address || ''), phone: BusinessValues.text(o.phone || ''), active: true, createdAt: d.clock.now()
        };
        d.repository.branches.push(b);
        if (first && d.actor()) {
            d.actor().branchId = b.id;
            d.actor().allowedBranchIds = [b.id];
            d.selection.store(b.id);
        }
        d.persistence.log('add', 'branch', b.id, b.name);
        return b;
    },
    updateBranch(d: BranchWorkflowDeps, id: string, o: BusinessBranchFields) {
        d.authorization.require('branches', 'edit');
        const b = BusinessValues.find(d.repository.branches, id);
        if (!b)
            throw new Error('الفرع غير موجود');
        const name = BusinessValues.text(o.name || b.name).trim(), code = BusinessValues.text(o.code || b.code).trim().toUpperCase(), active = o.active !== false;
        if (!name || !code)
            throw new Error('اسم الفرع وكوده مطلوبان');
        if ((d.repository.branches || []).some(x => x.id !== id && BusinessValues.text(x.code).toUpperCase() === code))
            throw new Error('كود الفرع مستخدم بالفعل');
        if ((d.repository.branches || []).some(x => x.id !== id && BusinessValues.text(x.name).trim().toLowerCase() === name.toLowerCase()))
            throw new Error('اسم الفرع مستخدم بالفعل');
        BranchRules.assertDeactivation(b, id, active, d.repository.branches, d.repository.users);
        Object.assign(b, {
            name, code, address: BusinessValues.text(o.address || ''), phone: BusinessValues.text(o.phone || ''), active
        });
        if (!active && d.selection.current() === id) {
            const next = (d.repository.branches || []).find(x => x.active !== false && x.id !== id);
            if (next)
                d.selection.store(next.id);
        }
        d.persistence.log('update', 'branch', id, b.name);
        return b;
    }
};
export { BranchWorkflows };
