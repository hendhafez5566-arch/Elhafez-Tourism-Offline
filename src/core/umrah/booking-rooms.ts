import { UmrahCore_N, UmrahCore_S, UmrahCore_deep, UmrahCore_iid, UmrahCore_now, UmrahCore_roomCap } from './runtime';
import { UmrahCore_Bridge, UmrahCore_DB } from './data';
const UmrahCore_BookingRooms = {
    defaultPlan(ops, p, type, counts) {
        const bedPeople = UmrahCore_N(counts.adults) + UmrahCore_N(counts.childBed);
        const rooms = bedPeople > 0 ? Math.ceil(bedPeople / Math.max(1, UmrahCore_N(UmrahCore_roomCap[type]))) : 0;
        return ops.segments(p.id, 'hotel').map(s => ({ id: UmrahCore_iid(), segmentId: s.id, roomType: type, rooms }));
    },
    normalize(ops, p, plan, type, counts) {
        const hotels = ops.segments(p.id, 'hotel'), allowed = new Set(Object.keys(UmrahCore_roomCap));
        if (!Array.isArray(plan) || !plan.length) return this.defaultPlan(ops, p, type, counts);
        const hotelIds = new Set(hotels.map(x => x.id)), out = [];
        for (const r of plan) {
            const segmentId = UmrahCore_S(r?.segmentId), roomType = allowed.has(r?.roomType) ? r.roomType : type;
            const rooms = Math.max(0, Math.floor(UmrahCore_N(r?.rooms)));
            if (!hotelIds.has(segmentId) || !rooms) continue;
            const existing = out.find(x => x.segmentId === segmentId && x.roomType === roomType);
            if (existing) existing.rooms += rooms;
            else out.push({ id: r.id || UmrahCore_iid(), segmentId, roomType, rooms });
        }
        for (const h of hotels) if (!out.some(x => x.segmentId === h.id)) {
            const fallback = this.defaultPlan(ops, p, type, counts).find(x => x.segmentId === h.id);
            if (fallback?.rooms) out.push(fallback);
        }
        return out;
    },
    setPlan(ops, id, plan, reason = '') {
        UmrahCore_Bridge.require('umrah.bookings', 'edit');
        return UmrahCore_DB.atomic('setBookingRoomPlan', () => {
            const b = ops.booking(id), p = b && ops.program(b.programId);
            if (!b || !p) throw new Error('الحجز أو البرنامج غير موجود');
            if (['traveling','returned','closed','cancelled','expired','refunded','noShow','cancelRequested'].includes(b.status))
                throw new Error('حالة الحجز لا تسمح بتعديل توزيع الغرف');
            if (!['inquiry','quotation','hold','waitlist'].includes(b.status) && !UmrahCore_S(reason).trim())
                throw new Error('سبب تعديل الغرف مطلوب للحجز المؤكد');
            const next = this.normalize(ops, p, plan, b.primaryRoomType || 'quad', b.counts || {});
            ops.validateBooking(p, { ...b, roomPlan: next }, b.id);
            const before = UmrahCore_deep(b.roomPlan || []);
            b.roomPlan = next;
            b.updatedAt = UmrahCore_now();
            b.changeLog = [...(b.changeLog || []), {
                id: UmrahCore_iid(), type: 'roomPlan', reason: reason || 'تعديل قبل التأكيد',
                before, after: UmrahCore_deep(next), at: UmrahCore_now(), by: UmrahCore_Bridge.currentUser().id
            }];
            this.ensureRooms(ops, b, true);
            UmrahCore_Bridge.audit('room-plan', 'umrahBooking', b.id, reason || 'تعديل توزيع الغرف');
            return b;
        });
    },
    ensureRooms(ops, b, rebuild = false) {
        if (rebuild) {
            UmrahCore_DB.data.hotelRooms = UmrahCore_DB.data.hotelRooms.filter(r => r.bookingId !== b.id);
            for (const t of UmrahCore_DB.data.travelers.filter(x => x.bookingId === b.id)) t.roomAssignments = {};
        }
        for (const seg of ops.segments(b.programId, 'hotel')) {
            const desired = (b.roomPlan || []).filter(r => r.segmentId === seg.id && UmrahCore_N(r.rooms) > 0)
                .flatMap(r => Array.from({ length: Math.max(0, Math.floor(UmrahCore_N(r.rooms))) }, () => r.roomType));
            const existing = UmrahCore_DB.data.hotelRooms.filter(r => r.bookingId === b.id && r.segmentId === seg.id);
            const same = existing.length === desired.length && existing.map(r => r.roomType).sort().join('|') === [...desired].sort().join('|');
            if (same) continue;
            UmrahCore_DB.data.hotelRooms = UmrahCore_DB.data.hotelRooms.filter(r => !(r.bookingId === b.id && r.segmentId === seg.id));
            let n = 0;
            for (const roomType of desired) {
                n++;
                UmrahCore_DB.data.hotelRooms.push({
                    id: UmrahCore_iid(), branchId: b.branchId || UmrahCore_Bridge.branchId(), programId: b.programId,
                    bookingId: b.id, segmentId: seg.id, code: `${b.no}-${seg.id.slice(-4)}-R${String(n).padStart(2, '0')}`,
                    roomType, capacity: UmrahCore_roomCap[roomType] || 4, hotelRoomNo: '', notes: ''
                });
            }
        }
        ops.autoAssignRooms(b.id);
    }
};
export { UmrahCore_BookingRooms };
