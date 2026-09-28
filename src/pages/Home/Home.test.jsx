import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home.jsx';
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

describe('Home page', () => {
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

  test('renders the active MAIN TOP banner from the public banner API', async () => {
    mock.onGet('/api/content/banners').reply((config) => {
      expect(config.params).toEqual({ banner_type: 'MAIN', position: 'TOP', limit: 10 });
      return [
        200,
        {
          items: [
            {
              id: 1,
              title: '히어로 배너 테스트',
              subtitle: '배너 서브타이틀',
              imageUrl: 'https://via.placeholder.com/840x450',
              linkUrl: 'https://wondergoodlife.com',
              position: 'TOP',
            },
          ],
          pagination: { page: 1, size: 1, totalElements: 1, totalPages: 1 },
        },
      ];
    });

    mock.onGet('/api/content/main-page/closing-soon').reply((config) => {
      expect(config.params).toEqual({ limit: 10, exclude_ended: true });
      return [
        200,
        {
          items: [
            {
              id: 10,
              title: '마감 임박 차량',
              subtitle: '곧 마감됩니다',
              imageUrl: 'https://via.placeholder.com/300x200',
              extraInfo: 'KIA',
              is_active: true,
            },
          ],
          pagination: { page: 1, size: 1, totalElements: 1, totalPages: 1 },
        },
      ];
    });

    mock.onGet('/api/content/main-page/popular-vehicle').reply((config) => {
      expect(config.params).toEqual({ limit: 10 });
      return [
        200,
        {
          items: [],
          pagination: { page: 1, size: 0, totalElements: 0, totalPages: 1 },
        },
      ];
    });

    mock.onGet('/api/content/main-page/top-cars').reply((config) => {
      expect(config.params).toEqual({ limit: 5 });
      return [
        200,
        {
          items: [
            {
              id: 20,
              rank: 1,
              title: '주간 인기 차량',
              subtitle: '2025년형',
              description: '인기 차량 설명',
              imageUrl: 'https://via.placeholder.com/320x200',
              extraInfo: 'HYUNDAI',
              is_active: true,
            },
          ],
          pagination: { page: 1, size: 1, totalElements: 1, totalPages: 1 },
        },
      ];
    });

    mock.onGet('/api/content/promotions/brand').reply((config) => {
      expect(config.params).toEqual({ position: 'TOP', limit: 100 });
      return [
        200,
        {
          items: [
            {
              id: 30,
              title: '특가 차량',
              subtitle: '오늘의 특가',
              description: '특가 설명',
              imageUrl: 'https://via.placeholder.com/320x200',
              extraInfo: 'GENESIS',
              is_active: true,
            },
          ],
          pagination: { page: 1, size: 1, totalElements: 1, totalPages: 1 },
        },
      ];
    });

    mock.onGet('/api/content/pre-purchase').reply((config) => {
      expect(config.params).toEqual({ limit: 100 });
      return [
        200,
        {
          items: [
            {
              id: 40,
              title: '즉시 출고 차량',
              subtitle: '바로 출고 가능',
              description: '즉시 출고 설명',
              imageUrl: 'https://via.placeholder.com/320x200',
              extraInfo: 'KIA',
              is_active: true,
            },
          ],
          pagination: { page: 1, size: 1, totalElements: 1, totalPages: 1 },
        },
      ];
    });

    mock.onGet('/api/content/inventory').reply(200, { items: [] });

    renderWithProviders(<Home />);

    await waitFor(() => {
      expect(document.querySelector('[style*="via.placeholder.com/840x450"]')).toBeInTheDocument();
    });

    expect(screen.getByText('마감 임박 차량')).toBeInTheDocument();
    expect(screen.getByText('주간 인기 차량')).toBeInTheDocument();
    expect(screen.getByText('즉시 출고 차량')).toBeInTheDocument();
  });
});
