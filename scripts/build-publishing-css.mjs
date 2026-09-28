/**
 * 퍼블리싱 CSS(design/publishing-step2-1/assets/css)를 SPA에서 쓸 수 있게 옮긴다.
 *
 * 정적 퍼블리싱은 페이지마다 필요한 CSS만 불러오지만, SPA에서는 한 번 불러온 CSS가
 * 계속 남는다. 그래서 PC·모바일·페이지 전용 CSS를 범위 선택자로 감싸 서로 섞이지 않게 한다.
 * 범위는 :where()로 감싸 우선순위(specificity)를 원본 그대로 유지한다.
 *
 * 퍼블리싱이 새로 오면 design/ 아래를 교체하고 `node scripts/build-publishing-css.mjs`를 다시 실행한다.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = join(root, 'design/publishing-step2-1/assets/css');
const outDir = join(root, 'src/styles/bcs');

// scope가 null이면 전역으로 둔다.
const FILES = [
  ['tokens.css', null],
  ['reset.css', null],
  ['common.css', null],
  ['quote-modal.css', null],
  ['style.css', 'body.pc-page'],
  ['mobile.css', 'body.mobile-page'],
  ['carlist.css', '.bcs-page-carlist'],
  ['car-detail.css', '.bcs-page-car-detail'],
  ['express.css', '.bcs-page-express'],
  ['promotion.css', '.bcs-page-promotion'],
  ['promotion-detail.css', '.bcs-page-promotion-detail'],
  ['review.css', '.bcs-page-review'],
];

const scopeSelector = (selector, scope) => {
  const trimmed = selector.trim();
  // body.pc-page / body.has-cd-bar / html.mobile-html 처럼 루트를 직접 가리키는 규칙은 그대로 둔다.
  if (/^(html|body|:root)\b/.test(trimmed)) return trimmed;
  if (trimmed.startsWith(scope)) return trimmed;
  // 원본이 `.mobile-page .toast` 처럼 body 클래스를 태그 없이 쓴 경우: body 자신을 가리키도록 바꾼다.
  const bodyClass = scope.match(/^body(\.[\w-]+)$/)?.[1];
  if (bodyClass && new RegExp(`^\\${bodyClass}(?![\\w-])`).test(trimmed)) {
    return `body${trimmed}`;
  }
  return `:where(${scope}) ${trimmed}`;
};

const scopePlugin = (scope) => ({
  postcssPlugin: 'bcs-scope',
  Rule(rule) {
    if (!scope || rule.__bcsScoped) return;
    const parent = rule.parent;
    if (parent?.type === 'atrule' && /keyframes$/i.test(parent.name)) return;
    rule.selectors = rule.selectors.map((selector) => scopeSelector(selector, scope));
    rule.__bcsScoped = true;
  },
});
scopePlugin.postcss = true;

mkdirSync(outDir, { recursive: true });
for (const [file, scope] of FILES) {
  const css = readFileSync(join(sourceDir, file), 'utf8');
  const result = await postcss([scopePlugin(scope)]).process(css, { from: undefined });
  const header = `/* 자동 생성: scripts/build-publishing-css.mjs (원본 design/publishing-step2-1/assets/css/${file}${
    scope ? `, 범위 ${scope}` : ', 전역'
  }). 직접 고치지 말고 원본이나 src/styles/bcs-overrides.css 를 고친다. */\n`;
  writeFileSync(join(outDir, file), header + result.css);
  console.log(`${file} -> src/styles/bcs/${file}${scope ? ` (${scope})` : ''}`);
}
