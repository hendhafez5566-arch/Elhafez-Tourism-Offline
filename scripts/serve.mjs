import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.map':'application/json; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.png':'image/png'};
http.createServer(async(req,res)=>{
  try{
    let path=decodeURIComponent((req.url||'/').split('?')[0]);
    if(path==='/') path='/index.html';
    const file=normalize(join(root,path));
    if(!file.startsWith(root)) throw new Error('Forbidden');
    const st=await stat(file); if(!st.isFile()) throw new Error('Not file');
    const body=await readFile(file); res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'}); res.end(body);
  }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');}
}).listen(port,()=>console.log(`ERP running on http://localhost:${port}`));
