/**
 * recolor-blue-to-gold.mjs 가 만든 골드 값을 시안(Blind Car Story) 팔레트로 다시 매핑한다.
 *
 * 이전 변환은 hue 195~265 를 전부 골드로 돌려서 두 가지 문제가 있었다.
 *   1) 주색(파랑)이 골드가 됐다. 시안의 주색은 검정 #111111 이고 골드는 강조용이다.
 *   2) 파란 기운이 살짝 있는 중립 회색(#6b7280, #111827, #0f172a 등)까지 골드가 됐다.
 *
 * 그래서 원본에서 어떤 값이 어떤 골드가 됐는지 다시 계산해 역방향 표를 만들고,
 * 원본 값의 채도·지각밝기(L*)로 역할을 판정해 시안 색으로 바꾼다.
 *
 * 원본에 원래부터 노란색이던 값(별점, 경고색 등)은 이 표에 없으므로 건드리지 않는다.
 *
 * --report 를 주면 파일을 바꾸지 않고 변환표만 출력한다.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ORIGINAL_SRC = '../wonder-front-user/src';
const SRC = 'src';
const TARGET_EXT = /\.(jsx?|css)$/;
const PROTECTED = /\.test\.jsx?$/;
const REPORT_ONLY = process.argv.includes('--report');

/**
 * 차량 외장색 이름을 hex로 매핑한 표가 들어 있는 파일.
 * "인텐스 블루", "네이비" 같은 실제 도장색이라 브랜딩 색이 아니다.
 * 이전 골드 변환이 잘못 건드렸으므로 원본 값으로 되돌린다.
 */
const RESTORE_FILES = new Set([
  'pages/Car/CarDetail.jsx',
  'pages/Car/CarLineDetail.jsx',
  'pages/Car/CarTrimDetail.jsx',
  'mobilePages/main/MobleCarDetail.jsx',
]);

/* recolor-blue-to-gold.mjs 와 반드시 같아야 하는 값 */
const BLUE_HUE_MIN = 195;
const BLUE_HUE_MAX = 265;
const GOLD_HUE = 45;
const SATURATION_SCALE = 0.78;
const MIN_CHROMA = 0.06;

/* 시안 tokens.css 팔레트 */
const BLACK = [17, 17, 17];
const BLACK_DEEP = [0, 0, 0];
const GOLD_LINE = [232, 215, 154];
const GOLD_SOFT = [246, 239, 216];

function rgbToHsl(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return [h * 360, s, l];
}

function hueToRgb(p, q, t) {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

function hslToRgb(h, s, l) {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hn = h / 360;
  return [
    Math.round(hueToRgb(p, q, hn + 1 / 3) * 255),
    Math.round(hueToRgb(p, q, hn) * 255),
    Math.round(hueToRgb(p, q, hn - 1 / 3) * 255),
  ];
}

/** 지각 밝기. 채도 높은 파랑은 HSL 밝기가 0.5여도 실제로는 어둡게 보인다. */
function lstar(r, g, b) {
  const lin = (v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const y = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return y <= 216 / 24389 ? y * (24389 / 27) : y ** (1 / 3) * 116 - 16;
}

/** 이전 변환이 골드로 바꿨을 값. 안 바꿨으면 null. */
function toGold(r, g, b) {
  const chroma = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
  if (chroma < MIN_CHROMA) return null;
  const [h, s, l] = rgbToHsl(r, g, b);
  if (h < BLUE_HUE_MIN || h > BLUE_HUE_MAX) return null;
  return hslToRgb(GOLD_HUE, Math.min(1, s * SATURATION_SCALE), l);
}

/**
 * 원본 값의 역할을 판정해 시안 색을 고른다.
 *
 * 채도가 확실히 높으면 브랜드 파랑이었다는 뜻이다.
 *   아주 밝으면 강조 테두리(골드 라인), 그 외에는 주색인 검정.
 *   원본이 더 어두웠던 값(hover, pressed)은 더 진한 검정으로 보내 단계를 유지한다.
 * 채도가 낮은데 아주 밝으면 칩·배지의 연한 파란 배경이었다. 시안은 연한 골드를 쓴다.
 * 나머지는 파란 기운만 살짝 있던 중립 회색이므로 같은 밝기의 무채색으로 되돌린다.
 */
function pickTarget(r, g, b) {
  const chroma = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
  const l = lstar(r, g, b);

  if (chroma >= 0.25) {
    if (l >= 70) return { rgb: GOLD_LINE, role: '밝은 강조 → 골드 라인' };
    if (l >= 45) return { rgb: BLACK, role: '주색 → 검정' };
    return { rgb: BLACK_DEEP, role: '진한 주색(hover) → 더 진한 검정' };
  }

  if (l >= 92) return { rgb: GOLD_SOFT, role: '연한 배경 → 연한 골드' };
  if (chroma >= 0.14 && l >= 75) return { rgb: GOLD_LINE, role: '연한 테두리 → 골드 라인' };

  const [, , hslL] = rgbToHsl(r, g, b);
  const v = Math.round(hslL * 255);
  return { rgb: [v, v, v], role: '중립 회색 → 무채색 복구' };
}

function toHex(r, g, b) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

const HEX = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
const RGB = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+)\s*)?\)/g;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (TARGET_EXT.test(entry.name)) out.push(full);
  }
  return out;
}

