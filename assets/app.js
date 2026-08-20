/* ZUTOMAYO CARD 도감 — 검색 / 필터 / 정렬 / 한국어·일본어 전환
 *
 * 데이터는 data/cards.json 한 파일. 카드마다 일본어 원문(공식)과 한국어 번역을
 * 함께 들고 있고, 화면 언어와 무관하게 검색은 양쪽 언어 모두를 대상으로 한다.
 */
'use strict';

/* ── UI 문자열 ─────────────────────────────── */
const UI = {
  ko: {
    brandSub: '한국어 도감',
    searchPlaceholder: '이름 · 효과 · 일러스트레이터 · 초성 검색',
    all: '전체',
    fSeason: '탄 / 팩', fType: '카드 종류', fRarity: '등급', fAttribute: '속성',
    fSong: '수록곡',
    resetAll: '필터 전체 해제',
    rangeMin: '최소', rangeMax: '최대', rangeNote: (n) => `값이 있는 ${n}장만 대상`,
    sort: '정렬', copyLink: '🔗 링크 복사', copyCardLink: '🔗 이 카드 링크 복사',
    total: (n) => `/ ${n}장`,
    noResult: '조건에 맞는 카드가 없습니다. 검색어나 필터를 바꿔보세요.',
    viewTable: '☰ 표', viewGrid: '▦ 카드',
    copied: '링크를 복사했습니다', copyFail: '복사 실패 — 주소창의 URL 을 직접 복사해 주세요',
    loadFail: (m) => `카드 데이터를 불러오지 못했습니다 (${m}).<br>file:// 로 열면 브라우저가 fetch 를 막습니다. <code>python3 -m http.server</code> 로 실행해 주세요.`,
    chronos: '크로노스', cost: '파워코스트', stp: '센드 투 파워',
    night: '공격력 (밤)', day: '공격력 (낮)',
    cardNo: '카드 번호', rarity: '등급', type: '종류', attribute: '속성',
    attack: '공격력', effect: '효과', song: '수록곡', illustrator: '일러스트레이터',
    pack: '팩', jaOriginal: '일본어 원문',
    nightShort: '밤', dayShort: '낮',
    sortOptions: [
      ['default', '탄 · 번호'], ['name', '이름 (가나다)'], ['rarity', '등급 (N→SE)'],
      ['chronos-asc', '크로노스 낮은 순'], ['chronos-desc', '크로노스 높은 순'],
      ['cost-asc', '파워코스트 낮은 순'], ['cost-desc', '파워코스트 높은 순'],
      ['night-desc', '밤 공격력 높은 순'], ['day-desc', '낮 공격력 높은 순'],
    ],
    tableCols: ['이미지', '이름', '탄', '등급', '종류', '속성', '크로노스', '밤', '낮', '코스트', 'S→P', '효과'],
  },
  ja: {
    brandSub: '日本語（公式データ）',
    searchPlaceholder: 'カード名・効果・イラストレーターを検索',
    all: 'すべて',
    fSeason: '弾 / パック', fType: '種類', fRarity: 'レアリティ', fAttribute: '属性',
    fSong: '楽曲',
    resetAll: 'フィルターをリセット',
    rangeMin: '下限', rangeMax: '上限', rangeNote: (n) => `値のある${n}枚のみ対象`,
    sort: '並び替え', copyLink: '🔗 リンクをコピー', copyCardLink: '🔗 このカードのリンク',
    total: (n) => `/ ${n}枚`,
    noResult: '条件に合うカードがありません。キーワードやフィルターを変えてみてください。',
    viewTable: '☰ 一覧', viewGrid: '▦ カード',
    copied: 'リンクをコピーしました', copyFail: 'コピーできませんでした — URL を直接コピーしてください',
    loadFail: (m) => `カードデータを読み込めませんでした (${m}).<br>file:// では fetch がブロックされます。<code>python3 -m http.server</code> で起動してください。`,
    chronos: '時計', cost: 'POWER COST', stp: 'SEND TO POWER',
    night: '攻撃力（夜）', day: '攻撃力（昼）',
    cardNo: 'カード番号', rarity: 'レアリティ', type: '種類', attribute: '属性',
    attack: '攻撃力', effect: '効果', song: '楽曲', illustrator: 'イラストレーター',
    pack: 'パック', jaOriginal: '日本語原文',
    nightShort: '夜', dayShort: '昼',
    sortOptions: [
      ['default', '弾・番号'], ['name', '名前順'], ['rarity', 'レアリティ (N→SE)'],
      ['chronos-asc', '時計が小さい順'], ['chronos-desc', '時計が大きい順'],
      ['cost-asc', 'POWER COST 小さい順'], ['cost-desc', 'POWER COST 大きい順'],
      ['night-desc', '夜攻撃力が高い順'], ['day-desc', '昼攻撃力が高い順'],
    ],
    tableCols: ['画像', '名前', '弾', 'レアリティ', '種類', '属性', '時計', '夜', '昼', 'COST', 'S→P', '効果'],
  },
};

