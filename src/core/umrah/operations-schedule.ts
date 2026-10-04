import { UmrahCore_N, UmrahCore_S, UmrahCore_dateAdd, UmrahCore_iid, UmrahCore_now, UmrahCore_segLabel, UmrahCore_today } from './runtime';
import { UmrahCore_Bridge, UmrahCore_DB } from './data';
import { UmrahCore_ContractCenter } from './contracts';
const UmrahCore_OpsSchedule = {
    addSegment(o, automated = false) { if (!automated)
        UmrahCore_Bridge.require('umrah.programs', 'edit'); const p = this.program(o.programId); if (!p)
        throw new Error('البرنامج غير موجود'); const x = { id: UmrahCore_iid(), branchId: UmrahCore_Bridge.branchId(), programId: p.id, type: o.type || 'custom', title: UmrahCore_S(o.title).trim() || UmrahCore_segLabel(o.type), start: o.start || p.departureDate, end: o.end || o.start || p.departureDate, sequence: UmrahCore_N(o.sequence) || UmrahCore_DB.data.programSegments.filter(s => s.programId === p.id).length + 1, supplierId: o.supplierId || '', contractId: o.contractId || '', city: o.city || '', route: o.route || '', details: o.details || '', nights: Math.max(0, UmrahCore_N(o.nights)), inventory: { single: UmrahCore_N(o.singleQty ?? o.inventory?.single), double: UmrahCore_N(o.doubleQty ?? o.inventory?.double), triple: UmrahCore_N(o.tripleQty ?? o.inventory?.triple), quad: UmrahCore_N(o.quadQty ?? o.inventory?.quad), quint: UmrahCore_N(o.quintQty ?? o.inventory?.quint) }, seats: UmrahCore_N(o.seats), capacity: UmrahCore_N(o.capacity), deadline: o.deadline || '', direction: o.direction || '', airline: o.airline || '', flightNo: o.flightNo || '', from: o.from || '', to: o.to || '', dateTime: o.dateTime || '', active: true, createdAt: UmrahCore_now() }; if (x.end < x.start)
        throw new Error('نهاية القطاع قبل بدايته'); UmrahCore_DB.data.programSegments.push(x); UmrahCore_DB.data.programSegments.sort((a, b) => a.programId === b.programId ? a.sequence - b.sequence : 0); this.refreshTaskDates(p); UmrahCore_Bridge.audit('create', 'programSegment', x.id, `${p.no} ${x.title}`); return x; },
    removeSegment(id) { UmrahCore_Bridge.require('umrah.programs', 'delete'); const s = this.segment(id); if (!s)
        return; if (s.contractId)
        throw new Error('هذا القطاع مرتبط بمخزون عقد. حرر التخصيص من مركز التعاقدات والمخزون حتى يتم عكس المخزون والتكلفة وأمر الشراء معًا.'); if (UmrahCore_DB.data.hotelRooms.some(r => r.segmentId === id))
        throw new Error('القطاع مرتبط بتوزيع غرف؛ لا يمكن حذفه'); UmrahCore_ContractCenter.releaseSegment(id); UmrahCore_DB.data.programSegments = UmrahCore_DB.data.programSegments.filter(x => x.id !== id); UmrahCore_Bridge.audit('delete', 'programSegment', id, s.title); },
    segments(programId, type = '') { return UmrahCore_DB.data.programSegments.filter(x => x.programId === programId && x.active !== false && (!type || x.type === type)).sort((a, b) => UmrahCore_N(a.sequence) - UmrahCore_N(b.sequence)); },
    seedTasks(p) { const defs = [['contracts', 'مراجعة التعاقدات والمخزون', -35, true], ['pricing', 'اعتماد التكلفة والتسعير', -30, true], ['visa', 'استكمال التأشيرات المطلوبة', -18, true], ['tickets', 'إصدار التذاكر ومراجعة الأسماء', -7, true], ['rooming', 'اعتماد قوائم توزيع الغرف', -5, true], ['transport', 'اعتماد توزيع المركبات', -3, true], ...(p.programType === 'hajj' ? [['permit', 'اعتماد التصاريح / نسك', -7, true], ['camp', 'اعتماد تسكين المخيم / المشاعر', -5, true]] : []), ['financial', 'مراجعة الموقف المالي للحجوزات', -2, true], ['manifest', 'إقفال كشف المسافرين النهائي', -1, true]]; for (const [code, title, offset, critical] of defs)
        UmrahCore_DB.data.operationTasks.push({ id: UmrahCore_iid(), branchId: p.branchId || UmrahCore_Bridge.branchId(), programId: p.id, code, title, dueDate: UmrahCore_dateAdd(p.departureDate, offset), critical, status: 'pending', ownerId: '', notes: '', doneAt: '', createdAt: UmrahCore_now() }); },
    refreshTaskDates(p) { const offsets = { contracts: -35, pricing: -30, visa: -18, tickets: -7, rooming: -5, transport: -3, permit: -7, camp: -5, financial: -2, manifest: -1 }; for (const t of UmrahCore_DB.data.operationTasks.filter(x => x.programId === p.id && offsets[x.code] != null))
        t.dueDate = UmrahCore_dateAdd(p.departureDate, offsets[t.code]); },
    addTask(o) { UmrahCore_Bridge.require('umrah.control', 'add'); const p = this.program(o.programId); if (!p)
        throw new Error('اختر البرنامج'); const x = { id: UmrahCore_iid(), branchId: UmrahCore_Bridge.branchId(), programId: p.id, code: 'custom-' + UmrahCore_iid().slice(0, 6), title: UmrahCore_S(o.title).trim(), dueDate: o.dueDate || p.departureDate, critical: o.critical === 'yes', ownerId: o.ownerId || '', notes: o.notes || '', status: 'pending', createdAt: UmrahCore_now() }; if (!x.title)
        throw new Error('اسم المهمة مطلوب'); UmrahCore_DB.data.operationTasks.push(x); UmrahCore_Bridge.audit('create', 'umrahTask', x.id, x.title); return x; },
    toggleTask(id) { UmrahCore_Bridge.require('umrah.control', 'edit'); const x = this.scoped('operationTasks').find(t => t.id === id); if (!x)
        return; x.status = x.status === 'done' ? 'pending' : 'done'; x.autoDone = false; x.doneAt = x.status === 'done' ? UmrahCore_now() : ''; x.doneBy = x.status === 'done' ? UmrahCore_Bridge.currentUser().id : ''; UmrahCore_Bridge.audit('status', 'umrahTask', id, x.status); },
    syncAutoTasks(programId) { const p = this.program(programId); if (!p)
        return; const activeBookings = UmrahCore_DB.data.bookings.filter(b => b.programId === programId && this.activeBookingStatuses.has(b.status)), trav = UmrahCore_DB.data.travelers.filter(t => t.programId === programId && t.active !== false && activeBookings.some(b => b.id === t.bookingId)), all = (fn) => trav.length > 0 && trav.every(fn), visaRequired = this.segments(programId, 'visa').length > 0, permitRequired = p.programType === 'hajj', campRequired = p.programType === 'hajj', conds = { contracts: () => this.financialSetupGaps(programId).length === 0, pricing: () => Object.values(p.pricing || {}).some(v => UmrahCore_N(v) > 0), visa: () => !visaRequired || all(t => t.visaStatus === 'issued'), tickets: () => all(t => this.travelerFlightReady(t)), rooming: () => all(t => this.segments(programId, 'hotel').every(s => !!t.roomAssignments?.[s.id])), transport: () => all(t => this.transportAssigned(t.id)), permit: () => !permitRequired || all(t => t.hajjPermitStatus === 'issued'), camp: () => !campRequired || all(t => !!UmrahCore_S(t.campAssignment).trim()), financial: () => activeBookings.length > 0 && activeBookings.every(b => this.bookingReadiness(b).finance === 'ok'), manifest: () => all(t => this.travelerReadiness(t).score === 100) }; for (const task of UmrahCore_DB.data.operationTasks.filter(x => x.programId === programId && conds[x.code])) {
        const ok = !!conds[task.code]();
        if (ok && task.status !== 'done') {
            task.status = 'done';
            task.autoDone = true;
            task.doneAt = UmrahCore_now();
            task.doneBy = 'SYSTEM';
        }
        else if (!ok && task.autoDone) {
            task.status = 'pending';
            task.autoDone = false;
            task.doneAt = '';
            task.doneBy = '';
        }
    } },
    expireHolds() { const ts = Date.now(); let n = 0; for (const b of this.scoped('bookings')) {
        if (b.status === 'hold' && b.holdUntil && new Date(b.holdUntil).getTime() <= ts) {
            b.status = 'expired';
            b.cancelReason = 'انتهاء مدة الحجز المؤقت';
            b.expiredAt = UmrahCore_now();
            this.releaseBookingResources(b.id);
            UmrahCore_Bridge.audit('expire', 'umrahBooking', b.id, b.no);
            n++;
        }
    } return n; },
    holdsExpiring(hours = UmrahCore_N(UmrahCore_DB.data.settings.holdWarnHours) || 6) { const nowMs = Date.now(), limit = nowMs + Math.max(1, UmrahCore_N(hours)) * 3600000; return this.scoped('bookings').filter(b => b.status === 'hold' && b.holdUntil && new Date(b.holdUntil).getTime() > nowMs && new Date(b.holdUntil).getTime() <= limit).sort((a, b) => UmrahCore_S(a.holdUntil).localeCompare(UmrahCore_S(b.holdUntil))); },
    syncTimedStatuses() { let n = this.expireHolds(); for (const p of this.scoped('programs').filter(x => x.status === 'open' && x.salesCloseDate && UmrahCore_today() > x.salesCloseDate)) {
        p.status = 'salesClosed';
        p.statusAt = UmrahCore_now();
        p.autoSalesClosed = true;
        UmrahCore_Bridge.audit('status', 'umrahProgram', p.id, `${p.no} -> salesClosed (تاريخ إغلاق البيع)`);
        n++;
    } return n; }
};
export { UmrahCore_OpsSchedule };
