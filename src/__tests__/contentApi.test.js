import MockAdapter from 'axios-mock-adapter';
import { contentAPI, contentHttp, __contentApiTestUtils } from '../services/contentApi';
import { carHttp } from '../services/carApi';

describe('contentAPI', () => {
  let mock;
  let carMock;

  beforeAll(() => {
    mock = new MockAdapter(contentHttp);
    carMock = new MockAdapter(carHttp);
  });

  beforeEach(() => {
    __contentApiTestUtils.clearBrandCache();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01T12:00:00Z'));
  });

  afterEach(() => {
    mock.reset();
    carMock.reset();
    jest.useRealTimers();
  });

  afterAll(() => {
    mock.restore();
    carMock.restore();
  });

  test('getClosingSoon는 활성화된 기간 내 아이템만 반환한다', async () => {
    mock.onGet('/api/content/main-page/closing-soon').reply((config) => {
      expect(config.params).toEqual({ limit: 10, exclude_ended: true });
      return [
        200,
        {
          items: [
            {
              id: 1,
              is_active: true,
              start_date: '2024-12-01T00:00:00Z',
              end_date: '2025-02-01T00:00:00Z',
            },
            {
              id: 2,
              is_active: false,
              start_date: '2024-12-01T00:00:00Z',
              end_date: '2025-02-01T00:00:00Z',
            },
            {
              id: 3,
              is_active: true,
              start_date: '2026-01-01T00:00:00Z',
              end_date: '2026-12-31T00:00:00Z',
            },
          ],
          pagination: { page: 1, size: 3, totalElements: 3, totalPages: 1 },
        },
      ];
    });

    const result = await contentAPI.getClosingSoon();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  test('getTopCars는 rank 기준으로 정렬된 상위 5개만 반환한다', async () => {
    mock.onGet('/api/content/main-page/top-cars').reply((config) => {
      expect(config.params).toEqual({ limit: 5 });
      return [
        200,
        {
          items: [
            { id: 1, is_active: true, rank: 3 },
            { id: 2, is_active: true, rank: 1 },
            { id: 3, is_active: true, rank: 2 },
            { id: 4, is_active: false, rank: 4 },
            { id: 5, is_active: true, rank: 5 },
            { id: 6, is_active: true, rank: 6 },
          ],
          pagination: { page: 1, size: 6, totalElements: 6, totalPages: 1 },
        },
      ];
    });

    const result = await contentAPI.getTopCars();

    expect(result.map(item => item.id)).toEqual([2, 3, 1, 5, 6]);
  });

  test('getReviews는 limit 기본값에 맞춰 데이터를 반환한다', async () => {
    mock.onGet('/api/content/main-page/reviews').reply((config) => {
      expect(config.params).toEqual({ limit: 10 });
      return [
        200,
        {
          items: [
            { id: 10, title: '리뷰 A', is_approved: true },
            { id: 11, title: '리뷰 B', is_approved: true },
          ],
          pagination: { page: 1, size: 2, totalElements: 2, totalPages: 1 },
        },
      ];
    });

    const result = await contentAPI.getReviews();

    expect(result).toHaveLength(2);
    expect(result.every(item => item.is_approved)).toBe(true);
  });

  test('getReviews는 snake_case 이미지 필드를 camelCase로 정규화한다', async () => {
    mock.onGet('/api/content/main-page/reviews').reply((config) => {
      expect(config.params).toEqual({ limit: 10 });
      return [
        200,
        {
          items: [
            {
              id: 21,
              title: '리뷰 C',
              image_url: 'https://cdn.wonder.com/reviews/new-thumb.png',
              images: ['https://cdn.wonder.com/reviews/old-thumb.png'],
              thumbs: ['https://cdn.wonder.com/reviews/gallery-a.png'],
            },
          ],
        },
      ];
    });

    const [review] = await contentAPI.getReviews();

    expect(review.imageUrl).toBe('https://cdn.wonder.com/reviews/new-thumb.png');
    expect(review.imageUrls[0]).toBe('https://cdn.wonder.com/reviews/new-thumb.png');
    expect(review.imageUrls).toEqual([
      'https://cdn.wonder.com/reviews/new-thumb.png',
      'https://cdn.wonder.com/reviews/old-thumb.png',
      'https://cdn.wonder.com/reviews/gallery-a.png',
    ]);
    expect(review.images).toEqual(['https://cdn.wonder.com/reviews/old-thumb.png']);
  });

  test('getBrandPromotions는 trimId로 브랜드명을 extraInfo에 채운다', async () => {
    mock.onGet('/api/content/promotions/brand').reply((config) => {
      expect(config.params).toEqual({ limit: 2, position: 'TOP' });
      return [
        200,
        [
          {
            id: 5,
            title: '제목',
            subtitle: '부제목',
            trimId: 2986,
            is_active: true,
          },
          {
            id: 6,
            title: '다른 제목',
            trimId: 3293,
            is_active: true,
          },
        ],
      ];
    });

    carMock.onGet('/api/user/cars/2986/detail').reply(200, {
      brandName: '현대',
      name: '아이오닉 5',
    });

    carMock.onGet('/api/user/cars/3293/detail').reply(200, {
      brandName: '기아',
      name: 'EV6',
    });

    const result = await contentAPI.getBrandPromotions('TOP', 2);

    expect(result).toHaveLength(2);
    expect(result[0].extraInfo).toBe('현대');
    expect(result[1].extraInfo).toBe('기아');
    expect(carMock.history.get).toHaveLength(2);
  });
  test('getBanners uses the public banner endpoint, never the admin endpoint', async () => {
    mock.onGet('/api/content/banners').reply((config) => {
      expect(config.params).toEqual({ banner_type: 'MAIN', position: 'TOP', limit: 2 });
      return [200, {
        items: [
          { id: 1, is_active: true, position: 'TOP', display_order: 2 },
          { id: 2, is_active: true, position: 'TOP', display_order: 1 },
        ],
      }];
    });

    const result = await contentAPI.getBanners('MAIN', { position: 'TOP', limit: 2 });

    expect(result.map(item => item.id)).toEqual([2, 1]);
    expect(mock.history.get.map(request => request.url)).not.toContain('/api/content/admin/list');
  });
});


