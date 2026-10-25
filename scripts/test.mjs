import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const tests=readdirSync(new URL('../tests/',import.meta.url)).filter(f=>f.endsWith('.test.mjs')).sort().map(f=>'tests/'+f);
if(!tests.length)throw new Error('No unit tests found');
const result=spawnSync(process.execPath,['--test',...tests],{cwd:root,stdio:'inherit'});
if(result.error)throw result.error;
process.exit(result.status??1);
