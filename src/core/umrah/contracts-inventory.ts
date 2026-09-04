const UmrahCore_Inventory = {
    kinds: ['hotel', 'flight', 'transport', 'visa', 'service'],
    serviceCategories: ['camp', 'permit', 'meal', 'visit', 'guide', 'rawda', 'insurance', 'custom'],
    serviceCategoryLabel(v) { return ({ camp: 'مخيم / مشاعر', permit: 'تصاريح / نسك', meal: 'وجبات / إعاشة', visit: 'زيارات', guide: 'مشرف / مرشد', rawda: 'الروضة', insurance: 'تأمين', custom: 'خدمة أخرى' })[v] || v || 'خدمة أخرى'; },
    serviceUnitLabel(v) { return ({ pax: 'فرد', group: 'مجموعة', day: 'يوم', service: 'خدمة' })[v] || v || 'وحدة'; },
    normalizeRules(o: Record<string, any> = {}, old: Record<string, any> = {}) {
        const releaseMode = ['manual', 'absolute', 'rolling'].includes(o.releaseMode) ? o.releaseMode : (old.releaseMode || (o.releaseDeadline || old.releaseDeadline ? 'absolute' : 'manual'));
        const stopSales = Array.isArray(o.stopSales) ? UmrahCore_deep(o.stopSales) : UmrahCore_deep(old.stopSales || []);
        const inventoryPeriods = Array.isArray(o.inventoryPeriods) ? UmrahCore_deep(o.inventoryPeriods) : UmrahCore_deep(old.inventoryPeriods || []);
        return {
            releaseMode,
            releaseDays: Math.max(0, UmrahCore_N(o.releaseDays ?? old.releaseDays)),
            releaseDeadline: o.releaseDeadline || old.releaseDeadline || '',
            stopSales,
            inventoryPeriods,
            amendmentOf: o.amendmentOf || old.amendmentOf || '',
            amendmentNo: Math.max(0, UmrahCore_N(o.amendmentNo ?? old.amendmentNo)),
            amendmentReason: UmrahCore_S(o.amendmentReason || old.amendmentReason).trim(),
        };
    },
    releaseCutoff(c, serviceDate = '') {
        if (!c) return '';
        const mode = c.releaseMode || (c.releaseDeadline ? 'absolute' : 'manual');
        if (mode === 'absolute') return c.releaseDeadline || '';
        if (mode === 'rolling' && serviceDate && UmrahCore_N(c.releaseDays) >= 0) return UmrahCore_dateAdd(serviceDate, -Math.max(0, UmrahCore_N(c.releaseDays)));
        return '';
    },
    released(c, serviceDate = '', asOf = UmrahCore_today()) {
        const cut = this.releaseCutoff(c, serviceDate);
        return !!(cut && asOf > cut);
    },
    stopSaleOverlap(c, from = '', to = '') {
        if (!c) return null;
        const a = from || '', b = to || from || '';
        return (c.stopSales || []).find(x => {
            if (!x || x.active === false || !x.from || !x.to) return false;
            if (!a && !b) return false;
            const end = b || a;
            return x.from <= end && x.to >= a;
        }) || null;
    },
    assertOpenForAllocation(c, from = '', to = '') {
        const ss = this.stopSaleOverlap(c, from, to);
        if (ss) throw new Error(`المخزون موقوف للبيع خلال ${ss.from} → ${ss.to}${ss.reason ? ` — ${ss.reason}` : ''}`);
        const dates = [];
        if (from && to && to > from) for (let d = from; d < to; d = UmrahCore_dateAdd(d, 1)) dates.push(d);
        else if (from) dates.push(from);
        for (const d of dates) if (this.released(c, d)) throw new Error(`انتهى موعد الاحتفاظ بالمخزون غير المخصص لتاريخ ${d}`);
        return true;
    },
    hotelTermsAt(c, type, date) {
        const base = c?.rooms?.[type] || { qty: 0, rate: 0 };
        let out = { qty: UmrahCore_N(base.qty), rate: UmrahCore_N(base.rate), source: 'base' };
        const rows = (c?.inventoryPeriods || []).filter(x => x && x.active !== false && x.roomType === type && x.from && x.to && x.from <= date && x.to > date);
        if (rows.length) {
            const x = rows[rows.length - 1];
            out = { qty: Math.max(0, UmrahCore_N(x.qty)), rate: Math.max(0, UmrahCore_N(x.rate)), source: x.id || 'period' };
        }
        return out;
    },
    directReservations(kind, id, excludeReservationId = '', from = '', to = '') {
        if (typeof TourismServiceInventory === 'undefined') return [];
        return TourismServiceInventory.asReservations(kind, id, excludeReservationId, from, to);
    },
    hotelReservedOn(id, type, date, excludeReservationId = '') {
        let n = 0;
        for (const r of (UmrahCore_DB.data.contractReservations || [])) {
            if (!UmrahCore_Bridge.branchMatch(r) || r.kind !== 'hotel' || r.contractId !== id || r.active === false || r.id === excludeReservationId) continue;
            const p = UmrahCore_Ops.program(r.programId); if (!p || p.status === 'cancelled') continue;
            if (r.from && r.to && !(r.from <= date && r.to > date)) continue;
            n += UmrahCore_N(r.allocation?.rooms?.[type]);
        }
        for (const r of this.directReservations('hotel', id, excludeReservationId, date, UmrahCore_dateAdd(date, 1)))
            n += UmrahCore_N(r.allocation?.rooms?.[type]);
        return n;
    },
    hotelUsedOn(id, type, date) {
        let n = 0;
        const segments = (UmrahCore_DB.data.programSegments || []).filter(s => s.type === 'hotel' && s.contractId === id && s.active !== false && s.start <= date && UmrahCore_dateAdd(s.end || s.start, 1) > date);
        const segIds = new Set(segments.map(s => s.id));
        if (!segIds.size) return 0;
        for (const hr of (UmrahCore_DB.data.hotelRooms || [])) {
            if (!segIds.has(hr.segmentId) || hr.roomType !== type) continue;
            const b = UmrahCore_Ops.booking(hr.bookingId);
            if (b && UmrahCore_Ops.resourceBookingStatuses.has(b.status)) n++;
        }
        return n;
    },
    hotelRange(id, type, from = '', to = '', excludeReservationId = '') {
        const c = UmrahCore_ContractCenter?.get?.('hotel', id) || (UmrahCore_DB.data.hotelContracts || []).find(x => x.id === id);
        if (!c) return { total: 0, minTotal: 0, maxTotal: 0, reserved: 0, used: 0, available: 0, released: 0, roomNights: 0 };
        const start = from || c.from || UmrahCore_today(), end = to || c.to || UmrahCore_dateAdd(start, 1);
        let minTotal = Infinity, maxTotal = 0, peakReserved = 0, peakUsed = 0, minAvailable = Infinity, released = 0, roomNights = 0, days = 0;
        for (let d = start; d < end; d = UmrahCore_dateAdd(d, 1)) {
            days++;
            const terms = this.hotelTermsAt(c, type, d), total = UmrahCore_N(terms.qty), reserved = this.hotelReservedOn(id, type, d, excludeReservationId), used = this.hotelUsedOn(id, type, d), blocked = !!this.stopSaleOverlap(c, d, d) || this.released(c, d), available = blocked ? 0 : Math.max(0, total - reserved);
            minTotal = Math.min(minTotal, total); maxTotal = Math.max(maxTotal, total); peakReserved = Math.max(peakReserved, reserved); peakUsed = Math.max(peakUsed, used); minAvailable = Math.min(minAvailable, available); roomNights += total; if (blocked) released += Math.max(0, total - reserved);
        }
        if (!days) minTotal = maxTotal = peakReserved = peakUsed = minAvailable = 0;
        return { total: minTotal === Infinity ? 0 : minTotal, minTotal: minTotal === Infinity ? 0 : minTotal, maxTotal, reserved: peakReserved, used: peakUsed, available: minAvailable === Infinity ? 0 : minAvailable, released, roomNights, days };
    },
    hotelContractTotal(c) {
        if (!c?.from || !c?.to || c.to <= c.from) return 0;
        let total = 0;
        for (let d = c.from; d < c.to; d = UmrahCore_dateAdd(d, 1)) for (const t of Object.keys(UmrahCore_roomCap)) {
            const x = this.hotelTermsAt(c, t, d); total += UmrahCore_N(x.qty) * UmrahCore_N(x.rate);
        }
        return total;
    },
    hotelAllocationCost(c, rooms, from, to) {
        let total = 0;
        for (let d = from; d < to; d = UmrahCore_dateAdd(d, 1)) for (const [t, q] of Object.entries(rooms || {})) total += UmrahCore_N(q) * UmrahCore_N(this.hotelTermsAt(c, t, d).rate);
        return total;
    },
    flightSold(id) {
        const reservations=(UmrahCore_DB.data.contractReservations||[]).filter(r=>r.kind==='flight'&&r.contractId===id&&r.active!==false&&UmrahCore_Ops.program(r.programId)?.status!=='cancelled');
        let total=0; for(const programId of [...new Set(reservations.map(r=>r.programId))]) { const bookings=(UmrahCore_DB.data.bookings||[]).filter(b=>b.programId===programId&&UmrahCore_Ops.resourceBookingStatuses.has(b.status)), booked=bookings.reduce((z,b)=>z+Math.max(0,UmrahCore_N(b.persons)-UmrahCore_N(b.infants)),0), segIds=new Set(reservations.filter(r=>r.programId===programId).flatMap(r=>[...(r.segmentIds||[]),r.segmentId].filter(Boolean))), ticketed=new Set((UmrahCore_DB.data.tickets||[]).filter(t=>segIds.has(t.segmentId)&&t.active!==false&&t.status!=='cancelled').map(t=>t.travelerId).filter(Boolean)).size; total+=Math.max(booked,ticketed); }
        return total;
    },
    transportSold(id, from = '', to = '') {
        const rows=(UmrahCore_DB.data.contractReservations||[]).filter(r=>r.kind==='transport'&&r.contractId===id&&r.active!==false&&UmrahCore_Ops.program(r.programId)?.status!=='cancelled'); if(!rows.length)return 0;
        const start=from||rows.map(r=>r.from).filter(Boolean).sort()[0]||UmrahCore_today(), end=to||rows.map(r=>r.to).filter(Boolean).sort().slice(-1)[0]||UmrahCore_dateAdd(start,1); let peak=0;
        for(let d=start;d<end;d=UmrahCore_dateAdd(d,1)){const programIds=[...new Set(rows.filter(r=>(!r.from||r.from<=d)&&(!r.to||r.to>d)).map(r=>r.programId))], used=(UmrahCore_DB.data.bookings||[]).filter(b=>programIds.includes(b.programId)&&UmrahCore_Ops.resourceBookingStatuses.has(b.status)).reduce((z,b)=>z+UmrahCore_N(b.persons),0);peak=Math.max(peak,used);} return peak;
    },
    visaUsed(id) {
        const programIds = [...new Set((UmrahCore_DB.data.programSegments || []).filter(s => s.type === 'visa' && s.contractId === id && s.active !== false).map(s => s.programId))];
        const rows = (UmrahCore_DB.data.travelers || []).filter(t => programIds.includes(t.programId) && t.active !== false);
        return { issued: rows.filter(t => t.visaStatus === 'issued').length, inProcess: rows.filter(t => ['documents_received', 'submitted', 'processing'].includes(t.visaStatus)).length };
    },
    serviceUsed(id) {
        const c = UmrahCore_ContractCenter?.get?.('service', id) || (UmrahCore_DB.data.serviceContracts || []).find(x => x.id === id), reservations = (UmrahCore_DB.data.contractReservations || []).filter(r => r.kind === 'service' && r.contractId === id && r.active !== false);
        if(c?.unit && c.unit !== 'pax') return reservations.filter(r=>['traveling','returned','closed'].includes(UmrahCore_Ops.program(r.programId)?.status)).reduce((z,r)=>z+UmrahCore_N(r.allocation?.units),0);
        const programIds = [...new Set(reservations.map(r => r.programId))], travelers = (UmrahCore_DB.data.travelers || []).filter(t => programIds.includes(t.programId) && t.active !== false && (UmrahCore_DB.data.bookings || []).some(b => b.id === t.bookingId && UmrahCore_Ops.resourceBookingStatuses.has(b.status)));
        if (c?.serviceCategory === 'permit') return travelers.filter(t => t.hajjPermitStatus === 'issued').length;
        if (c?.serviceCategory === 'camp') return travelers.filter(t => UmrahCore_S(t.campAssignment).trim()).length;
        return (UmrahCore_DB.data.bookings || []).filter(b => programIds.includes(b.programId) && UmrahCore_Ops.resourceBookingStatuses.has(b.status)).reduce((z, b) => z + UmrahCore_N(b.persons), 0);
    },
    genericReserved(kind, id, field) {
        const program = (UmrahCore_DB.data.contractReservations || []).filter(r => r.kind === kind && r.contractId === id && r.active !== false && UmrahCore_Bridge.branchMatch(r) && UmrahCore_Ops.program(r.programId)?.status !== 'cancelled').reduce((z, r) => z + UmrahCore_N(r.allocation?.[field]), 0);
        const direct = this.directReservations(kind, id).reduce((z, r) => z + UmrahCore_N(r.allocation?.[field]), 0);
        return program + direct;
    },
    serviceStats(id, excludeReservationId = '', from = '', to = '') {
        const c = UmrahCore_ContractCenter?.get?.('service', id) || (UmrahCore_DB.data.serviceContracts || []).find(x => x.id === id),
            total = UmrahCore_N(c?.quota),
            programReserved = (UmrahCore_DB.data.contractReservations || []).filter(r => r.kind === 'service' && r.contractId === id && r.active !== false && r.id !== excludeReservationId).reduce((z, r) => z + UmrahCore_N(r.allocation?.units), 0),
            directReserved = this.directReservations('service', id, excludeReservationId, from, to).reduce((z, r) => z + UmrahCore_N(r.allocation?.units), 0),
            reserved = programReserved + directReserved, used = this.serviceUsed(id), blocked=!!(c&&from&&(this.stopSaleOverlap(c,from,to||from)||this.released(c,from))), available = blocked ? 0 : Math.max(0, total - reserved);
        return { total, reserved, used, available, released: blocked ? Math.max(0, total - reserved) : 0 };
    },
    stopSaleRowsHtml(c: Record<string, any> = {}) {
        const rows = (c.stopSales || []).length ? c.stopSales : [{ id: '', from: '', to: '', reason: '' }];
        return `<div class="contract-stop-rows">${rows.map(x => `<div class="contract-stop-row form-grid four"><input type="hidden" name="stopId" value="${UmrahCore_esc(x.id || '')}"><div class="field"><label>من</label><input type="date" name="stopFrom" value="${x.from || ''}"></div><div class="field"><label>إلى</label><input type="date" name="stopTo" value="${x.to || ''}"></div><div class="field"><label>السبب</label><input name="stopReason" value="${UmrahCore_esc(x.reason || '')}" placeholder="نفاد/طلب المورد/إغلاق بيع"></div><div class="field"><label>&nbsp;</label><button type="button" class="btn small danger" data-remove-closest=".contract-stop-row">حذف</button></div></div>`).join('')}</div>`;
    },
    addStopSaleRow() { const box=document.querySelector('#modalForm .contract-stop-rows'); if(!box)return; const d=document.createElement('div'); d.className='contract-stop-row form-grid four'; d.innerHTML=`<input type="hidden" name="stopId"><div class="field"><label>من</label><input type="date" name="stopFrom"></div><div class="field"><label>إلى</label><input type="date" name="stopTo"></div><div class="field"><label>السبب</label><input name="stopReason"></div><div class="field"><label>&nbsp;</label><button type="button" class="btn small danger" data-remove-closest=".contract-stop-row">حذف</button></div>`; box.appendChild(d); },
    hotelInventoryRowsHtml(c: Record<string, any> = {}) {
        const rows=(c.inventoryPeriods||[]).length?c.inventoryPeriods:[{id:'',from:'',to:'',roomType:'double',qty:'',rate:''}];
        return `<div class="hotel-inventory-periods">${rows.map(x=>`<div class="hotel-inventory-period form-grid six"><input type="hidden" name="invId" value="${UmrahCore_esc(x.id||'')}"><div class="field"><label>من</label><input type="date" name="invFrom" value="${x.from||''}"></div><div class="field"><label>إلى (غير شامل)</label><input type="date" name="invTo" value="${x.to||''}"></div><div class="field"><label>نوع الغرفة</label><select name="invRoomType">${Object.keys(UmrahCore_roomCap).map(t=>`<option value="${t}" ${x.roomType===t?'selected':''}>${UmrahCore_roomLabel(t)}</option>`).join('')}</select></div><div class="field"><label>عدد الغرف</label><input type="number" min="0" name="invQty" value="${UmrahCore_N(x.qty)||''}"></div><div class="field"><label>سعر الليلة</label><input type="number" min="0" step="0.01" name="invRate" value="${UmrahCore_N(x.rate)||''}"></div><div class="field"><label>&nbsp;</label><button type="button" class="btn small danger" data-remove-closest=".hotel-inventory-period">حذف</button></div></div>`).join('')}</div>`;
    },
    addHotelInventoryRow(){const box=document.querySelector('#modalForm .hotel-inventory-periods');if(!box)return;const d=document.createElement('div');d.className='hotel-inventory-period form-grid six';d.innerHTML=`<input type="hidden" name="invId"><div class="field"><label>من</label><input type="date" name="invFrom"></div><div class="field"><label>إلى (غير شامل)</label><input type="date" name="invTo"></div><div class="field"><label>نوع الغرفة</label><select name="invRoomType">${Object.keys(UmrahCore_roomCap).map(t=>`<option value="${t}">${UmrahCore_roomLabel(t)}</option>`).join('')}</select></div><div class="field"><label>عدد الغرف</label><input type="number" min="0" name="invQty"></div><div class="field"><label>سعر الليلة</label><input type="number" min="0" step="0.01" name="invRate"></div><div class="field"><label>&nbsp;</label><button type="button" class="btn small danger" data-remove-closest=".hotel-inventory-period">حذف</button></div>`;box.appendChild(d);},
    allocationFloor(kind, r) {
        const p = UmrahCore_Ops.program(r.programId), activeBookings = (UmrahCore_DB.data.bookings || []).filter(b => b.programId === r.programId && UmrahCore_Ops.resourceBookingStatuses.has(b.status));
        if (kind === 'hotel') {
            const out = Object.fromEntries(Object.keys(UmrahCore_roomCap).map(t => [t, 0]));
            const segIds = new Set([...(r.segmentIds || []), r.segmentId].filter(Boolean));
            for (const hr of (UmrahCore_DB.data.hotelRooms || [])) if (segIds.has(hr.segmentId) && activeBookings.some(b => b.id === hr.bookingId)) out[hr.roomType] = UmrahCore_N(out[hr.roomType]) + 1;
            return { rooms: out };
        }
        const pax = activeBookings.reduce((z, b) => z + (kind === 'flight' ? Math.max(0, UmrahCore_N(b.persons) - UmrahCore_N(b.infants)) : UmrahCore_N(b.persons)), 0);
        if (kind === 'flight') return { seats: pax };
        if (kind === 'visa') {
            const ts = (UmrahCore_DB.data.travelers || []).filter(t => t.programId === r.programId && t.active !== false && ['documents_received', 'submitted', 'processing', 'issued'].includes(t.visaStatus));
            return { visas: Math.max(pax, ts.length) };
        }
        if (kind === 'transport') return { capacity: pax, vehicles: Math.ceil(pax / Math.max(1, UmrahCore_N(UmrahCore_ContractCenter.get('transport', r.contractId)?.capacityPerVehicle))) };
        return { units: p ? Math.min(UmrahCore_N(r.allocation?.units), pax) : 0 };
    },
    summary(kind, c) {
        if (kind === 'hotel') {
            let totalBeds = 0, allocatedBeds = 0, usedBeds = 0, availableBeds = 0;
            for (const t of Object.keys(UmrahCore_roomCap)) { const s = this.hotelRange(c.id, t, c.from, c.to); totalBeds += s.total * UmrahCore_roomCap[t]; allocatedBeds += s.reserved * UmrahCore_roomCap[t]; usedBeds += s.used * UmrahCore_roomCap[t]; availableBeds += s.available * UmrahCore_roomCap[t]; }
            return { total: totalBeds, allocated: allocatedBeds, used: usedBeds, available: availableBeds, unit: 'سرير' };
        }
        if (kind === 'flight') { const s=UmrahCore_ContractCenter.flightStats(c.id); return { total:s.total, allocated:s.reserved, used:s.used, available:s.available, unit:'مقعد' }; }
        if (kind === 'visa') { const s=UmrahCore_ContractCenter.visaStats(c.id); return { total:s.total, allocated:s.reserved, used:s.used, inProcess:s.inProcess, available:s.available, unit:'تأشيرة' }; }
        if (kind === 'transport') { const s=UmrahCore_ContractCenter.transportStats(c.id,'',c.from||'',c.to?UmrahCore_dateAdd(c.to,1):''); return { total:s.totalCapacity, allocated:s.reservedCapacity, used:s.used, available:s.availableCapacity, unit:'راكب' }; }
        const s = this.serviceStats(c.id); return { total: s.total, allocated: s.reserved, used: s.used, available: s.available, unit: this.serviceUnitLabel(c.unit) };
    }
};
