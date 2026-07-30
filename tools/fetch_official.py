#!/usr/bin/env python3
"""공식 사이트(zutomayocard.net/search) 의 카드 데이터를 내려받는다.

공식 검색은 공개 MeiliSearch 인스턴스를 쓴다. 검색 페이지의 CONFIG 블록에서
호스트/공개키/인덱스명을 읽어오므로, 공식 쪽 값이 바뀌어도 따라간다.

    python3 tools/fetch_official.py        # -> data/official_cards.json

주의: SE(시크릿) 등급 일부는 공식에 공개되지 않는다. 2026-07 기준 422장이며
4탄 SE 3장(4th_105~107)이 빠져 있다. 그 3장은 data/extra_cards.json 에 손으로 채운다.
"""
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEARCH_PAGE = 'https://zutomayocard.net/search/'
DST = os.path.join(ROOT, 'data/official_cards.json')
UA = 'Mozilla/5.0 (compatible; zutomayo-card-korean/1.0; +https://github.com/park001024/zutomayo-card-korean)'


def get(url, data=None, headers=None):
    req = urllib.request.Request(url, data=data, headers={'User-Agent': UA, **(headers or {})})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def read_config():
    html = get(SEARCH_PAGE).decode('utf-8')
    i = html.find('const CONFIG = {')
    if i < 0:
        sys.exit('검색 페이지에서 CONFIG 블록을 찾지 못했습니다. 공식 사이트 구조가 바뀐 듯합니다.')
    block = html[i:html.find('};', i)]
    cfg = dict(re.findall(r'(\w+):\s*"([^"]*)"', block))
    for key in ('HOST', 'SEARCH_KEY', 'INDEX_NAME_CARDS'):
        if key not in cfg:
            sys.exit(f'CONFIG 에 {key} 가 없습니다.')
    return cfg


def main():
    cfg = read_config()
    url = f"{cfg['HOST']}/indexes/{cfg['INDEX_NAME_CARDS']}/search"
    body = json.dumps({'q': '', 'limit': 2000}).encode()
    res = json.loads(get(url, body, {
        'Authorization': f"Bearer {cfg['SEARCH_KEY']}",
        'Content-Type': 'application/json',
    }))

    hits = res.get('hits', [])
    if not hits:
        sys.exit('검색 결과가 비었습니다.')

    def sort_key(h):
        m = re.match(r'(\d)(?:st|nd|rd|th)_(\d+)', h['id'])
        return (int(m.group(1)), int(m.group(2))) if m else (9, 0)

    hits.sort(key=sort_key)
    for h in hits:
        # 효과에 붙은 에라타 안내 링크와 errata 필드는 쓰지 않으므로 저장하지 않는다
        h['effect'] = re.sub(r'\s*<br\s*/?>\s*$', '',
                             re.sub(r'<a\b[^>]*>.*?</a>', '', h.get('effect') or '', flags=re.S)).strip()
        h.pop('errata', None)
    with open(DST, 'w', encoding='utf-8') as f:
        json.dump(hits, f, ensure_ascii=False, indent=1)

    packs = {}
    for h in hits:
        packs[h['id'].split('_')[0]] = packs.get(h['id'].split('_')[0], 0) + 1
    print(f'{DST}: {len(hits)}장')
    for k, v in packs.items():
        print(f'  {k}: {v}장')


if __name__ == '__main__':
    main()
