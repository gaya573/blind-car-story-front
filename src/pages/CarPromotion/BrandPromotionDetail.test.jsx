import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BrandPromotionDetail from './BrandPromotionDetail.jsx';
import { contentHttp } from '../../services/contentApi.js';
import { carHttp } from '../../services/carApi.js';
import { BcsUiProvider } from '../../bcs/BcsUiContext.jsx';

const renderWithProviders = (entry = '/promotion/brands/detail/83') => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[entry]}>
        <BcsUiProvider>
          <Routes>
            <Route path="/promotion/brands/detail/:id" element={<BrandPromotionDetail />} />
          </Routes>
        </BcsUiProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const inDays = (days) => new Date(Date.now() + days * 86400000 - 60000).toISOString();

const TUCSON = {
  id: 83,
  position: 'TOP',
  trimId: 8144,
  title: '현대 투싼 (블라인드 x IM캐피탈)',
  subtitle: '블라인드 x IM캐피탈',
  extraInfo: '현대',
  imageUrl: 'https://cdn.example.com/thumb.png',
  topPromotionImage: 'https://cdn.example.com/top.jpg',
  startDate: '2026-08-06T08:17:00',
  endDate: inDays(20),
  basePrice: 32700000,
  trim_monthly_rental_fee: 237110,
  is_active: true,
};

describe('BrandPromotionDetail (퍼블리싱 브랜드 혜택 상세)', () => {
  let content;
  let cars;

  beforeAll(() => {
    content = new MockAdapter(contentHttp);
    cars = new MockAdapter(carHttp);
  });

  afterEach(() => {
    content.reset();
    cars.reset();
  });

  afterAll(() => {
    content.restore();
    cars.restore();
  });

  test('주소로 바로 들어와도 진행중 목록에서 기획전을 찾아 상세를 채운다', async () => {
    content.onGet('/api/content/promotions/brand').reply((config) => {
      if (config.params.position === 'TOP') {
        return [200, [TUCSON, { id: 81, position: 'TOP', title: '기아 카니발 (블라인드 x IM캐피탈)', extraInfo: '기아', is_active: true }]];
      }
      return [200, []];
    });
    content.onGet('/api/content/main-page/reviews').reply(200, {
      items: [{ id: 57, title: '모델3 전기차 출고기', description: '만족합니다.', authorName: '박미영', rating: 5, createdAt: '2026-05-06T04:05:21' }],
    });
    cars.onGet('/api/user/cars/8144/detail').reply(200, {
      id: 8144,
      name: '투싼 하이브리드',
      brandName: '현대',
      trims: [{ id: 8144, name: '터보 1.6 모던', sourceTrimName: '2026년형 가솔린 터보 1.6 하이브리드 모던 2WD A/T', basePrice: 32700000, lowestPrepayment30MonthlyFee: 237110 }],
    });

    renderWithProviders();

    expect(await screen.findByRole('heading', { level: 1, name: '현대 투싼' })).toBeInTheDocument();
    expect(screen.getByText('진행중 · D-20')).toBeInTheDocument();
    expect(screen.getByText('블라인드 x IM캐피탈')).toBeInTheDocument();
    expect(screen.getByAltText('현대 투싼 (블라인드 x IM캐피탈) 혜택 안내')).toHaveAttribute('src', 'https://cdn.example.com/top.jpg');

    // 대상 차종은 트림 상세로 연결된다.
    const model = await screen.findByRole('link', { name: /현대 투싼 하이브리드/ });
    expect(model).toHaveAttribute('href', '/car-detail/trim/8144');
    expect(within(model).getByText('237,110원')).toBeInTheDocument();

    // 후기는 실제 후기 API, 작성자는 가려서 보여준다.
    expect(await screen.findByText('모델3 전기차 출고기')).toBeInTheDocument();
    expect(screen.getByText('박*영')).toBeInTheDocument();

    // 함께 보면 좋은 기획전은 같은 진행 상태의 다른 기획전
    expect(screen.getByRole('link', { name: /기아 카니발 \(블라인드 x IM캐피탈\)/ })).toHaveAttribute('href', '/promotion/brands/detail/81');

    // 개인정보 동의는 기본 해제
    screen.getAllByRole('checkbox').forEach((checkbox) => expect(checkbox).not.toBeChecked());
  });

  test('이 혜택으로 견적받기는 차종을 채운 실시간 견적 모달을 연다', async () => {
    content.onGet('/api/content/promotions/brand').reply((config) => [200, config.params.position === 'TOP' ? [TUCSON] : []]);
    content.onGet(/.*/).reply(200, []);
    cars.onGet('/api/user/cars/8144/detail').reply(200, { id: 8144, name: '투싼 하이브리드', brandName: '현대', trims: [] });

    renderWithProviders();

    await screen.findByText('현대 투싼 하이브리드');
    fireEvent.click(screen.getByRole('link', { name: '이 혜택으로 견적받기' }));

    const dialog = screen.getByRole('dialog', { name: '실시간 견적 받기', hidden: true });
    expect(dialog.closest('.qm-overlay')).toHaveClass('is-open');
    expect(within(dialog).getByLabelText('차종')).toHaveValue('현대 투싼 하이브리드');
  });

  test('종료된 기획전은 종료 상태로 보여준다', async () => {
    content.onGet('/api/content/promotions/brand').reply((config) =>
      [200, config.params.position === 'BOTTOM' ? [{ id: 86, position: 'BOTTOM', title: '아우디 A8 연말할인', extraInfo: '아우디', endDate: '2026-01-09T14:59:00' }] : []],
    );
    content.onGet(/.*/).reply(200, []);
    cars.onGet(/.*/).reply(404);

    renderWithProviders('/promotion/brands/detail/86');

    expect(await screen.findByText('종료된 기획전')).toBeInTheDocument();
    expect(screen.getByText('기획전이 종료되었습니다')).toBeInTheDocument();
    expect(screen.getByText('종료된 기획전이지만, 지금 조건도 비교해 드립니다')).toBeInTheDocument();
  });

  test('없는 기획전이면 안내와 목록 링크를 보여준다', async () => {
    content.onGet(/.*/).reply(200, []);

    renderWithProviders('/promotion/brands/detail/999');

    expect(await screen.findByText('해당 브랜드 혜택 정보를 찾을 수 없습니다.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '기획전 목록으로 돌아가기' })).toHaveAttribute('href', '/promotion');
  });
});
