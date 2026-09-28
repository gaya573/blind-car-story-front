/**
 * 원본 리액트(wonder-front-user)를 이 프로젝트로 복제한다.
 * 원본은 읽기만 하며 절대 수정하지 않는다.
 * 배포 워크플로와 scripts 폴더는 이 프로젝트 것을 유지한다.
 */
import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';

const SOURCE = 'C:/Users/chang/Documents/ChatGPT/0806/wonder-front-user';
const TARGET = 'C:/Users/chang/Documents/ChatGPT/0806/blind-car-story-front';

/** 원본에서 가져올 항목. 문서(*.md)와 빌드 산출물, 로그는 제외한다. */
const COPY = [
  'src',
  'public',
  'index.html',
  'vite.config.js',
  'eslint.config.js',
  'babel.config.cjs',
  'jest.config.cjs',
  'jest-babel-transform.cjs',
  '.env.example',
];

/** 복제 전에 지울 이 프로젝트의 기존 구현. scripts와 .github은 남긴다. */
const CLEAR = [
  'src',
  'public',
  'index.html',
  'vite.config.js',
  'eslint.config.js',
  'dist',
];

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

for (const entry of CLEAR) {
  const path = join(TARGET, entry);
  if (await exists(path)) {
    await rm(path, { recursive: true, force: true });
    console.log(`삭제: ${entry}`);
  }
}

for (const entry of COPY) {
  const from = join(SOURCE, entry);
  if (!(await exists(from))) {
    console.log(`원본에 없음, 건너뜀: ${entry}`);
    continue;
  }
  await cp(from, join(TARGET, entry), { recursive: true });
  console.log(`복사: ${entry}`);
}

async function countFiles(dir, acc = { files: 0, bytes: 0 }) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await countFiles(full, acc);
    else {
      acc.files += 1;
      acc.bytes += (await stat(full)).size;
    }
  }
  return acc;
}

await mkdir(join(TARGET, 'src'), { recursive: true });
const src = await countFiles(join(TARGET, 'src'));
const pub = await countFiles(join(TARGET, 'public'));

console.log(`\nsrc: ${src.files}개 파일`);
console.log(`public: ${pub.files}개 파일 ${(pub.bytes / 1048576).toFixed(1)}MB`);
