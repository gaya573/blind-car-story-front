/**
 * 원본의 파란색 계열 색상을 블라인드 카스토리 골드 계열로 바꾼다.
 * 변수로 정리되지 않고 하드코딩된 색상까지 처리하기 위해
 * 색상을 HSL로 바꿔 파란 색상(hue 195~265)만 골드 hue로 회전시킨다.
 * 명도와 채도는 유지하므로 연한 파란 배경은 연한 골드 배경이 된다.
 *
 * --report 를 주면 파일을 바꾸지 않고 대상만 출력한다.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = new URL('../src/', import.meta.url).pathname.replace(/^\//, '');
const TARGET_EXT = /\.(jsx?|css)$/;
const PROTECTED = /\.test\.jsx?$/;
const REPORT_ONLY = process.argv.includes('--report');

const BLUE_HUE_MIN = 195;
const BLUE_HUE_MAX = 265;
const GOLD_HUE = 45;
/** 골드는 파랑만큼 짙게 표현되지 않아 채도를 살짝 낮춘다. */
const SATURATION_SCALE = 0.78;
/**
 * HSL 채도는 흰색에 가까운 색에서도 1에 가깝게 나와 구분에 못 쓴다.
 * 실제 색 기운은 최대·최소 채널 차이(chroma)로 판단해,
 * 테두리·배경에 쓰이는 중립 회색은 건드리지 않는다.
 */
const MIN_CHROMA = 0.06;

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

/** 파란 계열이면 골드로 회전한 rgb를 돌려주고, 아니면 null. */
function shift(r, g, b) {
  const chroma = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
  if (chroma < MIN_CHROMA) return null;
  const [h, s, l] = rgbToHsl(r, g, b);
  if (h < BLUE_HUE_MIN || h > BLUE_HUE_MAX) return null;
  return hslToRgb(GOLD_HUE, Math.min(1, s * SATURATION_SCALE), l);
}

function toHex(r, g, b) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

const HEX = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
const RGB = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+)\s*)?\)/g;

function convert(text, record) {
  let out = text.replace(HEX, (match, body) => {
    const full =
      body.length === 3
        ? body
            .split('')
            .map((c) => c + c)
            .join('')
        : body;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    const shifted = shift(r, g, b);
    if (!shifted) return match;
    const next = toHex(...shifted);
    record.push(`${match} -> ${next}`);
    return next;
  });

  out = out.replace(RGB, (match, r, g, b, a) => {
    const shifted = shift(Number(r), Number(g), Number(b));
    if (!shifted) return match;
    const next =
      a === undefined
        ? `rgb(${shifted.join(', ')})`
        : `rgba(${shifted.join(', ')}, ${a})`;
    record.push(`${match} -> ${next}`);
    return next;
  });

  return out;
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (TARGET_EXT.test(entry.name)) out.push(full);
  }
  return out;
}

let changedFiles = 0;
let totalHits = 0;
const distinct = new Map();

for (const file of walk(SRC)) {
  if (PROTECTED.test(file)) continue;
  const original = readFileSync(file, 'utf8');
  const record = [];
  const next = convert(original, record);
  if (!record.length) continue;

  for (const item of record) distinct.set(item, (distinct.get(item) || 0) + 1);
  totalHits += record.length;
  changedFiles += 1;

  if (!REPORT_ONLY) writeFileSync(file, next, 'utf8');
  console.log(`${relative(SRC, file).split('\\').join('/')}  ${record.length}건`);
}

console.log(`\n${REPORT_ONLY ? '[report] ' : ''}파일 ${changedFiles}개, 색상 ${totalHits}건`);
console.log('\n고유 변환:');
for (const [item, count] of [...distinct].sort((a, b) => b[1] - a[1])) {
  console.log(`    ${item}  x${count}`);
}
