import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import MockAdapter from 'axios-mock-adapter';
import MobleCarSearchResult from './MobleCarSearchResult.jsx';
import { carHttp } from '../../services/carApi.js';

const renderWithProviders = (ui, route = '/m/search/results?brand=현대') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('MobleCarSearchResult', () => {
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
    mock.onGet('/api/user/cars/brands').reply(200, []);
    mock.onGet('/api/user/cars/v3').reply(() => new Promise(() => {}));

    renderWithProviders(<MobleCarSearchResult />);

    expect(screen.getByText(/검색 중/)).toBeInTheDocument();
  });

  test('renders search results', async () => {
    mock.onGet('/api/user/cars/brands').reply(200, [
      { id: 10, name: '현대', country: 'KR' },
    ]);
    mock.onGet('/api/user/cars/v3').reply(200, {
      items: [
        {
          id: 1,
          vehicleLineName: '모닝',
          brandName: '현대',
          basePrice: 273379,
          imageUrl: 'https://example.com/image.jpg',
        },
      ],
      pagination: { page: 1, totalPages: 1 },
    });

    renderWithProviders(<MobleCarSearchResult />);

    await waitFor(() => {
      expect(screen.getByText('모닝')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('shows empty state when no results', async () => {
    mock.onGet('/api/user/cars/brands').reply(200, []);
    mock.onGet('/api/user/cars/v3').reply(200, {
      items: [],
      pagination: { page: 1, totalPages: 1 },
    });

    renderWithProviders(<MobleCarSearchResult />);

    await waitFor(() => {
      expect(screen.getByText(/검색 결과가 없습니다/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});















