// Part 5 (partial) — unit test of the before/after verification logic using a large synthetic Arabic dataset. No DB.
import { fingerprint, compare } from './lib/state-verify.mjs';
let failed = 0; const ok = (n, c, x = '') => { console.log(`${c ? 'PASS' : 'FAIL'} ${n}${c ? '' : ' ' + x}`); if (!c) failed++; };
const first = ['محمد','أحمد','محمود','عبدالرحمن','فاطمة','نور','إبراهيم','عُمر','سلمى','يوسف'], last = ['الحافظ','السيد','عبد العال','الشناوي','أبو زيد','القاضي'];
const customers = [], journals = [];
for (let i = 1; i <= 5000; i++) customers.push({ id: 'c' + i, no: 'C-' + String(i).padStart(5, '0'), name: `${first[i % 10]} ${last[i % 6]} ${i % 97 === 0 ? '<b>"x"</b>' : ''}`, phone: '01' + (100000000 + i), notes: i % 50 === 0 ? 'ملاحظة\nبسطرين' : '' });
for (let i = 1; i <= 20000; i++) { const amt = Math.round((100 + (i * 37) % 9000) * 100) / 100, cur = i % 7 === 0 ? 'SAR' : 'EGP', cid = 'c' + (1 + i % 5000); journals.push({ id: 'j' + i, date: '2026-0' + (1 + i % 9) + '-15', lines: [{ accountId: '1300', debit: amt, currency: cur, partyType: 'customer', partyId: cid }, { accountId: '4100', credit: amt, currency: cur }] }); }
journals.push({ id: 'jfrac', lines: [{ accountId: '1100', debit: 0.1, currency: 'EGP' }, { accountId: '1100', debit: 0.2, currency: 'EGP' }, { accountId: '3100', credit: 0.3, currency: 'EGP' }] });
const payload = { customers, journals, invoices: [], bookings: [] };
const t0 = Date.now(), A = fingerprint(payload), ms = Date.now() - t0;
ok('fingerprint of 5000 customers + 20001 journals completes', ms < 10000, ms + 'ms');
ok('counts correct', A.counts.customers === 5000 && A.counts.journals === 20001);
ok('journals balanced per currency (incl. 0.1+0.2=0.3 float case)', compare(A, A).ok, JSON.stringify(compare(A, A).problems));
const clone = JSON.parse(JSON.stringify(payload)); clone.customers.reverse();
ok('record order does not matter (same data, reordered)', compare(A, fingerprint(clone)).ok);
const lost = JSON.parse(JSON.stringify(payload)); lost.customers.pop();
ok('detects a lost customer', !compare(A, fingerprint(lost)).ok);
const edited = JSON.parse(JSON.stringify(payload)); edited.customers[10].name += ' ';
ok('detects silent field edit (content hash)', compare(A, fingerprint(edited)).problems.some(p => p.includes('content differs in customers')));
const money = JSON.parse(JSON.stringify(payload)); money.journals[5].lines[0].debit += 1; money.journals[5].lines[1].credit += 1;
ok('detects balanced-but-changed amounts (trial balance + party balance)', compare(A, fingerprint(money)).problems.some(p => p.startsWith('trial balance')) && compare(A, fingerprint(money)).problems.some(p => p.startsWith('party balance')));
const unb = JSON.parse(JSON.stringify(payload)); unb.journals[3].lines[0].debit += 5;
ok('detects debit != credit', compare(A, fingerprint(unb)).problems.some(p => p.startsWith('NOT BALANCED')));
const dup = JSON.parse(JSON.stringify(payload)); dup.customers.push({ ...dup.customers[0] });
ok('reports duplicate ids', fingerprint(dup).dupIds.length === 1);
console.log(`(timing: ${ms}ms)`);
if (failed) { console.error(failed + ' failed'); process.exit(1); } console.log('\nState verify smoke passed');
