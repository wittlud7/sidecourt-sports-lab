import {readFileSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../dist/client');
const manifest=JSON.parse(readFileSync(resolve(root,'.vite/manifest.json'),'utf8'));
const seen=new Set();
function visit(key){if(seen.has(key))return;const item=manifest[key];if(!item)throw Error('Missing build entry: '+key);seen.add(key);for(const dependency of item.imports||[])visit(dependency);}
visit('app/page.tsx');
const entries=[...seen].map(key=>({key,file:manifest[key].file}));
const forbidden=entries.filter(e=>/archive-|game-hub|relationship-graph|team-tactics|research-lab/.test(e.key));
if(forbidden.length)throw Error('A deferred module entered the initial graph: '+forbidden.map(e=>e.key).join(', '));
const bytes=entries.reduce((n,e)=>n+statSync(resolve(root,e.file)).size,0),limit=750000;
if(bytes>limit)throw Error(`Initial JavaScript graph exceeds budget: ${bytes} > ${limit} bytes`);
console.log(`Initial JavaScript graph: ${bytes} / ${limit} bytes (uncompressed); heavy modules remain deferred.`);
