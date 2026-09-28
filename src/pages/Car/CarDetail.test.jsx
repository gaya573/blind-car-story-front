import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CarDetail from './CarTrimDetail.jsx';
import { carHttp } from '../../services/carApi.js';

const renderWithProviders = (ui, { route = '/car-detail/trim/1' } = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/car-detail/trim/:trimId" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('CarDetail', () => {
  let mock;

  beforeAll(() => {
    mock = new MockAdapter(carHttp);
  });

  afterEach(() => {
    mock.reset();
  });

  afterAll(() => {
    mock.restore();
  });

  test('renders car detail with fetched data', async () => {
    mock.onGet('/api/user/cars/1/detail').reply(200, {
      id: 1,
      name: 'EV6 롱레인지',
      brandName: 'KIA',
      brandLogoUrl: 'https://via.placeholder.com/100',
      trims: [
        {
          id: 101,
          name: 'EV6 롱레인지 AWD',
          basePrice: 55000000,
          carType: '전기',
          fuelName: '전기',
        },
      ],
      sharedOptions: [
        {
          id: 201,
          name: '선루프 패키지',
          price: 1500000,
          discountedPrice: 1200000,
        },
      ],
      availableColors: [
        { id: 301, name: '크리미 화이트', colorCode: '#F5F5F5' },
        { id: 302, name: '어비스 블랙', colorCode: '#1A1A1A' },
      ],
      features: [],
    });

    renderWithProviders(<CarDetail />);

    await waitFor(() => {
      expect(screen.getAllByText('EV6 롱레인지').length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText('EV6 롱레인지 AWD')[0]).toBeInTheDocument();
    // 중복된 텍스트가 있을 수 있으므로 getAllByText 사용
    expect(screen.getAllByText(/55,000,000원/)[0]).toBeInTheDocument();
  });

  test('shows loading state', () => {
    mock.onGet('/api/user/cars/1/detail').reply(() => new Promise(() => {}));

    renderWithProviders(<CarDetail />);

    expect(screen.getByText('차량 정보를 불러오는 중입니다...')).toBeInTheDocument();
  });

  test('shows error state', async () => {
    mock.onGet('/api/user/cars/1/detail').reply(404);

    renderWithProviders(<CarDetail />);

    await waitFor(() => {
      expect(screen.getByText(/차량 정보를 불러오지 못했습니다/)).toBeInTheDocument();
    });
  });
});

