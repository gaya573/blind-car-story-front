import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import MockAdapter from 'axios-mock-adapter';
import MobileReview from './MobileReview.jsx';
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

describe('MobileReview', () => {
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

    renderWithProviders(<MobileReview />);

    expect(screen.getByText(/리뷰를 불러오는 중/)).toBeInTheDocument();
  });

  test('renders reviews', async () => {
    mock.onGet('/api/content/main-page/reviews').reply(200, [
      {
        id: 1,
        title: '더 뉴 스포티지',
        subtitle: '2.5 터보 익스클루시브',
        rating: 4.8,
        authorName: '이**님',
        createdAt: '2025-10-21',
        content: '매우 만족합니다.',
        serviceType: '장기렌트',
        images: [],
      },
    ]);

    renderWithProviders(<MobileReview />);

    await waitFor(() => {
      expect(screen.getAllByText('더 뉴 스포티지').length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  test('shows empty state when no reviews', async () => {
    mock.onGet('/api/content/main-page/reviews').reply(200, []);

    renderWithProviders(<MobileReview />);

    await waitFor(() => {
      expect(screen.getByText(/표시할 리뷰가 없습니다/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});














