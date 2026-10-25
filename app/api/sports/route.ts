import { LEAGUES, normalizeMatch, normalizeTeam, normalizeRoster,beijingDay,dateShift } from '@/lib/sports';
import {scheduleMetrics} from '@/lib/research-metrics.mjs';
import {calendarEvents,calendarSeason} from '@/lib/calendar-evidence.mjs';
import {overviewFromGames} from '@/lib/overview-evidence.mjs';
import {snapshotPlayer,rosterProfile,recentTeamGames} from '@/lib/player-fallback';
import {cbaData} from '@/lib/cba';
import {normalizeBio,normalizeGameLog,normalizeNews,summaryData} from '@/lib/enrichment';
const cache=new Map<string,{body:any;until:number}>();
export async function GET(request:Request){
 const u=new URL(request.url),league=u.searchParams.get('league')||'nba',kind=u.searchParams.get('kind')||'scoreboard';
 const config=LEAGUES.find(l=>l.id===league);
 if(!config||!['scoreboard','teams','roster','summary','standings','team','athlete','profile','career','gamelog','splits','schedule','teamstats','news','playbyplay'].includes(kind))return Response.json({error:'不支持的联赛或资源'},{status:400});
 const team=u.searchParams.get('team')||'',event=u.searchParams.get('event')||'',day=u.searchParams.get('date')||'',athlete=u.searchParams.get('athlete')||'',season=u.searchParams.get('season')||'';
 if(['athlete','profile','career','gamelog','splits'].includes(kind)&&!/^\d{1,12}$/.test(athlete))return Response.json({error:'球员编号无效'},{status:400});
 if((team&&!/^\d{1,12}$/.test(team))||(['team','roster','schedule','teamstats'].includes(kind)&&!/^\d{1,12}$/.test(team))||(['summary','playbyplay'].includes(kind)&&!/^\d{1,12}$/.test(event))||(day&&!/^\d{4}-\d{2}-\d{2}$/.test(day)))return Response.json({error:'参数格式不正确'},{status:400});
 if(season&&!/^(19|20)\d{2}$/.test(season))return Response.json({error:'赛季格式不正确'},{status:400});
 if(league==='cba'){const key=`cba:${kind}:${team}:${event}:${athlete}:${season}:${day||beijingDay()}`,hit=cache.get(key);if(hit&&hit.until>Date.now())return Response.json({...hit.body,cached:true});try{const body=await cbaData(kind,team,event,day||beijingDay(),athlete,season);cache.set(key,{body,until:Date.now()+(['scoreboard','summary','playbyplay'].includes(kind)?60000:3600000)});if(cache.size>250)cache.delete(cache.keys().next().value!);return Response.json(body);}catch(e){if(hit)return Response.json({...hit.body,stale:true,error:'CBA 接口暂不可用，显示缓存。'});return Response.json({data:[],error:e instanceof Error?e.message:'CBA 数据暂不可用',source:'https://www.cbaleague.com/data/',fetchedAt:new Date().toISOString()},{status:502});}}
 const base=`https://site.api.espn.com/apis/site/v2/sports/${config.sport}/${league}`;
 let url=kind==='standings'?`https://site.api.espn.com/apis/v2/sports/${config.sport}/${league}/standings`:kind==='roster'?`${base}/teams/${team}/roster`:kind==='team'?`${base}/teams/${team}`:kind==='summary'?`${base}/summary?event=${event}`:kind==='teams'?`${base}/teams?limit=1000`:`${base}/scoreboard?limit=200${day?'&dates='+day.replaceAll('-',''):''}`;
 if(['profile','career','gamelog','splits'].includes(kind)){const suffix={profile:'',career:'/stats',gamelog:'/gamelog',splits:'/splits'}[kind as 'profile'];url=`https://site.web.api.espn.com/apis/common/v3/sports/${config.sport}/${league}/athletes/${athlete}${suffix}`;}
 if(kind==='schedule')url=`${base}/teams/${team}/schedule`;if(kind==='teamstats')url=`${base}/teams/${team}/statistics`;if(kind==='news')url=`${base}/news?limit=12${team?'&team='+encodeURIComponent(team):''}`;
 if(kind==='playbyplay')url=`${base}/summary?event=${event}`;
 if(kind==='athlete')url=`https://site.web.api.espn.com/apis/common/v3/sports/${config.sport}/${league}/athletes/${athlete}/overview`;
 if(season&&kind!=='profile')url+=(url.includes('?')?'&':'?')+'season='+season;
 const key=kind+':'+url+(['profile','gamelog'].includes(kind)?':team='+team:''),hit=cache.get(key);if(hit&&hit.until>Date.now())return Response.json({...hit.body,cached:true},{headers:{'Cache-Control':'private, max-age=30'}});
 try{
  const urls=kind==='scoreboard'&&day?[url,`${base}/scoreboard?limit=200&dates=${dateShift(day,-1).replaceAll('-','')}`]:[url];
  const responses=await Promise.all(urls.map(async target=>{const res=await fetch(target,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(['profile','career','gamelog','athlete','splits'].includes(kind)?6000:16000)});if(!res.ok)throw new Error(`数据源返回 ${res.status}`);return await res.json() as any;}));
  const raw:any=responses[0];if(responses.length>1){raw.events=[...new Map(responses.flatMap(r=>r.events||[]).map(e=>[e.id,e])).values()];raw.events.sort((a:any,b:any)=>new Date(a.date).getTime()-new Date(b.date).getTime());}let data:any;
  if(kind==='scoreboard')data=(raw.events||[]).map(normalizeMatch).filter((m:any)=>!day||beijingDay(new Date(m.date))===day);
  else if(kind==='teams')data=(raw.sports?.[0]?.leagues?.[0]?.teams||[]).map((x:any)=>normalizeTeam(x.team));
  else if(kind==='roster')data=normalizeRoster(raw,team);
  else if(kind==='summary')data=summaryData(raw);
  else if(kind==='playbyplay')data={plays:raw.plays||raw.keyEvents||[],commentary:raw.commentary||[]};
  else if(kind==='athlete')data={statistics:raw.statistics,gameLog:raw.gameLog,awards:raw.awards,nextGame:raw.nextGame};
  else if(kind==='profile')data=normalizeBio(raw);
  else if(kind==='gamelog')data=normalizeGameLog(raw);
  else if(kind==='career')data={categories:raw.categories,teams:raw.teams,filters:raw.filters};
  else if(kind==='news')data=normalizeNews(raw);
  else if(kind==='schedule')data=calendarEvents(raw,season).map(normalizeMatch);
  else if(kind==='teamstats'){data={stats:raw.results?.stats,season:calendarSeason(raw),navigationSeason:raw.season,requestedSeason:raw.requestedSeason};if(!data.stats&&config.sport==='soccer'){const calendarUrl=`${base}/teams/${team}/schedule${season?'?season='+season:''}`;const r=await fetch(calendarUrl,{signal:AbortSignal.timeout(12000)});if(r.ok){const calendar:any=await r.json();const sums=scheduleMetrics(calendarEvents(calendar,season).map(normalizeMatch),team);data={stats:{categories:[{name:'scheduleAggregate',stats:Object.entries(sums).map(([name,value])=>({name,value,displayValue:Number.isInteger(value)?String(value):Number(value).toFixed(2)}))}]},season:calendarSeason(calendar,season),requestedSeason:calendar.requestedSeason,method:'从此联赛赛程已返回且已完成的比赛聚合；不冒称未返回比赛、控球率或射门数据。',sampleCount:sums.gamesPlayed};urls.push(calendarUrl);}}}
  else if(kind==='team')data={team:normalizeTeam(raw.team),record:raw.team?.record,standingSummary:raw.team?.standingSummary,nextEvent:raw.team?.nextEvent};
  else data=raw;
  const coachList=raw.coach?(Array.isArray(raw.coach)?raw.coach:[raw.coach]):[];
  const body={data,source:kind==='teamstats'&&urls.length>1?urls[urls.length-1]:url,sources:urls,fetchedAt:new Date().toISOString(),season:(kind==='schedule'?calendarSeason(raw,season)?.displayName:kind==='teamstats'?data.season?.displayName:raw.season?.displayName)||raw.leagues?.[0]?.season?.displayName||raw.sports?.[0]?.leagues?.[0]?.season?.displayName,coaches:coachList.map((c:any)=>({id:c.id,name:c.fullName||c.displayName||[c.firstName,c.lastName].filter(Boolean).join(' '),title:c.position?.name||'主教练'}))};
  cache.set(key,{body,until:Date.now()+(['scoreboard','summary','playbyplay'].includes(kind)?60000:3600000)});
  if(cache.size>250)cache.delete(cache.keys().next().value!);
  return Response.json(body,{headers:{'Cache-Control':'private, max-age=30'}});
 }catch(e){if(hit)return Response.json({...hit.body,stale:true,error:'上游暂不可用，展示上次缓存。'});let fallback:any=null;if(kind==='athlete'&&config.sport==='basketball'){fallback=snapshotPlayer(league,kind,athlete,season);if(!fallback&&team){const log=await recentTeamGames(league,team,athlete,season).catch(()=>null);if(log)fallback=overviewFromGames(log);}}if(kind==='profile'&&team)fallback=await rosterProfile(league,team,athlete).catch(()=>null);if(kind==='gamelog'&&team)fallback=await recentTeamGames(league,team,athlete,season).catch(()=>null);if(!fallback||kind==='gamelog'&&!fallback.data.rows?.length)fallback=snapshotPlayer(league,kind,athlete,season)||fallback;if(fallback){cache.set(key,{body:fallback,until:Date.now()+3600000});return Response.json(fallback,{headers:{'Cache-Control':'private, max-age=30'}});}return Response.json({error:e instanceof Error?e.message:'数据源暂不可用',data:[],source:url,fetchedAt:new Date().toISOString()},{status:502});}
}
