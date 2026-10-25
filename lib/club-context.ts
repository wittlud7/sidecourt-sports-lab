import data from '@/data/club-context.json';
export function clubContext(sport:string,teamId:string,date?:string){const entry=data.entries.find(x=>x.sport===sport&&x.teamId===teamId);return {verifiedAt:data.verifiedAt,name:entry?.name,staff:(entry?.staff||[]).filter(s=>!date||new Date(s.publishedAt).getTime()<=new Date(date).getTime())};}
