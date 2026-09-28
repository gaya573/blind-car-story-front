/**
 * 복제한 원본 코드의 브랜딩 문자열을 블라인드 카스토리로 교체한다.
 * 값은 모두 Blind Car Story 시안에서 확인된 것만 사용하며 임의로 만들지 않는다.
 * 테스트 파일은 보호 대상이라 건드리지 않는다.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = new URL('../src/', import.meta.url).pathname.replace(/^\//, '');
const TARGET_EXT = /\.(jsx?|css|html)$/;
const PROTECTED = /\.test\.jsx?$/;

/** 앞에 있는 규칙이 먼저 적용된다. 더 구체적인 문자열을 위에 둔다. */
const RULES = [
  ['https://www.youtube.com/@WonderGoodLife', 'https://www.youtube.com/@BlindCarstory'],
  ['@WonderGoodLife', '@BlindCarstory'],
  ['(C) WonderGoodLife All Rights Reserved.', '(C) Blind CarStory All Rights Reserved.'],
  ['WonderGoodLife', 'Blind CarStory'],
  ['/logo/원더굿라이프_로고_펭귄.svg', '/logo/carstory-logo.svg'],
  ['원더굿라이프', '블라인드 카스토리'],
  ['원더그라이프', '블라인드 카스토리'],
  ['원더를 이용한', '블라인드 카스토리를 이용한'],
  ['원더가 제안하는', '블라인드 카스토리가 제안하는'],
  ['원더 단독 물량 확보', '블라인드 카스토리 단독 물량 확보'],
  ['원더 챗봇', '블라인드 카스토리 챗봇'],
];

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
const skipped = [];

for (const file of walk(SRC)) {
  if (PROTECTED.test(file)) {
    skipped.push(relative(SRC, file).split('\\').join('/'));
    continue;
  }

  const original = readFileSync(file, 'utf8');
  let text = original;
  const applied = [];

  for (const [from, to] of RULES) {
    if (!text.includes(from)) continue;
    const count = text.split(from).length - 1;
    text = text.split(from).join(to);
    applied.push(`${from} x${count}`);
    totalHits += count;
  }

  if (text === original) continue;
  writeFileSync(file, text, 'utf8');
  changedFiles += 1;
  console.log(`${relative(SRC, file).split('\\').join('/')}`);
  for (const item of applied) console.log(`    ${item}`);
}

console.log(`\n변경 파일 ${changedFiles}개, 치환 ${totalHits}건`);
if (skipped.length) {
  console.log(`\n테스트 파일 ${skipped.length}개는 보호 대상이라 건너뜀:`);
  for (const item of skipped) console.log(`    ${item}`);
}
