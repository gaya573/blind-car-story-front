import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Review from './Review.jsx';
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

describe('Review', () => {
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

  test('renders reviews with fetched data', async () => {
    mock.onGet('/api/content/main-page/reviews').reply((config) => {
      // Public review pages must never depend on the protected admin list.
      expect(config.params).toEqual({ limit: 100 });
      return [
        200,
        {
          items: [
            {
              id: 301,
              title: 'EV6 구매 후기',
              description: '정말 만족스러운 구매였습니다.',
              rating: 5,
              authorName: '홍길동',
              createdAt: '2025-01-15T10:00:00Z',
              imageUrl: 'https://via.placeholder.com/480x320',
              is_approved: true,
            },
            {
              id: 302,
              title: 'IONIQ 6 리뷰',
              description: '전기차의 미래를 느낄 수 있어요.',
              rating: 5,
              authorName: '김철수',
              createdAt: '2025-01-14T10:00:00Z',
              imageUrl: 'https://via.placeholder.com/480x320',
              is_approved: true,
            },
          ],
          pagination: { page: 1, size: 12, totalElements: 2, totalPages: 1 },
        },
      ];
    });

    renderWithProviders(<Review />);

    await waitFor(() => {
      expect(screen.getAllByText('출고후기 및 리뷰').length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(screen.getByText('EV6 구매 후기')).toBeInTheDocument();
    });

    expect(screen.getByText('IONIQ 6 리뷰')).toBeInTheDocument();
  });

  test('shows loading state', () => {
    mock.onGet('/api/content/main-page/reviews').reply(() => new Promise(() => {}));

    renderWithProviders(<Review />);

    expect(screen.getByText('리뷰를 불러오는 중입니다...')).toBeInTheDocument();
  });

  test('shows empty state when no reviews', async () => {
    mock.onGet('/api/content/main-page/reviews').reply(200, {
      items: [],
      pagination: { page: 1, size: 12, totalElements: 0, totalPages: 1 },
    });

    renderWithProviders(<Review />);

    await waitFor(() => {
      expect(screen.getByText('등록된 리뷰가 없습니다.')).toBeInTheDocument();
    });
  });

  test('opens modal when review card is clicked', async () => {
    mock.onGet('/api/content/main-page/reviews').reply(200, {
      items: [
        {
          id: 301,
          title: 'EV6 구매 후기',
          description: '정말 만족스러운 구매였습니다.',
          rating: 5,
          authorName: '홍길동',
          createdAt: '2025-01-15T10:00:00Z',
          imageUrl: 'https://via.placeholder.com/480x320',
          is_approved: true,
        },
      ],
      pagination: { page: 1, size: 12, totalElements: 1, totalPages: 1 },
    });

    renderWithProviders(<Review />);

    await waitFor(() => {
      expect(screen.getByText('EV6 구매 후기')).toBeInTheDocument();
    });

    const reviewCard = screen.getByAltText('EV6 구매 후기').closest('[class*="reviewCard"]');
    if (reviewCard) {
      reviewCard.click();

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2, name: '고객 후기' })).toBeInTheDocument();
      });
    }
  });
});

