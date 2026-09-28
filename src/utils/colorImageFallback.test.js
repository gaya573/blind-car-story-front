import { findBestMatchingColorImageUrl } from './colorImageFallback';

describe('colorImageFallback', () => {
  test('does not borrow a one-tone image for a two-tone color', () => {
    const selected = { name: '아틀라스 화이트(SAW)/어비스 블랙(A2B)' };
    const sources = [
      { name: '어비스 블랙(A2B)', imageUrl: 'black.png' },
      { name: '아틀라스 화이트(SAW)', imageUrl: 'white.png' },
    ];

    expect(findBestMatchingColorImageUrl(selected, sources)).toBeNull();
  });

  test('keeps two-tone image matching order body first and roof second', () => {
    const selected = { name: '아틀라스 화이트(SAW)/어비스 블랙(A2B)' };
    const sources = [
      { name: '어비스 블랙(A2B)/아틀라스 화이트(SAW)', imageUrl: 'black-white.png' },
      { name: '아틀라스 화이트 (SAW) / 어비스 블랙 ((A2B)', imageUrl: 'white-black.png' },
    ];

    expect(findBestMatchingColorImageUrl(selected, sources)).toBe('white-black.png');
  });

  test('does not match one-tone and two-tone names that share only one code', () => {
    const selected = { name: '블랙/그랜드 화이트 (WAA)' };
    const sources = [
      { name: '그랜드 화이트 (WAA)', imageUrl: 'white.png' },
    ];

    expect(findBestMatchingColorImageUrl(selected, sources)).toBeNull();
  });

  test('treats plus-separated two-tone colors as ordered color parts', () => {
    const selected = { name: '퓨전 블랙 + 스노우 화이트 펄(CAS)' };
    const sources = [
      { name: '스노우 화이트 펄(CAS)', imageUrl: 'white.png' },
      { name: '퓨전 블랙+스노우 화이트 펄(CAS)', imageUrl: 'black-white.png' },
    ];

    expect(findBestMatchingColorImageUrl(selected, sources)).toBe('black-white.png');
  });

  test('normalizes spacing and broken parentheses for single color codes', () => {
    const selected = { name: '메타 블루 펄((PM2)' };
    const sources = [
      { name: '메타 블루 펄 (PM2)', imageUrl: 'meta-blue.png' },
    ];

    expect(findBestMatchingColorImageUrl(selected, sources)).toBe('meta-blue.png');
  });
});
