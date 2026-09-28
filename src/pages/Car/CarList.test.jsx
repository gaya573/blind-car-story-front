import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import CarList from './CarList.jsx';
import { carHttp } from '../../services/carApi.js';
import { contentHttp } from '../../services/contentApi.js';
import { BcsUiProvider } from '../../bcs/BcsUiContext.jsx';

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
};

const renderWithProviders = (route = '/carlist/domestic') => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <BcsUiProvider>
          <Routes>
            <Route path="/carlist/:carType" element={<CarList />} />
            <Route path="*" element={<div>다른 화면</div>} />
          </Routes>
          <LocationProbe />
        </BcsUiProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const listResponse = (items, totalElements = items.length) => [
  200,
  { items, pagination: { page: 1, size: 12, totalElements, totalPages: 1 } },
];

const domesticItem = (overrides = {}) => ({
  vehicleLineId: 989,
  vehicleLineName: '아반떼',
  modelId: 2451,
  modelName: '아반떼 가솔린',
  brandId: 95,
  representativeTrimId: 8052,
  representativeTrimName: '1.6 스마트 A/T',
  representativeFinalPrice: 20340000,
  representativeDiscountPercent: 0,
  representativeDiscountAmount: 0,
  imageUrl: 'https://cdn.example.com/avante.png',
  trims: [
    {
      id: 8052,
      name: '1.6 스마트 A/T',
      basePrice: 20340000,
      monthlyRentalFee: 197930,
      modelId: 2451,
      brandId: 95,
      lowestPrepayment30MonthlyFee: 197930,
      lowestDeposit30MonthlyFee: 284970,
      lowestNoDepositMonthlyFee: 316140,
    },
  ],
  ...overrides,
});

const importedItem = {
  vehicleLineId: 887,
  vehicleLineName: '3 Series',
  modelId: 1555,
  modelName: '3 Series 가솔린',
  brandId: 81,
  representativeTrimId: 6525,
  representativeTrimName: '2.0 투어링 320i Touring P1 A/T',
  representativeFinalPrice: 50400000,
  representativeDiscountPercent: 19,
  representativeDiscountAmount: 12000000,
  imageUrl: 'https://cdn.example.com/3series.png',
  trims: [{ id: 6525, name: '2.0 투어링 320i Touring P1 A/T', basePrice: 62400000, modelId: 1555, brandId: 81 }],
};

