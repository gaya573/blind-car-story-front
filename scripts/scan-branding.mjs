/**
 * 원본 리액트에서 브랜딩(사명·전화·SNS·색상)이 박혀 있는 위치를 찾는다.
 * 복제 후 무엇을 바꿔야 하는지 파악하기 위한 조사용이며 원본은 읽기만 한다.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = 'C:/Users/chang/Documents/ChatGPT/0806/wonder-front-user';
const SKIP = new Set(['node_modules', '.git', 'dist']);

const TERMS = [
  '원더굿라이프',
  '원더 굿라이프',
  'wondergoodlife',
  'wonder-goodlife',
  '1577',
  'youtube.com/@',
  'pf.kakao',
  '사업자등록번호',
  '대표',
];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = walk(join(ROOT, 'src'));
const hits = new Map();

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const term of TERMS) {
    let count = 0;
    let idx = text.indexOf(term);
    while (idx !== -1) {
      count += 1;
      idx = text.indexOf(term, idx + term.length);
    }
    if (count === 0) continue;
    if (!hits.has(term)) hits.set(term, []);
    hits.get(term).push(`${relative(ROOT, file).split('\\').join('/')} (${count})`);
  }
}

for (const [term, list] of hits) {
  console.log(`### ${term}  -> ${list.length}개 파일`);
  for (const item of list.slice(0, 15)) console.log(`    ${item}`);
  if (list.length > 15) console.log(`    ...외 ${list.length - 15}개`);
  console.log('');
}

// 색상 토큰 위치
const cssVars = readFileSync(join(ROOT, 'src/index.css'), 'utf8');
const colors = [...cssVars.matchAll(/(--[\w-]*(?:color|brand|primary|accent)[\w-]*)\s*:\s*([^;]+);/gi)];
console.log(`### index.css 색상 변수 ${colors.length}개`);
for (const [, name, value] of colors) console.log(`    ${name}: ${value.trim()}`);
