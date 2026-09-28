import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MockAdapter from 'axios-mock-adapter';
import MobleCarDetail from './MobleCarDetail.jsx';
import { carHttp } from '../../services/carApi.js';

const renderWithProviders = (ui, route = '/m/car-detail/100') => {
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
          <Route path="/m/car-detail/:carId" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('MobleCarDetail', () => {
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

  test('renders loading state initially', () => {
    mock.onGet('/api/user/cars/models').reply(() => new Promise(() => {}));

    renderWithProviders(<MobleCarDetail />);

    expect(screen.getByText(/차량 정보를 불러오는 중/)).toBeInTheDocument();
  });

  test('renders car detail', async () => {
    mock.onGet('/api/user/cars/models').reply(200, [
      {
        id: 10,
        name: '가솔린 1.0',
        vehicleLineName: '모닝',
      },
    ]);

    mock.onGet('/api/user/cars/trims').reply((config) => {
      if (config.params?.modelId === 10) {
        return [
          200,
          [
            {
              id: 1,
              name: '트렌디',
              basePrice: 13250000,
            },
          ],
        ];
      }
      return [200, []];
    });

    mock.onGet('/api/user/cars/1/detail').reply(200, {
      vehicleLineName: '모닝',
      brandName: '기아',
      imageUrl: 'https://example.com/image.jpg',
      trims: [
        {
          id: 1,
          name: '트렌디',
          basePrice: 13250000,
          options: [],
          colors: [],
        },
      ],
    });

    renderWithProviders(<MobleCarDetail />);

    await waitFor(() => {
      expect(screen.getAllByText('가솔린 1.0')[0]).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});












