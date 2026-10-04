import { UmrahBusinessRules } from './business-rules';
import { UmrahLifecycleWorkflows } from '../../application/umrah-lifecycle-workflows';
import { UmrahCore_N, UmrahCore_S, UmrahCore_fmt, UmrahCore_iid, UmrahCore_now, UmrahCore_roomCap, UmrahCore_roomLabel, UmrahCore_today, UmrahCore_deep } from './runtime';
import { UmrahCore_Bridge, UmrahCore_DB } from './data';
import { UmrahCore_Procurement } from './procurement';
import { UmrahCore_BookingRooms } from './booking-rooms';
import { composeLegacyUmrahLifecycleDeps } from '../late-bindings';
const UmrahCore_OpsBookings = {
    reservedPersons(programId, exclude = '') { return UmrahCore_DB.data.bookings.filter(b => b.programId === programId && b.id !== exclude && this.resourceBookingStatuses.has(b.status)).reduce((s, b) => s + UmrahCore_N(b.persons), 0); },
    availablePersons(programId) { const p = this.program(programId); return p ? Math.max(0, UmrahCore_N(p.capacity) - this.reservedPersons(programId)) : 0; },
    hotelInventoryAvailable(programId, segmentId, type, exclude = '') { const s = this.segment(segmentId); if (!s)
        return 0; const total = UmrahCore_N(s.inventory?.[type]); const used = UmrahCore_DB.data.bookings.filter(b => b.programId === programId && b.id !== exclude && this.resourceBookingStatuses.has(b.status)).reduce((sum, b) => sum + (b.roomPlan || []).filter(r => r.segmentId === segmentId && r.roomType === type).reduce((z, r) => z + UmrahCore_N(r.rooms), 0), 0); return Math.max(0, total - used); },
    flightSeatsAvailable(programId, segmentId, exclude = '') { const s = this.segment(segmentId); if (!s)
        return 0; const used = UmrahCore_DB.data.bookings.filter(b => b.programId === programId && b.id !== exclude && this.resourceBookingStatuses.has(b.status)).reduce((sum, b) => sum + Math.max(0, UmrahCore_N(b.persons) - UmrahCore_N(b.infants)), 0); return Math.max(0, UmrahCore_N(s.seats) - used); },
    bookingGross(program,b){return UmrahBusinessRules.bookingGross(program,b);},
    bookingPrice(program, b) { return Math.max(0, this.bookingGross(program, b) - Math.max(0, UmrahCore_N(b.discount))); },
    bookingDiscountLimit() { const u = UmrahCore_Bridge.currentUser() || {}; if (u.role === 'admin' || u.permissions?.all)
        return 100; return Math.max(0, Math.min(100, UmrahCore_N(u.maxDiscountPct))); },
    validateBookingDiscount(p,b){return UmrahBusinessRules.discount(this.bookingGross(p,b),b.discount,b.discountReason,()=>this.bookingDiscountLimit(),UmrahCore_fmt);},
    assertNewBookingSaleAllowed(p,status){return UmrahBusinessRules.saleAllowed(p,status,UmrahCore_today);},
    validateBooking(p, b, exclude = '') { if (!p)
        throw new Error('البرنامج غير موجود'); if (!['open', 'salesClosed', 'operating'].includes(p.status) && !['inquiry', 'quotation', 'waitlist'].includes(b.status))
        throw new Error('البرنامج غير مفتوح للحجز'); if (UmrahCore_N(b.persons) <= 0)
        throw new Error('الحجز يحتاج مسافرًا واحدًا على الأقل'); if (UmrahCore_N(b.counts?.adults) <= 0)
        throw new Error('يجب أن يحتوي الحجز على بالغ واحد على الأقل'); this.validateBookingDiscount(p, b); if (this.reservedPersons(p.id, exclude) + UmrahCore_N(b.persons) > UmrahCore_N(p.capacity))
        throw new Error(`سعة البرنامج غير كافية. المتاح ${this.availablePersons(p.id) + (exclude ? UmrahCore_N(this.booking(exclude)?.persons) : 0)}`); for (const r of b.roomPlan || []) {
        if (!r.segmentId || UmrahCore_N(r.rooms) <= 0)
            continue;
        if (UmrahCore_N(r.rooms) > this.hotelInventoryAvailable(p.id, r.segmentId, r.roomType, exclude) + (exclude ? UmrahCore_N((this.booking(exclude)?.roomPlan || []).find(x => x.segmentId === r.segmentId && x.roomType === r.roomType)?.rooms) : 0))
            throw new Error(`مخزون ${UmrahCore_roomLabel(r.roomType)} غير كاف في أحد الفنادق`);
    }
    const bedPeople = UmrahCore_N(b.counts?.adults) + UmrahCore_N(b.counts?.childBed);
    for (const h of this.segments(p.id, 'hotel')) {
        const beds = (b.roomPlan || []).filter(r => r.segmentId === h.id).reduce((z, r) => z + UmrahCore_N(r.rooms) * Math.max(1, UmrahCore_N(UmrahCore_roomCap[r.roomType])), 0);
        if (bedPeople > 0 && beds < bedPeople)
            throw new Error(`توزيع الغرف في ${h.title} يستوعب ${beds} سرير فقط بينما الحجز يحتاج ${bedPeople}`);
    }
    for (const s of this.segments(p.id, 'flight'))
        if (UmrahCore_N(s.seats) > 0 && Math.max(0, UmrahCore_N(b.persons) - UmrahCore_N(b.infants)) > this.flightSeatsAvailable(p.id, s.id, exclude) + (exclude ? Math.max(0, UmrahCore_N(this.booking(exclude)?.persons) - UmrahCore_N(this.booking(exclude)?.infants)) : 0))
            throw new Error(`مقاعد الطيران غير كافية في ${s.title}`); },
    createBooking(o) { UmrahCore_Bridge.require('umrah.bookings', 'add'); const p = this.program(o.programId), c = UmrahCore_Bridge.customer(o.customerId); if (!p || !c)
        throw new Error('اختر العميل والبرنامج'); const counts = { adults: Math.max(0, UmrahCore_N(o.adults)), childBed: Math.max(0, UmrahCore_N(o.childBed)), childNoBed: Math.max(0, UmrahCore_N(o.childNoBed)), infants: Math.max(0, UmrahCore_N(o.infants)) }, persons = Object.values(counts).reduce((s, v) => s + v, 0), requestedStatus = o.status || 'hold', status = requestedStatus === 'confirmed' ? 'hold' : requestedStatus; this.assertNewBookingSaleAllowed(p, status); const b: any = { id: UmrahCore_iid(), branchId: UmrahCore_Bridge.branchId(), no: UmrahCore_DB.next('booking'), date: o.date || UmrahCore_today(), programId: p.id, customerId: c.id, customerSnapshot: { name: c.name || '', phone: c.phone || '', no: c.no || '' }, sourceType: o.sourceType || 'direct', sourceRefId: o.sourceRefId || (o.sourceType === 'agent' ? o.sourceAgentId || '' : ''), sourceName: o.sourceName || (o.sourceType === 'agent' ? UmrahCore_Bridge.agent(o.sourceAgentId)?.name || '' : ''), status, counts, persons, infants: counts.infants, primaryRoomType: o.primaryRoomType || 'quad', roomPlan: this.normalizeRoomPlan(p, o.roomPlan, o.primaryRoomType || 'quad', counts), discount: Math.max(0, UmrahCore_N(o.discount)), discountReason: o.discountReason || '', currency: p.currency, holdUntil: status === 'hold' ? new Date(Date.now() + UmrahCore_N(p.holdHours) * 3600000).toISOString() : '', note: o.note || '', hostInvoiceId: '', createdAt: UmrahCore_now(), createdBy: UmrahCore_Bridge.currentUser().id }; this.validateBookingDiscount(p, b); b.total = this.bookingPrice(p, b); if (!['inquiry', 'quotation', 'waitlist'].includes(status))
        this.validateBooking(p, b); UmrahCore_DB.data.bookings.unshift(b); this.syncTravelers(b); this.ensureHotelRooms(b); UmrahCore_Bridge.audit('create', 'umrahBooking', b.id, b.no); if (requestedStatus === 'confirmed')
        this.confirmBooking(b.id); return b; },
    buildDefaultRoomPlan(p, type, counts) { return UmrahCore_BookingRooms.defaultPlan(this, p, type, counts); },
    normalizeRoomPlan(p, plan, type, counts) { return UmrahCore_BookingRooms.normalize(this, p, plan, type, counts); },
    setBookingRoomPlan(id, plan, reason = '') { return UmrahCore_BookingRooms.setPlan(this, id, plan, reason); },
    updateBooking(id, o) { UmrahCore_Bridge.require('umrah.bookings', 'edit'); const b = this.booking(id); if (!b)
        throw new Error('الحجز غير موجود'); if (!['inquiry', 'quotation', 'hold', 'waitlist'].includes(b.status))
        throw new Error('الحجز مؤكد؛ استخدم تعديل تشغيلي موثق بدل تغيير أساس الحجز'); const oldProgramId = b.programId, p = this.program(o.programId || b.programId), c = UmrahCore_Bridge.customer(o.customerId || b.customerId); if (!p || !c)
        throw new Error('بيانات الحجز غير مكتملة'); if (b.status === 'hold') {
        const oldPersons = UmrahCore_N(b.persons), newPersons = Math.max(0, UmrahCore_N(o.adults)) + Math.max(0, UmrahCore_N(o.childBed)) + Math.max(0, UmrahCore_N(o.childNoBed)) + Math.max(0, UmrahCore_N(o.infants));
        if (p.id !== oldProgramId || newPersons > oldPersons)
            this.assertNewBookingSaleAllowed(p, b.status);
    } const counts = { adults: Math.max(0, UmrahCore_N(o.adults)), childBed: Math.max(0, UmrahCore_N(o.childBed)), childNoBed: Math.max(0, UmrahCore_N(o.childNoBed)), infants: Math.max(0, UmrahCore_N(o.infants)) }, persons = Object.values(counts).reduce((s, v) => s + v, 0); Object.assign(b, { programId: p.id, customerId: c.id, customerSnapshot: { name: c.name || '', phone: c.phone || '', no: c.no || '' }, sourceType: o.sourceType || 'direct', sourceRefId: o.sourceRefId || (o.sourceType === 'agent' ? o.sourceAgentId || '' : ''), sourceName: o.sourceName || (o.sourceType === 'agent' ? UmrahCore_Bridge.agent(o.sourceAgentId)?.name || '' : ''), counts, persons, infants: counts.infants, primaryRoomType: o.primaryRoomType || b.primaryRoomType, discount: Math.max(0, UmrahCore_N(o.discount)), discountReason: o.discountReason || '', currency: p.currency, note: o.note || '', updatedAt: UmrahCore_now() }); b.roomPlan = this.normalizeRoomPlan(p, o.roomPlan, b.primaryRoomType, counts); this.validateBookingDiscount(p, b); b.total = this.bookingPrice(p, b); if (b.status === 'hold')
        this.validateBooking(p, b, b.id); this.syncTravelers(b); this.ensureHotelRooms(b, true); UmrahCore_Bridge.audit('update', 'umrahBooking', id, b.no); return b; },
    confirmBooking(id) { UmrahCore_Bridge.require('umrah.bookings', 'approve'); return UmrahCore_DB.atomic('confirmBooking', () => { const b = this.booking(id), p = b && this.program(b.programId); if (!b || !p)
        throw new Error('الحجز غير موجود'); if (b.status === 'confirmed')
        return b; if (!['inquiry', 'quotation', 'hold', 'waitlist'].includes(b.status))
        throw new Error('الحجز غير متاح للتأكيد'); if (b.status === 'hold' && b.holdUntil && new Date(b.holdUntil).getTime() <= Date.now())
        throw new Error('انتهت مهلة الحجز المؤقت؛ جدّد الحجز أو ضعه على قائمة الانتظار'); if (b.status !== 'hold')
        this.assertNewBookingSaleAllowed(p, 'hold'); this.validateBooking(p, b, b.id); b.status = 'confirmed'; b.holdUntil = ''; b.confirmedAt = UmrahCore_now(); const ev = UmrahCore_Bridge.emit('umrah.booking.confirmed', { id: b.id, bookingId: b.id, bookingNo: b.no, date: b.date, programId: p.id, programNo: p.no, customerId: b.customerId, currency: b.currency, total: b.total, costCenterId: p.costCenterId || '', dueDate: p.departureDate, description: `حجز ${p.name}`, sourceType: b.sourceType, sourceRefId: b.sourceRefId }, `booking-confirm:${b.id}`); if (ev?.invoiceId) {
        b.hostInvoiceId = ev.invoiceId;
        b.hostInvoiceNo = ev.invoiceNo || '';
    } UmrahCore_Procurement.onBookingConfirmed(b); this.syncVisaBatchTravelers(p.id); UmrahCore_Bridge.audit('confirm', 'umrahBooking', id, b.no); return b; }); },
    setBookingStatus(id,status){return UmrahLifecycleWorkflows.setBookingStatus(composeLegacyUmrahLifecycleDeps(this),id,status);},
    requestCancel(id, reason) { UmrahCore_Bridge.require('umrah.bookings', 'void'); return UmrahCore_DB.atomic('requestCancel', () => { const b = this.booking(id); if (!b || ['cancelled', 'closed', 'refunded', 'expired', 'noShow'].includes(b.status))
        throw new Error('الحجز غير متاح للإلغاء في حالته الحالية'); if (['traveling', 'returned'].includes(b.status))
        throw new Error('لا يُلغى الحجز بعد بدء السفر/العودة من شاشة الإلغاء العادي؛ استخدم التسوية المالية وسجل الواقعة التشغيلية.'); if (!UmrahCore_S(reason).trim())
        throw new Error('سبب الإلغاء مطلوب'); if (['confirmed', 'partiallyPaid', 'fullyPaid', 'docsPending', 'ready', 'checkedIn'].includes(b.status)) {
        const res = UmrahCore_Bridge.emit('umrah.booking.cancel.requested', { id: b.id, bookingId: b.id, bookingNo: b.no, reason }, `booking-cancel:${b.id}`);
        if (res?.status === 'void') {
            UmrahCore_Procurement.cancelBookingCommitments(b.id, reason);
            b.status = 'cancelled';
            b.cancelledAt = UmrahCore_now();
            this.releaseBookingResources(b.id);
        }
        else {
            b.status = 'cancelRequested';
            b.cancelBlockReason = res?.status === 'refund-required' ? (res.message || 'يلزم رد/عكس التحصيلات أولًا') : '';
            b.cancelCollected = res?.collected || 0;
        }
    }
    else {
        b.status = 'cancelled';
        this.releaseBookingResources(b.id);
    } b.cancelReason = reason; b.cancelRequestedAt = UmrahCore_now(); UmrahCore_Bridge.audit('cancel-request', 'umrahBooking', id, reason); }); },
    completeCancel(id) { UmrahCore_Bridge.require('umrah.bookings', 'void'); return UmrahCore_DB.atomic('completeCancel', () => { const b = this.booking(id); if (!b || b.status !== 'cancelRequested')
        throw new Error('لا يوجد طلب إلغاء'); const res = UmrahCore_Bridge.emit('umrah.booking.cancel.requested', { id: b.id, bookingId: b.id, bookingNo: b.no, reason: b.cancelReason || 'إلغاء حجز حج/عمرة' }, `booking-cancel-final:${b.id}`); if (res?.status !== 'void') {
        b.cancelBlockReason = res?.message || 'ما زالت هناك حركة مالية تمنع الإلغاء';
        b.cancelCollected = res?.collected || 0;
        throw new Error(b.cancelBlockReason);
    } UmrahCore_Procurement.cancelBookingCommitments(b.id, b.cancelReason || 'إلغاء حجز حج/عمرة'); b.status = 'cancelled'; b.cancelledAt = UmrahCore_now(); b.cancelBlockReason = ''; this.releaseBookingResources(id); UmrahCore_Bridge.audit('cancel', 'umrahBooking', id, b.no); }); },
    transferBooking(id, newProgramId) {
        UmrahCore_Bridge.require('umrah.bookings', 'edit');
        return UmrahCore_DB.atomic('transferBooking', () => {
            const b = this.booking(id), p = this.program(newProgramId);
            if (!b || !p)
                throw new Error('بيانات النقل غير صحيحة');
            if (b.programId === p.id)
                throw new Error('اختر برنامجًا مختلفًا');
            if (b.hostInvoiceId || ['confirmed', 'partiallyPaid', 'fullyPaid', 'docsPending', 'ready', 'checkedIn', 'traveling', 'returned', 'closed'].includes(b.status))
                throw new Error('الحجز له أثر مالي/تشغيلي؛ لا يتم نقله مباشرة. ألغِ/سوِّ المستندات المالية ثم أنشئ حجزًا على البرنامج الجديد');
            if (!['inquiry', 'quotation', 'hold', 'waitlist'].includes(b.status))
                throw new Error('حالة الحجز لا تسمح بالنقل');
            this.assertNewBookingSaleAllowed(p, b.status);
            const old = b.programId, oldStatus = b.status, temp = { ...UmrahCore_deep(b), programId: p.id, currency: p.currency, roomPlan: this.buildDefaultRoomPlan(p, b.primaryRoomType, b.counts) };
            this.validateBookingDiscount(p, temp);
            temp.total = this.bookingPrice(p, temp);
            this.validateBooking(p, temp, b.id);
            this.releaseBookingResources(id);
            b.transferHistory = [...(b.transferHistory || []), { fromProgramId: old, toProgramId: p.id, at: UmrahCore_now(), by: UmrahCore_Bridge.currentUser().id, status: oldStatus }];
            b.previousProgramId = old;
            b.programId = p.id;
            b.currency = p.currency;
            b.roomPlan = temp.roomPlan;
            b.status = oldStatus;
            b.transferredAt = UmrahCore_now();
            b.total = temp.total;
            for (const t of UmrahCore_DB.data.travelers.filter(x => x.bookingId === b.id))
                t.programId = p.id;
            this.ensureHotelRooms(b, true);
            UmrahCore_Bridge.emit('umrah.booking.transferred', { bookingId: b.id, fromProgramId: old, toProgramId: p.id, total: b.total, currency: b.currency }, `booking-transfer:${b.id}:${p.id}`);
            UmrahCore_Bridge.audit('transfer', 'umrahBooking', id, `${old} -> ${p.id}`);
            return b;
        });
    }
};
export { UmrahCore_OpsBookings };
