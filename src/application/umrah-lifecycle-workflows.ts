import { UmrahBusinessRules } from '../core/umrah/business-rules';
import type { UmrahLifecycleDeps } from './business-contracts';
const UmrahLifecycleWorkflows = {
    setProgramStatus(d: UmrahLifecycleDeps, id: string, status: string) {
        return d.transactions.atomic('setProgramStatus', () => {
            d.authorization.require('umrah.programs', 'approve');
            const p = d.repository.program(id);
            if (!p)
                throw new Error('البرنامج غير موجود');
            const current = p.status || 'planning';
            UmrahBusinessRules.programTransition(current, status, d.programLabel);
            if (status === 'open') {
                if (p.salesCloseDate && d.clock.today() > p.salesCloseDate)
                    throw new Error(`لا يمكن فتح البيع لأن تاريخ إغلاق البيع ${p.salesCloseDate} انتهى؛ حدّث تاريخ إغلاق البيع أولًا`);
                d.operations.assertProgramOpenReady(id);
            }
            if (status === 'traveling') {
                const b = d.operations.blockers(id);
                if (!b.travelers.length)
                    throw new Error('لا يمكن تسجيل مغادرة فوج بدون مسافرين مؤكدين');
                if (b.total)
                    throw new Error(`لا يمكن تسجيل مغادرة الفوج قبل معالجة ${b.total} مانع/تنبيه`);
            }
            if (status === 'returned') {
                const gaps = d.operations.financialSetupGaps(id);
                if (gaps.length)
                    throw new Error(`لا يمكن تسجيل العودة قبل استكمال الربط المالي: ${gaps.map(g => g.title).join('، ')}`);
            }
            if (status === 'cancelled' && d.repository.bookings().some(b => b.programId === id && d.operations.resourceBookingStatuses.has(b.status)))
                throw new Error('يوجد حجوزات نشطة؛ عالجها أولًا');
            if (status === 'cancelled')
                d.procurement.cancelProgramCommitments(p.id, 'إلغاء برنامج حج/عمرة');
            p.status = status;
            p.statusAt = d.clock.now();
            if (status === 'cancelled')
                d.releaseProgram(p.id);
            if (status === 'open')
                d.procurement.onProgramOpen(p);
            if (status === 'traveling')
                d.procurement.onProgramTraveling(p);
            if (status === 'returned')
                d.procurement.onProgramReturned(p);
            d.audit('status', 'umrahProgram', id, `${p.no} -> ${status}`);
            return p;
        }, {
            rollback: true
        });
    },
    setBookingStatus(d: UmrahLifecycleDeps, id: string, status: string) {
        d.authorization.require('umrah.bookings', 'edit');
        return d.transactions.atomic('setBookingStatus', () => {
            const b = d.repository.booking(id);
            if (!b)
                throw new Error('الحجز غير موجود');
            if (status === 'ready' && d.operations.bookingReadiness(b).score < 100)
                throw new Error('الحجز غير جاهز بالكامل');
            UmrahBusinessRules.bookingTransition(b.status, status);
            b.status = status;
            b.statusAt = d.clock.now();
            d.audit('status', 'umrahBooking', id, `${b.no} -> ${status}`);
            return b;
        });
    }
};
export { UmrahLifecycleWorkflows };
