import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {localName,localText,statusCN,eventCN} from '../lib/localization.mjs';
import {makePlay} from '../lib/tactics.mjs';
const read=name=>JSON.parse(readFileSync(new URL('../data/'+name,import.meta.url),'utf8'));

test('every collected public name has a Chinese display without changing its source identity',()=>{
 const corpus=read('localization-corpus.json');
 assert.ok(corpus.names.length>5000);
 for(const source of corpus.names){
  const display=localName(source);
  assert.equal(typeof display,'string');
  assert.ok(display.length>0,source);
  assert.ok(!/[A-Za-zÀ-ž]/.test(display),source+' → '+display);
 }
});
test('assisted translations reject advertising fragments and common literal-name failures',()=>{
 for(const [name,zh] of Object.entries(read('zh-glossary.json').names))
  assert.ok(!/免费|下载|精选|最佳作品|我爱你|面包店|科比还活着|胶带|肠道/.test(zh),name+' → '+zh);
 assert.equal(localName('Fraser Forster'),'弗雷泽·福斯特');
 assert.equal(localName('Amine Adli'),'阿明·阿德利');
 assert.equal(localName('Gutí'),'古蒂');
 assert.equal(localName('Désiré Doué'),'德西雷·杜埃');
 assert.equal(localName('Míchel Salgado'),'米歇尔·萨尔加多');
 assert.equal(localName('Michele Di Gregorio'),'米凯莱·迪格雷戈里奥');
});
test('diacritics and punctuation aliases resolve to the same player translation',()=>{
 assert.equal(localName('N’Golo Kante'),localName("N'Golo Kanté"));
 assert.equal(localName('Luka Doncic'),localName('Luka Dončić'));
 assert.equal(localName('Djordje Petrovic'),localName('Djordje Petrović'));
});
test('states, saved game logs and roster animation use Chinese consistently',()=>{
 assert.equal(statusCN('2026-27 English Premier League'),'2026-27 英超');
 assert.equal(statusCN('Questionable'),'出战存疑');
 assert.equal(localText('加盟 Chicago Bulls，下一场对手 Real Madrid'),'加盟 芝加哥公牛，下一场对手 皇家马德里');
 const play=makePlay('soccer',undefined,[{name:'Fraser Forster',position:'GK'},{name:'Amine Adli',position:'F'}]);
 assert.equal(play.players[0].name,'弗雷泽·福斯特');
 assert.ok(play.players.some(p=>p.name==='阿明·阿德利'));
 const event=eventCN({type:{text:'Yellow Card'},text:'Yellow card for Amine Adli',participants:[{athlete:{displayName:'Amine Adli'}}]});
 assert.equal(event,'阿明·阿德利 · 黄牌');
 assert.equal(eventCN({text:'未知事件'}),'未知事件');
});
