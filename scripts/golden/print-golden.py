#!/usr/bin/env python3
"""Golden test for printed documents (invoice, receipt/payment vouchers, expense, transfer, statements).
Captures the exact HTML handed to Print.show() with a frozen clock and seeded Math.random, and compares it to
scripts/golden/expected/*.html byte for byte.
  python scripts/golden/print-golden.py            compare (exit 1 on any difference, 3 when no browser is available)
  python scripts/golden/print-golden.py --update   (re)write the expected files - only for an INTENDED output change
Run `npm run build` first (it reads dist/app.js)."""
import asyncio, sys, json, pathlib, difflib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _boot import *
EXPECTED = pathlib.Path(__file__).resolve().parent / 'expected'
SEED = """async()=>{
  const out={};const cap=[];const orig=Print.show;Print.show=function(html,ctx){cap.push(html);return orig.call(this,html,ctx)};
  const run=(name,f)=>{cap.length=0;try{const r=f();if(typeof r==='string'&&!cap.length)cap.push(r)}catch(e){cap.push('THROWN: '+e.message)}out[name]=cap.join('\\n<!--SHOW-->\\n')};
  const cust=Transactions.addCustomer({name:'Golden Customer',currency:'EGP',phone:'0100'});
  const sup=Transactions.addSupplier({name:'Golden Supplier',currency:'EGP',type:'hotel'});
  const tre=DB.data.treasuries[0];
  const inv=Invoices.create({kind:'customer',partyType:'customer',partyId:cust.id,currency:'EGP',date:'2026-01-20',dueDate:'2026-02-20',lines:[{description:'Umrah package',qty:2,price:1500,taxId:'VAT14'},{description:'Visa',qty:1,price:300,taxId:'TAX0'}]});
  Invoices.post(inv);
  const rec=Transactions.addReceipt({partyType:'customer',partyId:cust.id,amount:1000,currency:'EGP',date:'2026-01-25',treasuryId:tre.id,method:'cash',allocations:[{invoiceId:inv.id,amount:1000}]});
  const sinv=Invoices.create({kind:'supplier',partyType:'supplier',partyId:sup.id,currency:'EGP',date:'2026-01-18',dueDate:'2026-02-18',lines:[{description:'Hotel nights',qty:3,price:800,taxId:'TAX0'}]});
  Invoices.post(sinv);
  const pay=Transactions.addPayment({partyType:'supplier',partyId:sup.id,amount:700,currency:'EGP',date:'2026-01-27',treasuryId:tre.id,method:'cash',allocations:[{invoiceId:sinv.id,amount:700}]});
  const ex=Transactions.addExpense({date:'2026-01-26',category:'rent',amount:500,currency:'EGP',treasuryId:tre.id,mode:'cash',description:'Office rent',taxId:'TAX0'});
  run('invoice-customer',()=>Print.invoice(inv.id));
  run('invoice-supplier',()=>Print.invoice(sinv.id));
  run('voucher-receipt',()=>Print.voucher('receipt',rec.id));
  run('voucher-payment',()=>Print.voucher('payment',pay.id));
  run('expense',()=>Print.expense(ex.id));
  run('statement-customer-all',()=>Statements.customer(cust.id,'','',{}));
  run('statement-customer-range',()=>Statements.customer(cust.id,'2026-01-22','2026-01-31',{}));
  run('statement-supplier',()=>Statements.supplier(sup.id,'','',{}));
  run('statement-treasury',()=>Statements.treasury(tre.id,'','',{}));
  run('statement-treasury-range',()=>Statements.treasury(tre.id,'2026-01-24','2026-01-31',{}));
  return out;
}"""
async def main():
    update = '--update' in sys.argv
    try:
        async with async_playwright() as p:
            browser, page, errors = await open_app(p)
            out = await page.evaluate(SEED)
            await browser.close()
    except Exception as e:
        if 'Executable' in str(e) or 'launch' in str(e):
            print('ENVIRONMENT BLOCKED: no Chromium available for the golden print test'); return 3
        raise
    if errors: print('PAGE ERRORS:', errors); return 1
    EXPECTED.mkdir(exist_ok=True)
    bad = 0
    for name, html in sorted(out.items()):
        if html.startswith('THROWN') or len(html) < 200:
            print(f'FAIL {name}: not a real document ({html[:120]!r})'); bad += 1; continue
        f = EXPECTED / f'{name}.html'
        if update:
            f.write_text(html, encoding='utf8', newline=''); print(f'WROTE {name} ({len(html)} chars)'); continue
        if not f.exists(): print(f'FAIL {name}: expected file missing'); bad += 1; continue
        want = f.read_text(encoding='utf8')
        if want == html: print(f'PASS {name} ({len(html)} chars)')
        else:
            bad += 1; print(f'FAIL {name}: output differs')
            for l in list(difflib.unified_diff(want.split('><'), html.split('><'), 'expected', 'actual', lineterm='', n=0))[:8]: print('   ', l[:200])
    if not update:
        extra = sorted(set(x.stem for x in EXPECTED.glob('*.html')) - set(out)); 
        if extra: print('FAIL expected files without a case:', extra); bad += 1
    print(f'golden print cases: {len(out)}, failures: {bad}')
    return 1 if bad else 0
sys.exit(asyncio.run(main()))
