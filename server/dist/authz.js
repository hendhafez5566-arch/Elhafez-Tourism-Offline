const ALL = '*';
const ROLE = {
    admin: { all: true },
    manager: { pages: { dashboard: ['view'], crm: ['view', 'add', 'edit', 'delete'], quotations: ['view', 'add', 'edit', 'delete', 'approve', 'print'], purchaseorders: ['view', 'add', 'edit', 'delete', 'approve', 'print'], programs: ['view', 'add', 'edit', 'delete', 'approve', 'print'], bookings: ['view', 'add', 'edit', 'void', 'print', 'approve'], services: ['view', 'add', 'edit', 'void', 'delete', 'approve', 'print'], customers: ['view', 'add', 'edit', 'delete', 'print', 'export'], suppliers: ['view', 'add', 'edit', 'delete', 'print', 'export'], agents: ['view', 'add', 'edit', 'delete', 'approve', 'void', 'print'], invoices: ['view', 'add', 'edit', 'void', 'approve', 'print'], receipts: ['view', 'add', 'void', 'print'], payments: ['view', 'add', 'void', 'approve', 'print'], expenses: ['view', 'add', 'edit', 'delete', 'void', 'print'], treasury: ['view', 'add', 'edit', 'delete', 'void', 'approve', 'print'], currencies: ['view', 'add', 'edit', 'delete', 'approve'], reports: ['view', 'print', 'export'], audit: ['view', 'approve'], activity: ['view', 'export'], documents: ['view', 'add', 'delete', 'print'], costcenters: ['view', 'add', 'edit', 'delete'], trial: ['view', 'print'], journal: ['view', 'add', 'edit', 'delete', 'approve', 'print', 'void'], accounts: ['view', 'add', 'edit', 'delete'], taxes: ['view', 'add', 'edit', 'delete'], periods: ['view', 'edit', 'approve'], approvals: ['view', 'add', 'approve'], settings: ['view', 'edit'], branches: ['view', 'edit'], sessions: ['view'], support: ['view'], dataexchange: ['view', 'export'] } },
    accountant: { pages: { dashboard: ['view'], crm: ['view'], quotations: ['view'], purchaseorders: ['view'], customers: ['view', 'add', 'edit', 'print', 'export'], suppliers: ['view', 'add', 'edit', 'print', 'export'], agents: ['view', 'print'], expenses: ['view', 'add', 'edit', 'delete', 'void', 'print'], receipts: ['view', 'add', 'void', 'print'], payments: ['view', 'add', 'void', 'print'], invoices: ['view', 'add', 'edit', 'void', 'print'], journal: ['view', 'add', 'edit', 'delete', 'print'], documents: ['view', 'add', 'print'], accounts: ['view', 'add', 'edit'], trial: ['view', 'print'], costcenters: ['view', 'add', 'edit'], treasury: ['view', 'print'], currencies: ['view', 'edit'], taxes: ['view', 'add', 'edit'], periods: ['view'], reports: ['view', 'print', 'export'], audit: ['view'], activity: ['view', 'export'], programs: ['view'], bookings: ['view'], services: ['view'], approvals: ['view', 'add'] } },
    cashier: { pages: { dashboard: ['view'], receipts: ['view', 'add', 'print'], payments: ['view', 'add', 'print'], treasury: ['view', 'print'], customers: ['view'], suppliers: ['view'], agents: ['view'], invoices: ['view'], reports: ['view'], approvals: ['add'] } },
    sales: { pages: { dashboard: ['view'], crm: ['view', 'add', 'edit'], quotations: ['view', 'add', 'edit', 'delete', 'print'], customers: ['view', 'add', 'edit'], agents: ['view'], programs: ['view'], bookings: ['view', 'add', 'edit'], services: ['view', 'add', 'edit'], invoices: ['view', 'print'], receipts: ['view', 'add', 'print'], documents: ['view', 'add'], approvals: ['add'] } },
    auditor: { pages: { dashboard: ['view'], crm: ['view'], quotations: ['view'], purchaseorders: ['view'], customers: ['view', 'print', 'export'], suppliers: ['view', 'print', 'export'], agents: ['view', 'print'], programs: ['view'], bookings: ['view'], services: ['view'], expenses: ['view'], receipts: ['view'], payments: ['view'], invoices: ['view', 'print'], journal: ['view', 'print'], documents: ['view', 'print'], accounts: ['view'], trial: ['view', 'print'], costcenters: ['view'], treasury: ['view', 'print'], currencies: ['view'], taxes: ['view'], periods: ['view'], reports: ['view', 'print', 'export'], audit: ['view'], activity: ['view', 'export'], approvals: ['view'] } }
};
export const COLLECTION_PAGE = { customers: 'customers', suppliers: 'suppliers', agents: 'agents', leads: 'crm', followups: 'crm', quotations: 'quotations', purchaseOrders: 'purchaseorders', programs: 'programs', bookings: 'bookings', travelers: 'bookings', roomAllocations: 'bookings', services: 'services', invoices: 'invoices', invoiceAdjustments: 'invoices', receipts: 'receipts', payments: 'payments', cheques: 'treasury', expenses: 'expenses', commissions: 'agents', manualJournalDrafts: 'journal', recurringJournals: 'journal', journals: 'journal', documents: 'documents', attachments: 'documents', transfers: 'treasury', cashCounts: 'treasury', bankReconciliations: 'treasury', fxRevaluations: 'currencies', approvals: 'approvals', costCenters: 'costcenters', treasuries: 'treasury', currencies: 'currencies', fxRates: 'currencies', taxCodes: 'taxes', accounts: 'accounts', serviceTypes: 'services', prepaidSchedules: 'expenses', commissionRules: 'agents', printNarratives: 'settings', supportNotes: 'support', fiscalYears: 'periods', periods: 'periods', users: 'users', branches: 'branches', dataImports: 'dataexchange', umrahSeasons: 'programs', umrahHotelContracts: 'programs', umrahFlightBlocks: 'programs', umrahTransportContracts: 'programs', umrahVisaContracts: 'programs', umrahContractReservations: 'programs', umrahPrograms: 'programs', umrahProgramSegments: 'programs', umrahProgramCosts: 'programs', umrahBookings: 'bookings', umrahTravelers: 'bookings', umrahHotelRooms: 'bookings', umrahVisaBatches: 'bookings', umrahVisaItems: 'bookings', umrahTickets: 'bookings', umrahBusRuns: 'bookings', umrahOperationTasks: 'programs', umrahIncidents: 'bookings', umrahSupplierCommitments: 'programs', umrahActivity: 'bookings', umrahOutbox: 'bookings' };
export const UMRAH_BRANCH_COLLECTIONS = ['umrahSeasons', 'umrahHotelContracts', 'umrahFlightBlocks', 'umrahTransportContracts', 'umrahVisaContracts', 'umrahContractReservations', 'umrahPrograms', 'umrahProgramSegments', 'umrahProgramCosts', 'umrahBookings', 'umrahTravelers', 'umrahHotelRooms', 'umrahVisaBatches', 'umrahVisaItems', 'umrahTickets', 'umrahBusRuns', 'umrahOperationTasks', 'umrahIncidents', 'umrahSupplierCommitments', 'umrahActivity', 'umrahOutbox'];
export const BRANCH_COLLECTIONS = new Set(['quotations', 'purchaseOrders', 'programs', 'bookings', 'travelers', 'roomAllocations', 'services', 'invoices', 'invoiceAdjustments', 'receipts', 'payments', 'cheques', 'expenses', 'commissions', 'manualJournalDrafts', 'recurringJournals', 'journals', 'documents', 'transfers', 'cashCounts', 'bankReconciliations', 'fxRevaluations', 'treasuries', ...UMRAH_BRANCH_COLLECTIONS]);
export const PAGE_MODULE = { crm: 'crm', customers: 'crm', suppliers: 'tourism', agents: 'crm', quotations: 'tourism', purchaseorders: 'tourism', programs: 'umrah', bookings: 'umrah', services: 'tourism', invoices: 'accounting', receipts: 'accounting', payments: 'accounting', expenses: 'accounting', journal: 'accounting', treasury: 'accounting', currencies: 'accounting', taxes: 'accounting', periods: 'accounting', reports: 'reports', users: '', branches: 'branches', dataexchange: 'imports' };
export function hasPermission(user, page, action = 'view') { if (user?.role === 'admin' || user?.permissions?.all)
    return true; const alias = page, direct = user?.permissions?.[page] ?? user?.permissions?.[alias]; if (direct === true)
    return action === 'view'; if (direct && typeof direct === 'object')
    return !!direct[action]; const roleDef = ROLE[String(user?.role || '')]; const base = roleDef?.pages?.[page] ?? roleDef?.pages?.[alias]; if (base === ALL)
    return true; return Array.isArray(base) && base.includes(action); }
