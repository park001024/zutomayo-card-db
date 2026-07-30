#!/usr/bin/env python3
"""공식 CDN 에서 카드 이미지를 images/original/<공식id>.<확장자> 로 내려받는다.

공식 CDN 은 Referer 없이 요청하면 403 을 준다.
이미 있는 파일은 건너뛴다. --force 로 전부 다시 받는다.

공식에 공개되지 않은 카드(data/extra_cards.json)의 이미지는 여기서 받지 않는다.
images/original/<공식id>.jpg 로 직접 넣어 두면 build_images.py 가 함께 변환한다.

    python3 tools/fetch_images.py [--force]
"""
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DST = os.path.join(ROOT, 'images/original')
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
    'Referer': 'https://zutomayocard.net/search/',
}


def get(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def targets():
    """[(공식id, url)] — 공식 사이트에 이미지가 있는 카드만."""
    official = json.load(open(os.path.join(ROOT, 'data/official_cards.json'), encoding='utf-8'))
    return [(h['id'], h['img']) for h in official if h.get('img')]


def main():
    force = '--force' in sys.argv
    os.makedirs(DST, exist_ok=True)
    items = targets()
    done = skipped = 0
    failed = []

    for i, (oid, url) in enumerate(items, 1):
        ext = os.path.splitext(url)[1].lower() or '.jpg'
        path = os.path.join(DST, oid + ext)
        if not force and os.path.exists(path) and os.path.getsize(path) > 0:
            skipped += 1
            continue
        try:
            data = get(url)
        except Exception as e:  # noqa: BLE001 - 어떤 실패든 목록에 남기고 계속
            failed.append((oid, url, str(e)))
            print(f'[{i}/{len(items)}] FAIL {oid} {e}')
            continue
        with open(path, 'wb') as f:
            f.write(data)
        done += 1
        if done % 50 == 0 or i == len(items):
            print(f'[{i}/{len(items)}] {oid} ({len(data)/1024:.0f}KB)')

    print(f'\n내려받음 {done} / 건너뜀 {skipped} / 실패 {len(failed)}')
    for oid, url, e in failed:
        print(f'  FAIL {oid} {url} — {e}')

    # 공식에 없는 카드는 손으로 넣어야 한다 — 빠진 게 있으면 알려 준다
    extra = json.load(open(os.path.join(ROOT, 'data/extra_cards.json'), encoding='utf-8'))
    have = {os.path.splitext(f)[0] for f in os.listdir(DST)}
    miss = [k for k in extra if not k.startswith('_') and k not in have]
    if miss:
        print(f'  직접 넣어야 하는 이미지: {miss}')


if __name__ == '__main__':
    main()
