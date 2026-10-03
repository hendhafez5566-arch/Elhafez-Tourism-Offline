import { PrefixDefaults, S, today, year2 } from './runtime';
import { DB } from './late-bindings';
const Numbering={
 masterTypes:new Set(['customer','supplier','agent','program','costCenter','treasury','lead']),
 key(type,date=today()){return this.masterTypes.has(type)?type:`${type}:${year2(date)}`},
 format(type,n,date=today()){const p=S(DB.data?.settings?.prefixes?.[type]||PrefixDefaults[type]||type.toUpperCase()).replace(/[^A-Z0-9]/g,'').slice(0,3)||PrefixDefaults[type]||'X';return this.masterTypes.has(type)?`${p}${String(n).padStart(4,'0')}`:`${p}${year2(date)}${String(n).padStart(4,'0')}`},
 next(type,date=today()){const key=this.key(type,date),n=(DB.data.sequences[key]||0)+1;DB.data.sequences[key]=n;return this.format(type,n,date)},
 peek(type,date=today()){const key=this.key(type,date),n=(DB.data.sequences[key]||0)+1;return this.format(type,n,date)}
};
export { Numbering };