const RANGES = [
  { key: 'chronos', field: 'chronos',     label: 'chronos', min: 'cmin', max: 'cmax' },
  { key: 'cost',    field: 'powerCost',   label: 'cost',    min: 'pmin', max: 'pmax' },
  { key: 'stp',     field: 'sendToPower', label: 'stp',     min: 'smin', max: 'smax' },
  { key: 'night',   field: 'powerNight',  label: 'night',   min: 'nmin', max: 'nmax' },
  { key: 'day',     field: 'powerDay',    label: 'day',     min: 'dmin', max: 'dmax' },
];

const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const RARITY_ORDER = { N: 0, R: 1, SR: 2, UR: 3, SE: 4 };

/** 한글 문자열 -> 초성 문자열 */
function chosung(s) {
  let out = '';
  for (const ch of s || '') {
    const c = ch.codePointAt(0);
    out += (c >= 0xac00 && c <= 0xd7a3) ? CHO[Math.floor((c - 0xac00) / 588)] : ch;
  }
  return out;
}
/* 반각 가나·구두점 ｡(U+FF61) ~ ﾝ(U+FF9D) 를 순서대로 전각에 대응시킨 표.
 * 탁점 ﾞ / 반탁점 ﾟ 는 뒤에 따로 오므로 앞 글자와 합쳐 준다 (ﾀ + ﾞ -> ダ). */
const HALF_WIDE = '。「」、・ヲァィゥェォャュョッーアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン';

/** 검색 정규화 + 위치 추적.
 *  소문자 · 공백 제거 · 전각 영숫자→반각 · 가타카나(전각·반각)→히라가나.
 *
 *  반각 탁점은 두 글자가 한 글자로 줄고 대문자 일부는 한 글자가 여러 글자로 늘기 때문에
 *  글자 수가 원본과 달라진다. 그래서 정규화 결과와 "그 글자가 원본의 어디에서 왔는지"를
 *  한 곳에서 함께 만든다. 검색 인덱스(norm)와 하이라이트가 이 함수를 공유하므로
 *  "검색은 걸리는데 하이라이트는 안 되는" 어긋남이 생기지 않는다.
 *
 *  out[k] 는 원본의 [from[k], to[k]) 구간에서 나온 글자다.
 */
function normScan(s) {
  let out = '';
  const from = [], to = [];
  for (let i = 0; i < s.length; i++) {
    if (/\s/.test(s[i])) continue;                 // 공백은 버린다 (대응 구간 없음)
    const c = s.charCodeAt(i);
    let piece = s[i], len = 1;

    if (c >= 0xff61 && c <= 0xff9d) {              // 반각 가나·구두점
      piece = HALF_WIDE[c - 0xff61];
      const nx = s.charCodeAt(i + 1);
      if (nx === 0xff9e || nx === 0xff9f) {         // 탁점 / 반탁점을 합친다
        const composed = (piece + (nx === 0xff9e ? '\u3099' : '\u309a')).normalize('NFC');
        if (composed.length === 1) { piece = composed; len = 2; }
      }
    }
    piece = piece
      .toLowerCase()
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
      .replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
      .replace(/ς/g, 'σ')                          // 어말 시그마를 한 형태로 모은다
      .replace(/[•·]/g, '・');                      // 중점 표기 차이를 흡수한다 (공식 데이터가 섞여 있다)

    for (const ch of piece) { out += ch; from.push(i); to.push(i + len); }
    i += len - 1;
  }
  return { out, from, to };
}
/** 검색용 정규화 문자열. 하이라이트와 같은 규칙을 쓴다. */
const norm = (s) => normScan(s || '').out;
const isChosungQuery = (x) => /^[ㄱ-ㅎ]+$/.test(x);

