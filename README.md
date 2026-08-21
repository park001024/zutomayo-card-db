# ZUTOMAYO CARD 도감 (한국어 / 日本語)

1~4탄 전 425장을 검색·필터·정렬할 수 있는 정적 사이트.
**일본어는 공식 사이트 데이터가 원문이고, 한국어는 그 원문을 새로 번역한 것**이다.

- 공개 주소: <https://park001024.github.io/zutomayo-card-db/>
- 일본어 원본: <https://zutomayocard.net/search/> (공식)

## 데이터 출처와 구성

| | 출처 | 비고 |
|---|---|---|
| 일본어 원문·수치 | 공식 사이트 MeiliSearch API | 422장. 이름·효과·시계·공격력·코스트·팩·수록곡·일러스트레이터 |
| 한국어 번역 | 이 저장소 (`data/i18n/ko.json`) | 카드명 286개 · 곡명 42개 · 효과 231개를 일본어 원문에서 번역 |
| 4탄 SE 3장 | `data/extra_cards.json` (손으로 채움) | 시크릿이라 공식에 없음. 공식과 같은 필드 구조를 쓰고, 화면에서는 다른 카드와 똑같이 취급 |
| 카드 이미지 | 공식 CDN 원본 422장 + 다른 사이트에서 받아온 3장 | 공식 JPG 원본을 보존용으로 함께 커밋한다. 화면에는 원본과 같은 크기(대개 700×978)의 WebP 와 폭 400 썸네일을 쓴다 (원본 150MB / WebP 81MB) |

수치·속성·종류·등급은 모두 공식 값을 따른다.

## 기능

- **언어 전환** 한국어 / 日本語 (기본 한국어). 라벨·정렬·표 머리글·카드 텍스트가 함께 바뀐다
- **검색은 항상 양쪽 언어 대상** — 화면이 한국어여도 `にらちゃん`·`ニラ`·`はなぶし`(일러스트레이터)로 찾을 수 있다
  - 초성 검색 `ㄴㄹㅉ` → 니라쨩, 가타카나/히라가나·전각/반각 구분 없음, 여러 단어 AND
  - 문장부호도 구분하지 않는다 — 따옴표 `「」` `『』` `“”` `‘’` `'` 는 `"` 로,
    중점 `・` `•` `·` 는 서로, `、` 는 `,` 로, `。` 는 `.` 로, `…` 는 `...` 로 쳐도 찾는다
    (`★`/`☆` 는 채움·비움이 뜻이 달라 구분한다)
  - 검색 대상: 한국어·일본어 이름, 한국어·일본어 효과, 일러스트레이터 이름
  - 초성 검색은 한국어 이름·효과에만 적용된다
- **필터** 탄·종류·등급·속성 다중 선택, 수록곡, 크로노스/파워코스트/센드 투 파워/밤·낮 공격력 범위
- **정렬** 이름·등급(N→SE)·크로노스·코스트·밤/낮 공격력. 동점이면 탄 → 카드 번호 순
- **카드 상세** 팩·수록곡·일러스트레이터, `←/→` 로 이동, 카드별 공유 링크
  - 한국어 화면에서는 **일본어 원문을 함께** 보여 준다
- 표 보기, 라이트/다크 테마, 검색·필터·카드 상태가 URL 에 저장됨
- **`/` 키를 누르면 바로 검색창으로 이동**하고, `Esc` 로 검색창을 벗어난다.
  카드를 열어 둔 상태에서는 `←` `→` 로 앞뒤 카드로 넘어가고 `Esc` 로 닫는다

## 로컬에서 미리 보기

수정한 내용을 push 하기 전에 확인할 때만 쓴다. 실제 사이트는 GitHub Pages 가 서빙하므로
서버를 따로 운영할 필요가 없다.

```bash
bash tools/serve.sh          # http://localhost:8765 (내 컴퓨터에서만 접속됨)
```

`index.html` 을 파일로 직접 열면(`file://`) 브라우저가 `fetch` 를 막아 카드가 표시되지 않는다.
그래서 미리 볼 때는 위 스크립트가 필요하다.

## 구조

```
index.html                 화면 구조 (라벨은 data-i18n 으로 app.js 가 채운다)
assets/app.js              검색·필터·정렬·모달·언어 전환 (의존성 0)
assets/style.css           스타일 (다크/라이트)
data/official_cards.json   공식 API 응답 원본 (일본어)
data/extra_cards.json      공식에 없는 카드 — official_cards 와 같은 필드 구조 (일본어) ← 손으로 채운다
data/overrides.json        위 두 파일의 표기 오류 교정 (카드 id -> 필드)
data/i18n/ko.json          한국어 번역 전부 ← 번역 수정은 여기
data/cards.json            ← 사이트가 읽는 결과물 (build_data.py 생성)
images/original/           공식 CDN 원본 <공식id>.jpg (보존용으로 커밋한다 — 화면에서는 쓰지 않는다)
images/full, images/thumb  WebP (모달용 / 그리드용)
tools/                     수집·변환·점검 스크립트
```

