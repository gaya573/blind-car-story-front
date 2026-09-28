import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import MockAdapter from 'axios-mock-adapter';
import MobileAdvanceAll from './MobileAdvanceAll.jsx';
import { contentHttp } from '../../services/contentApi.js';
import { BcsUiProvider } from '../../bcs/BcsUiContext.jsx';

const renderWithProviders = (ui) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/m/advance/all']}>
        <BcsUiProvider>{ui}</BcsUiProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const page = (items) => [200, { items, pagination: { page: 1, size: items.length, totalElements: items.length, totalPages: 1 } }];

describe('MobileAdvanceAll', () => {
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

  test('오늘 출고 마감 영역 없이 전체 재고 목록만 보여 준다', async () => {
    mock.onGet('/api/content/inventory').reply(() =>
      page([
        { id: 1, cardType: 'PROMOTION_EVENT', title: '마감 차량', extraInfo: '기아' },
        { id: 2, cardType: 'HOTDEAL', title: '현대 쏘나타', subtitle: '2.0 가솔린 프리미엄', extraInfo: '현대', basePrice: 28260000 },
      ]),
    );

    renderWithProviders(<MobileAdvanceAll />);

    expect(screen.getByRole('heading', { name: '재고 특가 핫딜' })).toBeInTheDocument();
    expect(await screen.findByText('현대 쏘나타')).toBeInTheDocument();
    expect(screen.getByText('28,260,000원~')).toBeInTheDocument();
    expect(screen.queryByText('오늘 출고 마감 차량')).not.toBeInTheDocument();
    expect(screen.queryByText('마감 차량')).not.toBeInTheDocument();
    expect(mock.history.get.every((request) => request.params.cardType === undefined)).toBe(true);
  });

  test('재고가 없으면 빈 목록 안내를 보여 준다', async () => {
    mock.onGet('/api/content/inventory').reply(() => page([]));

    renderWithProviders(<MobileAdvanceAll />);

    expect(await screen.findByText('조건에 맞는 재고 차량이 없습니다.')).toBeInTheDocument();
  });
});
