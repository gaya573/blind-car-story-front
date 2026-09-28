import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import MockAdapter from 'axios-mock-adapter';
import MobileSearch from './MobileSearch.jsx';
import { contentHttp } from '../../services/contentApi.js';
import { carHttp } from '../../services/carApi.js';

const renderWithProviders = (ui) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/m/search/find']}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
};

const REVIEWS = [
  { id: 1, title: '아반떼 출고 후기', description: '아반떼 구매했습니다.', authorName: '김영' },
  { id: 2, title: '카니발 후기', description: '카니발 좋아요.', authorName: '박미영' },
];

describe('MobileSearch (/m/search/find)', () => {
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

  test('검색어가 없으면 브랜드 바로가기와 최근 출고후기를 보여준다', async () => {
    content.onGet('/api/content/main-page/reviews').reply(200, REVIEWS);
    cars.onGet('/api/user/cars/brands').reply(200, []);

    renderWithProviders(<MobileSearch />);

    expect(screen.getByPlaceholderText(/찾으실 차량을 검색해주세요/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '현대' })).toHaveAttribute('href', `/m/search/results?carOrigin=domestic&brand=${encodeURIComponent('현대')}`);
    expect(await screen.findByText('아반떼 출고 후기')).toBeInTheDocument();
    expect(screen.getByText('카니발 후기')).toBeInTheDocument();
  });

  test('검색어를 넣으면 차량 검색 결과와 일치하는 후기만 보여준다', async () => {
    let searched;
    content.onGet('/api/content/main-page/reviews').reply(200, REVIEWS);
    cars.onGet('/api/user/cars/brands').reply(200, [{ id: 95, name: '현대', country: 'KR' }]);
    cars.onGet('/api/user/cars/search').reply((config) => {
      searched = config.params;
      return [200, { brands: [], vehicleLines: [{ id: 989, name: '아반떼', brandId: 95 }], trims: [{ id: 8052, name: '1.6 스마트 A/T', brandId: 95, vehicleLineId: 989 }] }];
    });

    renderWithProviders(<MobileSearch />);

    fireEvent.change(screen.getByPlaceholderText(/찾으실 차량을 검색해주세요/), { target: { value: '아반떼' } });

    const line = await screen.findByRole('link', { name: '현대 - 아반떼' });
    expect(searched).toEqual({ keyword: '아반떼', limit: 5 });
    expect(line).toHaveAttribute('href', `/m/search/results?brand=${encodeURIComponent('현대')}&keyword=${encodeURIComponent('아반떼')}`);
    expect(screen.getByRole('link', { name: '현대 - 1.6 스마트 A/T' })).toHaveAttribute('href', '/m/car-detail/989?trimId=8052');
    expect(screen.getByText('아반떼 출고 후기')).toBeInTheDocument();
    expect(screen.queryByText('카니발 후기')).not.toBeInTheDocument();
  });
});