/* ── 상태 ─────────────────────────────────── */
const state = {
  lang: 'ko',
  q: '',
  season: new Set(), type: new Set(), rarity: new Set(), attribute: new Set(),
  song: '',
  range: Object.fromEntries(RANGES.map((r) => [r.key, { min: null, max: null }])),
  sort: 'default',
  view: 'grid',
};
let DATA = null;
let CARDS = [];
let shown = [];
let modalIdx = -1;

const $ = (id) => document.getElementById(id);
const t = (k) => UI[state.lang][k] ?? UI.ko[k];

try {
  document.documentElement.dataset.theme = localStorage.getItem('ztmy-theme') || 'dark';
} catch { document.documentElement.dataset.theme = 'dark'; }

/* ── 카드 표시 헬퍼 ────────────────────────── */
const isJa = () => state.lang === 'ja';
const cardName = (c) => (isJa() ? (c.nameJa || c.nameKo) : c.nameKo);
const cardEffect = (c) => (isJa() ? (c.effectJa || c.effectKo) : (c.effectKo || c.effectJa));
const cardSong = (c) => (isJa() ? c.songJa : (c.songKo || c.songJa));
const label = (list, key) => {
  const hit = (list || []).find((x) => x.key === key);
  return hit ? (isJa() ? hit.ja : hit.ko) : (key || '');
};
const attrLabel = (c) => label(DATA.attributes, c.attribute);
const typeLabel = (c) => label(DATA.types, c.type);
const packOf = (season) => (DATA.seasons.find((s) => s.n === season) || {}).pack || '';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (m) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

