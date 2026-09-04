const same = (a, b) => JSON.stringify(a) === JSON.stringify(b), own = (o, k) => Object.prototype.hasOwnProperty.call(o || {}, k);
const conflict = (path) => { throw Object.assign(new Error('تم تحديث البيانات من جلسة أخرى. أعد تحميل الصفحة وراجع آخر تعديل.'), { statusCode: 409, code: 'state_conflict', conflictPath: path || 'root' }); };
function mergeNode(base, submitted, current, path) {
    if (same(submitted, base))
        return structuredClone(current);
    if (same(current, base) || same(submitted, current))
        return structuredClone(submitted);
    if (path === 'meta.updatedAt')
        return structuredClone(submitted);
    if (Array.isArray(base) && Array.isArray(submitted) && Array.isArray(current)) {
        const recordArray = [...base, ...submitted, ...current].every(x => x && typeof x === 'object' && !Array.isArray(x) && String(x.id || ''));
        if (!recordArray)
            return conflict(path);
        const bm = new Map(base.map(x => [String(x.id), x])), sm = new Map(submitted.map(x => [String(x.id), x])), cm = new Map(current.map(x => [String(x.id), x])), ids = new Set([...bm.keys(), ...sm.keys(), ...cm.keys()]), merged = new Map();
        for (const id of ids) {
            const b = bm.get(id), s = sm.get(id), c = cm.get(id), p = `${path}[${id}]`;
            if (b === undefined) {
                if (s !== undefined && c !== undefined && !same(s, c))
                    conflict(p);
                if (s !== undefined || c !== undefined)
                    merged.set(id, structuredClone(s ?? c));
                continue;
            }
            if (s === undefined) {
                if (c !== undefined && !same(c, b))
                    conflict(p);
                continue;
            }
            if (c === undefined) {
                if (!same(s, b))
                    conflict(p);
                continue;
            }
            merged.set(id, mergeNode(b, s, c, p));
        }
        const order = [...submitted, ...current].map(x => String(x.id));
        return [...new Set(order)].filter(id => merged.has(id)).map(id => merged.get(id));
    }
    if (base && submitted && current && typeof base === 'object' && typeof submitted === 'object' && typeof current === 'object' && !Array.isArray(base) && !Array.isArray(submitted) && !Array.isArray(current)) {
        const out = {}, keys = new Set([...Object.keys(base), ...Object.keys(submitted), ...Object.keys(current)]);
        for (const k of keys) {
            const bp = own(base, k), sp = own(submitted, k), cp = own(current, k), p = path ? `${path}.${k}` : k;
            if (!bp) {
                if (sp && cp && !same(submitted[k], current[k]))
                    conflict(p);
                if (sp || cp)
                    out[k] = structuredClone(sp ? submitted[k] : current[k]);
                continue;
            }
            if (!sp) {
                if (cp && !same(current[k], base[k]))
                    conflict(p);
                continue;
            }
            if (!cp) {
                if (!same(submitted[k], base[k]))
                    conflict(p);
                continue;
            }
            out[k] = mergeNode(base[k], submitted[k], current[k], p);
        }
        return out;
    }
    return conflict(path);
}
export function mergeConcurrentPayload(base, submitted, current) { if (!base || typeof base !== 'object')
    return conflict('base'); return mergeNode(base, submitted, current, ''); }
