import type { IntegrityWorkflowDeps } from './business-contracts';
const IntegrityWorkflows = {
    rerun(d: IntegrityWorkflowDeps) {
        const report = d.report();
        d.completed(report);
    },
    repair(d: IntegrityWorkflowDeps) {
        for (const issue of d.issues().filter(value => value.fixable)) {
            if (issue.code === 'TREASURY_ACCOUNT') {
                const treasury = d.treasury(issue.treasuryId);
                if (treasury)
                    d.ensureTreasury(treasury);
            }
        }
        d.save();
        d.report();
        d.repaired();
    }
};
export { IntegrityWorkflows };
