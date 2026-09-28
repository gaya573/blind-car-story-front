/**
 * src가 참조하는 정적 이미지를 전수 조사한다.
 * public에 실제로 있는지, 원본(원더굿라이프) 그림이 남아 있는지 확인용.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const SRC = 'src';
const PUBLIC = 'public';
const ASSET = /['"(](\/[^'")]*?\.(?:png|jpe?g|svg|webp))['")]/g;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(jsx?|css)$/.test(entry.name) && !/\.test\./.test(entry.name)) out.push(full);
  }
  return out;
}

const refs = new Map();

for (const file of walk(SRC)) {
  const text = readFileSync(file, 'utf8');
  const rel = relative(SRC, file).split(sep).join('/');
  for (const m of text.matchAll(ASSET)) {
    if (!refs.has(m[1])) refs.set(m[1], new Set());
    refs.get(m[1]).add(rel);
  }
}

const rows = [...refs].sort((a, b) => a[0].localeCompare(b[0]));
let missing = 0;

console.log(`src가 참조하는 정적 이미지 ${rows.length}개\n`);
for (const [path, files] of rows) {
  const exists = existsSync(join(PUBLIC, decodeURIComponent(path)));
  if (!exists) missing += 1;
  const mark = exists ? '있음' : '없음';
  console.log(`${mark}  ${path.padEnd(48)} x${String(files.size).padEnd(3)} ${[...files].slice(0, 2).join(', ')}`);
}

console.log(`\n참조하지만 public에 없는 파일: ${missing}개`);