export function allowedBranches(user, payload) { if (user?.role === 'admin' || user?.permissions?.all)
    return null; const active = (payload?.branches || []).filter((b) => b.active !== false), activeIds = new Set(active.map((b) => String(b.id))), ids = (Array.isArray(user?.allowedBranchIds) ? user.allowedBranchIds : []).map(String).filter((id) => id && activeIds.has(id)); if (ids.length)
    return new Set(ids); const primary = String(user?.branchId || ''); if (primary && activeIds.has(primary))
    return new Set([primary]); return new Set(); }
function mapById(xs) { return new Map((xs || []).map((x) => [String(x?.id || x?.code || x?.no || ''), x])); }
function recordsChanged(oldP, newP, name) { const old = mapById(oldP?.[name] || []), neu = mapById(newP?.[name] || []), out = []; for (const [id, after] of neu) {
    const before = old.get(id);
    if (!before || JSON.stringify(before) !== JSON.stringify(after))
        out.push({ id, before, after, added: !before });
} return out; }
function sameExcept(a, b, allowed) { const strip = (x) => Object.fromEntries(Object.entries(x || {}).filter(([k]) => !allowed.includes(k))); return JSON.stringify(strip(a)) === JSON.stringify(strip(b)); }
function directRecordPermission(user, collection, before) { const page = COLLECTION_PAGE[collection]; return !!page && (before ? (hasPermission(user, page, 'edit') || hasPermission(user, page, 'void') || hasPermission(user, page, 'approve')) : (hasPermission(user, page, 'add') || hasPermission(user, page, 'edit'))); }
function recordChanged(oldP, newP, collection, id) { const a = mapById(oldP?.[collection] || []).get(String(id)), b = mapById(newP?.[collection] || []).get(String(id)); return !!b && JSON.stringify(a) !== JSON.stringify(b); }
function sourceChangeAllowed(user, oldP, newP, collection, id) { const before = mapById(oldP?.[collection] || []).get(String(id)); return recordChanged(oldP, newP, collection, id) && directRecordPermission(user, collection, before); }
function invoiceDerivedAllowed(user, oldP, newP, inv) { const source = String(inv?.sourceType || ''), id = String(inv?.sourceId || ''); if (source === 'booking')
    return sourceChangeAllowed(user, oldP, newP, 'bookings', id); if (source === 'service')
    return sourceChangeAllowed(user, oldP, newP, 'services', id); if (source === 'expense')
    return sourceChangeAllowed(user, oldP, newP, 'expenses', id); if (source === 'umrah-booking') {
    const before = mapById(oldP?.umrahBookings || []).get(id), after = mapById(newP?.umrahBookings || []).get(id);
    return !!after && JSON.stringify(before) !== JSON.stringify(after) && (hasPermission(user, 'bookings', before ? 'edit' : 'add') || hasPermission(user, 'bookings', 'approve'));
} return false; }
function invoiceStatusDerivedAllowed(user, oldP, newP, before, after) { if (!sameExcept(before, after, ['status']))
    return false; for (const name of ['receipts', 'payments'])
    for (const x of recordsChanged(oldP, newP, name)) {
        if (!directRecordPermission(user, name, x.before))
            continue;
        if ((x.after?.allocations || []).some((a) => String(a?.invoiceId || '') === String(after?.id || '')))
            return true;
    } return false; }
