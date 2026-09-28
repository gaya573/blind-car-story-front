/**
 * 시안의 블라인드 카스토리 로고를 public/logo로 가져온다.
 * 원본 리액트의 펭귄 로고 파일은 남겨두되 코드에서는 참조하지 않는다.
 */
import { copyFile, mkdir } from 'node:fs/promises';

const PROTOTYPE =
  'C:/Users/chang/Downloads/Blind Car Story (Step 2-1) (2)/Blind Car Story (Step 2-1)/Blind Car Story (Step 2-1)/assets/images/brand/carstory-logo.svg';
const TARGET_DIR = new URL('../public/logo/', import.meta.url);

await mkdir(TARGET_DIR, { recursive: true });
await copyFile(PROTOTYPE, new URL('./carstory-logo.svg', TARGET_DIR));

console.log('로고 복사 완료: public/logo/carstory-logo.svg');
