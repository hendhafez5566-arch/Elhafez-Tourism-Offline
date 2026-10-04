// READ-ONLY. Compares what the company state looks like from the JSON payload vs from the row mirror (erp_entity_records).
// Usage: DATABASE_URL=postgres://... node scripts/state-verify-cli.mjs [--tenant default]
// It never writes. Run it on a COPY of real data first. NOT TESTED against a live PostgreSQL by the author.
import pg from 'pg';
import { fingerprint, compare } from './lib/state-verify.mjs';
const url = process.env.DATABASE_URL; if (!url) { console.error('DATABASE_URL is required'); process.exit(2); }
const ti = process.argv.indexOf('--tenant'), tenant = ti > 0 ? process.argv[ti + 1] : 'default';
const c = new pg.Client({ connectionString: url }); await c.connect();
try {
  await c.query('begin read only');
  const s = await c.query('select payload, storage_mode, revision, entity_row_count from erp_state where tenant_key=$1', [tenant]);
  if (!s.rowCount) { console.error('tenant not found: ' + tenant); process.exit(2); }
  const { payload, storage_mode, revision, entity_row_count } = s.rows[0];
  const rows = await c.query('select collection_key, ordinal, data from erp_entity_records where tenant_key=$1 order by collection_key, ordinal, entity_id', [tenant]);
  const fromRows = {}; for (const r of rows.rows) (fromRows[r.collection_key] ||= []).push(r.data);
  console.log(`tenant=${tenant} storage_mode=${storage_mode} revision=${revision} mirror_rows=${rows.rowCount} expected_rows=${entity_row_count}`);
  if (storage_mode === 'entity-backed') {
    console.log('Company is entity-backed: collections live only in rows, so there is no JSON copy to compare. Reporting the rows fingerprint only.');
    const f = fingerprint(fromRows); console.log(JSON.stringify({ counts: f.counts, totalsByCurrency: f.totalsByCurrency, duplicates: f.dupIds, missingIds: f.missingIds }, null, 1));
    process.exit(f.dupIds.length || f.missingIds.length || Object.values(f.totalsByCurrency).some(t => t.debit !== t.credit) ? 1 : 0);
  }
  const res = compare(fingerprint(payload), fingerprint(fromRows));
  console.log(res.ok ? 'OK: JSON payload and mirror rows are identical in counts, content, trial balance and party balances.' : 'MISMATCH:\n - ' + res.problems.slice(0, 50).join('\n - '));
  if (res.unbalancedBefore.length) console.log('WARNING: the source data itself is unbalanced in currencies: ' + res.unbalancedBefore.join(','));
  process.exit(res.ok ? 0 : 1);
} finally { await c.query('rollback').catch(() => {}); await c.end(); }
