import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import PromotionBrands from './PromotionBrands.jsx';
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

describe('PromotionBrands', () => {
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

  test('renders brand promotions with fetched data', async () => {
    mock.onGet('/api/content/promotions/brand').reply((config) => {
      expect(config.params).toEqual({ position: 'TOP', limit: 100 });
      return [
        200,
        [
          {
            id: 101,
            title: '현대 프로모션',
            description: '설명',
            imageUrl: 'https://via.placeholder.com/960x540',
            extraInfo: '현대',
            is_active: true,
          },
          {
            id: 102,
            title: '기아 프로모션',
            description: '설명',
            imageUrl: 'https://via.placeholder.com/960x540',
            extraInfo: '기아',
            is_active: true,
          },
        ],
      ];
    });

    renderWithProviders(<PromotionBrands />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '브랜드별 혜택 전체' })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('현대 프로모션')).toBeInTheDocument();
    });

    expect(screen.getByText('기아 프로모션')).toBeInTheDocument();
  });

  test('filters by brand', async () => {
    mock.onGet('/api/content/promotions/brand').reply(200, [
      {
        id: 101,
        title: '현대 프로모션',
        extraInfo: '현대',
        is_active: true,
      },
      {
        id: 102,
        title: '기아 프로모션',
        extraInfo: '기아',
        is_active: true,
      },
    ]);

    renderWithProviders(<PromotionBrands />);

    await waitFor(() => {
      expect(screen.getByText('현대')).toBeInTheDocument();
    });
  });
});