/** 원본을 훑어 "골드 문자열 → 시안 문자열" 표를 만든다. */
function buildMap() {
  const map = new Map();
  const restoreMaps = new Map();
  const conflicts = [];

  const add = (goldStr, targetStr, origStr, role) => {
    const prev = map.get(goldStr);
    if (prev) {
      if (prev.targetStr !== targetStr) {
        conflicts.push(`${goldStr}: ${prev.origStr}→${prev.targetStr} vs ${origStr}→${targetStr}`);
      }
      prev.count += 1;
      return;
    }
    map.set(goldStr, { targetStr, origStr, role, count: 1 });
  };

  for (const file of walk(ORIGINAL_SRC)) {
    if (PROTECTED.test(file)) continue;
    const text = readFileSync(file, 'utf8');
    const rel = relative(ORIGINAL_SRC, file).split('\\').join('/');
    const restore = RESTORE_FILES.has(rel) ? new Map() : null;
    if (restore) restoreMaps.set(rel, restore);

    for (const m of text.matchAll(HEX)) {
      const body =
        m[1].length === 3
          ? m[1]
              .split('')
              .map((c) => c + c)
              .join('')
          : m[1];
      const rgb = [0, 2, 4].map((i) => parseInt(body.slice(i, i + 2), 16));
      const gold = toGold(...rgb);
      if (!gold) continue;
      if (restore) {
        restore.set(toHex(...gold), m[0]);
        continue;
      }
      const target = pickTarget(...rgb);
      add(toHex(...gold), toHex(...target.rgb), m[0], target.role);
    }

    for (const m of text.matchAll(RGB)) {
      const rgb = [m[1], m[2], m[3]].map(Number);
      const gold = toGold(...rgb);
      if (!gold) continue;
      const alpha = m[4];
      const wrap = (v) => (alpha === undefined ? `rgb(${v.join(', ')})` : `rgba(${v.join(', ')}, ${alpha})`);
      if (restore) {
        restore.set(wrap(gold), m[0]);
        continue;
      }
      const target = pickTarget(...rgb);
      add(wrap(gold), wrap(target.rgb), m[0], target.role);
    }
  }

  return { map, restoreMaps, conflicts };
}

const { map, restoreMaps, conflicts } = buildMap();

console.log(`변환표 ${map.size}건`);
if (conflicts.length) {
  console.log(`\n[경고] 같은 골드 값이 서로 다른 원본에서 나와 충돌 ${conflicts.length}건`);
  for (const c of conflicts) console.log(`    ${c}`);
}

const byRole = new Map();
for (const info of map.values()) {
  byRole.set(info.role, (byRole.get(info.role) || 0) + 1);
}
console.log('\n역할별 값 개수:');
for (const [role, count] of byRole) console.log(`    ${role}: ${count}`);

if (REPORT_ONLY) {
  console.log('\n전체 표 (원본 → 골드 → 시안):');
  for (const [goldStr, info] of [...map].sort((a, b) => b[1].count - a[1].count)) {
    console.log(`    ${info.origStr.padEnd(24)} ${goldStr.padEnd(24)} ${info.targetStr.padEnd(24)} ${info.role}`);
  }
  process.exit(0);
}

/* 긴 문자열을 먼저 바꿔야 rgba 안의 rgb 조각이 잘리지 않는다. */
const sortByLength = (pairs) => pairs.sort((a, b) => b[0].length - a[0].length);
const paletteEntries = sortByLength([...map].map(([gold, info]) => [gold, info.targetStr]));

let changedFiles = 0;
let totalHits = 0;

for (const file of walk(SRC)) {
  if (PROTECTED.test(file)) continue;
  const rel = relative(SRC, file).split('\\').join('/');
  const restore = restoreMaps.get(rel);
  const entries = restore ? sortByLength([...restore]) : paletteEntries;

  const original = readFileSync(file, 'utf8');
  let next = original;
  let hits = 0;

  for (const [goldStr, targetStr] of entries) {
    if (!next.includes(goldStr)) continue;
    hits += next.split(goldStr).length - 1;
    next = next.split(goldStr).join(targetStr);
  }

  if (!hits) continue;
  writeFileSync(file, next, 'utf8');
  changedFiles += 1;
  totalHits += hits;
  console.log(`${rel}  ${hits}건${restore ? ' (원본 차량색 복구)' : ''}`);
}

console.log(`\n파일 ${changedFiles}개, 색상 ${totalHits}건 변경`);
