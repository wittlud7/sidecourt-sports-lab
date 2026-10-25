import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newDuel,playDuel,duelPreview,validateDuel,CARDS,chemistry,duelResult,draftFive,cardClub} from '../lib/card-duel.mjs';
const pool=JSON.parse(readFileSync(new URL('../data/archive.json',import.meta.url))).players;
const clone=g=>JSON.parse(JSON.stringify(g));
for(const sport of ['basketball','soccer']){
 const players=pool.filter(p=>p.sport===sport),squad=players.slice(0,5);
 test(`${sport}: reproducible full matches, legal energy, deck recycling and save round-trips`,()=>{
  for(let seed=1;seed<=80;seed++){
   let g=newDuel(sport,squad,players,seed,seed%2?'standard':'hard'),twin=clone(g);
   assert.ok(validateDuel(g));
   while(g.status==='playing'){
    const options=g.hands[0].map((id,i)=>({c:CARDS.find(c=>c.id===id),i})).filter(x=>x.c.cost<=g.energy[0]);
    assert.ok(options.length,'always a legal card');
    const option=options[(seed+g.round)%options.length],index=g.round%5,skill=index===0&&!g.captainUsed[0]&&option.c.cost+1<=g.energy[0];
    const preview=duelPreview(g,option.i,index,skill);assert.ok(preview.chance>=.08&&preview.chance<=.88);
    const old=clone(g);g=playDuel(g,option.i,index,skill);twin=playDuel(twin,option.i,index,skill);
    assert.deepEqual(g,twin);assert.deepEqual(old.round,g.round-1);assert.ok(validateDuel(clone(g)),`seed ${seed}, round ${g.round}`);
    assert.ok(g.energy.every(e=>e>=0&&e<=5));assert.equal(g.squads[0][index].stamina,Math.max(25,old.squads[0][index].stamina-18));
   }
   assert.equal(g.log.length,12);assert.ok(['win','draw','loss'].includes(duelResult(g)));assert.equal(g.score[0],g.log.filter(l=>l.side===0).reduce((n,l)=>n+l.points,0));assert.throws(()=>playDuel(g,0,0));
  }
 });
 test(`${sport}: invalid moves do not alter a game`,()=>{const g=newDuel(sport,squad,players,42),before=clone(g);for(const [c,p,s] of [[-1,0,false],[4,0,false],[0,5,false],[0,1,true]])assert.throws(()=>playDuel(g,c,p,s));assert.deepEqual(g,before);assert.throws(()=>newDuel(sport,[squad[0],...squad.slice(0,4)],players));});
 test(`${sport}: tactical counters and captain create measurable choices`,()=>{
  let g=newDuel(sport,squad,players,12);const ids=CARDS.filter(c=>c.sport===sport);
  const inside=ids.find(c=>c.style==='inside'),outside=ids.find(c=>c.style==='outside'),guard=ids.find(c=>c.style==='outside'&&c.defense>10),paint=ids.find(c=>c.style==='inside'&&c.defense>10);
  g.hands[0][0]=inside.id;g.hands[1][0]=guard.id;g.intent={cardIndex:0,playerIndex:0,skill:false};
  assert.equal(duelPreview(g,0,0).counter,10);g.hands[1][0]=paint.id;assert.equal(duelPreview(g,0,0).counter,-10);
  const normal=duelPreview(g,0,0),skill=duelPreview(g,0,0,true);assert.equal(skill.attackPower-normal.attackPower,12);
  g.hands[0][0]=outside.id;assert.equal(duelPreview(g,0,0).counter,10);
 });
}
test('save validation rejects corruption, impossible inventory and cross-sport cards',()=>{const players=pool.filter(p=>p.sport==='basketball'),original=newDuel('basketball',players.slice(0,5),players,4);for(const mutate of [g=>g.round=20,g=>g.energy[0]=99,g=>g.seed=-1,g=>g.hands[0][0]='wing',g=>g.decks[0].push(g.decks[0][0]),g=>g.squads[0][0].attack=Infinity,g=>g.squads[0][0].key=g.squads[0][1].key,g=>g.intent.playerIndex=10,g=>g.status='finished',g=>g.log.push({})]){const g=clone(original);mutate(g);assert.equal(validateDuel(g),false);}assert.equal(validateDuel(null),false);});
test('chemistry has a ceiling and requires a shared named club',()=>{assert.equal(chemistry(Array.from({length:5},()=>({teamName:'同队'}))),6);assert.equal(chemistry([{teamName:''},{teamName:''}]),0);});
test('automatic squad balances roles, preserves favorites, and archive labels are never clubs',()=>{const football=pool.filter(p=>p.sport==='soccer'),basketball=pool.filter(p=>p.sport==='basketball');assert.deepEqual(draftFive(football,'soccer').map(p=>p.position).map(p=>p==='G'?'GK':p==='D'?'DF':p==='M'?'MF':p==='F'?'FW':p),['GK','DF','MF','MF','FW']);const favorite=football.find(p=>p.name==='Lionel Messi');assert.equal(draftFive(football,'soccer',[favorite])[0],favorite);assert.equal(cardClub({teamId:'archive',teamName:'历史名册'}),'');assert.equal(cardClub({teamId:'archive',memberships:[{teamName:'国家队',year:2024,league:'fifa.world'},{teamName:'俱乐部',year:2020,league:'esp.1'}]}),'俱乐部');assert.equal(new Set(draftFive(basketball,'basketball').map(p=>p.id)).size,5);});