/* ── 데이터 로드 ───────────────────────────── */
async function boot() {
  readURL();                      // 언어를 먼저 확정해야 로드 실패 메시지도 해당 언어로 나온다
  try {
    const res = await fetch('data/cards.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    DATA = await res.json();
  } catch (err) {
    $('grid').innerHTML = `<p class="empty">${t('loadFail')(err.message)}</p>`;
    return;
  }

  CARDS = DATA.cards.map((c) => {
    // 검색 범위: 양쪽 언어의 이름·효과 + 일러스트레이터 (초성은 한국어 이름·효과만)
    const hay = [c.nameKo, c.nameJa, c.effectKo, c.effectJa, c.illustrator].join(' ');
    return {
      ...c,
      _text: norm(hay),
      _cho: norm(chosung([c.nameKo, c.effectKo].join(' '))),
    };
  });

  buildSort();
  buildChips();
  buildSongSelect();
  buildRanges();
  bindEvents();
  applyI18n();
  syncControls();
  render();
  openFromURL();
}

/* ── 사이드바 ──────────────────────────────── */
function countBy(key, value) {
  return CARDS.filter((c) => String(c[key]) === String(value)).length;
}
function chip(group, value, text, title) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chip';
  b.dataset.group = group;
  b.dataset.value = value;
  if (title) b.title = title;
  b.innerHTML = `<span class="chip-label"></span><span class="n">${countBy(group, value)}</span>`;
  b.querySelector('.chip-label').textContent = text;
  b.addEventListener('click', () => {
    const set = state[group];
    set.has(String(value)) ? set.delete(String(value)) : set.add(String(value));
    syncControls(); render(); writeURL();
  });
  return b;
}
function buildChips() {
  $('f-season').replaceChildren(...DATA.seasons.map((s) =>
    chip('season', s.n, isJa() ? `${s.n}弾` : `${s.n}탄`, s.pack)));
  $('f-type').replaceChildren(...DATA.types.map((x) => chip('type', x.key, isJa() ? x.ja : x.ko)));
  $('f-rarity').replaceChildren(...DATA.rarities.map((r) => chip('rarity', r, r)));
  $('f-attribute').replaceChildren(...DATA.attributes.map((a) => chip('attribute', a.key, isJa() ? a.ja : a.ko)));
}
/** 곡 목록 정렬: 일본어 화면은 일본어 원문 순(cards.json 순서), 한국어 화면은 한국어 이름 순 */
function songsSorted() {
  const list = DATA.songs.slice();
  if (!isJa()) list.sort((a, b) => a.ko.localeCompare(b.ko, 'ko'));
  return list;
}
function buildSongSelect() {
  const sel = $('f-song');
  sel.innerHTML = [`<option value="">${esc(t('all'))}</option>`].concat(
    songsSorted().map((s) => {
      const n = CARDS.filter((c) => c.songJa === s.ja).length;
      const text = isJa() || s.ko === s.ja ? s.ja : `${s.ko} · ${s.ja}`;
      return `<option value="${esc(s.ja)}">${esc(text)} (${n})</option>`;
    })
  ).join('');
  sel.value = state.song;
}
function buildSort() {
  $('sort').innerHTML = t('sortOptions')
    .map(([v, text]) => `<option value="${v}">${esc(text)}</option>`).join('');
  $('sort').value = state.sort;
}
function buildRanges() {
  const box = $('f-ranges');
  box.replaceChildren();
  RANGES.forEach((r) => {
    const vals = CARDS.map((c) => c[r.field]).filter((v) => v !== null && v !== undefined);
    const lo = Math.min(...vals), hi = Math.max(...vals);

    const h = document.createElement('h3');
    h.innerHTML = `<span></span> <span class="hint">${lo}–${hi}</span>`;
    h.firstElementChild.textContent = t(r.label);
    const row = document.createElement('div');
    row.className = 'range-row';
    row.innerHTML = ['min', 'max'].map((side) => `
      <label>${esc(side === 'min' ? t('rangeMin') : t('rangeMax'))}
        <input id="${r.key}-${side}" type="number" inputmode="numeric" step="1"
               min="${lo}" max="${hi}" placeholder="${side === 'min' ? lo : hi}" />
      </label>`).join('');
    box.append(h, row);

    if (vals.length < CARDS.length) {
      const note = document.createElement('p');
      note.className = 'range-note';
      note.textContent = t('rangeNote')(vals.length);
      box.appendChild(note);
    }
  });
  RANGES.forEach((r) => ['min', 'max'].forEach((side) => {
    $(`${r.key}-${side}`).addEventListener('input', (e) => {
      const n = parseInt(e.target.value, 10);
      state.range[r.key][side] = e.target.value === '' || Number.isNaN(n) ? null : n;
      render(); writeURL();
    });
  }));
}

/* ── 필터 ─────────────────────────────────── */
function matchQuery(card, tokens) {
  return tokens.every((tok) =>
    isChosungQuery(tok) ? card._cho.includes(tok) : card._text.includes(tok));
}

function filtered() {
  const tokens = state.q.trim().split(/\s+/).map(norm).filter(Boolean);
  const list = CARDS.filter((c) => {
    if (state.season.size && !state.season.has(String(c.season))) return false;
    if (state.type.size && !state.type.has(c.type)) return false;
    if (state.rarity.size && !state.rarity.has(c.rarity)) return false;
    if (state.attribute.size && !state.attribute.has(c.attribute)) return false;
    if (state.song && c.songJa !== state.song) return false;
    for (const r of RANGES) {
      const { min, max } = state.range[r.key];
      if (min === null && max === null) continue;
      const v = c[r.field];
      if (v === null || v === undefined) return false;
      if (min !== null && v < min) return false;
      if (max !== null && v > max) return false;
    }
    if (tokens.length && !matchQuery(c, tokens)) return false;
    return true;
  });

  const num = (v) => (v === null || v === undefined ? -Infinity : v);
  const cmp = {
    default: (a, b) => a.season - b.season || a.no - b.no,
    name: (a, b) => cardName(a).localeCompare(cardName(b), state.lang),
    rarity: (a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity],
    'chronos-asc': (a, b) => num(a.chronos) - num(b.chronos),
    'chronos-desc': (a, b) => num(b.chronos) - num(a.chronos),
    'cost-asc': (a, b) => num(a.powerCost) - num(b.powerCost),
    'cost-desc': (a, b) => num(b.powerCost) - num(a.powerCost),
    'night-desc': (a, b) => num(b.powerNight) - num(a.powerNight),
    'day-desc': (a, b) => num(b.powerDay) - num(a.powerDay),
  }[state.sort] || ((a, b) => a.season - b.season || a.no - b.no);
  list.sort((a, b) => cmp(a, b) || a.season - b.season || a.no - b.no);
  return list;
}

