export const MIRRORED_COLLECTION_KEYS = [
    'customers', 'suppliers', 'agents', 'quotations', 'purchaseOrders', 'programs', 'bookings', 'travelers', 'services',
    'invoices', 'invoiceAdjustments', 'receipts', 'payments', 'expenses', 'transfers', 'cheques', 'commissions', 'journals', 'manualJournalDrafts', 'cashCounts', 'bankReconciliations', 'fxRevaluations', 'approvals',
    'umrahSeasons', 'umrahHotelContracts', 'umrahFlightBlocks', 'umrahTransportContracts', 'umrahVisaContracts', 'umrahContractReservations', 'umrahPrograms', 'umrahProgramSegments', 'umrahProgramCosts', 'umrahBookings', 'umrahTravelers', 'umrahHotelRooms', 'umrahVisaBatches', 'umrahVisaItems', 'umrahTickets', 'umrahBusRuns', 'umrahOperationTasks', 'umrahIncidents', 'umrahSupplierCommitments'
];
export const MIRRORED_COLLECTIONS = new Set(MIRRORED_COLLECTION_KEYS);
export function mirrorPayloadSummary(payload) {
    let rowCount = 0, safe = true;
    const presentKeys = [];
    for (const name of MIRRORED_COLLECTION_KEYS) {
        if (!Object.prototype.hasOwnProperty.call(payload || {}, name))
            continue;
        presentKeys.push(name);
        const list = payload?.[name];
        if (!Array.isArray(list)) {
            safe = false;
            continue;
        }
        const ids = new Set();
        for (const item of list) {
            const id = String(item?.id || '');
            if (!id || ids.has(id)) {
                safe = false;
                continue;
            }
            ids.add(id);
            rowCount++;
        }
    }
    return { safe, rowCount, presentKeys };
}
export function hydrateMirroredPayload(base, rows, presentKeys) {
    const out = structuredClone(base || {}), present = new Set([...presentKeys].map(String));
    for (const name of present)
        if (MIRRORED_COLLECTIONS.has(name))
            out[name] = [];
    for (const row of rows || []) {
        const name = String(row.collection_key || '');
        if (!present.has(name) || !MIRRORED_COLLECTIONS.has(name))
            continue;
        (out[name] || (out[name] = [])).push(structuredClone(row.data));
    }
    return out;
}
