// Integrated host mode
const UmrahCore_META = {
    id: 'hajj-umrah-core', name: 'إدارة الحج والعمرة', version: '32.4.45-core-clean', mode: 'core',
    contract: { customers: 'CENTRAL', agents: 'CENTRAL', employees: 'CENTRAL', suppliers: 'CENTRAL', currencies: 'CENTRAL', costCenters: 'CENTRAL', finance: 'CENTRAL', treasury: 'CENTRAL', attachments: 'CENTRAL', auth: 'CENTRAL', audit: 'CENTRAL', rule: 'Hajj & Umrah records are first-class ERP state. Shared customers, suppliers, currencies, treasuries, accounting, permissions and branches are reused directly with no mirrored or standalone operational store.' }
};
const UmrahCore_S = v => String(v ?? ''), UmrahCore_N = v => Number(v) || 0, UmrahCore_deep = o => JSON.parse(JSON.stringify(o)), UmrahCore_today = () => { const x = new Date(); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; }, UmrahCore_now = () => new Date().toISOString(), UmrahCore_localDateTime = () => { const x = new Date(), p = n => String(n).padStart(2, '0'); return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`; }, UmrahCore_iid = () => globalThis.crypto?.randomUUID?.() || ('id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9));
const UmrahCore_esc = s => UmrahCore_S(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const UmrahCore_fmt = (n, d = 2) => new Intl.NumberFormat('ar-EG', { minimumFractionDigits: d, maximumFractionDigits: d }).format(UmrahCore_N(n)), UmrahCore_money = (n, c = 'EGP') => `${UmrahCore_fmt(n)} ${c}`;
const UmrahCore_dateAdd = (d, days) => { if (!d)
    return ''; const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + UmrahCore_N(days)); return x.toISOString().slice(0, 10); }, UmrahCore_monthsAdd = (d, m) => { if (!d)
    return ''; const x = new Date(d + 'T00:00:00Z'); x.setUTCMonth(x.getUTCMonth() + UmrahCore_N(m)); return x.toISOString().slice(0, 10); };
const UmrahCore_daysBetween = (a, b) => a && b ? Math.round((new Date(b + 'T00:00:00Z').getTime() - new Date(a + 'T00:00:00Z').getTime()) / 86400000) : 0;
const UmrahCore_roomCap = { single: 1, double: 2, triple: 3, quad: 4, quint: 5 }, UmrahCore_roomLabel = t => ({ single: 'فردي', double: 'ثنائي', triple: 'ثلاثي', quad: 'رباعي', quint: 'خماسي' })[t] || t;
const UmrahCore_vehicleCaps = { sedan: 4, staria_h1: 7, hiace: 11, coaster: 25, bus: 50 }, UmrahCore_vehicleLabel = t => ({ sedan: 'سيدان', staria_h1: 'ستاريا / H1', hiace: 'هايس', coaster: 'كوستر', bus: 'أوتوبيس / باص' })[t] || t, UmrahCore_programDisplay = p => p ? `${p.name}${p.groupNo ? ' — ' + p.groupNo : ''}${p.groupDescription ? ' — ' + p.groupDescription : ''}` : '-';
const UmrahCore_segLabel = t => ({ hotel: 'فندق', flight: 'طيران', transport: 'نقل', visit: 'زيارة', meal: 'وجبات', visa: 'تأشيرات', meeting: 'تجمع', camp: 'مخيم / مشاعر', permit: 'تصاريح / نسك', guide: 'مشرف / مرشد', rawda: 'الروضة', insurance: 'تأمين', custom: 'خدمة أخرى' })[t] || t;
const UmrahCore_programTypeLabel = t => t === 'hajj' ? 'حج' : 'عمرة', UmrahCore_travelerTitle = p => p?.programType === 'hajj' ? 'الحاج' : 'المعتمر', UmrahCore_travelersTitle = p => p?.programType === 'hajj' ? 'الحجاج' : 'المعتمرون';
const UmrahCore_hajjPermitStatusLabel = s => ({ not_started: 'لم يبدأ', documents_received: 'تم استلام المستندات', submitted: 'تم التقديم', processing: 'تحت الإجراء', issued: 'صادر', rejected: 'مرفوض' })[s] || s || 'لم يبدأ';
const UmrahCore_bookingLabel = s => StatusCatalog.label(s, 'umrahBooking');
const UmrahCore_programLabel = s => StatusCatalog.label(s, 'umrahProgram');
const UmrahCore_tone = s => StatusCatalog.tone(s, ['planning','contracting','pricing','open','salesClosed','operating','traveling','returned','closed','cancelled'].includes(s) ? 'umrahProgram' : 'umrahBooking');
const UmrahCore_Seed = {
    meta: { ...UmrahCore_META, createdAt: UmrahCore_now(), updatedAt: UmrahCore_now() },
    settings: { defaultCurrency: 'EGP', baseCurrency: 'EGP', holdHours: 24, passportValidityMonths: 6, programPrefix: 'UP', bookingPrefix: 'UB', seasonPrefix: 'US', visaPrefix: 'VB', busPrefix: 'BUS', incidentPrefix: 'INC', financialClearanceRequired: true, financialClearanceMaxDue: 0, defaultMarginPct: 15, supplierDocumentMode: 'bookingBatch', contractWarnDays: 14, holdWarnHours: 6 },
    seasons: [], hotelContracts: [], flightBlocks: [], transportContracts: [], visaContracts: [], serviceContracts: [], contractReservations: [], programs: [], programSegments: [], programCosts: [], bookings: [], travelers: [], hotelRooms: [], visaBatches: [], visaItems: [], tickets: [], busRuns: [], operationTasks: [], incidents: [], supplierCommitments: [], activity: [], outbox: [],
    uiState: { lastPage: 'dashboard', lastAction: '', bookingWizard: null, programWizard: null },
    sequences: { season: 0, program: 0, booking: 0, visa: 0, bus: 0, incident: 0 }
};
