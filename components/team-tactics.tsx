'use client';
import {useMemo,useRef,useState} from 'react';
import {cn,type Player,type Team,leagueInfo} from '@/lib/sports';
import {archiveFor} from '@/lib/archive';
import {sports} from '@/lib/client';
import {makePlay} from '@/lib/tactics.mjs';
import TacticalStudio from './tactical-studio';

export default function TeamTactics({league,teams,players}:{league:string;teams:Team[];players:Player[]}){
 const sport=leagueInfo(league).sport,archive=useMemo(()=>archiveFor(league),[league]);
 const pool=useMemo(()=>[...new Map([...archive,...players].map(p=>[p.id,p])).values()],[archive,players]);
 const historical=useMemo(()=>{const groups=new Map<string,{key:string;id:string;name:string;historical:boolean;rows:Player[]}>();for(const p of archive)for(const m of p.memberships||[]){const key='archive:'+m.league+':'+m.teamId;if(!groups.has(key))groups.set(key,{key,id:m.teamId,name:cn(m.teamName)+' · 历史选集',historical:true,rows:[]});const group=groups.get(key)!;if(!group.rows.some(x=>x.id===p.id))group.rows.push({...p,teamId:m.teamId,teamName:m.teamName});}return [...groups.values()].sort((a,b)=>b.rows.length-a.rows.length);},[archive]);
 const options=useMemo(()=>[...teams.map(t=>({key:'live:'+t.id,id:t.id,name:cn(t.name),historical:false,rows:[] as Player[]})),...historical],[teams,historical]);
 const [homeChoice,setHomeChoice]=useState(''),[awayChoice,setAwayChoice]=useState(''),[lineups,setLineups]=useState<any>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[revision,setRevision]=useState(0);
 const request=useRef(0),h=homeChoice||options[0]?.key||'',a=awayChoice||options[1]?.key||options[0]?.key||'';
 async function load(){
  const id=++request.current;setBusy(true);setError('');
  try{
   const read=async(key:string)=>{const option=options.find(o=>o.key===key);if(!option)throw Error('请选择球队');if(option.historical)return {name:option.name,rows:option.rows,label:'历史选集 · 跨年份组合'};const d=await sports<Player[]>(league,'roster',{team:option.id});if(!d.data.length)throw Error(option.name+' 暂无可用名单');return {name:option.name,rows:d.data.map(p=>({...p,league,sport})),label:d.stale?'缓存名单':'公开名单'};};
   const [home,away]=await Promise.all([read(h),read(a)]);if(id!==request.current)return;
   setLineups({home,away});setRevision(n=>n+1);
  }catch(e){if(id===request.current)setError(e instanceof Error?e.message:'名单加载失败，请重试');}finally{if(id===request.current)setBusy(false);}
 }
 const home=lineups?.home.rows||players.filter(p=>p.teamId===players[0]?.teamId),away=lineups?.away.rows||players.filter(p=>p.teamId!==players[0]?.teamId);
 const initial=lineups?{...makePlay(sport,undefined,home,away),homeName:lineups.home.name,awayName:lineups.away.name}:undefined;
 return <div className="stack"><div className="tactic-team-picker"><label className="field">主队<select aria-label="战术主队" value={h} onChange={e=>setHomeChoice(e.target.value)}>{options.map(o=><option key={o.key} value={o.key}>{o.name}</option>)}</select></label><span className="muted">对阵</span><label className="field">客队<select aria-label="战术客队" value={a} onChange={e=>setAwayChoice(e.target.value)}>{options.map(o=><option key={o.key} value={o.key}>{o.name}</option>)}</select></label><button className="btn primary" disabled={busy||!h||!a} onClick={load}>{busy?'加载名单…':'载入双方阵容'}</button>{lineups&&<small className="muted">{lineups.home.label} / {lineups.away.label}</small>}</div>{error&&<div className="error" role="alert">{error}</div>}<TacticalStudio key={league+'-'+revision} sport={sport} pool={pool} home={home} away={away} homeName={lineups?.home.name} awayName={lineups?.away.name} initial={initial} persistKey={'studio-'+league}/></div>;
}
