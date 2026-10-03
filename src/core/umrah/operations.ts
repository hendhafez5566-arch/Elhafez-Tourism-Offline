const UmrahCore_travelerIdentityKey = t => { const passport = UmrahCore_S(t?.passportNo).trim().toUpperCase(); if (passport) return `P:${passport}`; const name = UmrahCore_S(t?.nameAr).trim().replace(/\s+/g, ' ').toLowerCase(), birth = UmrahCore_S(t?.birthDate).trim(), nationality = UmrahCore_S(t?.nationality).trim().toLowerCase(); return name && birth ? `N:${name}|${birth}|${nationality}` : ''; };
const UmrahCore_duplicateTravelerGroups = (programId = '') => { const rows = UmrahCore_DB.data.travelers.filter(t => t.active !== false && UmrahCore_Bridge.branchMatch(t) && (!programId || t.programId === programId)), map = new Map(); for (const t of rows) { const key = UmrahCore_travelerIdentityKey(t); if (!key) continue; const groupKey = `${t.programId}|${key}`; if (!map.has(groupKey)) map.set(groupKey, []); map.get(groupKey).push(t); } return [...map.values()].filter(g => g.length > 1); };
const UmrahCore_duplicateTravelerIds = (programId = '') => new Set(UmrahCore_duplicateTravelerGroups(programId).flat().map(t => t.id));
const UmrahCore_Ops: any = {
    activeBookingStatuses: new Set(['hold', 'confirmed', 'partiallyPaid', 'fullyPaid', 'docsPending', 'ready', 'checkedIn', 'traveling']),
    resourceBookingStatuses: new Set(['hold', 'confirmed', 'partiallyPaid', 'fullyPaid', 'docsPending', 'ready', 'checkedIn', 'traveling', 'cancelRequested']),
    season(id) { return this.scoped('seasons').find(x => x.id === id); }, program(id) { return (UmrahCore_DB.data.programs || []).find(x => x.id === id && UmrahCore_Bridge.branchMatch(x)); }, booking(id) { return this.scoped('bookings').find(x => x.id === id); }, traveler(id) { return this.scoped('travelers').find(x => x.id === id); }, segment(id) { return this.scoped('programSegments').find(x => x.id === id); }, scoped(name) { return (UmrahCore_DB.data[name] || []).filter(x => UmrahCore_Bridge.branchMatch(x) && (name !== 'programs' || x.deleted !== true)); }, activeTravelers(programId) { const bookings = this.scoped('bookings'); return this.scoped('travelers').filter(t => t.programId === programId && t.active !== false && bookings.some(b => b.id === t.bookingId && this.activeBookingStatuses.has(b.status))); },
    addSeason(o) { UmrahCore_Bridge.require('umrah.seasons', 'add'); const name = UmrahCore_S(o.name).trim(), from = o.from || UmrahCore_today(), to = o.to || UmrahCore_today(), salesFrom = o.salesFrom || '', salesTo = o.salesTo || ''; if (!name)
        throw new Error('اسم الموسم مطلوب'); if (to < from)
        throw new Error('تاريخ نهاية الموسم يجب أن يكون بعد تاريخ البداية'); if (salesFrom && salesTo && salesTo < salesFrom)
        throw new Error('فترة البيع غير صحيحة: تاريخ نهاية البيع قبل بدايته'); const x = { id: UmrahCore_iid(), no: UmrahCore_DB.next('season'), name, hijri: o.hijri || '', from, to, salesFrom, salesTo, status: o.status || 'open', notes: o.notes || '', branchId: UmrahCore_Bridge.branchId(), createdAt: UmrahCore_now() }; UmrahCore_DB.data.seasons.unshift(x); UmrahCore_Bridge.audit('create', 'umrahSeason', x.id, x.no); return x; },
    updateSeason(id, o) { UmrahCore_Bridge.require('umrah.seasons', 'edit'); const x = this.season(id); if (!x)
        throw new Error('الموسم غير موجود'); const from = o.from || x.from, to = o.to || x.to, salesFrom = o.salesFrom || '', salesTo = o.salesTo || ''; if (to < from)
        throw new Error('تاريخ نهاية الموسم يجب أن يكون بعد تاريخ البداية'); if (salesFrom && salesTo && salesTo < salesFrom)
        throw new Error('فترة البيع غير صحيحة: تاريخ نهاية البيع قبل بدايته'); Object.assign(x, { name: UmrahCore_S(o.name).trim() || x.name, hijri: o.hijri || '', from, to, salesFrom, salesTo, status: o.status || x.status, notes: o.notes || '', updatedAt: UmrahCore_now() }); UmrahCore_Bridge.audit('update', 'umrahSeason', id, x.no); return x; },
    addHotelContract(o) { UmrahCore_Bridge.require('umrah.contracts', 'add'); if (!UmrahCore_S(o.hotelName).trim())
        throw new Error('اسم الفندق مطلوب'); if (!o.supplierId)
        throw new Error('اختر مورد الفندق'); const rooms = { single: { qty: UmrahCore_N(o.singleQty), rate: UmrahCore_N(o.singleRate) }, double: { qty: UmrahCore_N(o.doubleQty), rate: UmrahCore_N(o.doubleRate) }, triple: { qty: UmrahCore_N(o.tripleQty), rate: UmrahCore_N(o.tripleRate) }, quad: { qty: UmrahCore_N(o.quadQty), rate: UmrahCore_N(o.quadRate) }, quint: { qty: UmrahCore_N(o.quintQty), rate: UmrahCore_N(o.quintRate) } }; if (!Object.values(rooms).some(r => r.qty > 0 && r.rate > 0))
        throw new Error('أدخل مخزون غرفة واحدًا على الأقل مع سعر الليلة'); for (const [t, r] of Object.entries(rooms))
        if ((r.qty > 0) != (r.rate > 0))
            throw new Error(`أكمل عدد وسعر ${UmrahCore_roomLabel(t)} معًا`); const meta = UmrahCore_ContractCenter.normalizeMeta('hotel', o), x = { id: UmrahCore_iid(), branchId: UmrahCore_Bridge.branchId(), kind: 'hotel', ...meta, hotelName: UmrahCore_S(o.hotelName).trim(), shortName: UmrahCore_S(o.shortName || o.hotelName).trim(), city: o.city || 'Makkah', supplierId: o.supplierId, from: o.from || UmrahCore_today(), to: o.to || UmrahCore_today(), currency: o.currency || UmrahCore_DB.data.settings.defaultCurrency, board: o.board || '', cancellationPolicy: o.cancellationPolicy || '', rooms, active: meta.status !== 'cancelled', createdAt: UmrahCore_now() }; if (x.to <= x.from)
        throw new Error('فترة عقد الفندق غير صحيحة'); if (['confirmed', 'active'].includes(x.status))
        UmrahCore_ContractCenter.assertReady('hotel', x); UmrahCore_DB.data.hotelContracts.unshift(x); UmrahCore_Bridge.audit('create', 'hotelContract', x.id, `${x.contractNo} ${x.hotelName}`); return x; },
    updateHotelContract(id, o) { UmrahCore_Bridge.require('umrah.contracts', 'edit'); const x = UmrahCore_ContractCenter.get('hotel', id); if (!x)
        throw new Error('عقد الفندق غير موجود'); const rooms = { single: { qty: UmrahCore_N(o.singleQty), rate: UmrahCore_N(o.singleRate) }, double: { qty: UmrahCore_N(o.doubleQty), rate: UmrahCore_N(o.doubleRate) }, triple: { qty: UmrahCore_N(o.tripleQty), rate: UmrahCore_N(o.tripleRate) }, quad: { qty: UmrahCore_N(o.quadQty), rate: UmrahCore_N(o.quadRate) }, quint: { qty: UmrahCore_N(o.quintQty), rate: UmrahCore_N(o.quintRate) } }; for (const t of Object.keys(UmrahCore_roomCap)) {
        const reserved = UmrahCore_ContractCenter.hotelStats(id, t).reserved;
        if (UmrahCore_N(rooms[t].qty) < reserved)
            throw new Error(`لا يمكن خفض ${UmrahCore_roomLabel(t)} عن المحجوز (${reserved})`);
    } const reservations = UmrahCore_ContractCenter.activeReservations('hotel', id), meta = UmrahCore_ContractCenter.normalizeMeta('hotel', o, x), next = { ...x, ...meta, hotelName: UmrahCore_S(o.hotelName).trim() || x.hotelName, shortName: UmrahCore_S(o.shortName).trim() || UmrahCore_S(o.hotelName).trim() || x.shortName || x.hotelName, city: o.city || x.city, supplierId: o.supplierId || x.supplierId, from: o.from || x.from, to: o.to || x.to, currency: o.currency || x.currency, board: o.board || '', cancellationPolicy: o.cancellationPolicy || '', rooms, active: meta.status !== 'cancelled', updatedAt: UmrahCore_now() }; if (!next.supplierId || next.to <= next.from)
        throw new Error('بيانات عقد الفندق غير مكتملة'); if (reservations.length && (next.supplierId !== x.supplierId || next.currency !== x.currency))
        throw new Error('لا يمكن تغيير المورد أو العملة بعد تخصيص العقد لبرنامج'); if (reservations.length && (!['confirmed', 'active'].includes(next.status) || next.hotelName !== x.hotelName || next.shortName !== x.shortName || next.city !== x.city || next.board !== x.board || JSON.stringify(next.inventoryPeriods||[])!==JSON.stringify(x.inventoryPeriods||[]) || Object.keys(UmrahCore_roomCap).some(t => UmrahCore_N(next.rooms?.[t]?.rate) !== UmrahCore_N(x.rooms?.[t]?.rate))))
        throw new Error('لا يمكن تغيير حالة/فندق/مدينة/إعاشة/أسعار عقد مستخدم في برنامج؛ أنشئ تعديلًا تعاقديًا جديدًا حتى لا تختلف التكلفة عن المخزون وأمر الشراء'); for (const r of reservations)
        if ((r.from && next.from > r.from) || (r.to && next.to < r.to))
            throw new Error('لا يمكن تقليص فترة العقد بحيث تستبعد تخصيصًا قائمًا'); if (['confirmed', 'active'].includes(next.status))
        UmrahCore_ContractCenter.assertReady('hotel', next); Object.assign(x, next); UmrahCore_Bridge.audit('update', 'hotelContract', x.id, x.contractNo); return x; },
    addFlightBlock(o) { UmrahCore_Bridge.require('umrah.contracts', 'add'); if (!UmrahCore_S(o.airline).trim())
        throw new Error('شركة الطيران مطلوبة'); if (!o.supplierId)
        throw new Error('اختر مورد الطيران'); if (!o.outFlight || !o.returnFlight || !o.outDateTime || !o.returnDateTime)
        throw new Error('أكمل رحلتي الذهاب والعودة ومواعيدهما'); if (UmrahCore_N(o.seats) <= 0 || UmrahCore_N(o.costPerSeat) <= 0)
        throw new Error('عدد المقاعد وتكلفة المقعد مطلوبان'); const meta = UmrahCore_ContractCenter.normalizeMeta('flight', o), x = { id: UmrahCore_iid(), branchId: UmrahCore_Bridge.branchId(), kind: 'flight', ...meta, name: o.name || `${o.airline} ${o.outFlight || ''}`, supplierId: o.supplierId, airline: o.airline, outFlight: o.outFlight || '', outFrom: o.outFrom || '', outTo: o.outTo || '', outDateTime: o.outDateTime || '', returnFlight: o.returnFlight || '', returnFrom: o.returnFrom || '', returnTo: o.returnTo || '', returnDateTime: o.returnDateTime || '', seats: Math.max(1, UmrahCore_N(o.seats)), currency: o.currency || UmrahCore_DB.data.settings.defaultCurrency, costPerSeat: UmrahCore_N(o.costPerSeat), ticketDeadline: o.ticketDeadline || '', fareClass: o.fareClass || '', baggage: o.baggage || '', active: meta.status !== 'cancelled', createdAt: UmrahCore_now() }; if (x.returnDateTime <= x.outDateTime)
        throw new Error('موعد العودة يجب أن يكون بعد الذهاب'); if (['confirmed', 'active'].includes(x.status))
        UmrahCore_ContractCenter.assertReady('flight', x); UmrahCore_DB.data.flightBlocks.unshift(x); UmrahCore_Bridge.audit('create', 'flightBlock', x.id, `${x.contractNo} ${x.name}`); return x; },
    updateFlightBlock(id, o) { UmrahCore_Bridge.require('umrah.contracts', 'edit'); const x = UmrahCore_ContractCenter.get('flight', id); if (!x)
        throw new Error('بلوك الطيران غير موجود'); const reservations = UmrahCore_ContractCenter.activeReservations('flight', id), reserved = UmrahCore_ContractCenter.flightStats(id).reserved; if (UmrahCore_N(o.seats) < reserved)
        throw new Error(`لا يمكن خفض المقاعد عن المحجوز (${reserved})`); const meta = UmrahCore_ContractCenter.normalizeMeta('flight', o, x), next = { ...x, ...meta, name: o.name || x.name, airline: UmrahCore_S(o.airline).trim() || x.airline, supplierId: o.supplierId || x.supplierId, outFlight: o.outFlight || '', outFrom: o.outFrom || '', outTo: o.outTo || '', outDateTime: o.outDateTime || '', returnFlight: o.returnFlight || '', returnFrom: o.returnFrom || '', returnTo: o.returnTo || '', returnDateTime: o.returnDateTime || '', seats: Math.max(1, UmrahCore_N(o.seats)), currency: o.currency || x.currency, costPerSeat: UmrahCore_N(o.costPerSeat), ticketDeadline: o.ticketDeadline || '', fareClass: o.fareClass || '', baggage: o.baggage || '', active: meta.status !== 'cancelled', updatedAt: UmrahCore_now() }; if (!next.supplierId || !next.outFlight || !next.returnFlight || next.returnDateTime <= next.outDateTime || next.costPerSeat <= 0)
        throw new Error('بيانات بلوك الطيران غير مكتملة'); if (reservations.length && (next.supplierId !== x.supplierId || next.currency !== x.currency || next.outFlight !== x.outFlight || next.returnFlight !== x.returnFlight || next.outDateTime !== x.outDateTime || next.returnDateTime !== x.returnDateTime))
        throw new Error('لا يمكن تغيير المورد/العملة/الرحلات بعد تخصيص البلوك لبرنامج؛ أنشئ تعديلًا أو بلوكًا جديدًا'); if (reservations.length && (!['confirmed', 'active'].includes(next.status) || next.name !== x.name || next.airline !== x.airline || next.outFrom !== x.outFrom || next.outTo !== x.outTo || next.returnFrom !== x.returnFrom || next.returnTo !== x.returnTo || UmrahCore_N(next.costPerSeat) !== UmrahCore_N(x.costPerSeat) || next.fareClass !== x.fareClass || next.baggage !== x.baggage))
        throw new Error('لا يمكن تغيير بيانات التشغيل أو تكلفة بلوك مستخدم في برنامج؛ أنشئ بلوك/تعديل تعاقدي جديدًا للحفاظ على تطابق المخزون والتكلفة'); if (['confirmed', 'active'].includes(next.status))
        UmrahCore_ContractCenter.assertReady('flight', next); Object.assign(x, next); UmrahCore_Bridge.audit('update', 'flightBlock', x.id, x.contractNo); return x; },
    addTransportContract(o) { UmrahCore_Bridge.require('umrah.contracts', 'add'); if (!UmrahCore_S(o.provider).trim())
        throw new Error('شركة النقل مطلوبة'); if (!o.supplierId)
        throw new Error('اختر مورد النقل'); const vt = o.vehicleType || 'bus', cap = Math.max(1, UmrahCore_N(o.capacityPerVehicle) || UmrahCore_vehicleCaps[vt] || 50); if (UmrahCore_N(o.vehicles) <= 0 || UmrahCore_N(o.cost) <= 0)
        throw new Error('عدد المركبات والتكلفة مطلوبان'); const meta = UmrahCore_ContractCenter.normalizeMeta('transport', o), x = { id: UmrahCore_iid(), branchId: UmrahCore_Bridge.branchId(), kind: 'transport', ...meta, provider: UmrahCore_S(o.provider).trim(), supplierId: o.supplierId, route: o.route || '', vehicleType: vt, vehicles: Math.max(1, UmrahCore_N(o.vehicles)), capacityPerVehicle: cap, currency: o.currency || UmrahCore_DB.data.settings.defaultCurrency, cost: UmrahCore_N(o.cost), from: o.from || '', to: o.to || '', active: meta.status !== 'cancelled', createdAt: UmrahCore_now() }; if (x.from && x.to && x.to < x.from)
        throw new Error('فترة عقد النقل غير صحيحة'); if (['confirmed', 'active'].includes(x.status))
        UmrahCore_ContractCenter.assertReady('transport', x); UmrahCore_DB.data.transportContracts.unshift(x); UmrahCore_Bridge.audit('create', 'transportContract', x.id, `${x.contractNo} ${x.provider}`); return x; },
    updateTransportContract(id, o) { UmrahCore_Bridge.require('umrah.contracts', 'edit'); const x = UmrahCore_ContractCenter.get('transport', id); if (!x)
        throw new Error('عقد النقل غير موجود'); const reservations = UmrahCore_ContractCenter.activeReservations('transport', id), reserved = UmrahCore_ContractCenter.transportStats(id).reservedVehicles; if (UmrahCore_N(o.vehicles) < reserved)
        throw new Error(`لا يمكن خفض المركبات عن المحجوز (${reserved})`); const vt = o.vehicleType || x.vehicleType, cap = Math.max(1, UmrahCore_N(o.capacityPerVehicle) || UmrahCore_vehicleCaps[vt] || 50), meta = UmrahCore_ContractCenter.normalizeMeta('transport', o, x), next = { ...x, ...meta, provider: UmrahCore_S(o.provider).trim() || x.provider, supplierId: o.supplierId || x.supplierId, route: o.route || '', vehicleType: vt, vehicles: Math.max(1, UmrahCore_N(o.vehicles)), capacityPerVehicle: cap, currency: o.currency || x.currency, cost: UmrahCore_N(o.cost), from: o.from || '', to: o.to || '', active: meta.status !== 'cancelled', updatedAt: UmrahCore_now() }; if (!next.supplierId || next.cost <= 0)
        throw new Error('بيانات عقد النقل غير مكتملة'); if (next.from && next.to && next.to < next.from)
        throw new Error('فترة عقد النقل غير صحيحة'); if (reservations.length && (next.supplierId !== x.supplierId || next.currency !== x.currency || next.vehicleType !== x.vehicleType || next.capacityPerVehicle !== x.capacityPerVehicle))
        throw new Error('لا يمكن تغيير المورد/العملة/نوع المركبة بعد تخصيص العقد لبرنامج'); if (reservations.length && (!['confirmed', 'active'].includes(next.status) || next.provider !== x.provider || next.route !== x.route || UmrahCore_N(next.cost) !== UmrahCore_N(x.cost)))
        throw new Error('لا يمكن تغيير حالة/مسار/تكلفة عقد نقل مستخدم في برنامج؛ أنشئ تعديلًا تعاقديًا جديدًا للحفاظ على تطابق التشغيل والتكلفة'); for (const r of reservations)
        if ((r.from && next.from && next.from > r.from) || (r.to && next.to && next.to < UmrahCore_dateAdd(r.to, -1)))
            throw new Error('لا يمكن تقليص فترة عقد النقل بحيث تستبعد تخصيصًا قائمًا'); if (['confirmed', 'active'].includes(next.status))
        UmrahCore_ContractCenter.assertReady('transport', next); Object.assign(x, next); UmrahCore_Bridge.audit('update', 'transportContract', x.id, x.contractNo); return x; },
    addVisaContract(o) { UmrahCore_Bridge.require('umrah.contracts', 'add'); if (!UmrahCore_S(o.serviceName).trim())
        throw new Error('اسم خدمة التأشيرة مطلوب'); if (!o.supplierId)
        throw new Error('اختر مورد التأشيرات'); if (UmrahCore_N(o.quota) <= 0 || UmrahCore_N(o.costPerVisa) <= 0)
        throw new Error('حصة التأشيرات وتكلفة التأشيرة مطلوبتان'); const meta = UmrahCore_ContractCenter.normalizeMeta('visa', o), x = { id: UmrahCore_iid(), branchId: UmrahCore_Bridge.branchId(), kind: 'visa', ...meta, serviceName: UmrahCore_S(o.serviceName).trim(), programType: ['hajj', 'umrah'].includes(o.programType) ? o.programType : 'all', supplierId: o.supplierId, from: o.from || UmrahCore_today(), to: o.to || UmrahCore_monthsAdd(UmrahCore_today(), 3), quota: Math.max(1, UmrahCore_N(o.quota)), currency: o.currency || UmrahCore_DB.data.settings.defaultCurrency, costPerVisa: UmrahCore_N(o.costPerVisa), processingDays: Math.max(0, UmrahCore_N(o.processingDays)), active: meta.status !== 'cancelled', createdAt: UmrahCore_now() }; if (x.to < x.from)
        throw new Error('فترة اتفاقية التأشيرات غير صحيحة'); if (['confirmed', 'active'].includes(x.status))
        UmrahCore_ContractCenter.assertReady('visa', x); UmrahCore_DB.data.visaContracts.unshift(x); UmrahCore_Bridge.audit('create', 'visaContract', x.id, `${x.contractNo} ${x.serviceName}`); return x; },
    updateVisaContract(id, o) { UmrahCore_Bridge.require('umrah.contracts', 'edit'); const x = UmrahCore_ContractCenter.get('visa', id); if (!x)
        throw new Error('اتفاقية التأشيرات غير موجودة'); const reservations = UmrahCore_ContractCenter.activeReservations('visa', id), reserved = UmrahCore_ContractCenter.visaStats(id).reserved; if (UmrahCore_N(o.quota) < reserved)
        throw new Error(`لا يمكن خفض حصة التأشيرات عن المحجوز (${reserved})`); const meta = UmrahCore_ContractCenter.normalizeMeta('visa', o, x), next = { ...x, ...meta, serviceName: UmrahCore_S(o.serviceName).trim() || x.serviceName, programType: ['hajj', 'umrah'].includes(o.programType) ? o.programType : 'all', supplierId: o.supplierId || x.supplierId, from: o.from || x.from, to: o.to || x.to, quota: Math.max(1, UmrahCore_N(o.quota)), currency: o.currency || x.currency, costPerVisa: UmrahCore_N(o.costPerVisa), processingDays: Math.max(0, UmrahCore_N(o.processingDays)), active: meta.status !== 'cancelled', updatedAt: UmrahCore_now() }; if (!next.supplierId || next.to < next.from || next.costPerVisa <= 0)
        throw new Error('بيانات اتفاقية التأشيرات غير مكتملة'); if (reservations.length && (next.supplierId !== x.supplierId || next.currency !== x.currency || next.programType !== x.programType))
        throw new Error('لا يمكن تغيير المورد أو العملة أو نوع البرنامج بعد تخصيص الاتفاقية لبرنامج'); if (reservations.length && (!['confirmed', 'active'].includes(next.status) || next.serviceName !== x.serviceName || UmrahCore_N(next.costPerVisa) !== UmrahCore_N(x.costPerVisa)))
        throw new Error('لا يمكن تغيير حالة/خدمة/سعر اتفاقية مستخدمة في برنامج؛ أنشئ تعديلًا تعاقديًا جديدًا للحفاظ على التتبع'); for (const r of reservations) {
        const p = UmrahCore_Ops.program(r.programId);
        if ((p?.departureDate && next.from > p.departureDate) || (p?.returnDate && next.to < p.returnDate))
            throw new Error('لا يمكن تقليص فترة الاتفاقية بحيث تستبعد برنامجًا مخصصًا');
    } if (['confirmed', 'active'].includes(next.status))
        UmrahCore_ContractCenter.assertReady('visa', next); Object.assign(x, next); UmrahCore_Bridge.audit('update', 'visaContract', x.id, x.contractNo); return x; },
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
    },
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
    } return n; },
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
    },
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
    eligibleVisaTravelers(programId) { return this.activeTravelers(programId).filter(t => !UmrahCore_DB.data.visaItems.some(v => v.travelerId === t.id && v.active !== false && UmrahCore_DB.data.visaBatches.some(b => b.id === v.batchId && b.status !== 'cancelled'))); },
};
const UmrahCore_AdvancedPages = [
    ['seasons', '◫', 'المواسم', 'فترات التشغيل والبيع'], ['contracts', '▥', 'التعاقدات والمخزون', 'فنادق وطيران ونقل وتأشيرات'], ['programs', '▣', 'البرامج والمسار', 'التعديل الفني للبرنامج ومحطات الرحلة'], ['program-workspace', '✓', 'مساحة عمل البرنامج', 'ملخص البرنامج والخطوة التالية بعد الإنشاء'], ['costing', '◈', 'التكلفة والتسعير', 'الميزانية التقديرية ونقطة التعادل'], ['bookings', '▤', 'مركز الحجوزات', 'كل الحجوزات والحالات'], ['travelers', '👥', 'ملفات المسافرين', 'الجوازات والبيانات'], ['hajj-services', '◉', 'خدمات الحج', 'التصاريح / نسك والمخيمات والمشاعر'], ['hotels', '▦', 'الفنادق وتوزيع الغرف', 'التوزيع على الإقامات'], ['visas', '◇', 'التأشيرات', 'دفعات ومراحل التقديم'], ['flights', '✈', 'الطيران والتذاكر', 'PNR وتذاكر ومقاعد'], ['transport', '▰', 'النقل والباصات', 'التوزيع وكشوف التشغيل'], ['procurement', '¤', 'مشتريات الموردين', 'الأوامر والالتزامات والفواتير'], ['control', '◎', 'مركز الجاهزية', 'الموانع قبل السفر'], ['tripops', '⌁', 'تشغيل الرحلة', 'المسار والمهام اليومية'], ['incidents', '!', 'المشاكل والحوادث', 'سجل الحوادث والمشكلات'], ['documents', '▥', 'المستندات والتقارير', 'قوائم وربحية'], ['settings', '⚙', 'إعدادات الحج والعمرة', 'سياسات التشغيل']
];
