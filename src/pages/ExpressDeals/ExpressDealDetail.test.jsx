import React from 'react';
import { render, screen } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ExpressDealDetail from './ExpressDealDetail.jsx';
import { contentHttp } from '../../services/contentApi.js';

const renderWithProviders = (route = '/express-deals/detail/10') => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/express-deals/detail/:carId" element={<ExpressDealDetail />} />
          <Route path="/car-detail/trim/:trimId" element={<p>트림 상세 화면</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('ExpressDealDetail', () => {
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

  test('트림이 연결된 재고는 트림 상세로 보낸다', async () => {
    mock.onGet('/api/content/inventory').reply(200, [{ id: 10, trimId: 7063, title: '기아 스포티지', is_active: true }]);

    renderWithProviders();

    expect(await screen.findByText('트림 상세 화면')).toBeInTheDocument();
  });

  test('트림이 없는 재고는 퍼블리싱 재고 카드로 보여준다', async () => {
    mock.onGet('/api/content/inventory').reply(200, [
      { id: 10, title: '즉시 출고 차량', subtitle: '가솔린 1.6', extraInfo: '기아', lowest_prepayment_30_monthly_fee: 238000, is_active: true },
    ]);

    renderWithProviders();

    expect(await screen.findByRole('heading', { level: 3, name: '즉시 출고 차량' })).toBeInTheDocument();
    expect(screen.getByText('238,000')).toBeInTheDocument();
  });

  test('없는 재고면 목록으로 돌아가는 링크를 보여준다', async () => {
    mock.onGet('/api/content/inventory').reply(200, []);

    renderWithProviders();

    expect(await screen.findByRole('link', { name: '재고 특가 핫딜 목록으로 돌아가기' })).toHaveAttribute('href', '/express-deals');
  });

  test('불러오는 동안 안내 문구를 보여준다', () => {
    mock.onGet('/api/content/inventory').reply(() => new Promise(() => {}));

    renderWithProviders();

    expect(screen.getByText('차량 정보를 불러오는 중입니다...')).toBeInTheDocument();
  });
});
