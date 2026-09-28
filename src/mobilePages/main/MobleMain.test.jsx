import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import MockAdapter from 'axios-mock-adapter';
import MobleMain from './MobleMain.jsx';
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

describe('MobleMain', () => {
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

  test('renders main page with reviews', async () => {
    mock.onGet('/api/content/main-page/reviews').reply(200, [
      {
        id: 1,
        carModel: '더 뉴 스포티지',
        rating: 4.8,
        content: '매우 만족합니다.',
        images: [],
      },
    ]);

    mock.onGet('/api/content/main-page/top-cars').reply(200, []);
    mock.onGet('/api/content/banners').reply(200, null);
    mock.onAny().reply(200, []);

    renderWithProviders(<MobleMain />);

    await waitFor(() => {
      expect(screen.getByText('원더굿라이프')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('renders reviews section', async () => {
    mock.onGet('/api/content/main-page/reviews').reply(200, [
      {
        id: 1,
        carModel: '아반떼',
        rating: 4.8,
        content: '매우 만족합니다.',
        images: [],
      },
    ]);

    mock.onGet('/api/content/main-page/top-cars').reply(200, []);
    mock.onGet('/api/content/banners').reply(200, null);
    mock.onAny().reply(200, []);

    renderWithProviders(<MobleMain />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '출고후기' })).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('uses the MAIN TOP banner on mobile before the legacy mobile banner', async () => {
    const mainBannerUrl = 'https://cdn.example.com/main-top-banner.png';
    const legacyBannerUrl = 'https://cdn.example.com/legacy-mobile-banner.png';

    mock.onGet('/api/content/banners').reply((config) => {
      if (config.params?.banner_type === 'MAIN') {
        expect(config.params).toEqual({ banner_type: 'MAIN', position: 'TOP', limit: 10 });
        return [200, { items: [{ id: 131, imageUrl: mainBannerUrl, position: 'TOP' }] }];
      }

      if (config.params?.banner_type === 'MOBILE_MAIN') {
        return [200, { items: [{ id: 129, imageUrl: legacyBannerUrl }] }];
      }

      return [200, { items: [] }];
    });
    mock.onAny().reply(200, []);

    renderWithProviders(<MobleMain />);

    const banner = await screen.findByRole('img', { name: /모바일 메인 배너 1/i });
    expect(banner).toHaveAttribute('src', mainBannerUrl);
    expect(screen.queryByRole('img', { name: /legacy-mobile-banner/i })).not.toBeInTheDocument();
  });
});















