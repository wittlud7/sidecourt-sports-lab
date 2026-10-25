"""Build a local, inspectable Chinese name glossary from public sports rosters.

This is an authoring tool, never a runtime translation dependency. Existing
curated Chinese names in the app take priority over assisted transliterations.
"""
import concurrent.futures as futures
import json
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
CORPUS = DATA / 'localization-corpus.json'
GLOSSARY = DATA / 'zh-glossary.json'
LEAGUES = ['nba', 'eng.1', 'esp.1', 'ger.1', 'ita.1', 'fra.1', 'uefa.champions', 'uefa.euro', 'fifa.world']

def read(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Sidecourt-Research/1.0', 'Accept': 'application/json'})
    return json.load(urllib.request.urlopen(req, timeout=22))

def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

names = set()
sources = []
for p in json.loads((DATA / 'archive.json').read_text(encoding='utf-8'))['players']:
    names.add(p['name'])
    names.update(m['teamName'] for m in p.get('memberships', []))

if CORPUS.exists():
    cached = json.loads(CORPUS.read_text(encoding='utf-8'))
    names.update(cached['names'])
    sources = cached['sources']
else:
    jobs = []
    for league in LEAGUES:
        sport = 'basketball' if league == 'nba' else 'soccer'
        base = f'https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}'
        url = base + '/teams?limit=1000'
        try:
            raw = read(url)
            sources.append(url)
            teams = raw['sports'][0]['leagues'][0]['teams']
            for row in teams:
                t = row['team']
                names.add(t['displayName'])
                jobs.append(base + '/teams/' + t['id'] + '/roster')
            print(league, len(teams), 'teams', flush=True)
        except Exception as e:
            print('TEAM SOURCE FAILED', league, str(e), flush=True)
    def roster(url):
        try:
            raw = read(url)
            athletes = raw.get('athletes', [])
            if athletes and 'items' in athletes[0]:
                athletes = [p for g in athletes for p in g['items']]
            found = set()
            for p in athletes:
                for key in ['displayName', 'fullName']:
                    if p.get(key): found.add(p[key])
                if p.get('citizenship'): found.add(p['citizenship'])
            for coach in raw.get('coach', []) if isinstance(raw.get('coach'), list) else [raw.get('coach')]:
                if coach and coach.get('fullName'): found.add(coach['fullName'])
            return url, found
        except Exception as e:
            print('ROSTER SOURCE FAILED', url, str(e), flush=True)
            return url, set()
    with futures.ThreadPoolExecutor(max_workers=4) as pool:
        for i, (url, found) in enumerate(pool.map(roster, jobs)):
            names.update(found)
            if found: sources.append(url)
            if i % 20 == 0: print('rosters', i + 1, '/', len(jobs), 'names', len(names), flush=True)
    write(CORPUS, {'collectedAt': datetime.now(timezone.utc).isoformat(), 'sources': sources, 'names': sorted(names)})

glossary = json.loads(GLOSSARY.read_text(encoding='utf-8')) if GLOSSARY.exists() else {'names': {}}
known = glossary['names']
pending = sorted(n for n in names if re.search('[A-Za-zÀ-ž]', n) and (n not in known or '--refine' in sys.argv))
batches = [pending[i:i+32] for i in range(0, len(pending), 32)]

def translate(batch):
    query = urllib.parse.urlencode({'client': 'gtx', 'sl': 'en', 'tl': 'zh-CN', 'dt': 't', 'q': '\n'.join(n+' (professional sports player)' for n in batch)})
    try:
        raw = read('https://translate.googleapis.com/translate_a/single?' + query)
        output = ''.join(s[0] or '' for s in raw[0]).splitlines()
        if len(output) != len(batch): return []
        pairs=[]
        for name,zh in zip(batch,output):
            clean=re.sub(r'[（(].*?[）)]','',zh).strip()
            if re.search('[\u3400-\u9fff]',clean) and not re.search('[A-Za-z]',clean): pairs.append((name,clean))
        return pairs
    except Exception as e:
        print('TRANSLATION BATCH FAILED', str(e), flush=True)
        return []

with futures.ThreadPoolExecutor(max_workers=3) as pool:
    for i, pairs in enumerate(pool.map(translate, batches)):
        known.update(pairs)
        glossary.update({'updatedAt': datetime.now(timezone.utc).isoformat(), 'method': 'Local assisted Chinese transliterations; curated names override these entries. Original identity and source are retained.', 'names': dict(sorted(known.items()))})
        write(GLOSSARY, glossary)
        print('glossary', i + 1, '/', len(batches), 'entries', len(known), flush=True)
print('COMPLETE', len(names), 'source names;', len(known), 'Chinese entries;', len(set(names)-set(known)), 'remaining', flush=True)
