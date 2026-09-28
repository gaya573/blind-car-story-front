import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ExpressDeals from './ExpressDeals.jsx';
import { contentHttp } from '../../services/contentApi.js';
import { carHttp } from '../../services/carApi.js';
import { BcsUiProvider } from '../../bcs/BcsUiContext.jsx';

const renderWithProviders = (ui, { route = '/express-deals' } = {}) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <BcsUiProvider>{ui}</BcsUiProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const page = (items) => [200, { items, pagination: { page: 1, size: items.length, totalElements: items.length, totalPages: 1 } }];
const inDays = (days) => new Date(Date.now() + days * 86400000 - 60000).toISOString();

const car = (id, overrides = {}) => ({
  id,
  cardType: 'HOTDEAL',
  trimId: id + 1000,
  title: `차량 ${id}`,
  subtitle: `트림 ${id}`,
  extraInfo: '기아',
  basePrice: 28630000,
  lowest_prepayment_30_monthly_fee: 238000,
  lowest_deposit_30_monthly_fee: 346280,
  lowest_no_deposit_monthly_fee: 393430,
  deadline: inDays(5),
  endDate: inDays(5),
  is_active: true,
  ...overrides,
});

describe('ExpressDeals (퍼블리싱 재고 특가 핫딜)', () => {
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

  test('긴급 영역은 프로모션 재고, 차량선택은 전체 재고를 마감 순으로 보여준다', async () => {
    content.onGet('/api/content/inventory').reply((config) => {
      if (config.params.cardType === 'PROMOTION_EVENT') {
        expect(config.params.limit).toBe(30);
        return page([car(1, { cardType: 'PROMOTION_EVENT', title: '긴급 스포티지', deadline: inDays(3), endDate: inDays(3) })]);
      }
      expect(config.params).toEqual({ page: 1, limit: 200 });
      return page([
        car(2, { title: '늦은 마감 K8', deadline: inDays(9), endDate: inDays(9) }),
        car(3, { title: '빠른 마감 쏘렌토', deadline: inDays(2), endDate: inDays(2), remainingQuantity: 2 }),
      ]);
    });
    cars.onGet('/api/user/cars/brands').reply(200, [{ id: 84, name: '기아' }]);

    renderWithProviders(<ExpressDeals />);

    const urgent = await screen.findByRole('region', { name: /오늘 놓치면 마감 차량/ });
    expect(within(urgent).getByText('긴급 스포티지')).toBeInTheDocument();
    expect(within(urgent).getByText('D-3')).toBeInTheDocument();
    expect(within(urgent).getByText('238,000')).toBeInTheDocument();

    const list = screen.getByRole('region', { name: '차량선택' });
    await waitFor(() => expect(within(list).getAllByRole('heading', { level: 3 })).toHaveLength(2));
    const names = within(list).getAllByRole('heading', { level: 3 }).map((node) => node.textContent);
    expect(names).toEqual(['빠른 마감 쏘렌토', '늦은 마감 K8']);
    expect(within(list).getByText('재고 2대')).toBeInTheDocument();
    expect(within(list).getByText('2', { selector: 'strong' })).toBeInTheDocument();
  });

  test('제조사를 고르면 브랜드 id 로 재고를 다시 조회한다', async () => {
    const requested = [];
    content.onGet('/api/content/inventory').reply((config) => {
      requested.push(config.params);
      if (config.params.brandId === 95) return page([car(5, { title: '현대 투싼', extraInfo: '현대' })]);
      return page([car(4, { title: '기아 K8' })]);
    });
    cars.onGet('/api/user/cars/brands').reply(200, [
      { id: 95, name: '현대' },
      { id: 84, name: '기아' },
    ]);

    renderWithProviders(<ExpressDeals />);
    expect(await screen.findByText('기아 K8')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '현대' }));

    expect(await screen.findByText('현대 투싼')).toBeInTheDocument();
    expect(screen.queryByText('기아 K8')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '현대' })).toHaveAttribute('aria-pressed', 'true');
    expect(requested.some((params) => params.brandId === 95)).toBe(true);
  });

  test('12대씩 보여주고 차량 더보기로 나머지를 연다', async () => {
    content.onGet('/api/content/inventory').reply((config) =>
      config.params.cardType ? page([]) : page(Array.from({ length: 13 }, (_, index) => car(index + 10))),
    );
    cars.onGet(/.*/).reply(200, []);

    renderWithProviders(<ExpressDeals />);

    const more = await screen.findByRole('button', { name: '차량 더보기 (1)' });
    const list = screen.getByRole('region', { name: '차량선택' });
    expect(within(list).getAllByRole('heading', { level: 3 })).toHaveLength(12);

    fireEvent.click(more);
    expect(within(list).getAllByRole('heading', { level: 3 })).toHaveLength(13);
    expect(screen.queryByRole('button', { name: /차량 더보기/ })).not.toBeInTheDocument();
  });

  test('카드의 견적 버튼은 차량명을 채운 실시간 견적 모달을 연다', async () => {
    content.onGet('/api/content/inventory').reply((config) => (config.params.cardType ? page([]) : page([car(7, { title: '기아 레이' })])));
    cars.onGet(/.*/).reply(200, []);

    renderWithProviders(<ExpressDeals />);

    await screen.findByText('기아 레이');
    fireEvent.click(screen.getByRole('button', { name: '실시간 무료견적 받기' }));

    const dialog = screen.getByRole('dialog', { name: '실시간 견적 받기', hidden: true });
    expect(dialog.closest('.qm-overlay')).toHaveClass('is-open');
    await waitFor(() => expect(within(dialog).getByLabelText('차종')).toHaveValue('기아 레이 트림 7'));
  });

  test('불러오는 동안 안내 문구를 보여준다', () => {
    content.onGet('/api/content/inventory').reply(() => new Promise(() => {}));
    cars.onGet(/.*/).reply(200, []);

    renderWithProviders(<ExpressDeals />);

    expect(screen.getByText('재고 차량을 불러오는 중입니다...')).toBeInTheDocument();
  });
});
