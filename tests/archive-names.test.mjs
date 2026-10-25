import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('the lightweight name dictionary preserves all curated archive names without biographies',()=>{
 const archive=JSON.parse(readFileSync(new URL('../data/archive.json',import.meta.url),'utf8'));
 const text=readFileSync(new URL('../data/archive-names.json',import.meta.url),'utf8'),names=JSON.parse(text);
 assert.deepEqual(names,Object.fromEntries(archive.players.filter(p=>p.zhName).map(p=>[p.name,p.zhName])));
 assert.ok(Object.values(names).every(n=>typeof n==='string'));
 assert.ok(Buffer.byteLength(text)<20000);
});