function invoiceVoidSourceChangeAllowed(user, oldP, newP, collection, before, after) { if (!hasPermission(user, 'invoices', 'void'))
    return false; return recordsChanged(oldP, newP, 'invoices').some(x => { const inv = x.after; if (!['void', 'cancelled'].includes(String(inv?.status || '')) || !x.before || ['void', 'cancelled'].includes(String(x.before?.status || '')))
    return false; const id = String(inv.id || ''); if (collection === 'purchaseOrders')
    return inv.sourceType === 'purchaseOrder' && String(inv.sourceId || '') === String(after?.id || '') && String(before?.invoiceId || '') === id && !after?.invoiceId && ['approved', 'received'].includes(String(after?.status || '')); if (collection === 'quotations')
    return inv.sourceType === 'quotation' && String(inv.sourceId || '') === String(after?.id || '') && String(before?.invoiceId || '') === id && !after?.invoiceId && after?.status === 'accepted'; if (collection === 'umrahSupplierCommitments')
    return String(before?.hostInvoiceId || '') === id && !after?.hostInvoiceId && after?.status === 'committed'; if (collection === 'documents')
    return before?.type === 'invoice' && String(before?.refId || '') === id && after?.status === 'void'; return false; }); }
function journalShapeValid(user, j) { if (j?.status !== 'posted' || String(j?.createdBy || '') !== String(user?.id || '') || !Array.isArray(j?.lines) || j.lines.length < 2)
    return false; const debit = j.lines.reduce((z, l) => z + Number(l?.baseDebit || 0), 0), credit = j.lines.reduce((z, l) => z + Number(l?.baseCredit || 0), 0); return Number.isFinite(debit) && Number.isFinite(credit) && Math.abs(debit - credit) <= .01 && debit > 0; }
function journalDerivedAllowed(user, oldP, newP, j) { if (!journalShapeValid(user, j))
    return false; const type = String(j?.refType || ''), id = String(j?.refId || ''); if (type === 'invoice') {
    const inv = mapById(newP?.invoices || []).get(id), before = mapById(oldP?.invoices || []).get(id);
    return !!inv && recordChanged(oldP, newP, 'invoices', id) && (directRecordPermission(user, 'invoices', before) || invoiceDerivedAllowed(user, oldP, newP, inv));
} if (['receipt', 'receipt-advance-apply'].includes(type))
    return sourceChangeAllowed(user, oldP, newP, 'receipts', id); if (['payment', 'payment-advance-apply'].includes(type))
    return sourceChangeAllowed(user, oldP, newP, 'payments', id); return false; }
