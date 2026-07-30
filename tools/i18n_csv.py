#!/usr/bin/env python3
"""번역 검수용 CSV 내보내기 / 되돌려 넣기.

  python3 tools/i18n_csv.py export > review.csv    # 스프레드시트로 열어서 ko 열만 고치면 된다
  python3 tools/i18n_csv.py import review.csv      # 고친 ko 열을 data/i18n/ko.json 에 반영
  python3 tools/i18n_csv.py import review.csv --dry # 무엇이 바뀌는지만 확인

CSV 열
  kind      songs(곡명) / names(카드명) / effects(효과)   ← 건드리지 말 것
  ja        일본어 원문 (매칭 키)                        ← 건드리지 말 것
  ko        한국어 번역                                  ← 이 열만 고친다
  count     이 원문을 쓰는 카드 수
  sample    예시 카드 (id · 한국어 이름)
"""
import csv
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KO_PATH = os.path.join(ROOT, 'data/i18n/ko.json')
CARDS_PATH = os.path.join(ROOT, 'data/cards.json')
KINDS = ('songs', 'names', 'effects')
HEADER = ['kind', 'ja', 'ko', 'count', 'sample']


def load():
    ko = json.load(open(KO_PATH, encoding='utf-8'))
    cards = json.load(open(CARDS_PATH, encoding='utf-8'))['cards'] if os.path.exists(CARDS_PATH) else []
    return ko, cards


def base_ja(name_ja):
    """'にらちゃん（お勉強しといてよ）' -> 'にらちゃん'"""
    if name_ja.endswith('）') and '（' in name_ja:
        return name_ja[:name_ja.rindex('（')]
    return name_ja


def export():
    ko, cards = load()
    # 원문별로 쓰는 카드를 모아 count/sample 을 채운다
    users = {k: {} for k in KINDS}
    for c in cards:
        if c['songJa']:
            users['songs'].setdefault(c['songJa'], []).append(c)
        if c['nameJa']:
            users['names'].setdefault(base_ja(c['nameJa']), []).append(c)
        if c['effectJa']:
            users['effects'].setdefault(c['effectJa'], []).append(c)

    w = csv.writer(sys.stdout)
    w.writerow(HEADER)
    for kind in KINDS:
        for ja, ko_text in ko.get(kind, {}).items():
            cs = users[kind].get(ja, [])
            sample = f"{cs[0]['id']} · {cs[0]['nameKo']}" if cs else ''
            w.writerow([kind, ja, ko_text, len(cs), sample])


def do_import(path, dry):
    ko, _ = load()
    changed, unknown = [], []
    with open(path, encoding='utf-8-sig', newline='') as f:
        for row in csv.DictReader(f):
            kind, ja, new = row.get('kind'), row.get('ja'), (row.get('ko') or '').strip()
            if kind not in KINDS or not ja:
                continue
            if ja not in ko.get(kind, {}):
                unknown.append((kind, ja))
                continue
            if not new:
                continue
            if ko[kind][ja] != new:
                changed.append((kind, ja, ko[kind][ja], new))
                ko[kind][ja] = new

    for kind, ja, old, new in changed:
        print(f'[{kind}] {ja[:36]}\n    - {old}\n    + {new}')
    for kind, ja in unknown:
        print(f'  경고: {kind} 에 없는 원문 — {ja[:50]}')
    print(f'\n{len(changed)}건 변경{" (dry-run, 저장하지 않음)" if dry else ""}')
    if changed and not dry:
        json.dump(ko, open(KO_PATH, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print(f'{KO_PATH} 저장 — python3 tools/build_data.py 를 실행하세요.')


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'export':
        export()
    elif cmd == 'import' and len(sys.argv) > 2:
        do_import(sys.argv[2], '--dry' in sys.argv)
    else:
        sys.exit(__doc__)
