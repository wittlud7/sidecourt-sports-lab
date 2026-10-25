import raw from '@/data/archive.json';
import {cn,type Player} from './sports';
const metricHeight=(s:any)=>{if(typeof s==='number')return s;const m=typeof s==='string'?s.match(/(\d+)'\s*(\d+)/):null;return m?Math.round((Number(m[1])*12+Number(m[2]))*2.54):undefined;};
const metricWeight=(s:any)=>typeof s==='number'?s:typeof s==='string'&&parseFloat(s)?Math.round(parseFloat(s)*.453592):undefined;
export const ARCHIVE:Player[]=raw.players.map(p=>({...p,zhName:p.zhName||cn(p.name),height:metricHeight(p.height),weight:metricWeight(p.weight)})) as unknown as Player[];
export const ARCHIVE_DATE=raw.collectedAt;
export function archiveFor(league:string){return ARCHIVE.filter(p=>league==='nba'?p.league==='nba':league==='cba'?p.league==='cba':p.sport==='soccer');}
export const playerName=(p:Player)=>p.zhName||cn(p.name);
export function mergePlayers(live:Player[],archive:Player[]){const known=new Set(live.map(p=>p.id));return [...live,...archive.filter(p=>!known.has(p.id))];}