function derivedChangeAllowed(user, oldP, newP, collection, mode) {
    const rows = recordsChanged(oldP, newP, collection).filter(x => mode === 'added' ? x.added : !x.added);
    if (!rows.length)
        return false;
    if (collection === 'invoices')
        return rows.every(x => x.added ? invoiceDerivedAllowed(user, oldP, newP, x.after) : invoiceStatusDerivedAllowed(user, oldP, newP, x.before, x.after));
    if (collection === 'journals' && mode === 'added')
        return rows.every(x => journalDerivedAllowed(user, oldP, newP, x.after));
    if (collection === 'cheques' && mode === 'added')
        return rows.every(x => { const name = x.after?.direction === 'in' ? 'receipts' : 'payments'; return sourceChangeAllowed(user, oldP, newP, name, String(x.after?.voucherId || '')); });
    if (collection === 'documents' && mode === 'added')
        return rows.every(x => { const map = { invoice: 'invoices', receipt: 'receipts', payment: 'payments', journal: 'journals' }, name = map[x.after?.type]; if (!name)
            return false; const before = mapById(oldP?.[name] || []).get(String(x.after?.refId || '')), after = mapById(newP?.[name] || []).get(String(x.after?.refId || '')); if (!after || !recordChanged(oldP, newP, name, String(x.after?.refId || '')))
            return false; return directRecordPermission(user, name, before) || (name === 'invoices' && invoiceDerivedAllowed(user, oldP, newP, after)) || (name === 'journals' && journalDerivedAllowed(user, oldP, newP, after)); });
    if (mode === 'modified' && ['purchaseOrders', 'quotations', 'umrahSupplierCommitments', 'documents'].includes(collection))
        return rows.every(x => invoiceVoidSourceChangeAllowed(user, oldP, newP, collection, x.before, x.after));
    if (collection === 'services' && mode === 'modified')
        return rows.every(x => sameExcept(x.before, x.after, ['billingStatus', 'supplierBillingStatus']) && [x.after?.customerInvoiceId, x.after?.supplierInvoiceId].filter(Boolean).some((id) => { const a = mapById(newP?.invoices || []).get(String(id)), b = mapById(oldP?.invoices || []).get(String(id)); return a && invoiceStatusDerivedAllowed(user, oldP, newP, b, a); }));
    if (collection === 'commissions' && mode === 'added')
        return rows.every(x => x.after?.sourceType === 'service' && sourceChangeAllowed(user, oldP, newP, 'services', String(x.after?.sourceId || '')));
    return false;
}
export function diffState(oldP, newP) { const out = []; for (const [name, page] of Object.entries(COLLECTION_PAGE)) {
    const a = mapById(oldP?.[name] || []), b = mapById(newP?.[name] || []);
    let added = 0, removed = 0, modified = 0;
    for (const [id, x] of b)
        if (!a.has(id))
            added++;
        else if (JSON.stringify(a.get(id)) !== JSON.stringify(x))
            modified++;
    for (const id of a.keys())
        if (!b.has(id))
            removed++;
    if (added || removed || modified)
        out.push({ collection: name, page, added, removed, modified });
} for (const k of ['company', 'settings'])
    if (JSON.stringify(oldP?.[k] || {}) !== JSON.stringify(newP?.[k] || {}))
        out.push({ collection: k, page: 'settings', added: 0, removed: 0, modified: 1 }); return out; }
