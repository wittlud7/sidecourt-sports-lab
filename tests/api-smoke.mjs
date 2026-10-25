// Run against a running development or production preview server.
import assert from 'node:assert/strict';
const origin=process.env.SIDECOURT_TEST_ORIGIN||'http://127.0.0.1:5173';
const checks=[['nba','teams',{},d=>d.length===30],['cba','teams',{},d=>d.length===20],['cba','roster',{team:'29124'},d=>d.length>0&&d.every(p=>p.stats&&p.name)],['nba','scoreboard',{date:'2024-06-18'},d=>d.some(m=>m.state==='post'&&m.homeScore&&m.awayScore)],['eng.1','teams',{},d=>d.length===20],['uefa.euro','scoreboard',{date:'2024-07-15'},d=>d.some(m=>m.state==='post')]];
let failed=0;
for(const [league,kind,params,check]of checks){const q=new URLSearchParams({league,kind,...params});try{const r=await fetch(origin+'/api/sports?'+q,{signal:AbortSignal.timeout(30000)}),d=await r.json();assert.equal(r.status,200,JSON.stringify(d));assert.ok(check(d.data),`bad data shape: ${JSON.stringify(d.data).slice(0,300)}`);assert.ok(d.source&&d.fetchedAt);console.log('PASS',league,kind,Array.isArray(d.data)?d.data.length:'object');}catch(e){console.error('FAIL',league,kind,e.message);failed++;}}
for(const query of ['league=evil&kind=teams','league=nba&kind=roster&team=../../foo','league=nba&kind=athlete&athlete=evil','league=nba&kind=scoreboard&date=not-a-date']){const r=await fetch(origin+'/api/sports?'+query);assert.equal(r.status,400);console.log('PASS parameter guard',query);}
process.exitCode=failed?1:0;
