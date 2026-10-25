import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

export function writeArchiveNames(players){
 const names=Object.fromEntries(players.filter(p=>p.zhName).map(p=>[p.name,p.zhName]));
 writeFileSync(new URL('../data/archive-names.json',import.meta.url),JSON.stringify(names)+'\n');
 return names;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 writeArchiveNames(JSON.parse(readFileSync(new URL('../data/archive.json',import.meta.url),'utf8')).players);
}
