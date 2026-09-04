const UmrahCore_RootMap = {
    meta: 'umrahMeta', settings: 'umrahSettings', seasons: 'umrahSeasons', hotelContracts: 'umrahHotelContracts', flightBlocks: 'umrahFlightBlocks', transportContracts: 'umrahTransportContracts', visaContracts: 'umrahVisaContracts', serviceContracts: 'umrahServiceContracts', contractReservations: 'umrahContractReservations', programs: 'umrahPrograms', programSegments: 'umrahProgramSegments', programCosts: 'umrahProgramCosts', bookings: 'umrahBookings', travelers: 'umrahTravelers', hotelRooms: 'umrahHotelRooms', visaBatches: 'umrahVisaBatches', visaItems: 'umrahVisaItems', tickets: 'umrahTickets', busRuns: 'umrahBusRuns', operationTasks: 'umrahOperationTasks', incidents: 'umrahIncidents', supplierCommitments: 'umrahSupplierCommitments', activity: 'umrahActivity', outbox: 'umrahOutbox', sequences: 'umrahSequences'
};
const UmrahCore_LocalUI = {
    state: null,
    key() { const user = ServerStore?.userId || Auth?.user?.id || 'session'; return `${APP.session || APP.storage || 'erp'}:umrah-ui:${user}`; },
    load(seed = {}) { if (this.state) return this.state; let saved = null; try { saved = JSON.parse(sessionStorage.getItem(this.key()) || 'null'); } catch (_) { saved = null; } this.state = { ...UmrahCore_deep(seed || {}), ...(saved && typeof saved === 'object' ? saved : {}) }; return this.state; },
    save() { if (!this.state) return true; try { sessionStorage.setItem(this.key(), JSON.stringify(this.state)); return true; } catch (_) { return false; } },
    clear() { this.state = null; try { sessionStorage.removeItem(this.key()); } catch (_) {} }
};

