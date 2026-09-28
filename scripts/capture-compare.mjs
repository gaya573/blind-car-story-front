/**
 * 퍼블리싱 원본(design/publishing-step2-1)과 개발 서버 화면을 같은 크기로 전체 페이지 캡처한다.
 *
 *   node scripts/capture-compare.mjs [base=http://localhost:5190] [name ...]
 *
 * 결과: tmp/compare/<name>-publishing.png, tmp/compare/<name>-app.png
 * 개발 서버는 운영 API를 읽기만 한다(vite.config.js dev-write-guard).
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// 저장소의 design/ 에는 이미지가 없다(이미지는 public/bcs/images). 이미지까지 보려면
// 퍼블리싱 zip 을 푼 폴더를 PUBLISHING_DIR 로 넘긴다.
const design = process.env.PUBLISHING_DIR || join(root, 'design/publishing-step2-1');
const outDir = join(root, 'tmp/compare');
const [base = 'http://localhost:5190', ...only] = process.argv.slice(2);

const PC = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };

export const PAIRS = [
  ['pc-home', 'index.html', '/', PC],
  ['pc-carlist', 'pages/carlist.html', '/carlist/domestic', PC],
  ['pc-car-detail', 'pages/car-detail.html', null, PC],
  ['pc-express', 'pages/express-deals.html', '/express-deals', PC],
  ['pc-promotion', 'pages/promotion.html', '/promotion', PC],
  ['pc-promotion-detail', 'pages/promotion-detail.html', null, PC],
  ['pc-review', 'pages/review.html', '/review', PC],
  ['m-home', 'mobile.html', '/m', MOBILE],
  ['m-menu', 'pages/m-menu.html', '/m/menu', MOBILE],
  ['m-search', 'pages/m-search.html', '/m/search', MOBILE],
  ['m-search-results', 'pages/m-search-results.html', '/m/search/results?carOrigin=domestic', MOBILE],
  ['m-car-detail', 'pages/m-car-detail.html', null, MOBILE],
  ['m-express', 'pages/m-express.html', '/m/advance', MOBILE],
  ['m-brand', 'pages/m-brand.html', '/m/brand', MOBILE],
  ['m-brand-detail', 'pages/m-brand-detail.html', null, MOBILE],
];

const settle = async (page) => {
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  // lazy 이미지까지 불러오도록 끝까지 한 번 내려갔다 올라온다.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
};

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
try {
  for (const [name, file, appPath, viewport] of PAIRS) {
    if (only.length && !only.includes(name)) continue;
    const { isMobile, hasTouch, deviceScaleFactor, ...size } = viewport;
    const context = await browser.newContext({ viewport: size, isMobile, hasTouch, deviceScaleFactor: deviceScaleFactor ?? 1 });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto(pathToFileURL(join(design, file)).href);
    await settle(page);
    await page.screenshot({ path: join(outDir, `${name}-publishing.png`), fullPage: true });

    if (appPath) {
      await page.goto(new URL(appPath, base).href);
      await settle(page);
      await page.screenshot({ path: join(outDir, `${name}-app.png`), fullPage: true });
    }
    console.log(`${name}: ${appPath ?? '(publishing only)'}${errors.length ? ` errors=${errors.join(' | ')}` : ''}`);
    await context.close();
  }
} finally {
  await browser.close();
}
