import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Promotion from './Promotion.jsx';
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

describe('Promotion', () => {
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

  test('renders promotions with fetched data', async () => {
    mock.onGet('/api/content/promotions/brand').reply((config) => {
      if (config.params.position === 'TOP') {
        expect(config.params).toEqual({ position: 'TOP', limit: 100 });
        return [
          200,
          [
            {
              id: 100,
              title: '현대 프로모션',
              subtitle: 'PROMOTION',
              description: '프로모션 설명',
              imageUrl: 'https://via.placeholder.com/960x540',
              extraInfo: '현대',
              is_active: true,
            },
          ],
        ];
      }
      return [200, []];
    });

    renderWithProviders(<Promotion />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '브랜드별 혜택' })).toBeInTheDocument();
    });

    await waitFor(() => {
      // EventCard는 이미지 alt text로 title을 사용
      expect(screen.getByAltText('현대 프로모션')).toBeInTheDocument();
    });
  });

  test('shows empty state when no promotions', async () => {
    mock.onGet('/api/content/promotions/brand').reply(200, []);

    renderWithProviders(<Promotion />);

    await waitFor(() => {
      expect(screen.getByText('표시할 프로모션이 없습니다.')).toBeInTheDocument();
    });
  });
});