## 번역 고치는 법

번역은 **일본어 원문을 키로** 갖고 있어서, 같은 문장을 쓰는 카드는 한 번만 고치면 전부 반영된다.

### 방법 A — 스프레드시트 (권장)

```bash
python3 tools/i18n_csv.py export > review.csv    # 곡명 42 + 카드명 286 + 효과 231 = 559행
# review.csv 를 엑셀/구글시트로 열어 ko 열만 고친다 (kind·ja 열은 매칭 키라 건드리지 말 것)
python3 tools/i18n_csv.py import review.csv --dry # 무엇이 바뀌는지 먼저 확인
python3 tools/i18n_csv.py import review.csv       # ko.json 에 반영
python3 tools/build_data.py                       # 사이트 데이터 재생성
```

CSV 열: `kind`(songs/names/effects) · `ja`(일본어 원문) · **`ko`(고칠 곳)** · `count`(쓰는 카드 수) · `sample`(예시 카드)

`kind` 로 필터하면 곡명만, 카드명만, 효과만 따로 볼 수 있다.

### 방법 B — JSON 직접 수정

1. 무엇을 고칠지 찾기
   ```bash
   python3 tools/check_data.py                     # 요약
   python3 tools/check_data.py --csv  > all.csv     # 전체 425장 (일본어 원문 / 한국어 번역)
   ```
2. `data/i18n/ko.json` 수정
   - `songs`: 곡명 (`"お勉強しといてよ": "공부해 둬"`)
   - `names`: 카드명의 괄호 앞 부분 (`"にらちゃん": "니라쨩"`) — 표시 이름은 `이름 (곡명)` 으로 조립된다
   - `effects`: 효과 (키는 일본어 원문 전체)
3. 공식 데이터 자체에 표기 오류가 있으면 `data/overrides.json`
   ```json
   { "4th_76": { "title": "グレくまくん（形）" } }
   ```
   공식 레코드에 먼저 덮어쓰므로 공식 데이터를 다시 받아도 교정이 유지된다.
4. 다시 빌드
   ```bash
   python3 tools/build_data.py
   ```
   키가 원문과 어긋나면 `번역 없음` 경고가 뜬다 — 공식 텍스트가 바뀌면 여기서 잡힌다.

### 번역에서 정한 것들

- 용어: 어비스 / 파워 차저 / 배틀 존 / 배틀 필드 / 덱 / 패, 引く=뽑는다, 置く=둔다, 軽減=경감
- 속성: 闇 어둠 · 炎 화염 · 電気 전기 · 風 바람 · カオス 카오스
- 카드명은 공식 구조를 따라 `이름 (수록곡)` 형태
- 일러스트레이터 186명은 고유명사라 일본어 표기 그대로 두었다
- 곡명은 공식 번역명을 그대로 사용했다

## 다시 수집

```bash
python3 tools/fetch_official.py   # 공식 API -> data/official_cards.json (새 탄이 나오면)
python3 tools/fetch_images.py     # 공식 CDN -> images/original
python3 tools/build_images.py     # -> images/full + images/thumb (WebP)
python3 tools/build_data.py       # -> data/cards.json
```

공식에 공개되지 않은 카드는 `data/extra_cards.json` 에 **`official_cards.json` 과 같은 필드 구조**로
적고(일본어만), 한국어는 `data/i18n/ko.json` 에 넣는다. 이미지는 `images/original/<카드id>.jpg` 로
직접 넣으면 나머지 과정에 함께 실린다. 두 파일은 같은 경로로 처리되므로 화면상 차이가 없다.

## 배포

GitHub Pages (`main` / `/`). 커밋 후 push 하면 1~2분 안에 반영된다.

```bash
python3 tools/build_data.py
git add -A && git commit -m "..." && git push
```

공개 저장소라 호스팅은 무료다 (용량 1GB / 트래픽 월 100GB 한도, 현재 약 232MB —
그중 150MB 는 화면에서 쓰지 않는 보존용 원본 이미지다).

## 출처

카드 데이터·이미지의 저작권은 ずっと真夜中でいいのに。 / ZUTOMAYO 측에 있다.
일본어 원문과 이미지는 공식 사이트 <https://zutomayocard.net> 에서 가져왔고, 한국어 번역은 이 저장소에서 직접 작업한 것이다.