export function assertStateChangeAllowed(user, oldP, newP, license, moduleAllowed) { const protectedSettings = ['productName', 'productEdition', 'loginTagline', 'loginHeadline', 'loginDescription', 'loginButton', 'sidebarSubtitle', 'sidebarEdition']; for (const k of protectedSettings)
    if (JSON.stringify(oldP?.settings?.[k]) !== JSON.stringify(newP?.settings?.[k]))
        throw Object.assign(new Error('هوية المنتج محمية ولا يمكن تعديلها من نسخة العميل'), { statusCode: 403 }); if (JSON.stringify(oldP?.company?.companyId || '') !== JSON.stringify(newP?.company?.companyId || ''))
    throw Object.assign(new Error('معرّف الشركة محمي ولا يمكن تغييره من داخل النظام'), { statusCode: 403 }); const changes = diffState(oldP, newP); for (const c of changes) {
    const page = String(c.page), module = PAGE_MODULE[page] || '', collection = String(c.collection);
    if (module && !moduleAllowed(license, module))
        throw Object.assign(new Error(`الوحدة ${module} غير مفعلة في الترخيص`), { statusCode: 403 });
    if (c.added && !hasPermission(user, page, 'add') && !hasPermission(user, page, 'edit') && !derivedChangeAllowed(user, oldP, newP, collection, 'added'))
        throw Object.assign(new Error(`لا توجد صلاحية إضافة في ${page}`), { statusCode: 403 });
    if (c.modified && !hasPermission(user, page, 'edit') && !hasPermission(user, page, 'void') && !hasPermission(user, page, 'approve') && !derivedChangeAllowed(user, oldP, newP, collection, 'modified'))
        throw Object.assign(new Error(`لا توجد صلاحية تعديل في ${page}`), { statusCode: 403 });
    if (c.removed && !hasPermission(user, page, 'delete'))
        throw Object.assign(new Error(`لا توجد صلاحية حذف في ${page}`), { statusCode: 403 });
} return changes; }
export function assertBranchChangesAllowed(user, oldP, newP) { const allowed = allowedBranches(user, oldP); if (!allowed)
    return; const assertBranch = (x, msg) => { const bid = String(x?.branchId || ''); if (bid && !allowed.has(bid))
    throw Object.assign(new Error(msg), { statusCode: 403 }); }; for (const name of BRANCH_COLLECTIONS) {
    const old = mapById(oldP?.[name] || []), neu = mapById(newP?.[name] || []);
    for (const [id, x] of neu) {
        const before = old.get(id);
        if (!before || JSON.stringify(before) !== JSON.stringify(x))
            assertBranch(x, 'لا توجد صلاحية على فرع هذه العملية');
    }
    for (const [id, x] of old)
        if (!neu.has(id))
            assertBranch(x, 'لا توجد صلاحية لحذف عملية من هذا الفرع');
} }
export function assertCommercialLimits(user, oldP, newP) { if (user?.role === 'admin' || user?.permissions?.all)
    return; const maxRaw = user?.maxDiscountPct, max = maxRaw == null ? 100 : Math.max(0, Math.min(100, Number(maxRaw) || 0)), old = mapById(oldP?.invoices || []); for (const inv of newP?.invoices || []) {
    if (inv?.kind === 'supplier')
        continue;
    const before = old.get(String(inv?.id || ''));
    if (before && JSON.stringify(before) === JSON.stringify(inv))
        continue;
    for (const l of inv?.lines || []) {
        const gross = Math.max(0, Number(l?.qty) || 0) * Math.max(0, Number(l?.price) || 0), pct = l?.discountMode === 'percent' ? Math.max(0, Number(l?.discount) || 0) : (gross > 0 ? Math.max(0, Number(l?.discount) || 0) / gross * 100 : 0);
        if (pct > max + 0.0001)
            throw Object.assign(new Error(`حد الخصم المسموح لهذا المستخدم ${max}%`), { statusCode: 403 });
    }
} const oldUm = mapById(oldP?.umrahBookings || []); for (const b of newP?.umrahBookings || []) {
    const before = oldUm.get(String(b?.id || ''));
    if (before && JSON.stringify(before) === JSON.stringify(b))
        continue;
    const gross = Math.max(0, Number(b?.total) || 0) + Math.max(0, Number(b?.discount) || 0), disc = Math.max(0, Number(b?.discount) || 0), pct = gross > 0 ? disc / gross * 100 : 0;
    if (pct > max + 0.0001)
        throw Object.assign(new Error(`حد الخصم المسموح لهذا المستخدم ${max}%`), { statusCode: 403 });
    if (disc > 0 && !String(b?.discountReason || '').trim())
        throw Object.assign(new Error('سبب الخصم مطلوب لحجز العمرة'), { statusCode: 403 });
} }
export function assertRecordLifecycle(oldP, newP) {
    const removed = (name) => { const old = mapById(oldP?.[name] || []), neu = mapById(newP?.[name] || []); return [...old.entries()].filter(([id]) => !neu.has(id)).map(([, x]) => x); };
    const conflict = (message) => { throw Object.assign(new Error(message), { statusCode: 409 }); };
    const liveRow = (x) => x && x.active !== false && !['void', 'cancelled', 'reversed', 'deleted'].includes(String(x.status || ''));
    const any = (name, test) => (oldP?.[name] || []).some((x) => test(x));
    const never = ['journals', 'invoiceAdjustments', 'receipts', 'payments', 'transfers', 'cheques', 'cashCounts', 'fxRevaluations'];
    const protectedVisaBatches = new Set((newP?.umrahVisaBatches || []).filter((b) => String(b?.status || '') !== 'cancelled').map((b) => String(b.id || ''))), protectedVisaTraveler = new Map();
    for (const item of newP?.umrahVisaItems || []) {
        if (item?.active === false || !protectedVisaBatches.has(String(item?.batchId || '')))
            continue;
        const traveler = String(item?.travelerId || '');
        if (!traveler)
            continue;
        const previous = protectedVisaTraveler.get(traveler);
        if (previous && previous !== String(item.batchId || ''))
            conflict('لا يمكن تكرار نفس المسافر في أكثر من دفعة تأشيرات غير ملغاة');
        protectedVisaTraveler.set(traveler, String(item.batchId || ''));
    }
    for (const name of never)
        if (removed(name).length)
            conflict(`لا يسمح بالحذف المباشر من ${name}؛ استخدم الإلغاء أو العكس للحفاظ على الأثر المحاسبي`);
    for (const x of removed('invoices')) {
        if (x?.status !== 'draft')
            conflict('الفاتورة المرحلة لا تحذف؛ استخدم الإلغاء/العكس');
        if (any('journals', j => String(j.refId || '') === String(x.id) || j.lines?.some((l) => String(l.invoiceId || '') === String(x.id))) || any('invoiceAdjustments', a => String(a.invoiceId || '') === String(x.id)) || any('receipts', v => (v.allocations || []).some((a) => String(a.invoiceId || '') === String(x.id))) || any('payments', v => (v.allocations || []).some((a) => String(a.invoiceId || '') === String(x.id))) || any('documents', d => String(d.refId || '') === String(x.id)))
            conflict(`لا يمكن حذف الفاتورة ${x.no || ''}: توجد مستندات أو قيود مرتبطة بها`);
    }
    for (const x of removed('expenses'))
        if (x?.status !== 'draft')
            conflict('المصروف المرحل لا يحذف؛ استخدم الإلغاء');
    for (const x of removed('manualJournalDrafts'))
        if (x?.status !== 'draft')
            conflict('القيد المرحل لا يحذف؛ استخدم العكس');
    for (const x of removed('quotations')) {
        if (['converted', 'accepted'].includes(String(x?.status)))
            conflict('عرض السعر المحول/المعتمد لا يحذف؛ ألغِه وفق دورة المستند');
        if (any('invoices', i => String(i.sourceType || '') === 'quotation' && String(i.sourceId || '') === String(x.id)))
            conflict(`لا يمكن حذف عرض السعر ${x.no || ''}: توجد فاتورة مرتبطة به`);
    }
    for (const x of removed('purchaseOrders')) {
        if (['converted', 'received', 'approved', 'void', 'partiallyReceived', 'partiallyInvoiced'].includes(String(x?.status)))
            conflict('أمر الشراء المعتمد أو المنفذ أو المحول لا يحذف');
        const poId = String(x.id || ''), invoiceLinked = any('invoices', i => String(i.sourceType || '') === 'purchaseOrder' && String(i.sourceId || '') === poId), newCommitments = mapById(newP?.umrahSupplierCommitments || []), activeCommitmentLinked = (oldP?.umrahSupplierCommitments || []).some((c) => { if (String(c.hostPOId || '') !== poId)
            return false; const after = newCommitments.get(String(c.id || '')); return !!after && after.active !== false && String(after.status || '') !== 'cancelled' && String(after.hostPOId || '') === poId; });
        if (invoiceLinked || activeCommitmentLinked)
            conflict(`لا يمكن حذف أمر الشراء ${x.no || ''}: توجد فاتورة أو التزام مورد نشط مرتبط`);
    }
    for (const x of removed('documents'))
        if (x?.refId)
            conflict('المستند النظامي المرتبط بعملية لا يحذف من مركز المستندات');
    const masterRules = {
        customers: [['invoices', (x, id) => x.partyType === 'customer' && String(x.partyId || '') === id], ['receipts', (x, id) => x.partyType === 'customer' && String(x.partyId || '') === id], ['bookings', (x, id) => String(x.customerId || '') === id], ['umrahBookings', (x, id) => String(x.customerId || '') === id]],
        suppliers: [['invoices', (x, id) => x.kind === 'supplier' && String(x.partyId || '') === id], ['payments', (x, id) => x.partyType === 'supplier' && String(x.partyId || '') === id], ['purchaseOrders', (x, id) => String(x.supplierId || '') === id], ['umrahSupplierCommitments', (x, id) => String(x.supplierId || '') === id]],
        agents: [['invoices', (x, id) => x.partyType === 'agent' && String(x.partyId || '') === id], ['commissions', (x, id) => String(x.agentId || '') === id], ['umrahBookings', (x, id) => String(x.sourceRefId || '') === id]],
        accounts: [['journals', (x, id) => x.lines?.some((l) => String(l.accountId || '') === id)], ['invoices', (x, id) => [x.revenueAccountId, x.expenseAccountId].map(String).includes(id)]],
        costCenters: [['journals', (x, id) => String(x.costCenterId || '') === id || x.lines?.some((l) => String(l.costCenterId || '') === id)], ['invoices', (x, id) => String(x.costCenterId || '') === id], ['purchaseOrders', (x, id) => String(x.costCenterId || '') === id], ['umrahPrograms', (x, id) => String(x.costCenterId || '') === id]],
        treasuries: [['receipts', (x, id) => String(x.treasuryId || '') === id], ['payments', (x, id) => String(x.treasuryId || '') === id], ['transfers', (x, id) => String(x.from || '') === id || String(x.to || '') === id], ['cheques', (x, id) => String(x.treasuryId || '') === id]],
        currencies: [['invoices', (x, id) => String(x.currency || '') === id], ['receipts', (x, id) => String(x.currency || '') === id], ['payments', (x, id) => String(x.currency || '') === id], ['journals', (x, id) => x.lines?.some((l) => String(l.currency || '') === id)]],
        taxCodes: [['invoices', (x, id) => x.lines?.some((l) => String(l.taxId || '') === id)], ['expenses', (x, id) => String(x.taxId || '') === id]]
    };
    for (const [master, rules] of Object.entries(masterRules))
        for (const x of removed(master)) {
            const id = String(x.id || x.code || '');
            const hit = rules.find(([name, test]) => any(name, (row) => liveRow(row) && test(row, id)));
            if (hit)
                conflict(`لا يمكن حذف ${x.name || x.label || x.code || id}: السجل مستخدم في ${hit[0]}. استخدم التعليق/الإيقاف بدل الحذف`);
        }
    for (const x of removed('programs'))
        if (any('bookings', b => String(b.programId || '') === String(x.id)) || any('services', s => String(s.programId || '') === String(x.id)) || any('invoices', i => String(i.programId || '') === String(x.id)))
            conflict(`لا يمكن حذف البرنامج ${x.no || ''}: توجد حجوزات أو خدمات أو فواتير مرتبطة`);
    for (const x of removed('bookings'))
        if (any('invoices', i => String(i.bookingId || i.sourceId || '') === String(x.id)) || any('receipts', r => String(r.bookingId || '') === String(x.id)))
            conflict(`لا يمكن حذف الحجز ${x.no || ''}: توجد فاتورة أو حركة قبض مرتبطة`);
    for (const x of removed('umrahPrograms'))
        if (any('umrahBookings', b => String(b.programId || '') === String(x.id)) || any('invoices', i => String(i.programId || '') === String(x.id)) || any('purchaseOrders', p => String(p.programId || '') === String(x.id)) || any('journals', j => String(j.programId || '') === String(x.id)))
            conflict(`لا يمكن حذف برنامج الحج/العمرة ${x.no || ''}: توجد معاملات مرتبطة؛ استخدم الإلغاء أو الاحتفاظ الرقابي`);
}
function assertFieldsUnchanged(before, after, fields, label) { for (const k of fields)
    if (JSON.stringify(before?.[k]) !== JSON.stringify(after?.[k]))
        throw Object.assign(new Error(`${label}: لا يمكن تعديل ${k} بعد الترحيل؛ استخدم الإلغاء أو العكس ثم أنشئ مستندًا صحيحًا`), { statusCode: 409 }); }
