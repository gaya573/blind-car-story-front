import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import MockAdapter from 'axios-mock-adapter';
import MobileAdvance from './MobileAdvance.jsx';
import { contentHttp } from '../../services/contentApi.js';
import { BcsUiProvider } from '../../bcs/BcsUiContext.jsx';

const renderWithProviders = (ui) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/m/advance']}>
        <BcsUiProvider>{ui}</BcsUiProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const page = (items) => [200, { items, pagination: { page: 1, size: items.length, totalElements: items.length, totalPages: 1 } }];
const daysLater = (days) => new Date(Date.now() + days * 86400000).toISOString();

const deal = (overrides) => ({
  basePrice: 28630000,
  lowest_prepayment_30_monthly_fee: 238000,
  lowest_deposit_30_monthly_fee: 346280,
  lowest_no_deposit_monthly_fee: 393430,
  is_active: true,
  endDate: daysLater(8.5),
  ...overrides,
});

const URGENT = deal({ id: 1, cardType: 'PROMOTION_EVENT', title: '기아 스포티지', subtitle: '스포티지 1.6 터보', extraInfo: '기아', endDate: daysLater(2.5) });
const LIST = [
  deal({ id: 2, cardType: 'HOTDEAL', title: '현대 투싼', subtitle: '모던 하이브리드', extraInfo: '현대' }),
  deal({ id: 3, cardType: 'HOTDEAL', title: '기아 EV3', subtitle: 'EV3 스탠다드&&에어 A/T', extraInfo: '기아', lowest_prepayment_30_monthly_fee: 236320 }),
];

describe('MobileAdvance (퍼블리싱 m-express)', () => {
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

  test('재고를 불러오는 동안에도 페이지 머리말을 보여 준다', () => {
    mock.onGet('/api/content/inventory').reply(() => new Promise(() => {}));

    renderWithProviders(<MobileAdvance />);

    expect(screen.getByRole('heading', { name: '재고 특가 핫딜' })).toBeInTheDocument();
    expect(screen.getAllByText('차량 정보를 불러오는 중...').length).toBeGreaterThan(0);
  });

  test('PROMOTION_EVENT 는 오늘 출고 마감 영역에, 나머지는 전체 재고 목록에 m-deal 카드로 그린다', async () => {
    mock.onGet('/api/content/inventory').reply((config) =>
      page(config.params.cardType === 'PROMOTION_EVENT' ? [URGENT] : [URGENT, ...LIST]),
    );

    const { container } = renderWithProviders(<MobileAdvance />);

    const urgentCard = (await screen.findByText('기아 스포티지')).closest('.m-deal');
    expect(urgentCard).toHaveClass('m-deal--urgent');
    expect(within(urgentCard).getByText('긴급 D-3')).toBeInTheDocument();
    expect(within(urgentCard).getByText('238,000')).toBeInTheDocument();

    // 마감 카운트다운은 가장 이른 마감 기준
    expect(container.querySelector('.m-timer .countdown')).toBeInTheDocument();

    const list = await screen.findByText('현대 투싼');
    expect(list.closest('.m-deal')).not.toHaveClass('m-deal--urgent');
    expect(screen.getByText('EV3 스탠다드 에어 A/T')).toBeInTheDocument();
    expect(container.querySelector('.m-listbar strong')).toHaveTextContent('2');
  });

  test('브랜드 칩과 국산/수입 탭으로 목록을 거른다', async () => {
    mock.onGet('/api/content/inventory').reply((config) => {
      if (config.params.cardType === 'PROMOTION_EVENT') return page([]);
      if (config.params.carType === '수입') return page([]);
      return page(LIST);
    });

    renderWithProviders(<MobileAdvance />);
    await screen.findByText('현대 투싼');
    expect(screen.getByText('오늘 출고 마감 차량이 없습니다.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '기아' }));
    expect(screen.queryByText('현대 투싼')).not.toBeInTheDocument();
    expect(screen.getByText('기아 EV3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: '수입' }));
    expect(await screen.findByText('조건에 맞는 재고 차량이 없습니다.')).toBeInTheDocument();
    expect(mock.history.get.some((request) => request.params.carType === '수입')).toBe(true);
  });

  test('카드의 실시간 무료견적 받기는 차량명으로 견적 모달을 연다', async () => {
    mock.onGet('/api/content/inventory').reply((config) => page(config.params.cardType === 'PROMOTION_EVENT' ? [URGENT] : LIST));

    renderWithProviders(<MobileAdvance />);
    const card = (await screen.findByText('현대 투싼')).closest('.m-deal');

    fireEvent.click(within(card).getByRole('button', { name: '실시간 무료견적 받기' }));

    expect(document.querySelector('.qm-overlay')).toHaveClass('is-open');
    await waitFor(() => expect(screen.getByLabelText('차종')).toHaveValue('현대 투싼 모던 하이브리드'));
  });
});
