import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import MockAdapter from 'axios-mock-adapter';
import MobleCarSearchResult from './MobleCarSearchResult.jsx';
import { carHttp } from '../../services/carApi.js';
import { BcsUiProvider } from '../../bcs/BcsUiContext.jsx';

const renderWithProviders = (route) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <BcsUiProvider>
          <MobleCarSearchResult />
        </BcsUiProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const BRANDS = [
  { id: 95, name: '현대', country: 'KR' },
  { id: 83, name: 'KGM', country: 'KR' },
  { id: 81, name: 'BMW', country: 'IMPORT' },
];

const domesticLine = {
  vehicleLineId: 989,
  vehicleLineName: '아반떼',
  modelName: '아반떼 가솔린',
  brandId: 95,
  representativeTrimId: 8052,
  representativeTrimName: '1.6 스마트 A/T',
  representativeFinalPrice: 20340000,
  representativeDiscountAmount: 0,
  trims: [
    {
      id: 8052,
      basePrice: 20340000,
      lowestPrepayment30MonthlyFee: 197930,
      lowestDeposit30MonthlyFee: 284970,
      lowestNoDepositMonthlyFee: 316140,
    },
  ],
};

const importedLine = {
  vehicleLineId: 887,
  vehicleLineName: '3 Series',
  modelName: '3 Series 가솔린',
  brandId: 81,
  representativeTrimId: 6525,
  representativeTrimName: '2.0 320i A/T',
  representativeFinalPrice: 50400000,
  representativeDiscountPercent: 19,
  representativeDiscountAmount: 12000000,
  trims: [{ id: 6525, basePrice: 62400000, discountInfo: { discountType: 'PERCENTAGE', discountValue: 19, discountedPrice: 50400000 } }],
};

describe('MobleCarSearchResult (퍼블리싱 m-search-results)', () => {
  let cars;

  beforeAll(() => {
    cars = new MockAdapter(carHttp);
  });

  afterEach(() => {
    cars.reset();
  });

  afterAll(() => {
    cars.restore();
  });

  test('목록을 불러오는 동안 검색 중 안내를 보여준다', () => {
    cars.onGet('/api/user/cars/brands').reply(200, BRANDS);
    cars.onGet('/api/user/cars/v3').reply(() => new Promise(() => {}));

    renderWithProviders('/m/search/results?carOrigin=domestic');

    expect(screen.getByText(/검색 중/)).toBeInTheDocument();
    expect(screen.getByText('국산차 검색결과')).toBeInTheDocument();
  });

  test('브랜드 이름을 id로 바꿔 조회하고, 월 렌탈료가 있는 차량은 렌탈료 카드로 보여준다', async () => {
    let params;
    cars.onGet('/api/user/cars/brands').reply(200, BRANDS);
    cars.onGet('/api/user/cars/v3').reply((config) => {
      params = config.params;
      return [200, { items: [domesticLine], pagination: { page: 1, size: 8, totalElements: 10, totalPages: 2 } }];
    });

    renderWithProviders('/m/search/results?carOrigin=domestic&brand=현대');

    expect(await screen.findByText('아반떼 가솔린')).toBeInTheDocument();
    expect(params).toEqual(expect.objectContaining({ brandId: 95, carType: 'domestic', limit: 8, page: 1 }));
    expect(screen.getByText('197,930')).toBeInTheDocument();
    expect(screen.getByText('20,340,000원~')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '차량 더보기 (9)' })).toBeVisible();
    expect(screen.getByRole('button', { name: '현대' })).toHaveClass('is-active');
    // 국산차 칩에는 수입 브랜드가 없다.
    expect(screen.queryByRole('button', { name: 'BMW' })).not.toBeInTheDocument();
  });

  test('할인이 있는 차량은 기존가격 · 할인가격 · 최종가격으로 보여준다', async () => {
    cars.onGet('/api/user/cars/brands').reply(200, BRANDS);
    cars.onGet('/api/user/cars/v3').reply(200, { items: [importedLine], pagination: { page: 1, size: 8, totalElements: 1, totalPages: 1 } });

    renderWithProviders('/m/search/results?carOrigin=imported');

    expect(await screen.findByText('3 Series 가솔린')).toBeInTheDocument();
    expect(screen.getByText('수입차 검색결과')).toBeInTheDocument();
    expect(screen.getByText('19% 할인')).toBeInTheDocument();
    expect(screen.getByText('62,400,000원~')).toHaveClass('vehicle-base-price--strike');
    expect(screen.getByText('-12,000,000원')).toBeInTheDocument();
    expect(screen.getByText('50,400,000')).toBeInTheDocument();
    expect(document.querySelector('.m-more__btn')).not.toBeVisible();
  });

  test('목록에 없는 브랜드는 전체 목록 대신 준비 중 안내를 보여준다', async () => {
    const list = jest.fn(() => [200, { items: [domesticLine], pagination: { page: 1, totalElements: 1, totalPages: 1 } }]);
    cars.onGet('/api/user/cars/brands').reply(200, BRANDS);
    cars.onGet('/api/user/cars/v3').reply(list);

    renderWithProviders('/m/search/results?carOrigin=imported&brand=없는브랜드');

    expect(await screen.findByText('해당 브랜드의 차량 정보를 준비 중입니다.')).toBeInTheDocument();
    expect(list).not.toHaveBeenCalled();
  });

  test('KG모빌리티처럼 표기가 다른 브랜드도 같은 브랜드로 찾고, 칩을 누르면 조건을 바꾼다', async () => {
    const seen = [];
    cars.onGet('/api/user/cars/brands').reply(200, BRANDS);
    cars.onGet('/api/user/cars/v3').reply((config) => {
      seen.push(config.params.brandId);
      return [200, { items: [], pagination: { page: 1, totalElements: 0, totalPages: 0 } }];
    });

    renderWithProviders('/m/search/results?carOrigin=domestic&brand=KG모빌리티');

    await waitFor(() => expect(seen).toContain(83));
    fireEvent.click(await screen.findByRole('button', { name: '전체' }));
    await waitFor(() => expect(seen).toContain(undefined));
    expect(screen.getByRole('button', { name: '전체' })).toHaveClass('is-active');
  });
});