describe('CarList (퍼블리싱 내 차 견적)', () => {
  let cars;
  let content;

  beforeAll(() => {
    cars = new MockAdapter(carHttp);
    content = new MockAdapter(contentHttp);
  });

  beforeEach(() => {
    content.onGet(/\/contents$/).reply(200, []);
    cars.onGet('/api/user/cars/brands').reply((config) =>
      config.params?.country === 'KR'
        ? [200, [{ id: 95, name: '현대' }, { id: 83, name: 'KGM' }]]
        : [200, [{ id: 81, name: 'BMW' }]],
    );
  });

  afterEach(() => {
    cars.reset();
    content.reset();
  });

  afterAll(() => {
    cars.restore();
    content.restore();
  });

  test('국산차 목록을 퍼블리싱 카드로 그리고 월 렌탈료 3종을 보여준다', async () => {
    const pages = [];
    cars.onGet('/api/user/cars/v3').reply((config) => {
      expect(config.params).toMatchObject({ carType: 'domestic', limit: 12, sort: 'percent_desc' });
      pages.push(config.params.page);
      // 첫 페이지만 응답하고 다음 페이지는 아직 오지 않은 상태로 둔다.
      if (config.params.page > 1) return new Promise(() => {});
      return [200, { items: [domesticItem()], pagination: { page: 1, size: 12, totalElements: 97, totalPages: 9 } }];
    });

    const { container } = renderWithProviders();

    const card = await screen.findByRole('link', { name: /아반떼 가솔린/ });
    expect(within(card).getByText('1.6 스마트 A/T')).toBeInTheDocument();
    expect(within(card).getByText('현대')).toBeInTheDocument();
    expect(within(card).getByText('20,340,000원~')).toBeInTheDocument();
    expect(within(card).getByText('선납금 30%')).toBeInTheDocument();
    expect(within(card).getByText('197,930')).toBeInTheDocument();
    expect(within(card).getByText('316,140')).toBeInTheDocument();
    expect(container.querySelector('.bcs-page-carlist .cl-grid')).not.toBeNull();
    // 브랜드 필터는 퍼블리싱 표기(KG모빌리티)와 로고를 쓴다.
    expect(screen.getByRole('button', { name: 'KG모빌리티' })).toBeInTheDocument();
    // 아직 다 받지 않았으면 서버 전체 대수를 보여준다.
    expect(container.querySelector('.cl-listhead__count strong')).toHaveTextContent('97');
    expect(screen.getByRole('button', { name: '차량 더보기 (96)' })).toBeInTheDocument();
    // 화면에 12대를 채우려고 다음 페이지를 미리 요청한다.
    await waitFor(() => expect(pages).toEqual([1, 2]));
    expect(screen.getByRole('img', { name: /국산차 비교견적/ })).toHaveAttribute('src', '/bcs/images/banner/hero-domestic.png');
  });

  test('제휴 어드민 국산차 배너가 있으면 상단 배너로 쓴다', async () => {
    content.reset();
    content.onGet('/api/coalition/BLINDCAR/contents').reply((config) => {
      expect(config.params).toEqual({ pageType: 'DOMESTIC', contentType: 'BANNER' });
      return [200, [{ id: 1, imageUrl: 'https://cdn.example.com/domestic.png', title: '국산차 배너', active: true }]];
    });
    cars.onGet('/api/user/cars/v3').reply(() => listResponse([domesticItem()]));

    renderWithProviders();

    expect(await screen.findByRole('img', { name: '국산차 배너' })).toHaveAttribute('src', 'https://cdn.example.com/domestic.png');
  });

  test('수입차는 할인액과 이달의 프로모션가(정상가 - 할인액)를 보여준다', async () => {
    cars.onGet('/api/user/cars/v3').reply((config) => {
      expect(config.params.carType).toBe('import');
      return listResponse([importedItem]);
    });

    renderWithProviders('/carlist/imported');

    const card = await screen.findByRole('link', { name: /3 Series 가솔린/ });
    expect(within(card).getByText('62,400,000원')).toHaveClass('cl-price-base');
    expect(within(card).getByText('-1,200만원 할인')).toBeInTheDocument();
    expect(within(card).getByText('50,400,000원')).toHaveClass('cl-price-final');
    expect(within(card).getByText('BMW')).toBeInTheDocument();
  });

  test('카드를 누르면 트림 상세로, 견적 버튼을 누르면 견적 모달을 연다', async () => {
    cars.onGet('/api/user/cars/v3').reply(() => listResponse([domesticItem()]));

    const { container } = renderWithProviders();

    const card = await screen.findByRole('link', { name: /아반떼 가솔린/ });
    fireEvent.click(within(card).getByRole('button', { name: '실시간 무료견적 받기' }));
    expect(container.querySelector('.qm-overlay.is-open')).not.toBeNull();
    expect(container.querySelector('#qm-car')).toHaveValue('아반떼 가솔린 1.6 스마트 A/T');
    expect(screen.getByTestId('location')).toHaveTextContent('/carlist/domestic');

    fireEvent.click(card);
    expect(screen.getByTestId('location')).toHaveTextContent('/car-detail/trim/8052');
  });

  test('브랜드를 고르면 brand 쿼리로 다시 조회한다', async () => {
    const requested = [];
    cars.onGet('/api/user/cars/v3').reply((config) => {
      requested.push(config.params.brandId);
      return listResponse([domesticItem()]);
    });

    renderWithProviders();
    await screen.findByRole('link', { name: /아반떼 가솔린/ });

    fireEvent.click(screen.getByRole('button', { name: '현대' }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/carlist/domestic?brand=95'));
    await waitFor(() => expect(requested).toContain(95));
    expect(screen.getByRole('button', { name: '현대' })).toHaveClass('is-active');
  });

  test('?brand= 로 들어오면 해당 브랜드로 조회하고 필터를 선택해 둔다', async () => {
    const requested = [];
    cars.onGet('/api/user/cars/v3').reply((config) => {
      requested.push(config.params.brandId);
      return listResponse([domesticItem()]);
    });

    renderWithProviders('/carlist/domestic?brand=95');

    await screen.findByRole('link', { name: /아반떼 가솔린/ });
    expect(requested[0]).toBe(95);
    await waitFor(() => expect(screen.getByRole('button', { name: '현대' })).toHaveClass('is-active'));
    expect(screen.getByRole('button', { name: '전체' })).not.toHaveClass('is-active');
  });

  test('keyword 로 들어오면 전체 목록을 받아 이름으로 거른다(대소문자·공백 무시)', async () => {
    cars.onGet('/api/user/cars/v3').reply((config) => {
      if (config.params.limit === 12) return listResponse([]);
      expect(config.params.limit).toBeGreaterThan(100);
      return listResponse([
        domesticItem(),
        domesticItem({
          modelId: 2460,
          modelName: '더 뉴 그랜저 가솔린',
          vehicleLineName: '그랜저',
          representativeTrimId: 9001,
          trims: [{ ...domesticItem().trims[0], id: 9001 }],
        }),
      ]);
    });

    const { container } = renderWithProviders(`/carlist/domestic?keyword=${encodeURIComponent('그랜 저')}`);

    expect(await screen.findByRole('link', { name: /더 뉴 그랜저 가솔린/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /아반떼 가솔린/ })).not.toBeInTheDocument();
    expect(container.querySelector('.cl-listhead__count strong')).toHaveTextContent('1');
    expect(screen.getByText(/검색 결과입니다/)).toBeInTheDocument();
  });

  test('국산차에 없는 검색어가 수입차에 있으면 수입차 목록으로 안내한다', async () => {
    cars.onGet('/api/user/cars/v3').reply((config) => {
      if (config.params.carType === 'import') return listResponse([importedItem]);
      return listResponse([domesticItem()]);
    });

    renderWithProviders('/carlist/domestic?keyword=bmw');

    expect(await screen.findByText(/‘bmw’에 해당하는 국산차 정보가 없습니다/)).toBeInTheDocument();
    const link = await screen.findByRole('link', { name: /수입차에서 1대를 찾았습니다/ });
    expect(link).toHaveAttribute('href', '/carlist/imported?keyword=bmw');
  });
});