/* ── 검색어 하이라이트 ─────────────────────── */
/** 검색어에 걸린 부분을 <mark> 로 감싼다.
 *  normScan 이 돌려주는 위치 정보로 정규화 문자열에서 찾은 자리를 원본 자리로 되돌린다.
 *  그래서 ニラ 로 검색해도 にら 표기가, ﾀﾞﾝｽ 로 검색해도 ダンス 표기가 함께 강조된다. */
function highlight(text, tokens) {
  const s = String(text ?? '');
  const toks = tokens.map(norm).filter((x) => x && !isChosungQuery(x));
  if (!toks.length) return esc(s);

  const { out, from, to } = normScan(s);
  const hit = new Array(s.length).fill(false);
  toks.forEach((tok) => {
    for (let at = out.indexOf(tok); at >= 0; at = out.indexOf(tok, at + 1)) {
      for (let k = at; k < at + tok.length; k++) {
        for (let j = from[k]; j < to[k]; j++) hit[j] = true;   // 탁점까지 함께 덮는다
      }
    }
  });

  let html = '', open = false;
  for (let i = 0; i < s.length; i++) {
    if (hit[i] !== open) { html += open ? '</mark>' : '<mark>'; open = hit[i]; }
    html += esc(s[i]);
  }
  return html + (open ? '</mark>' : '');
}

/* ── 렌더 ─────────────────────────────────── */
/** 카드 배지. 수치는 이모지로 줄여 쓰고, 무슨 값인지는 title 로 알려 준다. */
function badges(c) {
  const b = (cls, text, title) =>
    `<span class="badge${cls ? ' ' + cls : ''}"${title ? ` title="${esc(title)}"` : ''}>${esc(text)}</span>`;
  const out = [
    b(`r-${c.rarity}`, c.rarity, `${t('rarity')} ${c.rarity}`),
    b('', isJa() ? `${c.season}弾` : `S${c.season}`, `${c.pack} (${c.season}${isJa() ? '弾' : '탄'})`),
  ];
  if (c.attribute) out.push(b(`a-${c.attribute}`, attrLabel(c), `${t('attribute')} ${attrLabel(c)}`));
  out.push(b('', typeLabel(c), `${t('type')} ${typeLabel(c)}`));
  const dash = (v) => (v === null || v === undefined ? '–' : v);
  if (c.chronos !== null) out.push(b('', `🕐 ${c.chronos}`, `${t('chronos')} ${c.chronos}`));
  // 파워코스트와 센드 투 파워를 한 배지에
  if (c.powerCost !== null || c.sendToPower !== null) {
    out.push(b('', `🔷 ${dash(c.powerCost)} | ⚡ ${dash(c.sendToPower)}`,
                   `${t('cost')} ${dash(c.powerCost)} | ${t('stp')} ${dash(c.sendToPower)}`));
  }
  // 밤/낮 공격력을 한 배지에 (값이 있는 캐릭터 카드만)
  if (c.powerNight !== null || c.powerDay !== null) {
    out.push(b('', `🌙 ${dash(c.powerNight)} | ☀️ ${dash(c.powerDay)}`,
                   `${t('attack')} ${t('nightShort')} ${dash(c.powerNight)} | ${t('dayShort')} ${dash(c.powerDay)}`));
  }
  const song = cardSong(c);
  if (song) out.push(b('badge-song', `🎵 ${song}`, `${t('song')} ${song}`));
  return out.join('');
}

