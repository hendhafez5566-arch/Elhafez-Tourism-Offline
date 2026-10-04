import { UmrahBusinessRules } from './business-rules';
import { UmrahCore_N, UmrahCore_S, UmrahCore_hajjPermitStatusLabel, UmrahCore_iid, UmrahCore_monthsAdd, UmrahCore_now, UmrahCore_segLabel, UmrahCore_today } from './runtime';
import { UmrahCore_Bridge, UmrahCore_DB } from './data';
import { UmrahCore_Procurement } from './procurement';
import { UmrahCore_BookingRooms } from './booking-rooms';
import { UmrahCore_travelerIdentityKey } from './operations-identity';
const UmrahCore_OpsTravelers = {
    syncTravelers(b) { const ex = UmrahCore_DB.data.travelers.filter(t => t.bookingId === b.id).sort((a, c) => UmrahCore_N(a.seq) - UmrahCore_N(c.seq)), wanted = []; for (let i = 0; i < UmrahCore_N(b.counts.adults); i++)
        wanted.push('adult'); for (let i = 0; i < UmrahCore_N(b.counts.childBed); i++)
        wanted.push('childBed'); for (let i = 0; i < UmrahCore_N(b.counts.childNoBed); i++)
        wanted.push('childNoBed'); for (let i = 0; i < UmrahCore_N(b.counts.infants); i++)
        wanted.push('infant'); const used = new Set(), blank = t => !UmrahCore_S(t.nameAr).trim() && !UmrahCore_S(t.nameEn).trim() && !UmrahCore_S(t.passportNo).trim(), pick = (cat) => ex.find(t => !used.has(t.id) && t.category === cat && t.active !== false) || ex.find(t => !used.has(t.id) && blank(t)); for (let i = 0; i < wanted.length; i++) {
        const cat = wanted[i];
        let t = pick(cat);
        if (!t) {
            t = { id: UmrahCore_iid(), branchId: b.branchId || UmrahCore_Bridge.branchId(), bookingId: b.id, programId: b.programId, seq: i + 1, no: `${b.no}-T${String(i + 1).padStart(2, '0')}`, nameAr: i === 0 && cat === 'adult' ? b.customerSnapshot.name : '', nameEn: '', relation: i === 0 && cat === 'adult' ? 'self' : 'family', gender: '', nationality: '', birthDate: '', passportNo: '', passportIssue: '', passportExpiry: '', issuePlace: '', visaStatus: 'not_started', visaNo: '', hajjPermitStatus: 'not_started', hajjPermitNo: '', campAssignment: '', ticketStatus: 'not_issued', pnr: '', ticketNo: '', seat: '', baggage: '', category: cat, phone: i === 0 && cat === 'adult' ? b.customerSnapshot.phone : '', emergencyPhone: '', roomAssignments: {}, notes: '', active: true, createdAt: UmrahCore_now() };
            UmrahCore_DB.data.travelers.push(t);
        }
        used.add(t.id);
        t.active = true;
        t.branchId = t.branchId || b.branchId || UmrahCore_Bridge.branchId();
        t.programId = b.programId;
        t.seq = i + 1;
        t.category = cat;
    } for (const t of ex)
        if (!used.has(t.id)) {
            t.active = false;
            t.roomAssignments = {};
        } },
    updateTraveler(id, o) { UmrahCore_Bridge.require('umrah.travelers', 'edit'); const t = this.traveler(id); if (!t)
        throw new Error('المسافر غير موجود'); const passport = UmrahCore_S(o.passportNo || '').trim().toUpperCase(), p = this.program(t.programId), dup = passport && UmrahCore_DB.data.travelers.find(x => { if (x.id === id || x.active === false || !UmrahCore_Bridge.branchMatch(x) || UmrahCore_S(x.passportNo).trim().toUpperCase() !== passport)
        return false; const ob = UmrahCore_DB.data.bookings.find(b => b.id === x.bookingId), op = this.program(x.programId); if (!ob || !op)
        return false; if (x.bookingId === t.bookingId || x.programId === t.programId)
        return true; if (!this.resourceBookingStatuses.has(ob.status))
        return false; if (!p)
        return true; return !(op.returnDate < p.departureDate || op.departureDate > p.returnDate); }); if (dup)
        throw new Error(`رقم الجواز مستخدم في حجز متداخل/نشط للملف ${dup.no}`); const identityProbe = { nameAr: UmrahCore_S(o.nameAr).trim(), birthDate: o.birthDate || '', nationality: o.nationality || '', passportNo: passport }, identityKey = UmrahCore_travelerIdentityKey(identityProbe), identityDup = identityKey && UmrahCore_DB.data.travelers.find(x => x.id !== id && x.active !== false && x.programId === t.programId && UmrahCore_Bridge.branchMatch(x) && UmrahCore_travelerIdentityKey(x) === identityKey); if (identityDup)
        throw new Error(`هذا المسافر لديه ملف بالفعل داخل نفس البرنامج (${identityDup.no}). افتح الملف الموجود بدل إنشاء ملف مكرر.`); if (o.birthDate && o.birthDate > UmrahCore_today())
        throw new Error('تاريخ الميلاد لا يمكن أن يكون في المستقبل'); if (o.passportIssue && o.passportExpiry && o.passportExpiry <= o.passportIssue)
        throw new Error('تاريخ انتهاء الجواز يجب أن يكون بعد تاريخ الإصدار'); Object.assign(t, { nameAr: UmrahCore_S(o.nameAr).trim(), nameEn: UmrahCore_S(o.nameEn).trim(), relation: o.relation || '', gender: o.gender || '', nationality: o.nationality || '', birthDate: o.birthDate || '', passportNo: passport, passportIssue: o.passportIssue || '', passportExpiry: o.passportExpiry || '', issuePlace: o.issuePlace || '', phone: o.phone || '', emergencyPhone: o.emergencyPhone || '', notes: o.notes || '', updatedAt: UmrahCore_now() }); if (!t.nameAr)
        throw new Error('الاسم بالعربي مطلوب'); UmrahCore_Bridge.audit('update', 'umrahTraveler', id, t.no); },
    updateHajjService(id, o) { UmrahCore_Bridge.require('umrah.travelers', 'edit'); const t = this.traveler(id), p = t && this.program(t.programId), b = t && this.booking(t.bookingId); if (!t || !p || !b)
        throw new Error('المسافر أو البرنامج أو الحجز غير موجود'); if (p.programType !== 'hajj')
        throw new Error('خدمات المخيم والتصاريح متاحة لبرامج الحج فقط'); if (['cancelRequested', 'cancelled', 'expired', 'refunded', 'noShow', 'closed'].includes(b.status))
        throw new Error('الحجز غير متاح لتعديل خدمات الحج في حالته الحالية'); const permitRequired = this.segments(p.id, 'permit').length > 0, campRequired = this.segments(p.id, 'camp').length > 0, current = t.hajjPermitStatus || 'not_started', status = o.hajjPermitStatus || current, allowed = { not_started: ['documents_received', 'rejected'], documents_received: ['submitted', 'rejected'], submitted: ['processing', 'issued', 'rejected'], processing: ['issued', 'rejected'], issued: ['issued'], rejected: ['documents_received'] }; if (status !== current && !(allowed[current] || []).includes(status))
        throw new Error(`لا يمكن نقل التصريح مباشرة من ${UmrahCore_hajjPermitStatusLabel(current)} إلى ${UmrahCore_hajjPermitStatusLabel(status)}`); const permitNo = UmrahCore_S(o.hajjPermitNo || '').trim(); if (permitRequired && status === 'issued' && !permitNo)
        throw new Error('رقم التصريح/نسك مطلوب عند اختيار الحالة صادرة'); const camp = UmrahCore_S(o.campAssignment || '').trim(), oldPermit = t.hajjPermitStatus || 'not_started', oldCamp = UmrahCore_S(t.campAssignment || '').trim(); Object.assign(t, { hajjPermitStatus: status, hajjPermitNo: permitNo, campAssignment: camp, updatedAt: UmrahCore_now() }); if (permitRequired && status === 'issued' && oldPermit !== 'issued')
        UmrahCore_Procurement.onHajjServiceProgress(t, 'permit'); if (campRequired && camp && camp !== oldCamp)
        UmrahCore_Procurement.onHajjServiceProgress(t, 'camp'); this.syncAutoTasks(p.id); UmrahCore_Bridge.audit('update', 'hajjTravelerService', id, `${permitRequired ? `تصريح ${UmrahCore_hajjPermitStatusLabel(status)}` : 'بدون تصريح'}${campRequired ? ` • مخيم ${camp || 'غير محدد'}` : ''}`); return t; },
    ensureHotelRooms(b, rebuild = false) { return UmrahCore_BookingRooms.ensureRooms(this, b, rebuild); },
    autoAssignRooms(bookingId) { const b = this.booking(bookingId); if (!b)
        return; const trav = UmrahCore_DB.data.travelers.filter(t => t.bookingId === bookingId && t.active !== false); for (const seg of this.segments(b.programId, 'hotel')) {
        const rooms = UmrahCore_DB.data.hotelRooms.filter(r => r.bookingId === b.id && r.segmentId === seg.id);
        for (const t of trav) {
            t.roomAssignments = t.roomAssignments || {};
            delete t.roomAssignments[seg.id];
        }
        const bedTrav = trav.filter(x => ['adult', 'childBed'].includes(x.category));
        for (const t of bedTrav) {
            const room = rooms.find(r => bedTrav.filter(x => x.roomAssignments?.[seg.id] === r.id).length < r.capacity);
            if (room)
                t.roomAssignments[seg.id] = room.id;
        }
        const anchor = trav.find(x => x.category === 'adult' && x.roomAssignments?.[seg.id])?.roomAssignments?.[seg.id] || rooms[0]?.id || '';
        for (const t of trav.filter(x => ['childNoBed', 'infant'].includes(x.category)))
            if (anchor)
                t.roomAssignments[seg.id] = anchor;
    } },
    releaseBookingResources(id) { for (const t of UmrahCore_DB.data.travelers.filter(x => x.bookingId === id))
        t.roomAssignments = {}; UmrahCore_DB.data.hotelRooms = UmrahCore_DB.data.hotelRooms.filter(r => r.bookingId !== id); for (const v of UmrahCore_DB.data.visaItems.filter(x => x.bookingId === id))
        v.active = false; for (const tk of UmrahCore_DB.data.tickets.filter(x => x.bookingId === id))
        tk.active = false; for (const br of UmrahCore_DB.data.busRuns)
        br.travelerIds = (br.travelerIds || []).filter(tid => this.traveler(tid)?.bookingId !== id); },
    travelerFlightReady(t) { const segs = this.segments(t.programId, 'flight').filter(s => s.active !== false); if (!segs.length)
        return false; return segs.every(seg => UmrahCore_DB.data.tickets.some(x => x.travelerId === t.id && x.segmentId === seg.id && x.active !== false && ['issued', 'reissued'].includes(x.status))); },
    travelerReadiness(t) { const p = this.program(t.programId), passport = !!(t.passportNo && t.passportExpiry && p && t.passportExpiry >= UmrahCore_monthsAdd(p.departureDate, UmrahCore_DB.data.settings.passportValidityMonths)), visaRequired = !!(p && this.segments(t.programId, 'visa').length), visa = !visaRequired || t.visaStatus === 'issued', ticket = this.travelerFlightReady(t), hotel = this.segments(t.programId, 'hotel').every(s => !!t.roomAssignments?.[s.id]), name = !!UmrahCore_S(t.nameAr).trim(), transport = this.transportAssigned(t.id), permitRequired = !!(p?.programType === 'hajj'), campRequired = !!(p?.programType === 'hajj'), permit = !permitRequired || t.hajjPermitStatus === 'issued', camp = !campRequired || !!UmrahCore_S(t.campAssignment).trim(), parts = { name, passport, visa, ticket, hotel, transport, ...(permitRequired ? { permit } : {}), ...(campRequired ? { camp } : {}) }, score = Math.round(Object.values(parts).filter(Boolean).length / Object.keys(parts).length * 100); return { ...parts, visaRequired, permit, camp, permitRequired, campRequired, score }; },
    transportAssigned(travelerId) { const p = this.traveler(travelerId)?.programId; if (!p)
        return false; const required = this.segments(p, 'transport'); if (!required.length)
        return true; return required.every(seg => UmrahCore_DB.data.busRuns.some(x => x.programId === p && x.segmentId === seg.id && (x.travelerIds || []).includes(travelerId))); },
    syncPaymentStatus(b,f=null){f=f||UmrahCore_Bridge.financeSnapshot(b);return UmrahBusinessRules.syncPaymentStatus(b,f,UmrahCore_now);},
    bookingReadiness(b) { const f: any = UmrahCore_Bridge.financeSnapshot(b), paymentStatus = this.syncPaymentStatus(b, f); let finance = 'ok'; const needsInvoice = ['confirmed', 'partiallyPaid', 'fullyPaid', 'docsPending', 'ready', 'checkedIn', 'traveling', 'returned', 'closed'].includes(b.status); if (needsInvoice && (!f || !f.invoiceId || f.remaining == null))
        finance = 'unknown';
    else if (UmrahCore_DB.data.settings.financialClearanceRequired && UmrahCore_N(f?.remaining) > UmrahCore_N(UmrahCore_DB.data.settings.financialClearanceMaxDue))
        finance = 'due'; const ts = UmrahCore_DB.data.travelers.filter(t => t.bookingId === b.id && t.active !== false); if (!ts.length)
        return { score: 0, travelers: 0, travelerScore: 0, finance, remaining: f?.remaining ?? null, paymentStatus }; const tr = Math.round(ts.reduce((z, t) => z + this.travelerReadiness(t).score, 0) / ts.length); return { score: Math.round((tr + (finance === 'ok' ? 100 : 0)) / 2), travelerScore: tr, finance, remaining: f?.remaining ?? null, paymentStatus }; },
    financialSetupGaps(programId) { const segs = this.segments(programId), cats = ['hotel', 'flight', 'transport', 'visa', 'camp', 'permit'], gaps = []; for (const cat of cats) {
        for (const seg of segs.filter(s => s.type === cat)) {
            const ok = !!seg.supplierId && UmrahCore_DB.data.programCosts.some(c => c.programId === programId && c.category === cat && c.active !== false && c.supplierId === seg.supplierId && UmrahCore_N(c.amount) > 0 && c.procurementPolicy !== 'budgetOnly');
            if (!ok)
                gaps.push({ category: cat, segmentId: seg.id, supplierId: seg.supplierId || '', title: seg.title || UmrahCore_segLabel(cat) });
        }
    } return gaps; },
    blockers(programId) { this.syncAutoTasks(programId); const travelers = UmrahCore_DB.data.travelers.filter(t => t.programId === programId && t.active !== false && UmrahCore_DB.data.bookings.some(b => b.id === t.bookingId && this.activeBookingStatuses.has(b.status))), bad = (key) => travelers.filter(t => !this.travelerReadiness(t)[key]), bookings = UmrahCore_DB.data.bookings.filter(b => b.programId === programId && this.activeBookingStatuses.has(b.status)), cancelPending = UmrahCore_DB.data.bookings.filter(b => b.programId === programId && b.status === 'cancelRequested'), fin = bookings.filter(b => ['due', 'unknown'].includes(this.bookingReadiness(b).finance)), tasks = UmrahCore_DB.data.operationTasks.filter(t => t.programId === programId && t.critical && t.status !== 'done'), financialSetup = this.financialSetupGaps(programId), permit = travelers.filter(t => { const r = this.travelerReadiness(t); return r.permitRequired && !r.permit; }), camp = travelers.filter(t => { const r = this.travelerReadiness(t); return r.campRequired && !r.camp; }), passport = bad('passport'), visa = bad('visa'), ticket = bad('ticket'), hotel = bad('hotel'), transport = bad('transport'); return { travelers, passport, visa, ticket, hotel, transport, permit, camp, finance: fin, tasks, financialSetup, cancelPending, total: passport.length + visa.length + ticket.length + hotel.length + transport.length + permit.length + camp.length + fin.length + tasks.length + financialSetup.length + cancelPending.length }; },
    programReadiness(p) { const b = this.blockers(p.id); if (!b.travelers.length)
        return { score: 0, blockers: b }; const base = Math.round(b.travelers.reduce((z, t) => z + this.travelerReadiness(t).score, 0) / b.travelers.length), taskTotal = UmrahCore_DB.data.operationTasks.filter(x => x.programId === p.id && x.critical).length, taskDone = UmrahCore_DB.data.operationTasks.filter(x => x.programId === p.id && x.critical && x.status === 'done').length, taskPct = taskTotal ? Math.round(taskDone / taskTotal * 100) : 100; return { score: Math.round((base + taskPct) / 2), blockers: b }; },
    eligibleVisaTravelers(programId) { return this.activeTravelers(programId).filter(t => !UmrahCore_DB.data.visaItems.some(v => v.travelerId === t.id && v.active !== false && UmrahCore_DB.data.visaBatches.some(b => b.id === v.batchId && b.status !== 'cancelled'))); }
};
export { UmrahCore_OpsTravelers };
