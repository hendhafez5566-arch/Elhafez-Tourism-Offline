// Part 5 (partial) — pure verification logic: builds a comparable "fingerprint" from a company payload.
// No database access here, so it can be unit-tested. The CLI (scripts/state-verify-cli.mjs) feeds it
// the payload loaded from the OLD storage and from the NEW storage; the two fingerprints must be identical.
export const COLLECTIONS = ['customers','suppliers','agents','quotations','purchaseOrders','programs','bookings','travelers','services','invoices','invoiceAdjustments','receipts','payments','expenses','transfers','cheques','commissions','journals','manualJournalDrafts','cashCounts','bankReconciliations','fxRevaluations','approvals','umrahSeasons','umrahHotelContracts','umrahFlightBlocks','umrahTransportContracts','umrahVisaContracts','umrahContractReservations','umrahPrograms','umrahProgramSegments','umrahProgramCosts','umrahBookings','umrahTravelers','umrahHotelRooms','umrahVisaBatches','umrahVisaItems','umrahTickets','umrahBusRuns','umrahOperationTasks','umrahIncidents','umrahSupplierCommitments'];
const n = v => { const x = Number(v); return Number.isFinite(x) ? x : 0; };
const r2 = v => Math.round((v + Number.EPSILON) * 100) / 100;
export function fingerprint(payload) {
  const p = payload || {};
  const counts = {}, dupIds = [], missingIds = [];
  for (const k of COLLECTIONS) {
    const list = Array.isArray(p[k]) ? p[k] : [];
    counts[k] = list.length;
    const seen = new Set();
    for (const it of list) { const id = String(it?.id ?? ''); if (!id) { missingIds.push(k); continue; } if (seen.has(id)) dupIds.push(`${k}:${id}`); seen.add(id); }
  }
  // Trial balance per (account, currency): debit/credit exactly as stored on journal lines.
  const tb = {}, totals = {};
  for (const j of Array.isArray(p.journals) ? p.journals : []) for (const l of j?.lines || []) {
    const cur = String(l.currency || ''), key = `${l.accountId ?? ''}|${cur}`;
    const t = (tb[key] ||= { debit: 0, credit: 0 }); t.debit += n(l.debit); t.credit += n(l.credit);
    const g = (totals[cur] ||= { debit: 0, credit: 0 }); g.debit += n(l.debit); g.credit += n(l.credit);
  }
  for (const t of Object.values(tb)) { t.debit = r2(t.debit); t.credit = r2(t.credit); }
  for (const t of Object.values(totals)) { t.debit = r2(t.debit); t.credit = r2(t.credit); }
  // Party balances: per (partyType, partyId, currency) net of journal lines that carry a party.
  const parties = {};
  for (const j of Array.isArray(p.journals) ? p.journals : []) for (const l of j?.lines || []) {
    if (!l.partyId) continue;
    const key = `${l.partyType || ''}|${l.partyId}|${l.currency || ''}`;
    parties[key] = r2((parties[key] || 0) + n(l.debit) - n(l.credit));
  }
  // Content hash of every record (order-independent) catches silent field loss that counts cannot.
  const content = {};
  for (const k of COLLECTIONS) { const m = {}; for (const it of Array.isArray(p[k]) ? p[k] : []) if (it?.id != null) m[String(it.id)] = stable(it); content[k] = hash(JSON.stringify(Object.entries(m).sort(([a],[b]) => a < b ? -1 : a > b ? 1 : 0))); }
  return { counts, dupIds, missingIds, trialBalance: tb, totalsByCurrency: totals, partyBalances: parties, contentHash: content };
}
function stable(v) { if (Array.isArray(v)) return v.map(stable); if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map(k => [k, stable(v[k])])); return v; }
function hash(s) { let h1 = 0xdeadbeef, h2 = 0x41c6ce57; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16) + ':' + s.length; }
export function compare(before, after) {
  const problems = [];
  for (const k of COLLECTIONS) { if (before.counts[k] !== after.counts[k]) problems.push(`count ${k}: ${before.counts[k]} -> ${after.counts[k]}`); if (before.contentHash[k] !== after.contentHash[k]) problems.push(`content differs in ${k}`); }
  const keys = new Set([...Object.keys(before.trialBalance), ...Object.keys(after.trialBalance)]);
  for (const k of keys) { const a = before.trialBalance[k] || { debit: 0, credit: 0 }, b = after.trialBalance[k] || { debit: 0, credit: 0 }; if (a.debit !== b.debit || a.credit !== b.credit) problems.push(`trial balance ${k}: ${a.debit}/${a.credit} -> ${b.debit}/${b.credit}`); }
  const pk = new Set([...Object.keys(before.partyBalances), ...Object.keys(after.partyBalances)]);
  for (const k of pk) if ((before.partyBalances[k] || 0) !== (after.partyBalances[k] || 0)) problems.push(`party balance ${k}: ${before.partyBalances[k] || 0} -> ${after.partyBalances[k] || 0}`);
  for (const [cur, t] of Object.entries(after.totalsByCurrency)) if (t.debit !== t.credit) problems.push(`NOT BALANCED after (${cur || 'no-currency'}): debit ${t.debit} != credit ${t.credit}`);
  return { ok: problems.length === 0, problems, unbalancedBefore: Object.entries(before.totalsByCurrency).filter(([, t]) => t.debit !== t.credit).map(([c]) => c) };
}
