const UmrahCore_PageScope = p => ({ dashboard: ['umrah.bookings', 'view'], 'guided-program': ['umrah.programs', 'add'], 'booking-wizard': ['umrah.bookings', 'add'], 'guided-resume': ['umrah.bookings', 'view'], 'guided-trip': ['umrah.control', 'view'], seasons: ['umrah.seasons', 'view'], contracts: ['umrah.contracts', 'view'], programs: ['umrah.programs', 'view'], 'program-workspace': ['umrah.programs', 'view'], costing: ['umrah.costing', 'view'], bookings: ['umrah.bookings', 'view'], travelers: ['umrah.travelers', 'view'], hotels: ['umrah.bookings', 'view'], visas: ['umrah.visas', 'view'], flights: ['umrah.flights', 'view'], transport: ['umrah.transport', 'view'], 'hajj-services': ['umrah.travelers', 'view'], procurement: ['umrah.procurement', 'view'], control: ['umrah.control', 'view'], tripops: ['umrah.tripops', 'view'], incidents: ['umrah.incidents', 'view'], documents: ['umrah.documents', 'view'], settings: ['umrah.settings', 'view'], integration: ['umrah.settings', 'view'] }[p] || ['umrah.bookings', 'view']);
const UmrahCore_PageAllowed = p => { const [scope, action] = UmrahCore_PageScope(p); return UmrahCore_Bridge.can(scope, action); };
const UmrahCore_UI = {
    current: 'dashboard', _lastTimedSync: 0, _lazyTables: new Map(), _lazySeq: 0,
    openPage(p, opts = {}) { if (!UmrahCore_PageAllowed(p)) { this.toast('ليس لديك صلاحية لفتح هذه الشاشة', 'error'); p = UmrahCore_PageAllowed('dashboard') ? 'dashboard' : 'bookings'; }
        const tick = Date.now(); if (tick - this._lastTimedSync > 60000) { this._lastTimedSync = tick; const timed = UmrahCore_Ops.syncTimedStatuses(); if (timed) UmrahCore_DB.save(false); }
        const prev = this.current; if (prev === 'guided-program' && prev !== p) UmrahCore_ProgramWizard.flushCapture?.();
        this.current = p; UmrahCore_DB.data.uiState = UmrahCore_DB.data.uiState || {}; UmrahCore_DB.data.uiState.lastPage = p; UmrahCore_DB.saveUiState?.();
        const target = CoreSuites.maps?.umrah?.[p] || 'umrah-dashboard';
        if (UI.current === target) UI.renderCurrent(); else UI.openPage(target, '', opts || {});
        return true; },
    pushLocation() { UI.pushNavLocation?.(); return true; },
    render() { UI.renderCurrent(); return true; },
    exportState() { if (this.current === 'booking-wizard') UmrahCore_Wizard.capture?.(); if (this.current === 'guided-program') UmrahCore_ProgramWizard.flushCapture?.(); return { page: this.current, wizard: { step: UmrahCore_Wizard.step, data: UmrahCore_deep(UmrahCore_Wizard.data) }, programWizard: { step: UmrahCore_ProgramWizard.step, maxStep: UmrahCore_ProgramWizard.maxStep, data: UmrahCore_deep(UmrahCore_ProgramWizard.data) } }; },
    resumeLast() { const st = UmrahCore_DB.data.uiState || {}; if (st.programWizard?.data?.creationToken) return this.openPage('guided-program'); if (st.bookingWizard?.data) return this.openPage('booking-wizard'); return this.openPage(st.lastPage || 'dashboard'); },
    enhanceTables(root = document) { UI.enhanceResponsiveTables(root); },
    toast(msg, type = '') { return toast(msg, type || 'ok'); },
    filter(input) { return UI.filterTable(input); },
    table(headers, rows, empty = 'لا توجد بيانات') { return UI.table(headers, rows, empty, { export: false }); },
    loadMoreTable(key, btn, all = false) { return UI.loadMoreTable(key, btn, all); },
    loadAllTable(card) { return UI.loadAllTable(card); },
    _documentsExpanded: false, _programsExpanded: false,
    expandPrograms() { this._programsExpanded = true; this.render(); return true; },
    expandDocuments() { this._documentsExpanded = true; this.render(); return true; },
    head(title, sub = '', actions = '') { return `<div class="section-head"><div><h2>${title}</h2></div><div class="quick-actions">${actions}</div></div>`; }
};
const UmrahCore_State = { hotelProgram: '', flightProgram: '', flightSegment: '', busProgram: '', busSegment: '', hajjProgram: '', controlProgram: '', tripProgram: '', contractKind: 'all', contractView: 'overview', listMode: { programs: 'active', bookings: 'active', travelers: 'active', visas: 'active' } };
const UmrahCore_isHistoryRow = (kind, x) => {
    if (kind === 'programs') return ['closed', 'cancelled'].includes(x.status) || x.active === false || x.deleted === true;
    if (kind === 'bookings') return ['closed', 'cancelled', 'refunded', 'expired', 'noShow'].includes(x.status) || x.active === false;
    if (kind === 'visas') return ['closed', 'cancelled', 'completed'].includes(x.status) || x.active === false;
    if (kind === 'travelers') { const b = UmrahCore_Ops.booking(x.bookingId), p = UmrahCore_Ops.program(x.programId); return x.active === false || !b || !p || UmrahCore_isHistoryRow('bookings', b) || UmrahCore_isHistoryRow('programs', p); }
    return false;
};
const UmrahCore_filterHistory = (kind, rows) => { const mode = UmrahCore_State.listMode[kind] || 'active'; return mode === 'all' ? rows : rows.filter(x => mode === 'history' ? UmrahCore_isHistoryRow(kind, x) : !UmrahCore_isHistoryRow(kind, x)); };
const UmrahCore_historyToolbar = (kind, rows) => { const mode = UmrahCore_State.listMode[kind] || 'active', historical = rows.filter(x => UmrahCore_isHistoryRow(kind, x)).length, current = rows.length - historical, button = (value, label, count, ic, cls) => UI.filterOption(label,count,mode===value,{type:'umrahHistory',kind,value},ic,cls); return `<div class="umrah-history-toolbar compact-filter-toolbar record-scope-toolbar"><div><b>تنظيم السجلات</b><small>الحالي منفصل عن السجل السابق.</small></div><div class="umrah-history-tabs">${button('active', 'الحالي', current,'check','good')}${button('history', 'السجل السابق', historical,'archive','purple')}${button('all', 'الكل', rows.length,'reports','info')}</div></div>`; };
const UmrahCore_travelerCategory = s => ({ adult: 'بالغ', childBed: 'طفل بسرير', childNoBed: 'طفل بدون سرير', infant: 'رضيع' })[s] || s;
const UmrahCore_visaStatusLabel = s => ({ not_started: 'لم يبدأ', documents_received: 'استلام مستندات', reviewed: 'تمت المراجعة', ready: 'جاهز للتقديم', submitted: 'تم الإرسال', processing: 'تحت الإجراء', more_info: 'طلب استكمال', issued: 'صادرة', rejected: 'مرفوضة' })[s] || s;
const UmrahCore_ticketStatusLabel = s => ({ not_issued: 'لم تصدر', reserved: 'محجوزة', issued: 'صادرة', reissued: 'إعادة إصدار', cancelled: 'ملغاة' })[s] || s;
const UmrahCore_currencyOptions = val => UmrahCore_Bridge.currencies().map(c => `<option value="${c.code}" ${c.code === val ? 'selected' : ''}>${c.code} — ${UmrahCore_esc(c.name || '')}</option>`).join('');
const UmrahCore_fxLabel = (currency, date = UmrahCore_today()) => { const base = UmrahCore_Bridge.baseCurrency(), r = UmrahCore_Bridge.rate(currency, date); return currency === base ? `العملة الأساسية ${base}` : r > 0 ? `1 ${currency} = ${UmrahCore_fmt(r, 4)} ${base}` : `لا يوجد سعر صرف لـ ${currency}`; };
const UmrahCore_treasuryOptions = (currency, val = '') => UmrahCore_Bridge.treasuries(currency).map(x => `<option value="${x.id}" ${x.id === val ? 'selected' : ''}>${UmrahCore_esc(x.name)} — ${x.currency}</option>`).join('');
const UmrahCore_entityOptions = (arr, val = '') => `<option value="">اختر...</option>${arr.map(x => `<option value="${x.id}" ${x.id === val ? 'selected' : ''}>${UmrahCore_esc((x.no ? x.no + ' — ' : '') + (x.name || x.hotelName || x.provider || x.title || ''))}</option>`).join('')}`;
const UmrahCore_selectProgram = (id, val, stateKey, resetKey='') => `<select id="${id}" data-umrah-select-program="${UmrahCore_esc(stateKey)}"${resetKey?` data-umrah-select-reset="${UmrahCore_esc(resetKey)}"`:''} style="padding:8px;border:1px solid var(--line);border-radius:9px;background:#fff">${UmrahCore_Ops.scoped('programs').filter(p => p.status !== 'cancelled').map(p => `<option value="${p.id}" ${p.id === val ? 'selected' : ''}>${UmrahCore_esc(p.no + ' — ' + UmrahCore_programDisplay(p))}</option>`).join('')}</select>`;
const UmrahCore_procurementSourceLabel = s => ({ hotelContract: 'عقد فندق', flightContract: 'عقد طيران', transportContract: 'عقد نقل', programCost: 'تكلفة برنامج', bookingCost: 'تكلفة مرتبطة بحجز', manual: 'إدخال يدوي' })[s] || 'خدمة تشغيلية';
const UmrahCore_integrationRows = s => `<div class="stack">${[['النظام المركزي', s.host], ['الفرع الحالي', s.branch], ['العملاء', s.customers], ['المندوبون', s.agents], ['الموردون', s.suppliers], ['العملات', s.currencies], ['مراكز التكلفة', s.costCenters], ['المالية', s.finance], ['الخزنة', s.treasury], ['المرفقات', s.attachments]].map(x => `<div class="info-row"><div><b>${x[0]}</b><small>${x[1] ? 'متصل بالنظام الرئيسي' : 'غير متاح من النظام الرئيسي'}</small></div><span class="badge ${x[1] ? 'green' : 'orange'}">${x[1] ? 'متصل' : 'غير متصل'}</span></div>`).join('')}</div>`;
