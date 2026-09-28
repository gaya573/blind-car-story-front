/**
 * 로컬에서 dist를 S3에 올리고 CloudFront 캐시를 무효화한다.
 * AWS CLI와 자격 증명이 설정된 환경에서만 동작하며,
 * 자격 증명이 없으면 --dry-run으로 실행할 명령만 확인할 수 있다.
 *
 * 사용법:
 *   node scripts/deploy-s3.mjs --dry-run
 *   S3_BUCKET=버킷명 CLOUDFRONT_DISTRIBUTION_ID=배포ID node scripts/deploy-s3.mjs
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const dryRun = process.argv.includes('--dry-run');
const bucket = process.env.S3_BUCKET;
const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
const region = process.env.AWS_REGION || 'ap-northeast-2';

if (!bucket) {
  console.error('S3_BUCKET 환경변수가 필요합니다.');
  process.exit(1);
}

if (!existsSync('dist/index.html')) {
  console.error('dist/index.html이 없습니다. npm run build를 먼저 실행하세요.');
  process.exit(1);
}

const commands = [
  [
    'aws',
    ['s3', 'sync', 'dist', `s3://${bucket}/`, '--delete', '--exclude', 'index.html',
      '--cache-control', 'public, max-age=31536000, immutable', '--region', region],
  ],
  [
    'aws',
    ['s3', 'cp', 'dist/index.html', `s3://${bucket}/index.html`,
      '--cache-control', 'no-cache, must-revalidate', '--region', region],
  ],
];

if (distributionId) {
  commands.push([
    'aws',
    ['cloudfront', 'create-invalidation', '--distribution-id', distributionId, '--paths', '/*'],
  ]);
} else {
  console.log('CLOUDFRONT_DISTRIBUTION_ID가 없어 캐시 무효화는 건너뜁니다.');
}

for (const [bin, args] of commands) {
  const printable = `${bin} ${args.map((a) => (a.includes(' ') ? `"${a}"` : a)).join(' ')}`;
  if (dryRun) {
    console.log(printable);
    continue;
  }
  console.log(`> ${printable}`);
  const result = spawnSync(bin, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) {
    console.error('명령이 실패해 배포를 중단합니다.');
    process.exit(result.status ?? 1);
  }
}

console.log(dryRun ? '\n실행 예정 명령만 출력했습니다.' : '배포 완료');
