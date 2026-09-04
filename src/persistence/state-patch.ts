const StatePatch={
 _same(a:any,b:any){return JSON.stringify(a)===JSON.stringify(b)},
 _recordArray(a:any){return Array.isArray(a)&&a.every(x=>x&&typeof x==='object'&&!Array.isArray(x)&&String(x.id||''))},
 diff(base:any,next:any){
  const set:any={},arrays:any={},unset:string[]=[];base=base&&typeof base==='object'?base:{};next=next&&typeof next==='object'?next:{};
  const keys=new Set([...Object.keys(base),...Object.keys(next)]);
  for(const key of keys){
   if(!(key in next)){unset.push(key);continue}
   const before=base[key],after=next[key];if(this._same(before,after))continue;
   if(this._recordArray(before)&&this._recordArray(after)){
    const bm=new Map(before.map((x:any)=>[String(x.id),x])),am=new Map(after.map((x:any)=>[String(x.id),x])),upserts:any[]=[],deletes:string[]=[];
    for(const x of after){const id=String(x.id),old=bm.get(id);if(!old||!this._same(old,x))upserts.push(x)}
    for(const x of before){const id=String(x.id);if(!am.has(id))deletes.push(id)}
    const survivingBefore=before.map((x:any)=>String(x.id)).filter((id:string)=>am.has(id)),existingAfter=after.map((x:any)=>String(x.id)).filter((id:string)=>bm.has(id));
    const orderChanged=!this._same(survivingBefore,existingAfter),inserted=after.filter((x:any)=>!bm.has(String(x.id))).map((x:any)=>String(x.id)),appendedOnly=inserted.every((id:string,i:number)=>after[after.length-inserted.length+i]?.id===id);
    arrays[key]={upserts,deletes,...((orderChanged||!appendedOnly)?{order:after.map((x:any)=>String(x.id))}:{})};
   }else set[key]=after;
  }
  return{set,arrays,unset};
 },
 empty(p:any){return !p||(!Object.keys(p.set||{}).length&&!Object.keys(p.arrays||{}).length&&!(p.unset||[]).length)}
};
