import assert from 'node:assert/strict';
const origin=process.env.SIDECOURT_TEST_ORIGIN||'http://127.0.0.1:5173';
let failed=0;
async function read(league,kind,params={}){const r=await fetch(origin+'/api/sports?'+new URLSearchParams({league,kind,...params}),{signal:AbortSignal.timeout(40000)});const d=await r.json();assert.equal(r.status,200,JSON.stringify(d).slice(0,350));assert.ok(d.source&&d.fetchedAt);return d.data;}
const checks=[
 ['NBA historical biography',async()=>{const d=await read('nba','profile',{athlete:'1035'});assert.equal(d.id,'1035');assert.equal(d.name,'Michael Jordan');assert.equal(d.height,198);}],
 ['NBA career identity and scope',async()=>{const d=await read('nba','career',{athlete:'1035'}),c=d.categories.find(c=>c.name==='averages');assert.ok(c.statistics.length>=15);assert.equal(c.totals[c.names.indexOf('avgPoints')],'30.1');}],
 ['NBA last archived game log',async()=>{const d=await read('nba','gamelog',{athlete:'1035',season:'2003'});assert.ok(d.rows.length>10);assert.ok(d.rows.every(r=>new Date(r.date).getFullYear()<=2003));}],
 ['NBA summary and events cannot share incompatible cache entries',async()=>{const p={event:'401656363'},summary=await read('nba','summary',p),events=await read('nba','playbyplay',p),again=await read('nba','summary',p);assert.ok(summary.boxscore?.players?.length===2);assert.ok(events.plays.length>100);assert.ok(!events.boxscore);assert.ok(again.boxscore);}],
 ['CBA retired biography',async()=>{const d=await read('cba','profile',{athlete:'393433'});assert.equal(d.name,'易建联');assert.ok(d.headshot?.startsWith('https://'));assert.equal(d.height,212);}],
 ['CBA career and recent actual season',async()=>{const d=await read('cba','career',{athlete:'393433'});assert.ok(d.categories[0].statistics.length>10);const l=await read('cba','gamelog',{athlete:'393433',season:'2022'});assert.ok(l.rows.length>10);assert.ok(l.rows.every(r=>Number.isFinite(new Date(r.date).getTime())&&r.season.includes('2022')));}],
 ['CBA team metrics and calendar',async()=>{const d=await read('cba','teamstats',{team:'29124'});assert.ok(d.stats.categories[0].stats.some(s=>s.name==='avgPoints'&&s.value>0));assert.ok(d.season.year>=2020);const s=await read('cba','schedule',{team:'29124'});assert.ok(s.some(m=>m.state==='post'));assert.ok(s.every(m=>m.home.id&&m.away.id&&Number.isFinite(new Date(m.date).getTime())));}],
 ['CBA full quarter events',async()=>{const s=await read('cba','scoreboard',{date:'2026-10-21'}),m=s.find(m=>m.state==='post');assert.ok(m);const d=await read('cba','playbyplay',{event:m.id});assert.ok(d.plays.length>100);assert.ok(new Set(d.plays.map(p=>p.period.number)).size>=4);assert.ok(d.plays.every(p=>p.text&&!/<[^>]*>/.test(p.text)));}],
 ['World Cup final lineups and formation',async()=>{const d=await read('fifa.world','summary',{event:'633850'});assert.equal(d.rosters.length,2);assert.ok(d.rosters.every(r=>r.roster.filter(p=>p.starter).length===11&&r.formation));}],
 ['Football team metrics and linked headlines',async()=>{const d=await read('eng.1','teamstats',{team:'382'});assert.ok(d.stats?.categories?.length);const n=await read('eng.1','news',{team:'382'});assert.ok(n.length&&n.every(n=>n.title&&n.url?.startsWith('https://')));}],
];
for(const [name,run] of checks){try{await run();console.log('PASS',name);}catch(e){failed++;console.error('FAIL',name,e.message);}}
for(const params of [{league:'nba',kind:'profile',athlete:'bad'},{league:'cba',kind:'gamelog',athlete:'393433',season:'../../2022'},{league:'nba',kind:'playbyplay',event:'NaN'}]){const r=await fetch(origin+'/api/sports?'+new URLSearchParams(params));assert.equal(r.status,400);}
console.log(`${checks.length-failed}/${checks.length} integration scenarios passed; parameter guards passed`);process.exitCode=failed?1:0;
