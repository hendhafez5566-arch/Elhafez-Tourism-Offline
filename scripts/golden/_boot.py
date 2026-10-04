# Shared boot for golden print tests: same self-contained single-document trick as scripts/ui-browser-smoke.py,
# plus a frozen clock so printed dates/times are deterministic.
import asyncio, json, pathlib, re, os, shutil
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parents[2]
FROZEN = 1769860800000  # 2026-01-31T12:00:00Z

def build_document():
    index = (ROOT / 'dist/index.html').read_text(errors='ignore')
    css = (ROOT / 'dist/styles.css').read_text(errors='ignore')
    js = (ROOT / 'dist/app.js').read_text(errors='ignore')
    index = re.sub(r'<link[^>]+href="[^"]*styles\.css[^"]*"[^>]*>', lambda _: '<style>' + css + '</style>', index)
    index = re.sub(r'<script\s+defer\s+src="[^"]*app\.js[^"]*"\s*></script>', lambda _: '<script>' + js.replace('</script>', '<\\/script>') + '</script>', index)
    clock = """<script>(()=>{const T=__T__,R=Date;class D extends R{constructor(...a){a.length?super(...a):super(T)}static now(){return T}}window.Date=D;let x=123456789;Math.random=()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return ((x>>>0)%1000000)/1000000};})();</script>""".replace("__T__", str(FROZEN))
    storage = """<script>(()=>{const make=()=>({_:{},setItem(k,v){this._[String(k)]=String(v)},getItem(k){return Object.prototype.hasOwnProperty.call(this._,String(k))?this._[String(k)]:null},removeItem(k){delete this._[String(k)]},clear(){this._={}},key(i){return Object.keys(this._)[i]||null},get length(){return Object.keys(this._).length}});try{Object.defineProperty(window,'localStorage',{value:make(),configurable:true});Object.defineProperty(window,'sessionStorage',{value:make(),configurable:true})}catch(e){}})();</script>"""
    return index.replace('<head>', '<head>' + clock + storage, 1)

async def open_app(p):
    path = os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
    browser = await p.chromium.launch(headless=True, executable_path=path or None, args=['--no-sandbox', '--disable-gpu'])
    page = await browser.new_page(viewport={'width': 1000, 'height': 900})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    await page.set_content(build_document(), wait_until='domcontentloaded', timeout=30000)
    await page.wait_for_timeout(300)
    await page.evaluate("""() => {
      DataStore.localPut=async()=>true; DataStore.put=async()=>({local:true,remote:false,serverAvailable:false});
      ServerStore.available=false; ServerStore.authenticated=false;
      DB.data=deep(Seed); DB.data.meta.setupComplete=true; DB.ensure();
      const u={id:'qa-admin',name:'QA Admin',username:'qa',role:'admin',active:true,onboardingSeen:true,permissions:{all:true},allowedBranchIds:[]};
      DB.data.users=[u]; Auth.user=u; Auth.enter();
    }""")
    return browser, page, errors
