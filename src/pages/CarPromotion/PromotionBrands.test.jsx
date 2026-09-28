import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import PromotionBrands from './PromotionBrands.jsx';
import { contentHttp } from '../../services/contentApi.js';
import { carHttp } from '../../services/carApi.js';

const renderWithProviders = (route = '/promotion/brands') => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <PromotionBrands />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const PROMOTIONS = [
  { id: 101, title: '현대 프로모션', extraInfo: '현대', is_active: true },
  { id: 102, title: '기아 프로모션', extraInfo: '기아', is_active: true },
];

describe('PromotionBrands (브랜드별 혜택 전체)', () => {
  let content;
  let cars;

  beforeAll(() => {
    content = new MockAdapter(contentHttp);
    cars = new MockAdapter(carHttp);
  });

  afterEach(() => {
    content.reset();
    cars.reset();
  });

  afterAll(() => {
    content.restore();
    cars.restore();
  });

  test('기획전의 브랜드로 필터를 만들고 고른 브랜드만 보여준다', async () => {
    content.onGet('/api/content/promotions/brand').reply((config) => {
      expect(config.params).toEqual({ position: 'TOP', limit: 100 });
      return [200, PROMOTIONS];
    });
    cars.onGet('/api/user/cars/brands').reply(200, [
      { id: 95, name: '현대' },
      { id: 84, name: '기아' },
    ]);

    renderWithProviders();

    expect(screen.getByRole('heading', { level: 1, name: '브랜드별 혜택 전체' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 3, name: '현대 프로모션' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '기아 프로모션' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '기아' }));

    expect(screen.queryByRole('heading', { level: 3, name: '현대 프로모션' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '기아 프로모션' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '기아' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('주소의 tab=ended, maker 값을 그대로 쓴다', async () => {
    content.onGet('/api/content/promotions/brand').reply((config) => {
      expect(config.params.position).toBe('BOTTOM');
      return [200, PROMOTIONS];
    });
    cars.onGet(/.*/).reply(200, []);

    renderWithProviders('/promotion/brands?tab=ended&maker=현대');

    expect(await screen.findByRole('heading', { level: 3, name: '현대 프로모션' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3, name: '기아 프로모션' })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '종료된 기획전' })).toHaveAttribute('aria-selected', 'true');
  });
});
