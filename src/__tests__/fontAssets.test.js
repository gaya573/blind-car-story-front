import fs from 'fs';
import path from 'path';

describe('Pretendard font assets', () => {
  it('uses the monorepo package path that exists in Pretendard v1.3.9', () => {
    const css = fs.readFileSync(path.resolve(process.cwd(), 'src/index.css'), 'utf8');
    const urls = [...css.matchAll(/url\('([^']*Pretendard-[^']+\.woff2)'\)/g)]
      .map((match) => match[1]);

    expect(urls).toHaveLength(4);
    expect(urls).toEqual(expect.arrayContaining([
      expect.stringContaining('/packages/pretendard/dist/web/static/woff2/Pretendard-Light.woff2'),
      expect.stringContaining('/packages/pretendard/dist/web/static/woff2/Pretendard-Regular.woff2'),
      expect.stringContaining('/packages/pretendard/dist/web/static/woff2/Pretendard-Medium.woff2'),
      expect.stringContaining('/packages/pretendard/dist/web/static/woff2/Pretendard-SemiBold.woff2'),
    ]));
    expect(css).not.toContain('@v1.3.9/dist/web/static/woff2/');
  });
});
