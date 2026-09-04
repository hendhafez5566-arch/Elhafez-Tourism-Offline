function clone(value) { return structuredClone(value); }
export function applyStatePatch(base, patch) {
    if (!base || typeof base !== 'object' || !patch || typeof patch !== 'object')
        throw Object.assign(new Error('state_patch_invalid'), { statusCode: 400 });
    const out = clone(base);
    for (const key of Array.isArray(patch.unset) ? patch.unset : [])
        if (typeof key === 'string')
            delete out[key];
    for (const [key, value] of Object.entries(patch.set || {}))
        out[key] = clone(value);
    for (const [key, raw] of Object.entries(patch.arrays || {})) {
        const change = raw || {}, before = Array.isArray(out[key]) ? out[key] : [], map = new Map();
        for (const item of before) {
            const id = String(item?.id || '');
            if (id)
                map.set(id, item);
        }
        for (const id0 of Array.isArray(change.deletes) ? change.deletes : [])
            map.delete(String(id0));
        const added = [];
        for (const item of Array.isArray(change.upserts) ? change.upserts : []) {
            const id = String(item?.id || '');
            if (!id)
                throw Object.assign(new Error(`state_patch_record_id_required:${key}`), { statusCode: 400 });
            if (!map.has(id))
                added.push(id);
            map.set(id, clone(item));
        }
        const order = Array.isArray(change.order) ? change.order.map(String) : null;
        if (order) {
            const seen = new Set(), items = [];
            for (const id of order) {
                if (seen.has(id) || !map.has(id))
                    continue;
                seen.add(id);
                items.push(map.get(id));
            }
            for (const [id, item] of map)
                if (!seen.has(id))
                    items.push(item);
            out[key] = items;
        }
        else {
            const seen = new Set(), items = [];
            for (const item of before) {
                const id = String(item?.id || '');
                if (!id || seen.has(id) || !map.has(id))
                    continue;
                seen.add(id);
                items.push(map.get(id));
            }
            for (const id of added)
                if (!seen.has(id) && map.has(id)) {
                    seen.add(id);
                    items.push(map.get(id));
                }
            for (const [id, item] of map)
                if (!seen.has(id))
                    items.push(item);
            out[key] = items;
        }
    }
    return out;
}