function render() {
  shown = filtered();
  const tokens = state.q.trim().split(/\s+/).filter(Boolean);

  $('count').textContent = shown.length;
  $('count-total').textContent = t('total')(CARDS.length);
  $('empty').hidden = shown.length > 0;
  $('grid').hidden = state.view !== 'grid';
  $('table-wrap').hidden = state.view !== 'table';
  renderActiveFilters();

  if (state.view === 'grid') {
    const frag = document.createDocumentFragment();
    shown.forEach((c, i) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'tile';
      const eff = cardEffect(c);
      el.innerHTML =
        `<img src="${c.thumb}" alt="${esc(cardName(c))}" loading="lazy" decoding="async" />` +
        `<div class="tile-body">` +
        `<div class="tile-name">${highlight(cardName(c), tokens)}</div>` +
        `<div class="tile-meta">${badges(c)}</div>` +
        (eff ? `<div class="tile-effect">${highlight(eff, tokens)}</div>` : '') +
        `</div>`;
      el.addEventListener('click', () => openModal(i));
      frag.appendChild(el);
    });
    $('grid').replaceChildren(frag);
  } else {
    $('thead-row').innerHTML = t('tableCols').map((h) => `<th>${esc(h)}</th>`).join('');
    const frag = document.createDocumentFragment();
    shown.forEach((c, i) => {
      const cell = (v) => (v === null || v === undefined || v === '' ? '–' : esc(v));
      const tr = document.createElement('tr');
      tr.innerHTML =
        `<td><img src="${c.thumb}" alt="" loading="lazy" /></td>` +
        `<td>${highlight(cardName(c), tokens)}</td>` +
        `<td class="num">${c.season}</td>` +
        `<td><span class="badge r-${c.rarity}">${c.rarity}</span></td>` +
        `<td>${esc(typeLabel(c))}</td>` +
        `<td>${cell(attrLabel(c))}</td>` +
        `<td class="num">${cell(c.chronos)}</td>` +
        `<td class="num">${cell(c.powerNight)}</td>` +
        `<td class="num">${cell(c.powerDay)}</td>` +
        `<td class="num">${cell(c.powerCost)}</td>` +
        `<td class="num">${cell(c.sendToPower)}</td>` +
        `<td class="eff">${cardEffect(c) ? highlight(cardEffect(c), tokens) : '–'}</td>`;
      tr.addEventListener('click', () => openModal(i));
      frag.appendChild(tr);
    });
    $('tbody').replaceChildren(frag);
  }
}

function renderActiveFilters() {
  const tags = [];
  const push = (text, clear) => tags.push({ text, clear });

  if (state.q.trim()) push(`"${state.q.trim()}"`, () => { state.q = ''; });
  state.season.forEach((v) => push(isJa() ? `${v}弾` : `${v}탄`, () => state.season.delete(v)));
  state.type.forEach((v) => push(label(DATA.types, v), () => state.type.delete(v)));
  state.rarity.forEach((v) => push(v, () => state.rarity.delete(v)));
  state.attribute.forEach((v) => push(label(DATA.attributes, v), () => state.attribute.delete(v)));
  if (state.song) {
    const s = DATA.songs.find((x) => x.ja === state.song);
    push(`${t('fSong')}: ${s ? (isJa() ? s.ja : s.ko) : state.song}`, () => { state.song = ''; });
  }
  RANGES.forEach((r) => {
    const { min, max } = state.range[r.key];
    if (min === null && max === null) return;
    push(`${t(r.label)} ${min ?? ''}~${max ?? ''}`,
         () => { state.range[r.key] = { min: null, max: null }; });
  });

  $('active-filters').replaceChildren(...tags.map(({ text, clear }) => {
    const el = document.createElement('span');
    el.className = 'tag';
    el.innerHTML = `<span></span> <button type="button">✕</button>`;
    el.firstElementChild.textContent = text;
    el.querySelector('button').addEventListener('click', () => {
      clear(); syncControls(); render(); writeURL();
    });
    return el;
  }));
}

