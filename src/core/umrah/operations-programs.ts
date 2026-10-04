import { live } from '../runtime';
import { UmrahLifecycleWorkflows } from '../../application/umrah-lifecycle-workflows';
import { DB } from '../../persistence/browser-store';
import { UmrahCore_N, UmrahCore_S, UmrahCore_dateAdd, UmrahCore_daysBetween, UmrahCore_iid, UmrahCore_now, UmrahCore_roomCap } from './runtime';
import { UmrahCore_Bridge, UmrahCore_DB } from './data';
import { UmrahCore_ContractCenter } from './contracts';
import { UmrahCore_Procurement } from './procurement';
import { composeLegacyUmrahLifecycleDeps } from '../late-bindings';
const UmrahCore_OpsPrograms = {
    createProgram(o) { UmrahCore_Bridge.require('umrah.programs', 'add'); const name = UmrahCore_S(o.name).trim(), departure = o.departureDate, ret = o.returnDate, season = o.seasonId ? this.season(o.seasonId) : null, currency = UmrahCore_S(o.currency || UmrahCore_DB.data.settings.defaultCurrency).toUpperCase(); if (!name)
        throw new Error('اسم البرنامج مطلوب'); if (!departure || !ret)
        throw new Error('تاريخ السفر والعودة مطلوبان'); if (ret < departure)
        throw new Error('تاريخ العودة يجب أن يكون بعد تاريخ السفر'); if (season) {
        if (season.status === 'closed' || season.status === 'cancelled')
            throw new Error('الموسم المحدد غير مفتوح');
        if (departure < season.from || ret > season.to)
            throw new Error(`تواريخ البرنامج يجب أن تقع داخل الموسم ${season.from} — ${season.to}`);
    } if (o.seasonId && !season)
        throw new Error('الموسم المحدد غير موجود'); const salesClose = o.salesCloseDate || departure; if (salesClose > departure)
        throw new Error('تاريخ إغلاق البيع لا يمكن أن يكون بعد تاريخ السفر'); const rate = UmrahCore_N(o.fxRateSnapshot) || UmrahCore_Bridge.rate(currency, departure); if (currency !== UmrahCore_Bridge.baseCurrency() && !(rate > 0))
        throw new Error(`لا يوجد سعر صرف صالح للعملة ${currency} في تاريخ البرنامج`); const treasury = UmrahCore_Bridge.preferredTreasury(currency, o.defaultTreasuryId || ''); if (o.defaultTreasuryId && !treasury)
        throw new Error(`خزنة التحصيل يجب أن تكون نشطة وبعملة ${currency}`); const p = { id: UmrahCore_iid(), no: UmrahCore_DB.next('program'), programType: o.programType === 'hajj' ? 'hajj' : 'umrah', seasonId: o.seasonId || '', name, groupNo: o.groupNo || '', groupDescription: o.groupDescription || '', durationDays: UmrahCore_daysBetween(departure, ret) + 1, status: o.status || 'planning', departureDate: departure, returnDate: ret, salesCloseDate: salesClose, capacity: Math.max(1, UmrahCore_N(o.capacity)), currency, fxRateSnapshot: rate || 1, defaultTreasuryId: treasury?.id || '', costCenterId: o.costCenterId || '', holdHours: Math.max(1, UmrahCore_N(o.holdHours) || UmrahCore_DB.data.settings.holdHours), depositMin: Math.max(0, UmrahCore_N(o.depositMin)), pricing: { single: UmrahCore_N(o.priceSingle), double: UmrahCore_N(o.priceDouble), triple: UmrahCore_N(o.priceTriple), quad: UmrahCore_N(o.priceQuad), quint: UmrahCore_N(o.priceQuint), childBed: UmrahCore_N(o.childBed), childNoBed: UmrahCore_N(o.childNoBed), infant: UmrahCore_N(o.infant) }, notes: o.notes || '', branchId: UmrahCore_Bridge.branchId(), active: true, createdAt: UmrahCore_now(), createdBy: UmrahCore_Bridge.currentUser().id }; const cc = UmrahCore_Bridge.ensureProgramCostCenter(p); if (cc?.id) p.costCenterId = cc.id; UmrahCore_DB.data.programs.unshift(p); this.seedTasks(p); UmrahCore_Bridge.audit('create', 'umrahProgram', p.id, p.no); return p; },
    updateProgram(id, o) { UmrahCore_Bridge.require('umrah.programs', 'edit'); const p = this.program(id); if (!p)
        throw new Error('البرنامج غير موجود'); const reserved = this.reservedPersons(id), capacity = Math.max(1, UmrahCore_N(o.capacity)); if (capacity < reserved)
        throw new Error(`السعة لا تقل عن المحجوز (${reserved})`); const departure = o.departureDate || p.departureDate, ret = o.returnDate || p.returnDate, salesClose = o.salesCloseDate || p.salesCloseDate; if (ret < departure)
        throw new Error('تاريخ العودة يجب أن يكون بعد تاريخ السفر'); if (salesClose > departure)
        throw new Error('تاريخ إغلاق البيع لا يمكن أن يكون بعد تاريخ السفر'); const season = o.seasonId ? this.season(o.seasonId) : null; if (o.seasonId && !season)
        throw new Error('الموسم المحدد غير موجود'); if (season && (departure < season.from || ret > season.to))
        throw new Error(`تواريخ البرنامج يجب أن تقع داخل الموسم ${season.from} — ${season.to}`); const nextCurrency = UmrahCore_S(o.currency || p.currency).toUpperCase(), nextTreasury = UmrahCore_Bridge.preferredTreasury(nextCurrency, o.defaultTreasuryId || p.defaultTreasuryId || ''); if ((o.defaultTreasuryId || p.defaultTreasuryId) && !nextTreasury)
        throw new Error(`خزنة التحصيل يجب أن تكون نشطة وبعملة ${nextCurrency}`); const hasFinancial = UmrahCore_DB.data.bookings.some(b => b.programId === id && (b.hostInvoiceId || this.activeBookingStatuses.has(b.status))) || UmrahCore_DB.data.supplierCommitments.some(c => c.programId === id && c.status !== 'cancelled'); if (nextCurrency !== p.currency && hasFinancial)
        throw new Error('لا يمكن تغيير عملة البرنامج بعد وجود حجوزات أو التزامات مالية'); const hasOps = UmrahCore_DB.data.tickets.some(x => x.programId === id && x.active !== false) || UmrahCore_DB.data.visaItems.some(x => x.programId === id && x.active !== false) || UmrahCore_DB.data.busRuns.some(x => x.programId === id) || (UmrahCore_DB.data.hotelRooms || []).some(x => x.programId === id); if ((departure !== p.departureDate || ret !== p.returnDate) && hasOps)
        throw new Error('لا يمكن تغيير تواريخ البرنامج بعد بدء إصدار التأشيرات/التذاكر أو توزيع التشغيل؛ أنشئ تعديلًا تشغيليًا موثقًا'); const nextType = o.programType === 'hajj' ? 'hajj' : o.programType === 'umrah' ? 'umrah' : p.programType || 'umrah'; if (nextType !== p.programType && UmrahCore_DB.data.bookings.some(b => b.programId === id))
        throw new Error('لا يمكن تغيير نوع البرنامج بعد إنشاء حجوزات'); Object.assign(p, { programType: nextType, seasonId: o.seasonId || '', name: UmrahCore_S(o.name).trim() || p.name, groupNo: o.groupNo || '', groupDescription: o.groupDescription || '', departureDate: departure, returnDate: ret, salesCloseDate: salesClose, capacity, currency: nextCurrency, defaultTreasuryId: nextTreasury?.id || '', costCenterId: o.costCenterId || '', holdHours: Math.max(1, UmrahCore_N(o.holdHours) || p.holdHours), depositMin: Math.max(0, UmrahCore_N(o.depositMin)), notes: o.notes || '', updatedAt: UmrahCore_now() }); p.durationDays = UmrahCore_daysBetween(p.departureDate, p.returnDate) + 1; p.pricing = { single: UmrahCore_N(o.priceSingle), double: UmrahCore_N(o.priceDouble), triple: UmrahCore_N(o.priceTriple), quad: UmrahCore_N(o.priceQuad), quint: UmrahCore_N(o.priceQuint), childBed: UmrahCore_N(o.childBed), childNoBed: UmrahCore_N(o.childNoBed), infant: UmrahCore_N(o.infant) }; const cc = UmrahCore_Bridge.ensureProgramCostCenter(p); if (cc?.id) p.costCenterId = cc.id; this.refreshTaskDates(p); UmrahCore_Bridge.audit('update', 'umrahProgram', id, p.no); return p; },
    programOpenGaps(id) { const p = this.program(id); if (!p)
        return [{ code: 'program_missing', message: 'البرنامج غير موجود' }]; const hotels = this.segments(id, 'hotel'), flights = this.segments(id, 'flight'), trans = this.segments(id, 'transport'), camps = this.segments(id, 'camp'), permits = this.segments(id, 'permit'), gaps = []; if (!hotels.length)
        gaps.push({ code: 'hotel_missing', message: 'أضف إقامة فندقية واحدة على الأقل قبل فتح البيع', action: 'program' }); const outbound = flights.some(f => f.start === p.departureDate || f.end === p.departureDate), returnLeg = flights.some(f => f.start === p.returnDate || f.end === p.returnDate); if (!flights.length || !outbound || !returnLeg) {
        const missing = [!outbound ? `رحلة ذهاب بتاريخ ${p.departureDate}` : '', !returnLeg ? `رحلة عودة بتاريخ ${p.returnDate}` : ''].filter(Boolean).join(' و');
        const existing = flights.length ? flights.map(f => `${f.direction === 'return' || /^عودة/.test(f.title) ? 'عودة' : f.direction === 'outbound' || /^ذهاب/.test(f.title) ? 'ذهاب' : f.title}: ${f.start}`).join('، ') : 'لا توجد رحلات مضافة';
        gaps.push({ code: 'flight_schedule', message: `لا يمكن فتح البرنامج للبيع: أضف/صحح ${missing}.`, detail: `الموجود حاليًا: ${existing}`, action: 'flightSetup' });
    } if (p.programType === 'hajj' && !camps.length)
        gaps.push({ code: 'camp_missing', message: 'أضف خدمة المخيم/المشاعر وموردها قبل فتح برنامج الحج', action: 'program' }); if (p.programType === 'hajj' && !permits.length)
        gaps.push({ code: 'permit_missing', message: 'أضف خدمة التصاريح/نسك وموردها قبل فتح برنامج الحج', action: 'program' }); const nights = hotels.reduce((z, h) => z + (UmrahCore_N(h.nights) > 0 ? UmrahCore_N(h.nights) : Math.max(1, UmrahCore_daysBetween(h.start, UmrahCore_dateAdd(h.end, 1)))), 0), required = Math.max(0, UmrahCore_daysBetween(p.departureDate, p.returnDate)); if (hotels.length && nights !== required)
        gaps.push({ code: 'hotel_nights', message: `إجمالي ليالي الإقامة ${nights} لا يطابق الليالي المطلوبة بين تاريخ السفر والعودة ${required}`, action: 'program' }); for (const h of hotels) { const beds = Object.entries(h.inventory || {}).reduce((z, [k, v]) => z + UmrahCore_N(v) * (UmrahCore_roomCap[k] || 0), 0); if (beds < UmrahCore_N(p.capacity))
            gaps.push({ code: 'hotel_capacity', message: `سعة الفندق ${h.title} (${beds}) أقل من سعة البرنامج (${p.capacity})`, action: 'program' }); } for (const f of flights)
        if (UmrahCore_N(f.seats) < UmrahCore_N(p.capacity))
            gaps.push({ code: 'flight_capacity', message: `مقاعد ${f.title} (${UmrahCore_N(f.seats)}) أقل من سعة البرنامج (${p.capacity})`, action: 'flightSetup' }); for (const t of trans)
        if (UmrahCore_N(t.capacity) > 0 && UmrahCore_N(t.capacity) < UmrahCore_N(p.capacity))
            gaps.push({ code: 'transport_capacity', message: `سعة النقل ${t.title} (${UmrahCore_N(t.capacity)}) أقل من سعة البرنامج (${p.capacity})`, action: 'program' }); const treasury = UmrahCore_Bridge.preferredTreasury(p.currency, p.defaultTreasuryId || ''); if (!treasury)
        gaps.push({ code: 'treasury_missing', message: `لا توجد خزنة/حساب نشط بعملة ${p.currency} لتحصيل حجوزات البرنامج`, action: 'program' }); const financial = this.financialSetupGaps(id); if (financial.length)
        gaps.push({ code: 'financial_setup', message: `الربط المالي ناقص: ${financial.map(g => g.title).join('، ')}`, action: 'program' }); return gaps; },
    assertProgramOpenReady(id) { const gaps = this.programOpenGaps(id); if (gaps.length) { const e: any = new Error(gaps.map(g => g.message).join(' • ')); e.code = 'PROGRAM_OPEN_BLOCKED'; e.gaps = gaps; e.programId = id; throw e; } const p = this.program(id), treasury = p && UmrahCore_Bridge.preferredTreasury(p.currency, p.defaultTreasuryId || ''); if (p && treasury && p.defaultTreasuryId !== treasury.id)
        p.defaultTreasuryId = treasury.id; return true; },
    saveSimpleFlightSchedule(programId, o) { UmrahCore_Bridge.require('umrah.programs', 'edit'); const p = this.program(programId); if (!p)
        throw new Error('البرنامج غير موجود'); const flights = this.segments(programId, 'flight'); if (flights.length > 2)
        throw new Error('هذا البرنامج يحتوي أكثر من رحلتين/ترانزيت. استخدم ملف البرنامج المتقدم حتى لا يتم تغيير المسار المركب بالخطأ.'); const ordered = [...flights].sort((a, b) => UmrahCore_N(a.sequence) - UmrahCore_N(b.sequence)), detectedOut = ordered.find(x => x.direction === 'outbound' || /^ذهاب/.test(x.title)) || null, detectedRet = ordered.find(x => x.direction === 'return' || /^عودة/.test(x.title)) || null, out = detectedOut || ordered.find(x => x !== detectedRet) || null, ret = detectedRet || ordered.find(x => x !== out) || null, airline = UmrahCore_S(o.airline).trim(), outFlight = UmrahCore_S(o.outFlight).trim(), returnFlight = UmrahCore_S(o.returnFlight).trim(), outFrom = UmrahCore_S(o.outFrom).trim(), outTo = UmrahCore_S(o.outTo).trim(), returnFrom = UmrahCore_S(o.returnFrom).trim(), returnTo = UmrahCore_S(o.returnTo).trim(), outDate = o.outDate || p.departureDate, returnDate = o.returnDate || p.returnDate, outTime = o.outTime || '06:00', returnTime = o.returnTime || '18:00', seats = Math.max(1, UmrahCore_N(o.seats) || UmrahCore_N(p.capacity)), supplierId = o.supplierId || out?.supplierId || ret?.supplierId || ''; if (!airline || !outFlight || !returnFlight || !outFrom || !outTo || !returnFrom || !returnTo)
        throw new Error('أكمل شركة الطيران ورقم ومسار رحلتي الذهاب والعودة'); if (!outDate || !returnDate || returnDate < outDate)
        throw new Error('راجع تاريخ الذهاب والعودة'); const update = (seg, direction, title, date, route, dateTime, flightNo, from, to) => { if (seg?.contractId && (seg.start !== date || seg.route !== route))
            throw new Error('هذه الرحلة مرتبطة ببلوك/تعاقد. عدّلها من مركز التعاقدات أو حرر التخصيص أولًا.'); if (!seg)
            return this.addSegment({ programId, type: 'flight', title, start: date, end: date, supplierId, route, details: dateTime, direction, airline, flightNo, from, to, dateTime, seats }, true); Object.assign(seg, { title, start: date, end: date, supplierId: supplierId || seg.supplierId || '', route, details: dateTime, direction, airline, flightNo, from, to, dateTime, seats, updatedAt: UmrahCore_now() }); return seg; }; const outSeg = update(out, 'outbound', `ذهاب ${airline} ${outFlight}`, outDate, `${outFrom} → ${outTo}`, `${outDate}T${outTime}`, outFlight, outFrom, outTo), retSeg = update(ret, 'return', `عودة ${airline} ${returnFlight}`, returnDate, `${returnFrom} → ${returnTo}`, `${returnDate}T${returnTime}`, returnFlight, returnFrom, returnTo); this.refreshTaskDates(p); UmrahCore_Bridge.audit('update', 'programFlights', p.id, `${p.no} ${outDate} / ${returnDate}`); return { outSeg, retSeg }; },
    setProgramStatus(id,status){return UmrahLifecycleWorkflows.setProgramStatus(composeLegacyUmrahLifecycleDeps(this),id,status);},
    programCancellationBlockers(id) {
        const p = this.program(id);
        if (!p)
            throw new Error('البرنامج غير موجود');
        const blockers = [], bookings = UmrahCore_DB.data.bookings.filter(b => b.programId === id && b.active !== false), active = bookings.filter(b => !['cancelled', 'expired', 'refunded', 'noShow'].includes(b.status));
        const traveled = active.filter(b => ['traveling', 'returned', 'closed'].includes(b.status));
        if (traveled.length)
            blockers.push(`${traveled.length} حجز بدأ السفر/عاد ولا يُلغى كإلغاء عادي`);
        const pending = active.filter(b => b.status === 'cancelRequested');
        if (pending.length)
            blockers.push(`${pending.length} حجز بانتظار تسوية إلغاء مالية`);
        const paid = [];
        for (const b of active.filter(x => ['confirmed', 'partiallyPaid', 'fullyPaid', 'docsPending', 'ready', 'checkedIn'].includes(x.status))) {
            const f: any = UmrahCore_Bridge.financeSnapshot(b) || {};
            if (UmrahCore_N(f.paid) > 0.009)
                paid.push(b);
            if (f.invoiceId && (DB.data.invoiceAdjustments || []).some(x => x.invoiceId === f.invoiceId && (typeof live === 'function' ? live(x) : x.status !== 'void')))
                blockers.push(`الحجز ${b.no} عليه إشعار فاتورة يحتاج عكس/تسوية أولًا`);
        }
        if (paid.length)
            blockers.push(`${paid.length} حجز عليه تحصيل فعلي؛ اعكس/رد سندات القبض أولًا`);
        const issuedTickets = UmrahCore_DB.data.tickets.filter(x => x.programId === id && x.active !== false && ['issued', 'reissued'].includes(x.status));
        if (issuedTickets.length)
            blockers.push(`${issuedTickets.length} تذكرة مصدرة؛ ألغِ/سوِّ التذاكر مع المورد أولًا`);
        const batchIds = new Set(UmrahCore_DB.data.visaBatches.filter(x => x.programId === id).map(x => x.id)), visaItems = UmrahCore_DB.data.visaItems.filter(x => x.active !== false && (x.programId === id || batchIds.has(x.batchId)) && ['submitted', 'processing', 'issued'].includes(x.status));
        if (visaItems.length)
            blockers.push(`${visaItems.length} ملف تأشيرة مقدم/صادر؛ عالج حالة التأشيرة أولًا`);
        const supplierRows = UmrahCore_DB.data.supplierCommitments.filter(c => c.programId === id && c.active !== false && c.status !== 'cancelled'), supplierInvoiced = supplierRows.filter(c => { const snap: any = UmrahCore_Procurement.status(c) || {}; return c.status === 'invoiced' || !!c.hostInvoiceId || !!snap.invoiceId || !!snap.invoiceNo; }), supplierExecuted = supplierRows.filter(c => { const snap: any = UmrahCore_Procurement.status(c) || {}; return !(c.status === 'invoiced' || c.hostInvoiceId || snap.invoiceId || snap.invoiceNo) && !!snap.hasExecution; });
        if (supplierInvoiced.length)
            blockers.push(`${supplierInvoiced.length} التزام مورد تحول لفاتورة؛ عالج فاتورة/رصيد المورد أولًا`);
        if (supplierExecuted.length)
            blockers.push(`${supplierExecuted.length} أمر شراء عليه تنفيذ/استلام فعلي غير مفوتر؛ اعكس/سوِّ التنفيذ مع المورد أولًا`);
        return [...new Set(blockers)];
    },
    cancelProgram(id, reason) {
        UmrahCore_Bridge.require('umrah.programs', 'approve');
        const p = this.program(id), why = UmrahCore_S(reason).trim();
        if (!p)
            throw new Error('البرنامج غير موجود');
        if (!why)
            throw new Error('سبب إلغاء البرنامج مطلوب');
        if (!['planning', 'contracting', 'pricing', 'open', 'salesClosed', 'operating'].includes(p.status || 'planning'))
            throw new Error('البرنامج غير متاح للإلغاء في حالته الحالية؛ بعد بدء السفر استخدم دورة العودة ثم الإغلاق');
        const blockers = this.programCancellationBlockers(id);
        if (blockers.length)
            throw new Error(`لا يمكن إلغاء البرنامج قبل معالجة: ${blockers.join(' • ')}`);
        const bookings = UmrahCore_DB.data.bookings.filter(b => b.programId === id && !['cancelled', 'expired', 'refunded', 'noShow', 'closed'].includes(b.status));
        for (const b of bookings) {
            this.requestCancel(b.id, `إلغاء البرنامج: ${why}`);
            if (b.status === 'cancelRequested')
                throw new Error(`الحجز ${b.no} يحتاج تسوية مالية قبل إلغاء البرنامج`);
        }
        UmrahCore_Procurement.cancelProgramCommitments(p.id, `إلغاء البرنامج: ${why}`);
        UmrahCore_ContractCenter.releaseProgram(p.id);
        p.status = 'cancelled';
        p.statusAt = UmrahCore_now();
        p.cancelReason = why;
        p.cancelledAt = UmrahCore_now();
        UmrahCore_Bridge.audit('cancel', 'umrahProgram', id, `${p.no} — ${why}`);
        return p;
    },
    programCloseBlockers(id) {
        const p = this.program(id);
        if (!p)
            throw new Error('البرنامج غير موجود');
        const blockers = [];
        if (p.status !== 'returned')
            blockers.push('حالة البرنامج يجب أن تكون «عاد» قبل الإغلاق النهائي');
        const bookings = UmrahCore_DB.data.bookings.filter(b => b.programId === id && b.active !== false), unsettledBookings = bookings.filter(b => !['returned', 'closed', 'cancelled', 'expired', 'refunded', 'noShow'].includes(b.status));
        if (unsettledBookings.length)
            blockers.push(`${unsettledBookings.length} حجز لم يصل لحالة العودة/الإغلاق أو الإلغاء`);
        const cancelPending = bookings.filter(b => b.status === 'cancelRequested');
        if (cancelPending.length)
            blockers.push(`${cancelPending.length} حجز عليه طلب إلغاء غير مكتمل`);
        const openCommitments = UmrahCore_DB.data.supplierCommitments.filter(c => c.programId === id && c.active !== false && !['invoiced', 'cancelled'].includes(c.status));
        if (openCommitments.length)
            blockers.push(`${openCommitments.length} التزام مورد لم يتحول لفاتورة أو يلغَ`);
        const openPO = (DB.data.purchaseOrders || []).filter(x => x.programId === id && ['draft', 'approved', 'received'].includes(x.status));
        if (openPO.length)
            blockers.push(`${openPO.length} أمر شراء ما زال مفتوحًا`);
        const draftInvoices = (DB.data.invoices || []).filter(x => x.programId === id && x.status === 'draft');
        if (draftInvoices.length)
            blockers.push(`${draftInvoices.length} فاتورة ما زالت مسودة`);
        const openIncidents = UmrahCore_DB.data.incidents.filter(x => x.programId === id && x.status !== 'closed');
        if (openIncidents.length)
            blockers.push(`${openIncidents.length} مشكلة/حادث تشغيلي ما زال مفتوحًا`);
        const criticalTasks = UmrahCore_DB.data.operationTasks.filter(x => x.programId === id && x.critical === true && x.status !== 'done');
        if (criticalTasks.length)
            blockers.push(`${criticalTasks.length} مهمة تشغيل حرجة لم تكتمل`);
        return [...new Set(blockers)];
    },
    closeProgram(id) {
        UmrahCore_Bridge.require('umrah.programs', 'approve');
        const p = this.program(id);
        if (!p)
            throw new Error('البرنامج غير موجود');
        const blockers = this.programCloseBlockers(id);
        if (blockers.length)
            throw new Error(`لا يمكن إغلاق البرنامج نهائيًا قبل معالجة: ${blockers.join(' • ')}`);
        for (const b of UmrahCore_DB.data.bookings.filter(b => b.programId === id && b.status === 'returned')) {
            b.status = 'closed';
            b.statusAt = UmrahCore_now();
            b.closedAt = UmrahCore_now();
            UmrahCore_Bridge.audit('status', 'umrahBooking', b.id, `${b.no} -> closed`);
        }
        p.status = 'closed';
        p.statusAt = UmrahCore_now();
        p.closedAt = UmrahCore_now();
        UmrahCore_Bridge.audit('close', 'umrahProgram', id, `${p.no} — إغلاق تشغيلي نهائي مع الاحتفاظ بالأثر المالي`);
        return p;
    }
};
export { UmrahCore_OpsPrograms };
