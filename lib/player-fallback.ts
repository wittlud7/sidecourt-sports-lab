import {calendarEvents,calendarSeason} from './calendar-evidence.mjs';
import snapshots from '@/data/player-snapshots.json';
import {ARCHIVE} from './archive';
import {normalizeBio} from './enrichment';
import {normalizeMatch,leagueInfo} from './sports';
import {publicSnapshot,playerFromGame} from './player-evidence.mjs';

export function snapshotPlayer(league:string,kind:string,id:string,season=''){return publicSnapshot(snapshots,ARCHIVE,league,kind,id,season);}
async function read(url:string){const r=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(7000)});if(!r.ok)throw Error('数据源返回 '+r.status);return await r.json() as any;}
export async function rosterProfile(league:string,team:string,id:string){if(!/^\d{1,12}$/.test(team))return null;const info=leagueInfo(league),url=`https://site.api.espn.com/apis/site/v2/sports/${info.sport}/${league}/teams/${team}/roster`,raw=await read(url),athletes=raw.athletes?.[0]?.items?raw.athletes.flatMap((g:any)=>g.items):raw.athletes||[],p=athletes.find((p:any)=>String(p.id)===id);if(!p)return null;return {data:normalizeBio(p),source:url,fetchedAt:new Date().toISOString(),season:raw.season?.displayName,fallback:true,method:'来自所选球队公开名单的个人资料。'};}
export async function recentTeamGames(league:string,team:string,id:string,season=''){
 if(!/^\d{1,12}$/.test(team))return null;const info=leagueInfo(league),base=`https://site.api.espn.com/apis/site/v2/sports/${info.sport}/${league}`,url=`${base}/teams/${team}/schedule${season?'?season='+season:''}`,calendar=await read(url),actual=calendarSeason(calendar,season);if(!actual)return null;
 const events=calendarEvents(calendar,season).filter((e:any)=>normalizeMatch(e).state==='post'&&(info.sport!=='basketball'||(e.seasonType?.type??calendar.requestedSeason?.type??calendar.season?.type)===2)).sort((a:any,b:any)=>new Date(b.date).getTime()-new Date(a.date).getTime()).slice(0,10),rows:any[]=[],sources=[url];
 // A bounded set of independent match requests keep fallback work within a normal client request.
 await Promise.all(events.map(async(e:any)=>{const source=base+'/summary?event='+e.id;try{const raw=await read(source),row=playerFromGame(raw,id,team,info.sport);if(row){row.season=actual.displayName||row.season;if(info.sport==='basketball')row.season+=' · Regular Season';rows.push(row);}sources.push(source);}catch{}}));
 return {data:{rows:rows.sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()),filters:[{name:'league',value:league}],sampleLimit:10},source:url,sources,fetchedAt:new Date().toISOString(),season:actual.displayName,fallback:true,method:'从球队最近最多 10 场已结束比赛的技术统计回溯；未出场不补零，不保证覆盖球员在其他球队的比赛。'};
}