const UmrahCore_DB = {
    data: null, _depth: 0, _dirty: false,
    rootView(seed) { const out = {}; for (const [logical, root] of Object.entries(UmrahCore_RootMap)) { const fallback = seed?.[logical]; if (Array.isArray(fallback)) { if (!Array.isArray(DB.data[root])) DB.data[root] = []; } else if (fallback && typeof fallback === 'object') { if (!DB.data[root] || typeof DB.data[root] !== 'object' || Array.isArray(DB.data[root])) DB.data[root] = UmrahCore_deep(fallback); else DB.data[root] = { ...UmrahCore_deep(fallback), ...DB.data[root] }; } else if (DB.data[root] === undefined) DB.data[root] = UmrahCore_deep(fallback); Object.defineProperty(out, logical, { enumerable: true, configurable: false, get: () => DB.data[root], set: v => { DB.data[root] = v; } }); } const localUi = UmrahCore_LocalUI.load(seed?.uiState || {}); Object.defineProperty(out, 'uiState', { enumerable: true, configurable: false, get: () => localUi, set: v => { UmrahCore_LocalUI.state = v && typeof v === 'object' ? v : {}; } }); return out; },
    atomic(label, fn, { save = true, render = true, rollback = false } = {}) { const outer = this._depth === 0, run = () => { if (outer)
        this._dirty = false; this._depth++; try {
        const result = fn();
        this._depth--;
        if (outer && (save || this._dirty)) {
            this._dirty = false;
            this.save(false);
        }
        if (outer && render)
            UmrahCore_UI.render();
        return result;
    }
    catch (e) {
        this._depth--;
        if (outer)
            this._dirty = false;
        throw e;
    } }; return outer ? DB.atomic(`umrah:${label}`, run, { save: false, render: false, rollback }) : run(); },
    async atomicAsync(label, fn, { save = true, render = true, strict = false, waitForSave = strict, rollback = strict } = {}) { const outer = this._depth === 0, run = async () => { if (outer)
        this._dirty = false; this._depth++; try {
        const result = await fn();
        this._depth--;
        if (outer && (save || this._dirty)) {
            this._dirty = false;
            const task = this.save(false);
            if (waitForSave || strict) await task;
            else Promise.resolve(task).catch(e => console.error('[umrah] background save failed', e));
        }
        if (outer && render)
            UmrahCore_UI.render();
        return result;
    }
    catch (e) {
        this._depth = Math.max(0, this._depth - 1);
        if (outer)
            this._dirty = false;
        throw e;
    } }; return outer ? DB.atomicAsync(`umrah:${label}`, run, { save: false, render: false, strict, waitForSave, rollback }) : run(); },
    restore(snapshot) { if (!snapshot || !this.data) return; for (const [k, v] of Object.entries(snapshot)) this.data[k] = UmrahCore_deep(v); },
    load() { if (DB.data && Object.prototype.hasOwnProperty.call(DB.data, 'umrahUiState')) delete DB.data.umrahUiState; this.data = this.rootView(UmrahCore_deep(UmrahCore_Seed)); this.ensure(); this.data.settings.baseCurrency = DB.data.settings?.baseCurrency || this.data.settings.baseCurrency || 'EGP'; const expired = UmrahCore_Ops.expireHolds(); if (expired) this.save(false); },
    ensure() {
        const d = this.data;
        for (const [k, v] of Object.entries(UmrahCore_Seed)) {
            if (Array.isArray(v) && !Array.isArray(d[k]))
                d[k] = [];
            else if (v && typeof v === 'object' && !Array.isArray(v) && (!d[k] || typeof d[k] !== 'object'))
                d[k] = UmrahCore_deep(v);
        }
        d.settings = { ...UmrahCore_Seed.settings, ...(d.settings || {}) };
        d.meta = { ...UmrahCore_Seed.meta, ...(d.meta || {}), ...UmrahCore_META };
        d.sequences = { ...UmrahCore_Seed.sequences, ...(d.sequences || {}) };
        for (const p of d.programs) {
            p.programType = p.programType || 'umrah';
            p.status = p.status || 'planning';
            p.capacity = Math.max(1, UmrahCore_N(p.capacity) || 1);
            p.pricing = { single: 0, double: 0, triple: 0, quad: 0, quint: 0, childBed: 0, childNoBed: 0, infant: 0, ...(p.pricing || {}) };
            p.active = p.active !== false;
        }
        for (const b of d.bookings) {
            b.status = b.status || 'inquiry';
            b.roomPlan = Array.isArray(b.roomPlan) ? b.roomPlan : [];
            b.customerSnapshot = { name: '', phone: '', no: '', ...(b.customerSnapshot || {}) };
            b.persons = Math.max(0, UmrahCore_N(b.persons));
            b.total = UmrahCore_N(b.total);
        }
        for (const t of d.travelers) {
            t.active = t.active !== false;
            t.visaStatus = t.visaStatus || 'not_started';
            t.ticketStatus = t.ticketStatus || 'not_issued';
            t.hajjPermitStatus = t.hajjPermitStatus || 'not_started';
            t.hajjPermitNo = t.hajjPermitNo || '';
            t.campAssignment = t.campAssignment || '';
            t.roomAssignments = t.roomAssignments && typeof t.roomAssignments === 'object' ? t.roomAssignments : {};
        }
        d.visaContracts = d.visaContracts || [];
        d.serviceContracts = d.serviceContracts || [];
        for (const [kind, arr] of [['hotel', d.hotelContracts], ['flight', d.flightBlocks], ['transport', d.transportContracts], ['visa', d.visaContracts], ['service', d.serviceContracts]])
            for (const c of arr) {
                c.status = c.status || 'confirmed';
                c.contractNo = c.contractNo || '';
                c.supplierRef = c.supplierRef || '';
                c.contactName = c.contactName || '';
                c.contactPhone = c.contactPhone || '';
                c.signedDate = c.signedDate || '';
                c.freeCancelUntil = c.freeCancelUntil || '';
                c.releaseDeadline = c.releaseDeadline || '';
                c.releaseMode = ['manual', 'absolute', 'rolling'].includes(c.releaseMode) ? c.releaseMode : (c.releaseDeadline ? 'absolute' : 'manual');
                c.releaseDays = Math.max(0, UmrahCore_N(c.releaseDays));
                c.stopSales = Array.isArray(c.stopSales) ? c.stopSales : [];
                c.inventoryPeriods = Array.isArray(c.inventoryPeriods) ? c.inventoryPeriods : [];
                c.amendmentOf = c.amendmentOf || '';
                c.amendmentNo = Math.max(0, UmrahCore_N(c.amendmentNo));
                c.amendmentReason = c.amendmentReason || '';
                if (kind === 'service') {
                    c.serviceCategory = c.serviceCategory || 'custom';
                    c.serviceName = c.serviceName || '';
                    c.unit = c.unit || 'pax';
                    c.quota = Math.max(0, UmrahCore_N(c.quota));
                    c.costPerUnit = Math.max(0, UmrahCore_N(c.costPerUnit));
                    c.programType = c.programType || 'all';
                }
                c.advancePct = Math.max(0, Math.min(100, UmrahCore_N(c.advancePct)));
                c.advanceDue = c.advanceDue || '';
                c.balanceDue = c.balanceDue || '';
                c.paymentTerms = c.paymentTerms || '';
                c.documentRef = c.documentRef || '';
                c.notes = c.notes || '';
                c.active = c.status !== 'cancelled' && c.active !== false;
                c.kind = kind;
            }
        for (const r of d.contractReservations) {
            r.active = r.active !== false;
            r.allocation = r.allocation || {};
            r.createdAt = r.createdAt || UmrahCore_now();
        }
        for (const r of d.busRuns) {
            if (!r.segmentId) {
                const segs = d.programSegments.filter(s => s.programId === r.programId && s.type === 'transport' && s.active !== false);
                if (segs.length === 1)
                    r.segmentId = segs[0].id;
            }
        }
        UmrahCore_Bridge.applyBranchDefaults?.(d);
        const maxNo = (arr) => arr.reduce((m, x) => Math.max(m, UmrahCore_N(UmrahCore_S(x.no).match(/(\d+)$/)?.[1])), 0);
        d.sequences.program = Math.max(UmrahCore_N(d.sequences.program), maxNo(d.programs));
        d.sequences.booking = Math.max(UmrahCore_N(d.sequences.booking), maxNo(d.bookings));
        d.sequences.season = Math.max(UmrahCore_N(d.sequences.season), maxNo(d.seasons));
        d.sequences.visa = Math.max(UmrahCore_N(d.sequences.visa), maxNo(d.visaBatches));
        d.sequences.bus = Math.max(UmrahCore_N(d.sequences.bus), maxNo(d.busRuns));
        d.sequences.incident = Math.max(UmrahCore_N(d.sequences.incident), maxNo(d.incidents));
    },
    saveUiState() { UmrahCore_LocalUI.save(); return Promise.resolve({ localUi: true }); },
    save(render = true) { if (this._depth > 0) { this._dirty = true; return Promise.resolve({ deferred: true }); } UmrahCore_Bridge.applyBranchDefaults(this.data); this.data.meta.updatedAt = UmrahCore_now(); this.saveUiState(); const task = DB.save(false, { silentUi: true }); if (render) UmrahCore_UI.render(); return Promise.resolve(task); },
    next(type) { const map = { season: 'seasonPrefix', program: 'programPrefix', booking: 'bookingPrefix', visa: 'visaPrefix', bus: 'busPrefix', incident: 'incidentPrefix' }, p = this.data.settings[map[type]] || type.toUpperCase(), n = (UmrahCore_N(this.data.sequences[type]) + 1); this.data.sequences[type] = n; return `${p}${String(n).padStart(4, '0')}`; },
    log(action, entity, id, details = '') { this.data.activity.unshift({ id: UmrahCore_iid(), at: UmrahCore_now(), action, entity, entityId: id, details, user: UmrahCore_Bridge.currentUser().name }); const days = Math.max(7, Math.min(365, UmrahCore_N(DB.data.settings?.activityRetentionDays || 90))), cut = Date.now() - days * 86400000; this.data.activity = this.data.activity.filter(x => !x.at || Date.parse(x.at) >= cut).slice(0, 1500); }
};
const UmrahCore_scopePage = scope => { scope = UmrahCore_S(scope); if (!scope.startsWith('umrah.')) return scope; const part = scope.split('.')[1] || ''; const map = { contracts: 'umrah-contracts', costing: 'umrah-costing', procurement: 'umrah-procurement', programs: 'umrah-programs', seasons: 'umrah-seasons', control: 'umrah-control', tripops: 'umrah-tripops', documents: 'umrah-documents', settings: 'umrah-settings', travelers: 'umrah-travelers', visas: 'umrah-visas', flights: 'umrah-flights', transport: 'umrah-transport' }; return map[part] || 'umrah-bookings'; };
const UmrahCore_Bridge = {
    currentUser() { return Auth.user || { id: '', name: 'مستخدم النظام' }; }, branchId() { return BranchScope.currentId() || ''; }, branchName() { return BranchScope.current()?.name || 'الفرع الحالي'; }, branchMatch(x) { const id = this.branchId(); return !id || !x?.branchId || x.branchId === id; }, can(scope, action = 'view') { return Auth.can(UmrahCore_scopePage(scope), action); }, canViewCosts() { return Commercial.canViewCosts() !== false; }, require(scope, action = 'view') { return Auth.require(UmrahCore_scopePage(scope), action); },
    status() { return { host: true, branch: true, customers: true, agents: true, employees: false, suppliers: true, currencies: true, costCenters: true, finance: true, treasury: true, attachments: true, audit: true, umrah: true }; },
    customers() { return DB.data.customers.filter(x => x.active !== false); }, agents() { return DB.data.agents.filter(x => x.active !== false); }, employees() { return []; }, suppliers() { return DB.data.suppliers.filter(x => x.active !== false); }, currencies() { return Currency.active(); }, costCenters() { return DB.data.costCenters.filter(x => x.active !== false); },
    ensureProgramCostCenter(p) { if (!p) return null; let cc = p.costCenterId && byId(DB.data.costCenters, p.costCenterId); if (!cc) cc = DB.data.costCenters.find(x => x.sourceType === 'umrah-program' && x.sourceId === p.id); const name = `${p.no} — ${p.name}${p.groupNo ? ' — ' + p.groupNo : ''}${p.groupDescription ? ' — ' + p.groupDescription : ''}`, description = `مركز ربحية برنامج ${p.programType === 'hajj' ? 'حج' : 'عمرة'} — ${p.no}`; if (!cc) { Auth.require('costcenters', 'add'); cc = { id: UmrahCore_iid(), no: Numbering.next('costCenter'), name, description, active: true, programId: p.id, branchId: p.branchId || this.branchId(), sourceType: 'umrah-program', sourceId: p.id, system: false }; DB.data.costCenters.push(cc); } else { cc.name = name; cc.description = description; cc.programId = p.id; cc.branchId = p.branchId || cc.branchId || this.branchId(); cc.sourceType = 'umrah-program'; cc.sourceId = p.id; } return UmrahCore_deep(cc); },
    treasuries(currency = '') { const a = DB.data.treasuries.filter(x => x.active !== false && (!x.branchId || x.branchId === BranchScope.currentId())); return currency ? a.filter(x => x.currency === currency) : a; },
    customer(id) { return this.customers().find(x => x.id === id); }, supplier(id) { return this.suppliers().find(x => x.id === id); }, agent(id) { return this.agents().find(x => x.id === id); }, employee(id) { return this.employees().find(x => x.id === id); },
    baseCurrency() { return DB.data.settings?.baseCurrency || UmrahCore_DB.data.settings.baseCurrency || 'EGP'; }, rate(code, date = UmrahCore_today()) { code = UmrahCore_S(code || this.baseCurrency()).toUpperCase(); return code === this.baseCurrency() ? 1 : UmrahCore_N(Currency.rate(code, date)); }, convert(amount, from, to, date = UmrahCore_today()) { if (from === to) return UmrahCore_N(amount); return UmrahCore_N(Currency.convert(UmrahCore_N(amount), from, to, date)); },
    setRate(code, rate, date = UmrahCore_today()) { if (code === this.baseCurrency()) return 1; if (!(UmrahCore_N(rate) > 0)) throw new Error('سعر الصرف يجب أن يكون أكبر من صفر'); Auth.require('currencies', 'edit'); Currency.setRate(code, UmrahCore_N(rate), date, 'umrah-inline'); UmrahCore_DB.save(false); return Currency.rate(code, date); },
    createCurrency(o) { Auth.require('currencies', 'add'); Currency.add({ ...o, date: o.date || UmrahCore_today() }); UmrahCore_DB.save(false); const c = Currency.get(o.code); return UmrahCore_deep({ id: c?.code || UmrahCore_S(o.code).toUpperCase(), code: c?.code || UmrahCore_S(o.code).toUpperCase(), name: c?.name || o.name, symbol: c?.symbol || o.symbol || '', decimals: c?.decimals ?? 2 }); },
    preferredTreasury(currency, id = '') { const list = this.treasuries(currency); return list.find(x => x.id === id) || list[0] || null; },
    createCustomer(o) { Auth.require('customers', 'add'); const x = Transactions.addCustomer(o); UmrahCore_DB.save(false); return UmrahCore_deep(x); },
    createSupplier(o) { Auth.require('suppliers', 'add'); const x = Transactions.addSupplier(o); UmrahCore_DB.save(false); return UmrahCore_deep(x); },
    createTreasury(o) { Auth.require('treasury', 'add'); const x:any = Transactions.createTreasury({ ...o, opening: UmrahCore_N(o.opening), date: o.date || UmrahCore_today(), branchId: BranchScope.currentId() }); x.branchId = x.branchId || BranchScope.currentId(); UmrahCore_DB.save(false); return UmrahCore_deep(x); },
    audit(action, entity, id, details = '') { DB.log(action, entity, id, details); },
    emit(type, payload, key = '') { const idempotencyKey = key || `${type}:${payload?.id || payload?.bookingId || payload?.programId || UmrahCore_iid()}`; return UmrahCore_ERP.handleUmrahEvent({ type, payload, idempotencyKey }); },
    financeSnapshot(booking) { return UmrahCore_ERP.bookingSnapshot(booking.id) || {}; }, actualProgramCost(programId) { return UmrahCore_ERP.programActualCost(programId) || null; }, procurementSnapshot(id) { return UmrahCore_ERP.procurementSnapshot(id) || null; }, contractPayments(sourceType, sourceId) { return UmrahCore_ERP.contractPayments(sourceType, sourceId) || []; }, attachments(entityType, entityId) { return Attachments.list(entityType, entityId) || []; },
    applyBranchDefaults(d) { const id = this.branchId(); if (!id) return d; for (const k of ['seasons', 'hotelContracts', 'flightBlocks', 'transportContracts', 'visaContracts', 'serviceContracts', 'contractReservations', 'programs', 'programSegments', 'programCosts', 'bookings', 'travelers', 'hotelRooms', 'visaBatches', 'visaItems', 'tickets', 'busRuns', 'operationTasks', 'incidents', 'supplierCommitments', 'activity', 'outbox']) for (const x of d?.[k] || []) if (x && !x.branchId) x.branchId = id; return d; },
    openERP(page) { return UI.openPage(page); }, openERPForm(type, ctx = {}) { return Forms.open(type, ctx || {}); }, openParty360(type, id) { return Party360.openMore(type, id); }, openPartyMore(type, id) { return Party360.openMore(type, id); }, openPartyActions(type, id) { return Actions.openPartyActions(type, id); }, partyControls(type, id) { return (UI as any).partyControls(type, id, { compact: true }); }, openAttachment(entityType, entityId) { Auth.require('documents', 'add'); return Forms.open('attachment', { entityType, entityId }); }, rememberLocation() { return true; }
};
const UmrahCore_Cost = {
    toBase(amount, currency, fx) { const r = UmrahCore_N(fx) || UmrahCore_Bridge.rate(currency); if (!(r > 0))
        throw new Error(`لا يوجد سعر صرف صالح للعملة ${currency}`); return UmrahCore_N(amount) * r; },
    budget(programId) { const lines = UmrahCore_Ops.scoped('programCosts').filter(x => x.programId === programId && x.active !== false), fixed = lines.filter(x => x.mode !== 'perPax').reduce((s, x) => s + this.toBase(x.amount, x.currency, x.fxToBase), 0), perPax = lines.filter(x => x.mode === 'perPax').reduce((s, x) => s + this.toBase(x.amount, x.currency, x.fxToBase), 0), p = UmrahCore_Ops.program(programId), capacity = UmrahCore_N(p?.capacity), totalAtCapacity = fixed + perPax * capacity, costPerPax = capacity ? totalAtCapacity / capacity : 0, avgSell = UmrahCore_N(p?.pricing?.quad) || UmrahCore_N(p?.pricing?.triple) || UmrahCore_N(p?.pricing?.double) || 0, avgSellBase = UmrahCore_Bridge.convert(avgSell, p?.currency || UmrahCore_Bridge.baseCurrency(), UmrahCore_Bridge.baseCurrency(), p?.departureDate || UmrahCore_today()), marginPerPax = avgSellBase - costPerPax, breakEven = avgSellBase > perPax ? Math.ceil(fixed / (avgSellBase - perPax)) : 0; return { lines, fixed, perPax, totalAtCapacity, costPerPax, avgSell: avgSellBase, marginPerPax, breakEven }; },
    add(o, automated = false) { if (!automated)
        UmrahCore_Bridge.require('umrah.costing', 'add'); const p = UmrahCore_Ops.program(o.programId); if (!p)
        throw new Error('اختر البرنامج'); const currency = o.currency || p.currency, rate = UmrahCore_N(o.fxToBase) || UmrahCore_Bridge.rate(currency, p.departureDate || UmrahCore_today()); if (!(rate > 0))
        throw new Error(`لا يوجد سعر صرف صالح للعملة ${currency}`); const category = o.category || 'other', procurementPolicy = o.procurementPolicy || 'budgetOnly', allowedActualization = { hotel: ['manual', 'onReturned'], flight: ['manual', 'onTicketIssued', 'onTraveling'], transport: ['manual', 'onReturned'], visa: ['manual', 'onVisaIssued'], camp: ['manual', 'onCampAssigned'], permit: ['manual', 'onPermitIssued'], supervision: ['manual'], meal: ['manual'], other: ['manual'] }, requested = procurementPolicy === 'budgetOnly' ? 'manual' : (o.actualizationPolicy || 'manual'), actualizationPolicy = (allowedActualization[category] || ['manual']).includes(requested) ? requested : 'manual'; if (requested !== actualizationPolicy)
        throw new Error('سياسة إثبات فاتورة المورد لا تتوافق مع نوع الخدمة'); const matchedReservation = o.sourceContractId ? [...UmrahCore_Ops.scoped('contractReservations')].reverse().find(r => r.active !== false && r.programId === p.id && r.kind === o.sourceContractKind && r.contractId === o.sourceContractId) : null, x = { id: UmrahCore_iid(), branchId: p.branchId || UmrahCore_Bridge.branchId(), programId: p.id, category, description: UmrahCore_S(o.description).trim(), amount: UmrahCore_N(o.amount), currency, fxToBase: rate, mode: o.mode || 'fixed', supplierId: o.supplierId || '', procurementPolicy, actualizationPolicy, sourceContractKind: o.sourceContractKind || '', sourceContractId: o.sourceContractId || '', sourceReservationId: o.sourceReservationId || matchedReservation?.id || '', sourceSegmentId: o.sourceSegmentId || matchedReservation?.segmentId || '', taxId: o.taxId || 'TAX0', notes: o.notes || '', active: true, createdAt: UmrahCore_now() }; if (!x.description || x.amount <= 0)
        throw new Error('وصف وقيمة التكلفة مطلوبان'); if (x.procurementPolicy !== 'budgetOnly' && !x.supplierId)
        throw new Error('اختر المورد عند تفعيل إنشاء التزام فعلي'); UmrahCore_DB.data.programCosts.push(x); UmrahCore_Bridge.audit('create', 'umrahBudgetCost', x.id, p.no); return x; }
};