export function assertFinancialImmutability(oldP, newP) {
    const compare = (name, fields, locked, label) => { const old = mapById(oldP?.[name] || []), neu = mapById(newP?.[name] || []); for (const [id, before] of old) {
        const after = neu.get(id);
        if (after && locked(before))
            assertFieldsUnchanged(before, after, fields, label);
    } };
    const notDraft = (x) => String(x?.status || '') !== 'draft';
    compare('invoices', ['id', 'no', 'date', 'kind', 'partyType', 'partyId', 'currency', 'dueDate', 'lines', 'baseRate', 'costCenterId', 'revenueAccountId', 'expenseAccountId', 'programId', 'bookingId'], notDraft, 'الفاتورة المرحلة/الملغاة');
    compare('receipts', ['id', 'no', 'date', 'partyType', 'partyId', 'treasuryId', 'amount', 'currency', 'note', 'paymentMethod', 'referenceNo', 'bankName', 'valueDate', 'allocations'], notDraft, 'سند القبض المرحل/الملغى');
    compare('payments', ['id', 'no', 'date', 'partyType', 'partyId', 'treasuryId', 'amount', 'currency', 'note', 'paymentMethod', 'referenceNo', 'bankName', 'valueDate', 'commissionId', 'agentSettlement', 'allocations'], notDraft, 'سند الصرف المرحل/الملغى');
    compare('expenses', ['id', 'no', 'date', 'category', 'amount', 'currency', 'mode', 'treasuryId', 'supplierId', 'description', 'costCenterId', 'months', 'expenseAccountId', 'taxId'], notDraft, 'المصروف المرحل/الملغى');
    compare('journals', ['id', 'no', 'date', 'memo', 'refType', 'refId', 'costCenterId', 'lines', 'createdAt', 'createdBy'], x => ['posted', 'reversed'].includes(String(x?.status)), 'القيد المرحل/المعكوس');
    compare('manualJournalDrafts', ['id', 'no', 'date', 'memo', 'lines', 'journalId', 'createdAt', 'createdBy'], notDraft, 'القيد اليدوي المرحل/الملغى');
    compare('invoiceAdjustments', ['id', 'no', 'date', 'invoiceId', 'kind', 'type', 'effect', 'amount', 'advanceEffect', 'currency', 'reason', 'partyId', 'partyType'], notDraft, 'إشعار الفاتورة المرحل/الملغى');
    compare('transfers', ['id', 'no', 'date', 'from', 'to', 'amount', 'sourceCurrency', 'received', 'targetCurrency', 'note'], notDraft, 'التحويل المرحل/الملغى');
    const poLineFingerprint = (po, l) => ({ description: String(l?.description || ''), qty: Number(l?.qty || 0), price: Number(l?.price || 0), taxId: String(l?.taxId || 'TAX0'), accountId: String(l?.accountId || (po?.sourceType === 'umrah-procurement' ? '5110' : '5100')), costCenterId: String(l?.costCenterId || po?.costCenterId || '') });
    const oldPO = mapById(oldP?.purchaseOrders || []), newPO = mapById(newP?.purchaseOrders || []);
    for (const [id, before] of oldPO) {
        const after = newPO.get(id);
        if (!after || String(before?.status || '') === 'draft')
            continue;
        assertFieldsUnchanged(before, after, ['id', 'no', 'date', 'supplierId', 'currency', 'expectedDate', 'programId', 'costCenterId'], 'أمر الشراء المعتمد/الملغى');
        const a = (before?.lines || []).map((l) => poLineFingerprint(before, l)), b = (after?.lines || []).map((l) => poLineFingerprint(after, l));
        if (JSON.stringify(a) !== JSON.stringify(b))
            throw Object.assign(new Error('أمر الشراء المعتمد/الملغى: لا يمكن تعديل البنود المالية بعد الترحيل؛ استخدم الإلغاء أو العكس ثم أنشئ مستندًا صحيحًا'), { statusCode: 409 });
    }
    compare('quotations', ['id', 'no', 'date', 'customerId', 'currency', 'validUntil', 'lines'], x => ['accepted', 'converted', 'void', 'cancelled'].includes(String(x?.status)), 'عرض السعر المعتمد/الملغى');
    compare('umrahBookings', ['id', 'no', 'date', 'programId', 'customerId', 'sourceType', 'sourceRefId', 'counts', 'persons', 'primaryRoomType', 'roomPlan', 'discount', 'currency', 'total'], x => !['inquiry', 'quotation', 'hold', 'waitlist'].includes(String(x?.status)), 'حجز الحج/العمرة المؤكد/الملغى');
    compare('umrahPrograms', ['id', 'no', 'seasonId', 'programType', 'departureDate', 'returnDate', 'capacity', 'currency', 'pricing', 'costCenterId'], x => !['planning', 'contracting', 'pricing'].includes(String(x?.status)), 'برنامج الحج/العمرة المفتوح/الملغى');
    compare('cashCounts', ['id', 'no', 'date', 'treasuryId', 'system', 'actual', 'diff', 'currency', 'differencePosted', 'differenceAccountId'], x => true, 'جرد الخزنة');
    compare('fxRevaluations', ['id', 'no', 'date', 'items', 'lines'], x => true, 'إعادة تقييم العملة');
    compare('cheques', ['id', 'direction', 'voucherId', 'no', 'bankName', 'valueDate', 'currency', 'amount', 'carryingBase', 'treasuryId', 'date'], x => true, 'الشيك المسجل');
}
function rateAt(payload, code, date) { const base = String(payload?.settings?.baseCurrency || 'EGP').toUpperCase(), cur = String(code || base).toUpperCase(); if (cur === base)
    return 1; let best = null; for (const r of payload?.fxRates || [])
    if (String(r?.code || '').toUpperCase() === cur && String(r?.date || '') <= String(date || '9999-12-31') && (!best || String(r.date) >= String(best.date)))
        best = r; return Math.max(0, Number(best?.rate) || 0); }
