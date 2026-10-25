import{mkdirSync,writeFileSync}from'node:fs';
mkdirSync('research/v2',{recursive:true});
const base='https://site.api.espn.com/apis/site/v2/sports';
const web='https://site.web.api.espn.com/apis/common/v3/sports';
const jobs=[
 ['jordan',`${base}/basketball/nba/athletes/1035`],
 ['jordan-overview',`${web}/basketball/nba/athletes/1035/overview`],
 ['jordan-stats',`${web}/basketball/nba/athletes/1035/stats`],
 ['lebron-log',`${web}/basketball/nba/athletes/1966/gamelog`],
 ['lakers-2003',`${base}/basketball/nba/teams/13/roster?season=2003`],
 ['barca-2011',`${base}/soccer/esp.1/teams/83/roster?season=2011`],
 ['team-lakers',`${base}/basketball/nba/teams/13?enable=roster,stats`],
 ['schedule-lakers',`${base}/basketball/nba/teams/13/schedule?season=2027`],
 ['nba-detail',`${base}/basketball/nba/summary?event=401656363`],
 ['soccer-detail',`${base}/soccer/fifa.world/summary?event=633850`],
 ['search',`https://site.web.api.espn.com/apis/common/v3/search?query=Ronaldinho&limit=5&type=player`],
 ['team-stats',`${base}/soccer/eng.1/teams/382/statistics`],
];
for(let i=0;i<jobs.length;i+=4)await Promise.all(jobs.slice(i,i+4).map(async([name,url])=>{try{const r=await fetch(url,{signal:AbortSignal.timeout(18000)});const d=await r.json();writeFileSync(`research/v2/${name}.json`,JSON.stringify(d));let info={keys:Object.keys(d),season:d.season,athlete:d.athlete?{name:d.athlete.displayName,active:d.athlete.active,status:d.athlete.status,keys:Object.keys(d.athlete)}:undefined,athletes:d.athletes?.slice(0,3).map(p=>({id:p.id,name:p.displayName})),stats:d.statistics?{keys:Object.keys(d.statistics),season:d.statistics.season}:undefined,rosters:d.rosters?.map(x=>({keys:Object.keys(x),count:x.roster?.length})),plays:d.plays?.length};console.log(name,r.status,JSON.stringify(info));}catch(e){console.log(name,e.message);}}));
