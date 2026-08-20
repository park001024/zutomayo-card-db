#!/usr/bin/env python3
"""images/original/*  ->  images/full/*.webp (모달용) + images/thumb/*.webp (그리드용)

원본 JPG(약 152MB)는 보존용으로 저장소에 함께 커밋하고, 화면에서는 WebP 만 쓴다.
원본이 없으면 tools/fetch_images.py 로 다시 받을 수 있다.

  python3 tools/build_images.py            # 없는 것만 생성
  python3 tools/build_images.py --force    # 전부 다시 생성
"""
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'images/original')
FULL = os.path.join(ROOT, 'images/full')
THUMB = os.path.join(ROOT, 'images/thumb')

FULL_QUALITY = 88     # 모달에서 원본 크기(700px)로 보이는 이미지
THUMB_WIDTH = 400     # 그리드 타일은 160~200px 이라 2배수면 충분
THUMB_QUALITY = 80


def convert(im, dst, width, quality):
    if width and im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(dst, 'WEBP', quality=quality, method=6)


def main():
    force = '--force' in sys.argv
    for d in (FULL, THUMB):
        os.makedirs(d, exist_ok=True)

    if not os.path.isdir(SRC) or not os.listdir(SRC):
        sys.exit(f'원본 이미지가 없습니다: {SRC}\n  python3 tools/fetch_images.py 를 먼저 실행하세요.')

    made = skipped = 0
    for name in sorted(os.listdir(SRC)):
        if not name.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
            continue
        src = os.path.join(SRC, name)
        stem = name.rsplit('.', 1)[0]   # 곧 공식 카드 id (1st_1 …)
        targets = [(os.path.join(FULL, stem + '.webp'), None, FULL_QUALITY),
                   (os.path.join(THUMB, stem + '.webp'), THUMB_WIDTH, THUMB_QUALITY)]
        todo = [t for t in targets
                if force or not os.path.exists(t[0]) or os.path.getmtime(t[0]) < os.path.getmtime(src)]
        if not todo:
            skipped += 1
            continue
        with Image.open(src) as im:
            im = im.convert('RGB')
            for dst, width, q in todo:
                convert(im, dst, width, q)
        made += 1

    def mb(p):
        return sum(os.path.getsize(os.path.join(p, f)) for f in os.listdir(p)) / 1024 / 1024

    print(f'{made}장 변환, {skipped}장 건너뜀')
    print(f'original {mb(SRC):.1f}MB  ->  full(webp) {mb(FULL):.1f}MB + thumb {mb(THUMB):.1f}MB')


if __name__ == '__main__':
    main()
