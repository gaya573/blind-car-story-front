import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import MobileBrandBenefitDetail from './MobileBrandBenefitDetail.jsx';
import { contentHttp } from '../../services/contentApi.js';
import { carHttp } from '../../services/carApi.js';
import { BcsUiProvider } from '../../bcs/BcsUiContext.jsx';

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{`${location.pathname}${location.search}`}</p>;
}

const renderWithProviders = (route) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <BcsUiProvider>
          <Routes>
            <Route path="/m/brand/detail/:id" element={<MobileBrandBenefitDetail />} />
            <Route path="*" element={<LocationProbe />} />
          </Routes>
        </BcsUiProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const page = (items) => [200, { items, pagination: { page: 1, size: items.length, totalElements: items.length, totalPages: 1 } }];
const daysLater = (days) => new Date(Date.now() + days * 86400000).toISOString();

const PROMOTION = {
  id: 83,
  position: 'TOP',
  trimId: 8144,
  title: '현대 투싼 (블라인드 카스토리 x IM캐피탈)',
  subtitle: '블라인드 카스토리 x IM캐피탈',
  extraInfo: '현대',
  imageUrl: 'https://cdn.example.com/banner.png',
  topPromotionImage: 'https://cdn.example.com/top.jpg',
  bottomPromotionImage: 'https://cdn.example.com/bottom.jpg',
  startDate: '2026-08-06T08:17:00',
  endDate: daysLater(22.5),
  basePrice: 32700000,
  trim_monthly_rental_fee: 237110,
};

describe('MobileBrandBenefitDetail (퍼블리싱 m-brand-detail)', () => {
  let content;
  let cars;

  beforeAll(() => {
    content = new MockAdapter(contentHttp);
    cars = new MockAdapter(carHttp);
  });

  beforeEach(() => {
    content.onGet('/api/content/promotions/brand').reply((config) => page(config.params.position === 'TOP' ? [PROMOTION] : []));
    cars.onGet('/api/user/cars/8144/detail').reply(200, {
      name: '투싼 하이브리드',
      vehicleLineId: 995,
      trims: [{ id: 8144, name: '터보 1.6 모던 2WD A/T', lowestPrepayment30MonthlyFee: 237110 }],
    });
  });

  afterEach(() => {
    content.reset();
    cars.reset();
  });

  afterAll(() => {
    content.restore();
    cars.restore();
  });

  test('주소로 바로 들어와도 기획전을 찾아 히어로·요약·안내 이미지·대상 차종을 그린다', async () => {
    renderWithProviders('/m/brand/detail/83');

    expect(await screen.findByRole('heading', { level: 1, name: '현대 투싼' })).toBeInTheDocument();
    expect(screen.getByText('현대 혜택')).toHaveClass('m-sub__title');
    expect(screen.getByText('진행중 · D-23')).toHaveClass('m-bd-hero__status');
    expect(screen.getByText('블라인드 카스토리 x IM캐피탈')).toHaveClass('m-bd-hero__partner');

    expect(screen.getByText('월 렌탈료', { selector: '.m-bd-stat span' }).nextSibling).toHaveTextContent('237,110원');
    expect(screen.getByText('32,700,000원')).toBeInTheDocument();
    expect(screen.getByAltText('현대 투싼 (블라인드 카스토리 x IM캐피탈) 혜택 안내 1')).toHaveAttribute('src', 'https://cdn.example.com/top.jpg');

    const model = await screen.findByText('투싼 하이브리드');
    expect(screen.getByText('터보 1.6 모던 2WD A/T')).toBeInTheDocument();
    fireEvent.click(model.closest('button'));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/m/car-detail/995?trimId=8144'));
  });

  test('하단 버튼은 기획전 이름으로 견적 모달을 연다', async () => {
    renderWithProviders('/m/brand/detail/83');
    await screen.findByRole('heading', { level: 1, name: '현대 투싼' });

    fireEvent.click(screen.getByRole('button', { name: '실시간 무료견적 받기' }));

    expect(document.querySelector('.qm-overlay')).toHaveClass('is-open');
    await waitFor(() => expect(screen.getByLabelText('차종')).toHaveValue('현대 투싼 (블라인드 카스토리 x IM캐피탈)'));
  });

  test('없는 기획전이면 안내 문구를 보여 준다', async () => {
    renderWithProviders('/m/brand/detail/999');

    expect(await screen.findByText('해당 브랜드 혜택 정보를 찾을 수 없습니다.')).toBeInTheDocument();
  });
});
