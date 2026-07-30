#!/usr/bin/env python3
"""데이터 점검 리포트.

  python3 tools/check_data.py           # 요약
  python3 tools/check_data.py --list    # 손볼 카드 목록 (미번역·공식 미공개 등)
  python3 tools/check_data.py --csv     # 검수용 CSV (일본어 원문 / 한국어 번역)

효과가 없는 카드(바닐라)는 결손이 아니므로 따로 센다.
"""
import csv
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data = json.load(open(os.path.join(ROOT, 'data/cards.json'), encoding='utf-8'))
cards = data['cards']

bad = [c for c in cards if c['missing']]
vanilla = [c for c in cards if c['vanilla']]
COLS = ['id', 'officialId', 'season', 'no', 'rarity', 'type', 'attribute', 'chronos',
        'powerNight', 'powerDay', 'powerCost', 'sendToPower', 'pack', 'songJa', 'songKo',
        'illustrator', 'nameJa', 'nameKo', 'effectJa', 'effectKo', 'missing']


def dump(rows):
    w = csv.writer(sys.stdout)
    w.writerow(COLS)
    for c in rows:
        w.writerow(['|'.join(c[k]) if isinstance(c.get(k), list) else c.get(k, '') for k in COLS])


if '--csv' in sys.argv:
    dump(cards)
    sys.exit()

# ── 손으로 넣은 카드의 일본어 표기 점검 ─────────────────────────
# 공식 원문의 관행: 枚/つ/属性/★/コスト 앞 숫자는 전각, 攻撃力+·HP·ダメージ 는 반각
NOTATION = [
    (r'[0-9](?=枚)', '枚 앞의 숫자는 전각(１２…)', 'full'),
    (r'[0-9](?=つ)', 'つ 앞의 숫자는 전각', 'full'),
    (r'[0-9](?=属性)', '属性 앞의 숫자는 전각', 'full'),
    (r'★[0-9]', '★ 뒤의 숫자는 전각', 'full'),
    (r'[0-9](?=コスト)', 'コスト 앞의 숫자는 전각', 'full'),
    (r'攻撃力\+[０-９]', '攻撃力+ 뒤의 숫자는 반각(30…)', 'half'),
    (r'HP[をがはに]?[０-９]', 'HP 뒤의 숫자는 반각', 'half'),
    (r'[０-９](?=ダメージ)', 'ダメージ 앞의 숫자는 반각', 'half'),
]
notes = []
for c in cards:
    if c['official']:
        continue
    for pat, msg, _ in NOTATION:
        for m in re.finditer(pat, c['effectJa'] or ''):
            notes.append(f"  {c['id']} {c['nameKo']}: {msg} — \"…{m.group(0)}…\"")
if notes:
    print('일본어 표기 점검 (손으로 넣은 카드)')
    print('\n'.join(notes))
    print()

# ── 수록곡 정합성 ───────────────────────────────────────────────
# 규칙 1: songs 값이 있는 카드는 이름이나 효과에 （곡명）이 나온다
# 규칙 2: 곡 목록의 곡은 모두 카드 1장 이상에 붙어 있다 (목록을 카드에서 만들므로 자동이지만 확인)
song_bad = []
for c in cards:
    if not c['songJa']:
        continue
    tag = f"（{c['songJa']}）"
    if tag not in (c['nameJa'] or '') and tag not in (c['effectJa'] or ''):
        song_bad.append(f"  {c['id']} {c['nameKo']}: 수록곡 '{c['songJa']}' 이 이름·효과에 없음")
song_empty = [s['ja'] for s in data['songs']
              if not any(c['songJa'] == s['ja'] for c in cards)]
if song_bad or song_empty:
    print('수록곡 정합성')
    print('\n'.join(song_bad))
    for s in song_empty:
        print(f"  곡 '{s}' 에 해당하는 카드가 없음")
    print()

print(f"전체 {len(cards)}장")
print(f"  공식 데이터  : {sum(1 for c in cards if c['official'])}장")
print(f"  공식 미공개  : {sum(1 for c in cards if not c['official'])}장 (SE 시크릿 — extra_cards.json)")
print(f"  바닐라(효과 없음): {len(vanilla)}장 ({len(vanilla)/len(cards)*100:.0f}%)")
print(f"  손볼 카드    : {len(bad)}장")
for key in ('translation', 'name', 'attribute', 'chronos', 'power', 'official'):
    n = sum(1 for c in cards if key in c['missing'])
    if n:
        print(f"    - {key}: {n}장")

if '--list' in sys.argv:
    print("\n손볼 카드 목록")
    for c in bad:
        print(f"  {c['id']}  {c['nameKo']:<28s} {c['rarity']:<3s} {','.join(c['missing'])}")
else:
    print("\n목록은 --list, 검수 CSV 는 --csv 를 쓰세요.")
    print("수정은 data/i18n/ko.json (번역) 또는 data/extra_cards.json (공식에 없는 카드) 에 넣고")
    print("python3 tools/build_data.py 를 다시 실행하면 반영됩니다.")
