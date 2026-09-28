import { rebrandPromotion, rebrandText, REBRANDED_IMAGES, WONDER_ONLY_IMAGES } from './promotionRebrand';

describe('promotionRebrand', () => {
  test('원더굿라이프 표기를 블라인드 카스토리로 바꾼다', () => {
    expect(rebrandText('현대 투싼 (원더굿라이프 x IM캐피탈)')).toBe('현대 투싼 (블라인드 카스토리 x IM캐피탈)');
    expect(rebrandText('원더 굿라이프 고객 전용')).toBe('블라인드 카스토리 고객 전용');
    expect(rebrandText(null)).toBeNull();
  });

  test('기획전의 문구와 이미지를 블라인드 사본으로 바꾸고 원더 소개 이미지는 뺀다', () => {
    const [thumb] = Object.keys(REBRANDED_IMAGES);
    const [wonderAd] = [...WONDER_ONLY_IMAGES];
    const result = rebrandPromotion({
      id: 83,
      title: '현대 투싼 (원더굿라이프 x IM캐피탈)',
      subtitle: '원더굿라이프 x IM캐피탈',
      imageUrl: thumb,
      bottomPromotionImage: wonderAd,
      topPromotionImage: 'https://cdn.example.com/other.jpg',
      displayOrder: 1,
    });
    expect(result).toEqual({
      id: 83,
      title: '현대 투싼 (블라인드 카스토리 x IM캐피탈)',
      subtitle: '블라인드 카스토리 x IM캐피탈',
      imageUrl: REBRANDED_IMAGES[thumb],
      bottomPromotionImage: null,
      topPromotionImage: 'https://cdn.example.com/other.jpg',
      displayOrder: 1,
    });
  });
});
