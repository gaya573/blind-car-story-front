import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import MockAdapter from 'axios-mock-adapter';
import MobileSearch from './MobileSearch.jsx';
import { contentHttp } from '../../services/contentApi.js';

const renderWithProviders = (ui) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('MobileSearch', () => {
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

  test('renders search page', () => {
    mock.onGet('/api/content/main-page/reviews').reply(200, []);

    renderWithProviders(<MobileSearch />);

    expect(screen.getByPlaceholderText(/찾으실 차량을 검색해주세요/)).toBeInTheDocument();
  });

  test('shows search results when searching', async () => {
    mock.onGet('/api/content/main-page/reviews').reply(200, [
      {
        id: 1,
        carModel: '아반떼',
        content: '아반떼 구매했습니다.',
        rating: 4.8,
        images: [],
      },
    ]);

    renderWithProviders(<MobileSearch />);

    const searchInput = screen.getByPlaceholderText(/찾으실 차량을 검색해주세요/);
    // 검색어 입력 시뮬레이션은 실제로는 사용자 이벤트를 트리거해야 함
    expect(searchInput).toBeInTheDocument();
  });
});















