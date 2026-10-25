import {realKey,realRating,gamePosition} from './immersion.mjs';

export const CARD_RULES={rounds:12,squad:5,hand:4,maxEnergy:5,energyGain:2};
export const CARDS=[
 {id:'screen',sport:'basketball',name:'挡拆顺下',style:'inside',cost:2,attack:14,defense:3,points:2,text:'内线进攻，克制外线盯防'},
 {id:'shoot',sport:'basketball',name:'外线投射',style:'outside',cost:2,attack:5,defense:5,points:3,text:'三分尝试，克制收缩禁区'},
 {id:'break',sport:'basketball',name:'转换快攻',style:'tempo',cost:3,attack:18,defense:0,points:2,text:'快速推进，克制区域联防'},
 {id:'post',sport:'basketball',name:'低位背打',style:'inside',cost:1,attack:8,defense:4,points:2,text:'低消耗内线进攻'},
 {id:'paint',sport:'basketball',name:'收缩禁区',style:'inside',cost:2,attack:0,defense:16,points:2,text:'守住篮下，克制内线进攻'},
 {id:'switch',sport:'basketball',name:'无限换防',style:'outside',cost:2,attack:2,defense:13,points:2,text:'外线盯防，克制转换快攻'},
 {id:'zone',sport:'basketball',name:'区域联防',style:'tempo',cost:1,attack:3,defense:9,points:2,text:'保持站位，克制外线投射'},
 {id:'pass',sport:'basketball',name:'耐心传导',style:'outside',cost:0,attack:0,defense:0,points:2,text:'零消耗，留力给下一回合'},
 {id:'wing',sport:'soccer',name:'边路套上',style:'outside',cost:2,attack:12,defense:3,points:1,text:'拉开宽度，克制中路封锁'},
 {id:'through',sport:'soccer',name:'中路直塞',style:'inside',cost:2,attack:14,defense:1,points:1,text:'穿透防线，克制边路盯防'},
 {id:'counter',sport:'soccer',name:'快速反击',style:'tempo',cost:3,attack:19,defense:0,points:1,text:'攻防转换，克制高位压迫'},
 {id:'wall',sport:'soccer',name:'撞墙配合',style:'inside',cost:1,attack:8,defense:4,points:1,text:'低消耗中路配合'},
 {id:'block',sport:'soccer',name:'中路封锁',style:'inside',cost:2,attack:0,defense:16,points:1,text:'压缩中路，克制直塞'},
 {id:'mark',sport:'soccer',name:'边路盯防',style:'outside',cost:2,attack:2,defense:13,points:1,text:'守住边路，克制反击'},
 {id:'press',sport:'soccer',name:'高位压迫',style:'tempo',cost:1,attack:3,defense:9,points:1,text:'前场逼抢，克制边路套上'},
 {id:'control',sport:'soccer',name:'控球组织',style:'outside',cost:0,attack:0,defense:0,points:1,text:'零消耗，留力给下一回合'}
];
export const styleName=s=>({inside:'中路 / 内线',outside:'边路 / 外线',tempo:'节奏 / 转换'}[s]||s);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const card=id=>CARDS.find(c=>c.id===id);
const attackBeats=(a,b)=>({inside:'outside',outside:'inside',tempo:'tempo'}[a]===b);
const defenseBeats=(a,b)=>({inside:'inside',outside:'tempo',tempo:'outside'}[a]===b);
function rng(g){g.seed=(Math.imul(g.seed,1664525)+1013904223)>>>0;return g.seed/4294967296;}
function shuffle(g,rows){const a=[...rows];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng(g)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function cardClub(p){if(p.teamId&&p.teamId!=='archive'&&!['历史名册','生涯档案'].includes(p.teamName))return p.teamName||'';return [...(p.memberships||[])].filter(m=>!['fifa.world','uefa.euro'].includes(m.league)).sort((a,b)=>b.year-a.year)[0]?.teamName||'';}
export function draftFive(pool,sport,selected=[]){const picked=[...selected],roles=sport==='basketball'?['PG','SG','SF','PF','C']:['GK','DF','MF','MF','FW'];for(const p of selected){const i=roles.indexOf(gamePosition(p,sport));if(i>=0)roles.splice(i,1);}for(const role of roles){if(picked.length===5)break;const available=pool.filter(p=>!picked.some(x=>realKey(x)===realKey(p))),p=available.find(p=>gamePosition(p,sport)===role)||available[0];if(p)picked.push(p);}return picked.slice(0,5);}
export function makeCardPlayer(p,sport){const rating=realRating(p,sport);return {key:realKey(p),id:String(p.id),name:String(p.zhName||p.name).slice(0,80),photo:typeof p.photo==='string'?p.photo.slice(0,600):'',teamName:String(cardClub(p)).slice(0,100),position:gamePosition(p,sport),attack:Math.round(rating.attack),defense:Math.round(rating.defense),stamina:100};}
function deck(g){return shuffle(g,CARDS.filter(c=>c.sport===g.sport).flatMap(c=>[c.id,c.id]));}
function draw(g,side){while(g.hands[side].length<CARD_RULES.hand){if(!g.decks[side].length){g.decks[side]=shuffle(g,g.discards[side]);g.discards[side]=[];}if(!g.decks[side].length)break;g.hands[side].push(g.decks[side].pop());}}
export function chemistry(squad){let pairs=0;for(let i=0;i<squad.length;i++)for(let j=i+1;j<squad.length;j++)if(squad[i].teamName&&squad[i].teamName===squad[j].teamName)pairs++;return Math.min(6,pairs*2);}
export function newDuel(sport,selected,pool,seed=Date.now(),difficulty='standard'){
 if(!['basketball','soccer'].includes(sport)||selected.length!==5||selected.some(p=>p.sport!==sport)||new Set(selected.map(realKey)).size!==5)throw Error('请选择 5 位同一运动的不同球员');
 const eligible=[...new Map(pool.filter(p=>p.sport===sport).map(p=>[realKey(p),p])).values()];
 const g={version:1,sport,difficulty:difficulty==='hard'?'hard':'standard',seed:seed>>>0,round:0,status:'playing',score:[0,0],squads:[selected.map(p=>makeCardPlayer(p,sport)),[]],hands:[[],[]],decks:[[],[]],discards:[[],[]],energy:[3,3],captainUsed:[false,false],log:[],intent:null};
 const opponents=shuffle(g,eligible.filter(p=>!selected.some(x=>realKey(x)===realKey(p))));
 for(const p of shuffle(g,eligible))if(opponents.length<5&&!opponents.some(x=>realKey(x)===realKey(p)))opponents.push(p);
 if(opponents.length<5)throw Error('可用球员不足，请加载更多名单');
 g.squads[1]=draftFive(opponents,sport).map(p=>makeCardPlayer(p,sport));
 g.decks=[deck(g),deck(g)];draw(g,0);draw(g,1);planAI(g);return g;
}
export function isAttacking(g,side=0){return g.round%2===side;}
function planAI(g){const attack=isAttacking(g,1),eligible=g.hands[1].map((id,index)=>({c:card(id),index})).filter(x=>x.c.cost<=g.energy[1]);eligible.sort((a,b)=>(attack?b.c.attack:b.c.defense)-(attack?a.c.attack:a.c.defense));const choice=eligible[0];const players=g.squads[1].map((p,index)=>({p,index})).sort((a,b)=>((attack?b.p.attack:b.p.defense)+b.p.stamina*.2)-((attack?a.p.attack:a.p.defense)+a.p.stamina*.2));const skill=!g.captainUsed[1]&&g.round>=8&&g.energy[1]>=(choice?.c.cost||0)+1;g.intent={cardIndex:choice?.index??-1,playerIndex:skill?0:players[0].index,skill};}
export function duelPreview(g,cardIndex,playerIndex,skill=false){
 const own=card(g.hands[0][cardIndex]),ai=card(g.hands[1][g.intent.cardIndex]),p=g.squads[0][playerIndex],q=g.squads[1][g.intent.playerIndex];if(!own||!p)return null;
 const attacking=isAttacking(g),att=attacking?own:ai,def=attacking?ai:own,attPlayer=attacking?p:q,defPlayer=attacking?q:p,attSide=attacking?0:1;
 const attackingSkill=attacking?skill:g.intent.skill,defendingSkill=attacking?g.intent.skill:skill;
 const counter=att&&def?(attackBeats(att.style,def.style)?10:0)-(defenseBeats(def.style,att.style)?10:0):0;
 const attackPower=attPlayer.attack+(att?.attack||-6)+(attPlayer.stamina-100)*.25+chemistry(g.squads[attSide])+(attackingSkill?12:0);
 const defensePower=defPlayer.defense+(def?.defense||-6)+(defPlayer.stamina-100)*.25+chemistry(g.squads[1-attSide])+(defendingSkill?12:0);
 const chance=clamp((g.sport==='basketball'?.56:.32)+(attackPower-defensePower+counter+(attSide===1&&g.difficulty==='hard'?6:0)-(attSide===0&&g.difficulty==='hard'?6:0))/150,.08,.88);
 return {chance,points:att?.points|| (g.sport==='basketball'?2:1),counter,attackPower,defensePower,attacking};
}
export function playDuel(state,cardIndex,playerIndex,skill=false){
 if(!validateDuel(state)||state.status!=='playing')throw Error('对局已结束或存档无效');
 const c=card(state.hands[0][cardIndex]);if(!Number.isInteger(cardIndex)||!c||!Number.isInteger(playerIndex)||!state.squads[0][playerIndex])throw Error('请选择手牌和球员');
 if(state.energy[0]<c.cost+(skill?1:0))throw Error('战术点不足');if(skill&&(state.captainUsed[0]||playerIndex!==0))throw Error('队长技能仅可由队长使用一次');
 const g=structuredClone(state),preview=duelPreview(g,cardIndex,playerIndex,skill),aiIndex=g.intent.cardIndex,ai=card(g.hands[1][aiIndex]),ownPlayer=g.squads[0][playerIndex],aiPlayer=g.squads[1][g.intent.playerIndex],roll=rng(g),success=roll<preview.chance,side=preview.attacking?0:1;
 if(success)g.score[side]+=preview.points;
 g.log.unshift({round:g.round+1,side,player:preview.attacking?ownPlayer.name:aiPlayer.name,defender:preview.attacking?aiPlayer.name:ownPlayer.name,ownCard:c.name,aiCard:ai?.name||'休整',chance:Math.round(preview.chance*100),roll:Math.round(roll*100),counter:preview.counter,points:success?preview.points:0,skill,aiSkill:g.intent.skill});
 const aiSkill=g.intent.skill;
 for(const [s,index,used] of [[0,cardIndex,skill],[1,aiIndex,aiSkill]]){if(index>=0){const spent=card(g.hands[s][index]);g.energy[s]-=spent.cost+(used?1:0);g.discards[s].push(g.hands[s].splice(index,1)[0]);}else if(used)g.energy[s]-=1;if(used)g.captainUsed[s]=true;g.energy[s]=Math.min(CARD_RULES.maxEnergy,g.energy[s]+CARD_RULES.energyGain);}
 for(let s=0;s<2;s++)for(let i=0;i<5;i++)g.squads[s][i].stamina=clamp(g.squads[s][i].stamina+(i===(s===0?playerIndex:g.intent.playerIndex)?-18:8),25,100);
 g.round++;
 if(g.round>=CARD_RULES.rounds){g.status='finished';g.intent=null;}else{draw(g,0);draw(g,1);planAI(g);}
 return g;
}
export function duelResult(g){return g.score[0]===g.score[1]?'draw':g.score[0]>g.score[1]?'win':'loss';}
export function validateDuel(g){try{
 if(!g||g.version!==1||!['basketball','soccer'].includes(g.sport)||!['standard','hard'].includes(g.difficulty)||!['playing','finished'].includes(g.status)||!Number.isInteger(g.seed)||g.seed<0||g.seed>4294967295||!Number.isInteger(g.round)||g.round<0||g.round>12||g.status!==(g.round===12?'finished':'playing'))return false;
 if(!Array.isArray(g.squads)||g.squads.length!==2||!g.squads.every(s=>s.length===5&&new Set(s.map(p=>p.key)).size===5&&s.every(p=>typeof p.key==='string'&&typeof p.name==='string'&&p.name.length<=80&&typeof p.teamName==='string'&&p.teamName.length<=100&&typeof p.photo==='string'&&p.photo.length<=600&&[p.attack,p.defense,p.stamina].every(n=>Number.isFinite(n)&&n>=0&&n<=100))))return false;
 if(!['hands','decks','discards'].every(k=>Array.isArray(g[k])&&g[k].length===2&&g[k].every(s=>Array.isArray(s)&&s.length<=16&&s.every(id=>card(id)?.sport===g.sport))))return false;
 for(let i=0;i<2;i++){const all=[...g.hands[i],...g.decks[i],...g.discards[i]];if(all.length!==16||!CARDS.filter(c=>c.sport===g.sport).every(c=>all.filter(id=>id===c.id).length===2)||g.hands[i].length!==4-(g.status==='finished'?1:0))return false;}
 if(!Array.isArray(g.energy)||g.energy.length!==2||!g.energy.every(n=>Number.isInteger(n)&&n>=0&&n<=5)||!Array.isArray(g.score)||g.score.length!==2||!g.score.every(n=>Number.isInteger(n)&&n>=0&&n<=36)||!Array.isArray(g.captainUsed)||g.captainUsed.length!==2||!g.captainUsed.every(x=>typeof x==='boolean')||!Array.isArray(g.log)||g.log.length!==g.round||!g.log.every((l,i)=>l.round===g.round-i&&['player','defender','ownCard','aiCard'].every(k=>typeof l[k]==='string'&&l[k].length<=100)&&[0,1].includes(l.side)&&Number.isInteger(l.chance)&&l.chance>=0&&l.chance<=100&&Number.isInteger(l.roll)&&l.roll>=0&&l.roll<=100&&[-10,0,10].includes(l.counter)&&Number.isInteger(l.points)&&l.points>=0&&l.points<=(g.sport==='basketball'?3:1)&&typeof l.skill==='boolean'&&typeof l.aiSkill==='boolean'))return false;
 if(!g.score.every((score,side)=>score===g.log.filter(l=>l.side===side).reduce((n,l)=>n+l.points,0)))return false;
 if(g.status==='finished')return g.intent===null;
 return !!g.intent&&Number.isInteger(g.intent.cardIndex)&&g.intent.cardIndex>=-1&&g.intent.cardIndex<4&&Number.isInteger(g.intent.playerIndex)&&g.intent.playerIndex>=0&&g.intent.playerIndex<5&&typeof g.intent.skill==='boolean'&&(g.intent.cardIndex===-1||card(g.hands[1][g.intent.cardIndex]).cost+(g.intent.skill?1:0)<=g.energy[1]);
 }catch{return false;}}