function expectedApprovalBase(x, payload) { if (x?.type === 'payment') {
    const p = x.payload || {}, amount = Math.max(0, Number(p.amount) || 0), date = String(p.date || new Date().toISOString().slice(0, 10)), rate = rateAt(payload, p.currency, date);
    return amount * rate;
} if (x?.type === 'expense') {
    const e = (payload?.expenses || []).find((z) => String(z?.id || '') === String(x?.payload?.expenseId || ''));
    if (!e)
        return NaN;
    const tax = (payload?.taxCodes || []).find((z) => String(z?.id || '') === String(e.taxId || 'TAX0')), gross = Math.max(0, Number(e.amount) || 0) * (1 + Math.max(0, Number(tax?.rate) || 0) / 100), rate = rateAt(payload, e.currency, e.date);
    return gross * rate;
} if (x?.type === 'commission') {
    const c = (payload?.commissions || []).find((z) => String(z?.id || '') === String(x?.payload?.commissionId || ''));
    if (!c)
        return NaN;
    return Math.max(0, Number(c.amount) || 0) * rateAt(payload, c.currency, c.date);
} return NaN; }
function approvalImmutableChanged(a, b) { for (const k of ['id', 'no', 'type', 'payload', 'baseAmount', 'requestedAt', 'requestedBy'])
    if (JSON.stringify(a?.[k]) !== JSON.stringify(b?.[k]))
        return true; return false; }
