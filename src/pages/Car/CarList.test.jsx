import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CarList from './CarList.jsx';
import { carHttp } from '../../services/carApi.js';

const renderWithProviders = (ui, { route = '/carlist/domestic' } = {}) => {
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
          <Route path="/carlist/:carType" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('CarList', () => {
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

  test('renders trims fetched from API', async () => {
    mock.onGet('/api/user/cars/brands').reply(200, [
      { id: 1, name: '현대', logoUrl: null },
    ]);

    mock.onGet('/api/user/cars/v3').reply(200, {
      items: [
        {
          vehicleLineId: 10,
          vehicleLineName: 'EV6',
          vehicleLineDescription: '',
          brandId: 1,
          imageUrl: null,
          trims: [
            {
              id: 101,
              name: 'EV6 롱레인지',
              carType: '전기',
              fuelName: '전기',
              basePrice: 55000000,
            },
          ],
        },
      ],
      pagination: {
        page: 1,
        size: 12,
        totalElements: 1,
        totalPages: 1,
      },
    });

    renderWithProviders(<CarList />);

    await waitFor(() => {
      expect(screen.getByText('EV6 롱레인지')).toBeInTheDocument();
    });

    expect(screen.getByText('실시간 무료견적 받기')).toBeInTheDocument();
  });
});
