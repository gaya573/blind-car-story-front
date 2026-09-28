import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PromotionDetail from './PromotionDetail.jsx';
import { carHttp } from '../../services/carApi.js';

const renderWithProviders = (ui, { route = '/promotion/brands/detail/100?trimId=100' } = {}) => {
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
          <Route path="/promotion/brands/detail/:id" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('PromotionDetail', () => {
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

  test('renders promotion detail with fetched data', async () => {
    mock.onGet('/api/user/cars/100/detail').reply(200, {
      id: 100,
      name: '아이오닉 5',
      brandName: '현대',
      trims: [{ id: 100, name: '롱레인지', basePrice: 55000000, options: [], colors: [] }],
      availableColors: [],
    });

    renderWithProviders(<PromotionDetail />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '아이오닉 5' })).toBeInTheDocument();
    });
  });

  test('shows error state when promotion not found', async () => {
    mock.onGet('/api/user/cars/100/detail').reply(404);

    renderWithProviders(<PromotionDetail />);

    await waitFor(() => {
      expect(screen.getByText(/차량 정보를 불러오지 못했습니다/)).toBeInTheDocument();
    });
  });
});

