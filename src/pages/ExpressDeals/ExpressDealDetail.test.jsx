import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ExpressDealDetail from './ExpressDealDetail.jsx';
import { contentHttp } from '../../services/contentApi.js';

const renderWithProviders = (ui, { route = '/express-deals/detail/10' } = {}) => {
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
          <Route path="/express-deals/detail/:carId" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('ExpressDealDetail', () => {
  let mock;

  beforeAll(() => {
    mock = new MockAdapter(contentHttp);
  });

  afterEach(() => {
    mock.reset();
  });

  afterAll(() => {
    mock.restore();
  });

  test('renders detail with fetched inventory item', async () => {
    mock.onGet('/api/content/inventory').reply(200, [
      {
        id: 10,
        title: '즉시 출고 차량',
        subtitle: '설명',
        description: '상세 설명',
        imageUrl: 'https://via.placeholder.com/960x540',
        extraInfo: 'KIA',
        is_active: true,
      },
    ]);

    renderWithProviders(<ExpressDealDetail />);

    await waitFor(() => {
      // carData.name이 h1으로 렌더링됨
      expect(screen.getByRole('heading', { name: '즉시 출고 차량' })).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('shows loading state', () => {
    mock.onGet('/api/content/inventory').reply(() => new Promise(() => {}));

    renderWithProviders(<ExpressDealDetail />);

    expect(screen.getByText('차량 정보를 불러오는 중입니다...')).toBeInTheDocument();
  });
});