/* ── 모달 ─────────────────────────────────── */
function openModal(i) {
  if (i < 0 || i >= shown.length) return;
  modalIdx = i;
  const c = shown[i];

  $('m-img').src = c.img;
  $('m-img').alt = cardName(c);
  $('m-name').textContent = cardName(c);
  // 한국어 화면에서만 일본어 원제를 부제로 보여 준다 (일본어 화면에는 한글을 넣지 않는다)
  $('m-subname').textContent = (!isJa() && c.nameJa && c.nameJa !== c.nameKo) ? c.nameJa : '';
  $('m-badges').innerHTML = badges(c);

  const rows = [
    [t('cardNo'), isJa() ? `${c.no}番` : `${c.no}번`],
    [t('pack'), `${c.pack || packOf(c.season)} (${c.season}${isJa() ? '弾' : '탄'})`.trim()],
    [t('rarity'), c.rarity],
    [t('type'), typeLabel(c)],
    [t('attribute'), attrLabel(c)],
    [t('chronos'), c.chronos],
    [t('attack'), (c.powerNight !== null || c.powerDay !== null)
      ? `${t('nightShort')} ${c.powerNight ?? '–'} ｜ ${t('dayShort')} ${c.powerDay ?? '–'}` : ''],
    [t('cost'), c.powerCost],
    [t('stp'), c.sendToPower],
    // 세 번째 값이 true 면 값이 없어도 줄을 남기고 빈 칸으로 보여 준다
    [t('song'), cardSong(c), true],
    [t('illustrator'), c.illustrator],
    [t('effect'), cardEffect(c), true],
  ].filter(([, v, keep]) => keep || (v !== '' && v !== null && v !== undefined));

  const br = (s) => esc(String(s)).replace(/\n/g, '<br>');
  let html = rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${br(v ?? '')}</td></tr>`).join('');

  // 한국어 화면에서는 일본어 원문을 함께 보여 준다 (없으면 빈 칸)
  if (!isJa()) {
    html += `<tr><th>${esc(t('jaOriginal'))}</th><td class="ja-src">${br(c.effectJa || '')}</td></tr>`;
  }
  $('m-table').innerHTML = html;

  $('modal').hidden = false;
  document.body.style.overflow = 'hidden';
  writeURL();
}
function closeModal() {
  $('modal').hidden = true;
  modalIdx = -1;
  document.body.style.overflow = '';
  writeURL();
}
const moveModal = (d) => openModal((modalIdx + d + shown.length) % shown.length);

/* ── URL 동기화 ───────────────────────────── */
function writeURL() {
  const p = new URLSearchParams();
  if (state.lang !== 'ko') p.set('lang', state.lang);
  if (state.q.trim()) p.set('q', state.q.trim());
  [['season', 'season'], ['type', 'type'], ['rarity', 'rarity'], ['attribute', 'attr']]
    .forEach(([g, key]) => { if (state[g].size) p.set(key, [...state[g]].join(',')); });
  if (state.song) p.set('song', state.song);
  RANGES.forEach((r) => {
    const { min, max } = state.range[r.key];
    if (min !== null) p.set(r.min, min);
    if (max !== null) p.set(r.max, max);
  });
  if (state.sort !== 'default') p.set('sort', state.sort);
  if (state.view !== 'grid') p.set('view', state.view);
  if (modalIdx >= 0 && shown[modalIdx]) p.set('card', shown[modalIdx].id);
  const qs = p.toString();
  history.replaceState(null, '', qs ? '?' + qs : location.pathname);
}
function readURL() {
  const p = new URLSearchParams(location.search);
  let lang = p.get('lang');
  if (lang !== 'ja' && lang !== 'ko') {
    try { lang = localStorage.getItem('ztmy-lang'); } catch { lang = null; }
  }
  state.lang = lang === 'ja' ? 'ja' : 'ko';

  state.q = p.get('q') || '';
  const setOf = (key, g) => (p.get(key) || '').split(',').filter(Boolean).forEach((v) => state[g].add(v));
  setOf('season', 'season'); setOf('type', 'type'); setOf('rarity', 'rarity'); setOf('attr', 'attribute');
  state.song = p.get('song') || '';
  const int = (k) => {
    const v = p.get(k);
    if (v === null || v === '') return null;
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? null : n;
  };
  RANGES.forEach((r) => { state.range[r.key] = { min: int(r.min), max: int(r.max) }; });
  state.sort = p.get('sort') || 'default';
  state.view = p.get('view') === 'table' ? 'table' : 'grid';
}
function openFromURL() {
  const id = new URLSearchParams(location.search).get('card');
  if (!id) return;
  const i = shown.findIndex((c) => c.id === id);
  if (i >= 0) openModal(i);
}

/* ── 언어 ─────────────────────────────────── */
function applyI18n() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  $('lang-ko').classList.toggle('on', state.lang === 'ko');
  $('lang-ja').classList.toggle('on', state.lang === 'ja');
}
function setLang(lang) {
  if (lang === state.lang) return;
  state.lang = lang;
  try { localStorage.setItem('ztmy-lang', lang); } catch {}
  // 라벨이 언어에 따라 바뀌는 컨트롤은 다시 만든다
  buildSort(); buildChips(); buildSongSelect(); buildRanges();
  applyI18n(); syncControls(); render(); writeURL();
  if (modalIdx >= 0) openModal(modalIdx);
}

function syncControls() {
  document.querySelectorAll('.chip').forEach((b) => {
    b.classList.toggle('on', state[b.dataset.group].has(b.dataset.value));
  });
  $('q').value = state.q;
  $('q-clear').hidden = !state.q;
  $('f-song').value = state.song;
  RANGES.forEach((r) => {
    $(`${r.key}-min`).value = state.range[r.key].min ?? '';
    $(`${r.key}-max`).value = state.range[r.key].max ?? '';
  });
  $('sort').value = state.sort;
  $('view-toggle').textContent = state.view === 'grid' ? t('viewTable') : t('viewGrid');
}

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.hidden = true; }, 1600);
}
async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast(t('copied'));
  } catch {
    toast(t('copyFail'));
  }
}

/* ── 이벤트 ───────────────────────────────── */
function bindEvents() {
  let timer;
  $('q').addEventListener('input', (e) => {
    state.q = e.target.value;
    $('q-clear').hidden = !state.q;
    clearTimeout(timer);
    timer = setTimeout(() => { render(); writeURL(); }, 80);
  });
  $('q-clear').addEventListener('click', () => {
    state.q = ''; syncControls(); render(); writeURL(); $('q').focus();
  });
  $('f-song').addEventListener('change', (e) => {
    state.song = e.target.value; render(); writeURL();
  });
  $('sort').addEventListener('change', (e) => { state.sort = e.target.value; render(); writeURL(); });

  document.querySelectorAll('[data-reset]').forEach((b) => {
    b.addEventListener('click', () => {
      state[b.dataset.reset].clear(); syncControls(); render(); writeURL();
    });
  });
  $('reset-all').addEventListener('click', () => {
    state.q = '';
    ['season', 'type', 'rarity', 'attribute'].forEach((g) => state[g].clear());
    state.song = '';
    RANGES.forEach((r) => { state.range[r.key] = { min: null, max: null }; });
    state.sort = 'default';
    syncControls(); render(); writeURL();
  });

  $('view-toggle').addEventListener('click', () => {
    state.view = state.view === 'grid' ? 'table' : 'grid';
    syncControls(); render(); writeURL();
  });
  $('lang-ko').addEventListener('click', () => setLang('ko'));
  $('lang-ja').addEventListener('click', () => setLang('ja'));
  $('share').addEventListener('click', () => copy(location.href));
  $('m-link').addEventListener('click', () => copy(location.href));

  $('m-close').addEventListener('click', closeModal);
  $('m-prev').addEventListener('click', () => moveModal(-1));
  $('m-next').addEventListener('click', () => moveModal(1));
  $('modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });

  $('theme-btn').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('ztmy-theme', next); } catch {}
  });

  document.addEventListener('keydown', (e) => {
    if (!$('modal').hidden) {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') moveModal(-1);
      if (e.key === 'ArrowRight') moveModal(1);
      return;
    }
    const typing = /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName);
    if (e.key === '/' && !typing) { e.preventDefault(); $('q').focus(); $('q').select(); }
    if (e.key === 'Escape' && typing) document.activeElement.blur();
  });
}

boot();
