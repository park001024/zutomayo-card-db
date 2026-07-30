#!/usr/bin/env python3
"""사이트가 읽는 data/cards.json 을 만든다.

입력
  data/official_cards.json  공식 사이트(zutomayocard.net) 데이터 — 일본어 원문 + 수치의 기준
  data/extra_cards.json     공식에 공개되지 않은 카드(4탄 SE 시크릿) — 같은 필드 구조, 손으로 채운다
  data/overrides.json       위 두 파일의 표기 오류 교정 (카드 id -> 그 레코드의 필드)
  data/i18n/ko.json         한국어 번역 (곡명 / 카드명 / 효과, 키는 일본어 원문)

공식 카드와 손으로 넣은 카드가 같은 필드 구조라 하나의 경로로 처리한다.
출처는 official 필드로만 구분하고, 화면에서는 구분하지 않는다.
효과가 비어 있으면 vanilla=true (결손이 아니다).
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

RARITY_ORDER = ['N', 'R', 'SR', 'UR', 'SE']

# 공식 표기(일본어) -> 내부 키 + 한국어 라벨
ATTRIBUTES = [
    ('dark',     '闇',     '어둠'),
    ('fire',     '炎',     '화염'),
    ('electric', '電気',   '전기'),
    ('wind',     '風',     '바람'),
    ('chaos',    'カオス', '카오스'),
]
TYPES = [
    ('character',    'Character',    '캐릭터'),
    ('enchant',      'Enchant',      '인챈트'),
    ('area-enchant', 'Area Enchant', '에어리어 인챈트'),
]
ATTR_BY_JA = {ja: key for key, ja, _ in ATTRIBUTES}
TYPE_BY_JA = {ja: key for key, ja, _ in TYPES}


def load(name, default=None):
    path = os.path.join(ROOT, name)
    if not os.path.exists(path):
        return default
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def public(d):
    """_note, _why 처럼 밑줄로 시작하는 메모 키를 걸러낸다."""
    return {k: v for k, v in (d or {}).items() if not str(k).startswith('_')}


def strip_html(s):
    """효과 본문에서 태그를 걷어낸다. <br> 은 개행."""
    s = re.sub(r'<a\b[^>]*>.*?</a>', '', s or '', flags=re.S)
    s = re.sub(r'<br\s*/?>', '\n', s)
    s = re.sub(r'<[^>]+>', '', s)
    s = re.sub(r'[ \t　]+\n', '\n', s)
    return s.strip()


def split_title(t):
    """'にらちゃん（お勉強しといてよ）' -> ('にらちゃん', 'お勉強しといてよ')"""
    m = re.match(r'^(.*?)（([^（）]*)）$', t or '')
    return (m.group(1), m.group(2)) if m else (t, None)


def order(oid):
    m = re.match(r'(\d)(?:st|nd|rd|th)_(\d+)', oid)
    return (int(m.group(1)), int(m.group(2))) if m else (9, 0)


def num(v):
    """'' / None -> None, 그 밖에는 정수."""
    return None if v is None or v == '' else int(v)


def main():
    official = load('data/official_cards.json', []) or []
    extra = public(load('data/extra_cards.json', {}))
    overrides = public(load('data/overrides.json', {}))
    ko = load('data/i18n/ko.json', {}) or {}
    ko_names, ko_songs, ko_effects = ko.get('names', {}), ko.get('songs', {}), ko.get('effects', {})
    warnings = []

    records = {h['id']: dict(h) for h in official}
    official_ids = set(records)
    for oid, rec in extra.items():
        rec = public(rec)
        rec.setdefault('id', oid)
        records[oid] = rec

    for oid, patch in overrides.items():
        if oid not in records:
            warnings.append(f'overrides.json 의 {oid} 는 카드 데이터에 없습니다')
            continue
        records[oid].update(public(patch))

    cards = []
    for oid in sorted(records, key=order):
        r = records[oid]
        season, no = order(oid)

        base_ja, paren_ja = split_title(r.get('title'))
        song_ja = r.get('songs') or ''
        effect_ja = strip_html(r.get('effect'))

        name_ko = ko_names.get(base_ja)
        if name_ko is None:
            warnings.append(f'{oid}: 카드명 번역 없음 "{base_ja}"')
            name_ko = base_ja

        # 제목 괄호는 보통 수록곡이지만 곡이 아닌 경우도 있다 (2nd_105 의 KKB, 4th_106 의 無罪)
        paren_ko = None
        if paren_ja:
            if paren_ja == song_ja:
                paren_ko = ko_songs.get(paren_ja)
                if paren_ko is None:
                    warnings.append(f'{oid}: 곡명 번역 없음 "{paren_ja}"')
                    paren_ko = paren_ja
            else:
                paren_ko = ko_names.get(paren_ja, paren_ja)

        effect_ko = ''
        if effect_ja:
            effect_ko = ko_effects.get(effect_ja)
            if effect_ko is None:
                warnings.append(f'{oid}: 효과 번역 없음 — {effect_ja[:40]}')
                effect_ko = ''

        is_char = r.get('class') == 'Character'
        pack = r.get('pack')
        c = {
            'id': f'{season}-{no:03d}',
            'officialId': oid,
            'season': season,
            'no': no,
            'official': oid in official_ids,
            'rarity': r.get('rare'),
            'type': TYPE_BY_JA.get(r.get('class'), r.get('class')),
            'attribute': ATTR_BY_JA.get(r.get('type')),
            'chronos': num(r.get('clock')),
            'powerNight': num(r.get('night_attack')) if is_char else None,
            'powerDay': num(r.get('noon_attack')) if is_char else None,
            'powerCost': num(r.get('cost')),
            'sendToPower': num(r.get('power')),
            'pack': (pack[0] if pack else '') if isinstance(pack, list) else (pack or ''),
            'illustrator': r.get('illustrator') or '',
            'songJa': song_ja,
            'songKo': ko_songs.get(song_ja, song_ja),
            'nameJa': r.get('title') or '',
            'nameKo': name_ko + (f' ({paren_ko})' if paren_ko else ''),
            'effectJa': effect_ja,
            'effectKo': effect_ko,
            'img': f'images/full/{oid}.webp',
            'thumb': f'images/thumb/{oid}.webp',
        }

        c['vanilla'] = not (c['effectJa'] or c['effectKo'] or '').strip()
        missing = []
        if not c['nameKo']:
            missing.append('name')
        if not c['attribute']:
            missing.append('attribute')
        if c['type'] == 'character' and (c['powerNight'] is None or c['powerDay'] is None):
            missing.append('power')
        if c['chronos'] is None:
            missing.append('chronos')
        if c['effectJa'] and not c['effectKo']:
            missing.append('translation')
        c['missing'] = missing
        cards.append(c)

    packs, songs = {}, {}
    for c in cards:
        if c['pack']:
            packs.setdefault(c['season'], c['pack'])
        if c['songJa']:
            songs[c['songJa']] = c['songKo']
    for c in cards:
        if not c['pack']:
            c['pack'] = packs.get(c['season'], '')

    out = {
        'count': len(cards),
        'seasons': [{'n': s, 'pack': packs.get(s, '')} for s in sorted({c['season'] for c in cards})],
        'rarities': [r for r in RARITY_ORDER if any(c['rarity'] == r for c in cards)],
        'types': [{'key': k, 'ja': ja, 'ko': ko_} for k, ja, ko_ in TYPES],
        'attributes': [{'key': k, 'ja': ja, 'ko': ko_} for k, ja, ko_ in ATTRIBUTES
                       if any(c['attribute'] == k for c in cards)],
        'songs': [{'ja': ja, 'ko': songs[ja]} for ja in sorted(songs)],
        'illustrators': sorted({c['illustrator'] for c in cards if c['illustrator']}),
        'cards': cards,
    }
    path = os.path.join(ROOT, 'data/cards.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'))

    print(f"wrote {path}: {len(cards)}장, {os.path.getsize(path)/1024:.0f} KB")
    print(f"  공식 {sum(1 for c in cards if c['official'])}장 / 공식 외 {sum(1 for c in cards if not c['official'])}장")
    print(f"  바닐라(효과 없음) {sum(1 for c in cards if c['vanilla'])}장")
    print(f"  곡 {len(songs)}종 · 일러스트레이터 {len(out['illustrators'])}명")
    for key in ('translation', 'name', 'attribute', 'chronos', 'power'):
        n = sum(1 for c in cards if key in c['missing'])
        if n:
            print(f"  missing {key}: {n}장")
    if warnings:
        print(f'\n경고 {len(warnings)}건')
        for w in warnings[:15]:
            print('  -', w)


if __name__ == '__main__':
    main()