export function assertApprovalWorkflow(user, oldP, newP) { const old = mapById(oldP?.approvals || []), neu = mapById(newP?.approvals || []), settings = newP?.settings || {}; for (const [id, x] of neu) {
    const before = old.get(id);
    if (!before) {
        if (x?.status !== 'pending' || String(x?.requestedBy || '') !== String(user?.id || ''))
            throw Object.assign(new Error('طلب الاعتماد الجديد يجب أن يكون معلقًا ومقدمًا بواسطة المستخدم الحالي'), { statusCode: 403 });
        const sourceOk = x?.type === 'payment' ? hasPermission(user, 'payments', 'add') : x?.type === 'expense' ? (hasPermission(user, 'expenses', 'add') || hasPermission(user, 'expenses', 'edit')) : x?.type === 'commission' ? (hasPermission(user, 'agents', 'add') || hasPermission(user, 'agents', 'edit') || hasPermission(user, 'services', 'add') || hasPermission(user, 'services', 'edit')) : false;
        if (!sourceOk)
            throw Object.assign(new Error('لا توجد صلاحية لإنشاء طلب الاعتماد لهذه العملية'), { statusCode: 403 });
        const expected = expectedApprovalBase(x, newP), actual = Number(x?.baseAmount || 0), tol = Math.max(.02, Math.abs(expected || 0) * 1e-8);
        if (!Number.isFinite(expected) || expected <= 0 || Math.abs(actual - expected) > tol)
            throw Object.assign(new Error('قيمة طلب الاعتماد لا تطابق قيمة العملية الأصلية'), { statusCode: 409 });
        continue;
    }
    if (before?.status !== 'pending') {
        if (JSON.stringify(before) !== JSON.stringify(x))
            throw Object.assign(new Error('طلب الاعتماد المنتهي غير قابل للتعديل'), { statusCode: 409 });
        continue;
    }
    if (approvalImmutableChanged(before, x))
        throw Object.assign(new Error('لا يمكن تغيير مبلغ أو بيانات طلب الاعتماد بعد إرساله'), { statusCode: 409 });
    if (!['pending', 'approved', 'rejected'].includes(String(x?.status || '')))
        throw Object.assign(new Error('حالة طلب الاعتماد غير صحيحة'), { statusCode: 409 });
    if (x.status === 'pending') {
        if (JSON.stringify(before) !== JSON.stringify(x))
            throw Object.assign(new Error('طلب الاعتماد المعلق لا يعدّل؛ ارفضه وأنشئ طلبًا جديدًا'), { statusCode: 409 });
        continue;
    }
    if (x.status === 'approved') {
        if (!hasPermission(user, 'approvals', 'approve'))
            throw Object.assign(new Error('لا توجد صلاحية لاعتماد الطلب'), { statusCode: 403 });
        if (settings.allowSelfApproval !== true && String(before.requestedBy || '') === String(user?.id || ''))
            throw Object.assign(new Error('لا يجوز لطالب العملية اعتماد طلبه بنفسه'), { statusCode: 403 });
        const limit = user?.role === 'admin' || user?.permissions?.all ? Infinity : Math.max(0, Number(user?.approvalLimit) || 0);
        if (Number(before.baseAmount || 0) > limit + 0.0001)
            throw Object.assign(new Error(`قيمة الطلب تتجاوز حد اعتماد المستخدم ${limit}`), { statusCode: 403 });
        if (String(x?.approvedBy || '') !== String(user?.id || '') || !String(x?.approvedAt || '').trim())
            throw Object.assign(new Error('بيانات جهة الاعتماد أو تاريخه غير صحيحة'), { statusCode: 403 });
        continue;
    }
    if (x.status === 'rejected') {
        const canReject = String(before.requestedBy || '') === String(user?.id || '') || hasPermission(user, 'approvals', 'approve');
        if (!canReject)
            throw Object.assign(new Error('لا توجد صلاحية لرفض أو إلغاء طلب الاعتماد'), { statusCode: 403 });
        if (String(x?.rejectedBy || '') !== String(user?.id || '') || !String(x?.rejectedAt || '').trim() || !String(x?.reason || '').trim())
            throw Object.assign(new Error('سبب الرفض وبيانات منفذ الرفض مطلوبة'), { statusCode: 403 });
    }
} }
