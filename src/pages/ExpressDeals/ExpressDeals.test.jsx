import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ExpressDeals from './ExpressDeals.jsx';
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

describe('ExpressDeals', () => {
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

  test('renders express deals with fetched data', async () => {
    mock.onGet('/api/content/inventory').reply((config) => {
      expect([30, 200]).toContain(config.params.limit);
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
        },
      ];
    });

    mock.onGet('/api/content/admin/list').reply(200, []);

    renderWithProviders(<ExpressDeals />);

    await waitFor(() => {
      expect(screen.getAllByText('마감 임박 차량').length).toBeGreaterThan(0);
    });

    expect(screen.getByText('차량선택')).toBeInTheDocument();
  });

  test('shows loading state', () => {
    mock.onGet('/api/content/inventory').reply(() => new Promise(() => {}));
    mock.onGet('/api/content/admin/list').reply(200, []);

    renderWithProviders(<ExpressDeals />);

    expect(screen.getByText(/불러오는 중입니다/)).toBeInTheDocument();
  });
});

