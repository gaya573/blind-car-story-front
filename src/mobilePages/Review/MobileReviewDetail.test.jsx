import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MockAdapter from 'axios-mock-adapter';
import MobileReviewDetail from './MobileReviewDetail.jsx';
import { contentHttp } from '../../services/contentApi.js';

const renderWithProviders = (ui, route = '/m/review/1') => {
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
          <Route path="/m/review/:id" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('MobileReviewDetail', () => {
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

  test('renders loading state initially', () => {
    mock.onGet('/api/content/main-page/reviews').reply(() => new Promise(() => {}));

    renderWithProviders(<MobileReviewDetail />);

    expect(screen.getByText(/리뷰를 불러오는 중/)).toBeInTheDocument();
  });

  test('renders review detail', async () => {
    mock.onGet('/api/content/main-page/reviews').reply(200, [
      {
        id: 1,
        title: '더 뉴 스포티지',
        subtitle: '2.5 터보 익스클루시브',
        rating: 4.8,
        content: '매우 만족합니다.',
        authorName: '이**님',
        createdAt: '2025-10-21',
        serviceType: '장기렌트',
        images: ['https://example.com/image1.jpg'],
      },
    ]);

    renderWithProviders(<MobileReviewDetail />);

    await waitFor(() => {
      expect(screen.getByText('매우 만족합니다.')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('shows empty state when review not found', async () => {
    mock.onGet('/api/content/main-page/reviews').reply(200, []);

    renderWithProviders(<MobileReviewDetail />, '/m/review/999');

    await waitFor(() => {
      expect(screen.getByText(/리뷰를 찾을 수 없습니다/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});















