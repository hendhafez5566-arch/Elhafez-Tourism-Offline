// Central bridge: tourism service sales consume contracted stock before external purchasing.
const TourismServiceInventory = {
    kind(type) {
        const t = S(type).trim();
        if (t === 'فندق') return 'hotel';
        if (t === 'طيران') return 'flight';
        if (t === 'نقل') return 'transport';
        if (t === 'تأشيرة') return 'visa';
        if (t === 'رحلة') return 'service';
        return '';
    },
    rows() { DB.data.serviceInventoryAllocations = Array.isArray(DB.data.serviceInventoryAllocations) ? DB.data.serviceInventoryAllocations : []; return DB.data.serviceInventoryAllocations; },
    active(kind, contractId, excludeServiceId = '', from = '', to = '') {
        return this.rows().filter(r => {
            if (r.active === false || r.kind !== kind || r.contractId !== contractId || (excludeServiceId && r.serviceId === excludeServiceId)) return false;
            const s = byId(DB.data.services, r.serviceId);
            if (!s || s.status === 'cancelled') return false;
            if (from && to && r.from && r.to) return r.from < to && r.to > from;
            return true;
        });
    },
    asReservations(kind, contractId, excludeReservationId = '', from = '', to = '') {
        return this.active(kind, contractId, '', from, to).filter(r => r.id !== excludeReservationId).map(r => ({
            id: r.id, kind, contractId, programId: '', segmentId: '', from: r.from, to: r.to,
            allocation: deep(r.allocation || {}), active: r.active !== false, sourceType: 'tourism-service', serviceId: r.serviceId
        }));
    },
    roomType(v) {
        const x = S(v).toLowerCase();
        if (/(single|مفرد|فردي)/.test(x)) return 'single';
        if (/(triple|ثلاث)/.test(x)) return 'triple';
        if (/(quad|رباع)/.test(x)) return 'quad';
        if (/(quint|خماس)/.test(x)) return 'quint';
        return 'double';
    },
    dateRange(kind, o) {
        if (kind === 'hotel') return { from: o.checkIn || o.serviceDate || o.date || today(), to: o.checkOut || (o.checkIn ? UmrahCore_dateAdd(o.checkIn, 1) : UmrahCore_dateAdd(o.serviceDate || o.date || today(), 1)) };
        const d = o.serviceDate || o.date || today();
        return { from: d, to: UmrahCore_dateAdd(d, 1) };
    },
    quantity(kind, o, c = null) {
        const pax = Math.max(1, N(o.passengers) || 1);
        if (kind === 'hotel') return { rooms: Math.max(1, N(o.rooms) || 1), roomType: this.roomType(o.roomType) };
        if (kind === 'flight') return { seats: pax };
        if (kind === 'visa') return { visas: pax };
        if (kind === 'transport') {
            const cap = Math.max(1, N(c?.capacityPerVehicle) || UmrahCore_vehicleCaps?.[c?.vehicleType] || 1);
            return { vehicles: Math.ceil(pax / cap), capacity: pax };
        }
        return { units: pax };
    },
    contractName(kind, c) {
        return kind === 'hotel' ? c.hotelName : kind === 'flight' ? `${c.airline || ''} ${c.outFlight || ''}`.trim() :
            kind === 'transport' ? c.provider : kind === 'visa' ? c.serviceName : c.serviceName;
    },
    availableText(kind, c) {
        try {
            if (kind === 'hotel') {
                const totals = Object.keys(UmrahCore_roomCap).map(t => `${UmrahCore_roomLabel(t)} ${UmrahCore_ContractCenter.hotelStats(c.id, t, '', c.from, c.to).available}`).filter(Boolean);
                return totals.join(' • ');
            }
            if (kind === 'flight') return `${UmrahCore_ContractCenter.flightStats(c.id).available} مقعد`;
            if (kind === 'visa') return `${UmrahCore_ContractCenter.visaStats(c.id).available} تأشيرة`;
            if (kind === 'transport') return `${UmrahCore_ContractCenter.transportStats(c.id, '', c.from || '', c.to ? UmrahCore_dateAdd(c.to, 1) : '').availableVehicles} مركبة`;
            return `${UmrahCore_ContractCenter.serviceStats(c.id).available} ${UmrahCore_Inventory.serviceUnitLabel(c.unit)}`;
        } catch (_) { return ''; }
    },
    optionsHtml(type, selected = '') {
        const kind = this.kind(type);
        if (!kind || typeof UmrahCore_ContractCenter === 'undefined' || typeof UmrahCore_DB === 'undefined' || !UmrahCore_DB?.data) return '<option value="">لا يوجد مخزون تعاقدي لهذا النوع</option>';
        const rows = UmrahCore_ContractCenter.arr(kind).filter(c => UmrahCore_ContractCenter.usable(kind, c));
        return `<option value="">اختيار تلقائي من الأنسب المتاح</option>${rows.map(c => `<option value="${esc(c.id)}" ${c.id === selected ? 'selected' : ''}>${esc(c.contractNo || '')} — ${esc(this.contractName(kind, c))} — ${esc(this.availableText(kind, c))}</option>`).join('')}`;
    },
    compatible(kind, c, o) {
        const { from, to } = this.dateRange(kind, o);
        if (!UmrahCore_ContractCenter.usable(kind, c)) return false;
        if (kind === 'hotel') {
            if ((c.from && c.from > from) || (c.to && c.to < to)) return false;
            const wanted = S(o.hotelName).trim().toLowerCase();
            return !wanted || S(c.hotelName).toLowerCase().includes(wanted) || wanted.includes(S(c.hotelName).toLowerCase());
        }
        if (kind === 'flight') {
            const d = from, no = S(o.flightNo).trim().toLowerCase(), airline = S(o.airline).trim().toLowerCase();
            const dates = [(c.outDateTime || '').slice(0,10), (c.returnDateTime || '').slice(0,10)];
            if (d && !dates.includes(d)) return false;
            if (no && ![c.outFlight,c.returnFlight].map(x=>S(x).toLowerCase()).includes(no)) return false;
            if (airline && !S(c.airline).toLowerCase().includes(airline)) return false;
            return true;
        }
        if ((c.from && c.from > from) || (c.to && c.to < from)) return false;
        return true;
    },
    availableUnits(kind, c, o) {
        const { from, to } = this.dateRange(kind, o), q = this.quantity(kind, o, c);
        if (kind === 'hotel') return Math.max(0, N(UmrahCore_ContractCenter.hotelStats(c.id, q.roomType, '', from, to).available));
        if (kind === 'flight') return Math.max(0, N(UmrahCore_ContractCenter.flightStats(c.id).available));
        if (kind === 'visa') return Math.max(0, N(UmrahCore_ContractCenter.visaStats(c.id, '', from, to).available));
        if (kind === 'transport') return Math.max(0, N(UmrahCore_ContractCenter.transportStats(c.id, '', from, to).availableVehicles));
        return Math.max(0, N(UmrahCore_ContractCenter.serviceStats(c.id, '', from, to).available));
    },
    requestedUnits(kind, q) {
        return kind === 'hotel' ? q.rooms : kind === 'flight' ? q.seats : kind === 'visa' ? q.visas : kind === 'transport' ? q.vehicles : q.units;
    },
    partialQuantity(kind, base, units, c) {
        if (kind === 'hotel') return { rooms: units, roomType: base.roomType };
        if (kind === 'flight') return { seats: units };
        if (kind === 'visa') return { visas: units };
        if (kind === 'transport') {
            const cap = Math.max(1, N(c?.capacityPerVehicle) || UmrahCore_vehicleCaps?.[c?.vehicleType] || 1);
            return { vehicles: units, capacity: Math.min(N(base.capacity)||units*cap, units*cap) };
        }
        return { units };
    },
    allocationFor(kind, q) {
        return kind === 'hotel' ? { rooms: { [q.roomType]: q.rooms } } :
            kind === 'flight' ? { seats: q.seats } : kind === 'visa' ? { visas: q.visas } :
            kind === 'transport' ? { vehicles: q.vehicles, capacity: q.capacity } : { units: q.units };
    },
    matches(kind, c, o) {
        if (!this.compatible(kind, c, o)) return false;
        const q=this.quantity(kind,o,c);
        return this.availableUnits(kind,c,o) >= this.requestedUnits(kind,q);
    },
    cost(kind, c, q, from, to) {
        if (kind === 'hotel') return UmrahCore_Inventory.hotelAllocationCost(c, { [q.roomType]: q.rooms }, from, to);
        if (kind === 'flight') return q.seats * N(c.costPerSeat);
        if (kind === 'visa') return q.visas * N(c.costPerVisa);
        if (kind === 'transport') return (N(c.cost) / Math.max(1, N(c.vehicles))) * q.vehicles;
        return q.units * N(c.costPerUnit);
    },
    resolve(o, excludeServiceId = '') {
        const mode = o.inventoryMode || 'auto', kind = this.kind(o.type);
        if (mode === 'external' || !kind || typeof UmrahCore_ContractCenter === 'undefined' || typeof UmrahCore_DB === 'undefined' || !UmrahCore_DB?.data) return null;
        const range=this.dateRange(kind,o), probe=this.quantity(kind,o,null), requested=this.requestedUnits(kind,probe);
        let selected=o.inventoryContractId ? UmrahCore_ContractCenter.get(kind,o.inventoryContractId) : null;
        if (o.inventoryContractId && !selected) throw new Error('التعاقد/المخزون المختار غير موجود');
        if (selected && !this.compatible(kind,selected,o)) throw new Error('التعاقد المختار لا يطابق تفاصيل أو تاريخ الخدمة');
        let candidates=UmrahCore_ContractCenter.arr(kind).filter(c=>this.compatible(kind,c,o));
        if(selected)candidates=[selected,...candidates.filter(c=>c.id!==selected.id)];
        candidates=candidates.sort((a,b)=>{
            if(selected){if(a.id===selected.id)return-1;if(b.id===selected.id)return 1}
            const qa=this.partialQuantity(kind,this.quantity(kind,o,a),1,a),qb=this.partialQuantity(kind,this.quantity(kind,o,b),1,b);
            return this.cost(kind,a,qa,range.from,range.to)-this.cost(kind,b,qb,range.from,range.to);
        });
        let remaining=requested;const parts=[];
        for(const c of candidates){if(remaining<=0)break;const available=this.availableUnits(kind,c,o);if(available<=0)continue;const take=Math.min(remaining,available),baseQ=this.quantity(kind,o,c),q=this.partialQuantity(kind,baseQ,take,c);UmrahCore_Inventory.assertOpenForAllocation(c,range.from,kind==='hotel'?range.to:range.from);parts.push({kind,contractId:c.id,contractNo:c.contractNo||'',contractName:this.contractName(kind,c),supplierId:c.supplierId||'',currency:c.currency||DB.data.settings.baseCurrency,from:range.from,to:range.to,allocation:this.allocationFor(kind,q),units:take,cost:this.cost(kind,c,q,range.from,range.to)});remaining-=take}
        if(mode==='inventory'&&remaining>0)throw new Error(`مخزون الشركة لا يغطي الكمية المطلوبة بالكامل؛ المتاح ${requested-remaining} من ${requested}`);
        if(!parts.length)return null;
        const base=DB.data.settings.baseCurrency,inventoryCostBase=parts.reduce((z,x)=>z+Currency.toBase(N(x.cost),x.currency,range.from),0),currencies=[...new Set(parts.map(x=>x.currency))];return{kind,parts,requestedUnits:requested,inventoryUnits:requested-remaining,externalUnits:remaining,inventoryCost:parts.reduce((z,x)=>z+N(x.cost),0),inventoryCostBase,inventoryCurrencies:currencies,fullyFromInventory:remaining<=0};
    },
    bind(s, resolved) {
        this.release(s.id, 'إعادة ربط قبل الحفظ');
        if (!resolved?.parts?.length) { s.inventorySource = null; s.inventorySources=[]; return []; }
        const rows=[];
        for(const part of resolved.parts){const r={id:iid(),serviceId:s.id,kind:part.kind,contractId:part.contractId,contractNo:part.contractNo,from:part.from,to:part.to,allocation:deep(part.allocation),cost:part.cost,currency:part.currency,active:true,createdAt:now()};this.rows().push(r);rows.push(r)}
        s.inventorySources=resolved.parts.map((part,i)=>({allocationId:rows[i].id,kind:part.kind,contractId:part.contractId,contractNo:part.contractNo,contractName:part.contractName,cost:part.cost,currency:part.currency,units:part.units}));
        s.inventorySource=s.inventorySources[0]||null;
        s.inventoryMode=resolved.externalUnits>0?'mixed':'inventory';
        return rows;
    },
    release(serviceId, reason = '') {
        for (const r of this.rows().filter(x => x.serviceId === serviceId && x.active !== false)) { r.active = false; r.releasedAt = now(); r.releaseReason = reason; }
    },
    prepare(o, excludeServiceId = '') {
        const originalExternalCost=N(o.cost), externalCurrency=o.costCurrency||DB.data.settings.baseCurrency, resolved = this.resolve(o, excludeServiceId);
        if (resolved) {
            const externalCost=resolved.externalUnits>0?originalExternalCost:0,externalBase=externalCost?Currency.toBase(externalCost,externalCurrency,o.date||today()):0,base=DB.data.settings.baseCurrency,multiCurrency=resolved.inventoryCurrencies.length>1||resolved.externalUnits>0;
            o.inventoryCost=multiCurrency?resolved.inventoryCostBase:resolved.inventoryCost;
            o.inventoryCostBase=resolved.inventoryCostBase;
            o.externalCost=externalCost;
            o.externalCostCurrency=externalCurrency;
            o.externalCostBase=externalBase;
            o.cost=multiCurrency?resolved.inventoryCostBase+externalBase:resolved.inventoryCost;
            o.costCurrency=multiCurrency?base:(resolved.parts[0]?.currency||externalCurrency);
            o.inventoryContractId=resolved.parts[0]?.contractId||'';
            o.inventoryMode=resolved.externalUnits>0?'mixed':'inventory';
            if(resolved.externalUnits<=0)o.supplierId=resolved.parts[0]?.supplierId||o.supplierId||'';
        }else{
            o.inventoryCost=0;o.inventoryCostBase=0;o.externalCost=originalExternalCost;o.externalCostCurrency=externalCurrency;o.externalCostBase=Currency.toBase(originalExternalCost,externalCurrency,o.date||today());o.inventoryMode='external';
        }
        return resolved;
    }
};
