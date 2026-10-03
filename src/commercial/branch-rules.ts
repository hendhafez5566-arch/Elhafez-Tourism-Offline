const BranchRules = {
    assertDeactivation(b: BusinessBranch, id: string, active: boolean, branches: BusinessBranch[], users: BusinessActor[]) {
        if (!active && b.active !== false) {
            const others = (branches || []).filter(x => x.active !== false && x.id !== id), otherIds = new Set(others.map(x => x.id));
            if (!others.length)
                throw new Error('لا يمكن إيقاف آخر فرع نشط');
            const stranded = (users || []).find(u => u.active !== false && u.role !== 'admin' && !u.permissions?.all && (() => {
                const ids = (Array.isArray(u.allowedBranchIds) && u.allowedBranchIds.length ? u.allowedBranchIds : [u.branchId].filter(Boolean));
                return ids.includes(id) && !ids.some(x => otherIds.has(x));
            })());
            if (stranded)
                throw new Error(`أعد تعيين المستخدم ${stranded.name || stranded.username} إلى فرع آخر قبل إيقاف هذا الفرع`);
        }
    }
};
