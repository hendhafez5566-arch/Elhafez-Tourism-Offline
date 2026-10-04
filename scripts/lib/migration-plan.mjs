// Part 5 — pure planning logic for legacy-full -> entity-backed. No DB. Mirrors server/src/entity-mirror*.ts rules.
import { COLLECTIONS } from './state-verify.mjs';
export function buildPlan(payload) {
  const reasons = [], rows = [], presentKeys = [];
  let rowCount = 0;
  for (const name of COLLECTIONS) {
    if (!Object.prototype.hasOwnProperty.call(payload || {}, name)) continue;
    presentKeys.push(name);
    const list = payload[name];
    if (!Array.isArray(list)) { reasons.push(`${name}: not an array`); continue; }
    const ids = new Set();
    list.forEach((item, i) => {
      const id = String(item?.id || '');
      if (!id) { reasons.push(`${name}[${i}]: missing id`); return; }
      if (ids.has(id)) { reasons.push(`${name}: duplicate id ${id}`); return; }
      ids.add(id); rows.push({ collection_key: name, entity_id: id, ordinal: i, data: item }); rowCount++;
    });
  }
  const stripped = structuredClone(payload || {});
  for (const k of COLLECTIONS) delete stripped[k];
  return { safe: reasons.length === 0, reasons, rows, presentKeys, rowCount, stripped };
}
// Same as hydrateMirroredPayload in server/src/entity-mirror-core.ts (rows ordered by collection_key, ordinal, entity_id).
export function hydrate(stripped, rows, presentKeys) {
  const out = structuredClone(stripped || {}), present = new Set(presentKeys);
  for (const k of present) out[k] = [];
  const ordered = [...rows].sort((a, b) => a.collection_key < b.collection_key ? -1 : a.collection_key > b.collection_key ? 1 : a.ordinal - b.ordinal || (a.entity_id < b.entity_id ? -1 : 1));
  for (const r of ordered) if (present.has(r.collection_key)) out[r.collection_key].push(structuredClone(r.data));
  return out;
}
