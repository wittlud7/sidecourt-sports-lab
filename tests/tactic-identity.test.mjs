import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlay,assignPlayer,playerView,validatePlay,duration} from '../lib/tactics.mjs';
for(const sport of ['basketball','soccer'])test(`${sport}: real identity replacement swaps duplicates and keeps choreography`,()=>{
 const a={id:'one',zhName:'甲',jersey:'23',position:'PG',teamName:'主队',photo:'https://example.com/a.png'},b={id:'two',zhName:'乙',jersey:'30',teamName:'主队'},play=makePlay(sport,undefined,[a,b]);
 const changed=assignPlayer(play,'h1',a);assert.equal(changed.players[1].playerId,'one');assert.equal(changed.players[0].playerId,'two');assert.deepEqual(changed.frames,play.frames);assert.ok(validatePlay(changed));assert.equal(play.players[0].name,'甲');
 const persisted=JSON.parse(JSON.stringify(changed));assert.equal(persisted.players[1].photo,a.photo);assert.equal(persisted.players[1].teamName,'主队');
 for(let t=0;t<=duration(play);t+=.5){const view=playerView(changed,t,'h1');assert.equal(view.person.name,'甲');assert.ok(view.nearestOpponent.team==='a');assert.ok(view.support.team==='h');assert.ok(Number.isFinite(view.position.x));}
 const bad=assignPlayer(play,'h0',{id:'three',name:'丙',photo:'javascript:alert(1)'});assert.equal(bad.players[0].photo,'');
});
