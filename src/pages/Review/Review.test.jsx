import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Review from './Review.jsx';
import { contentHttp } from '../../services/contentApi.js';
import { carHttp } from '../../services/carApi.js';
import { BcsUiProvider } from '../../bcs/BcsUiContext.jsx';

const renderWithProviders = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <BcsUiProvider>
          <Review />
        </BcsUiProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const review = (id, overrides = {}) => ({
  id,
  title: `후기 ${id}`,
  description: `첫 줄 ${id}\n둘째 줄 ${id}`,
  rating: 5,
  authorName: '홍길동',
  createdAt: `2026-05-${String(30 - (id % 28)).padStart(2, '0')}T10:00:00Z`,
  imageUrl: `https://cdn.example.com/review-${id}.jpg`,
  is_approved: true,
  ...overrides,
});

describe('Review (퍼블리싱 출고후기)', () => {
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

  test('실제 후기를 카드로 보여주고 작성자 이름은 가린다', async () => {
    content.onGet('/api/content/main-page/reviews').reply((config) => {
      // 공개 화면은 관리자 목록 API 를 쓰지 않는다.
      expect(config.params).toEqual({ limit: 100 });
      return [200, { items: [review(1, { trimId: 7112, extraInfo: '기아' }), review(2, { rating: 3, authorName: '김영' })] }];
    });
    cars.onGet('/api/user/cars/7112/detail').reply(200, { id: 7112, name: '카니발 하이브리드', brandName: '기아' });

    renderWithProviders();

    expect(screen.getByRole('heading', { level: 1, name: '출고후기 및 리뷰' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 3, name: '후기 1' })).toBeInTheDocument();
    expect(screen.getByText('홍*동')).toBeInTheDocument();
    expect(screen.getByText('김*')).toBeInTheDocument();
    // 별점 4점 이상만 "추천해요!" 배지
    expect(screen.getAllByText('추천해요!')).toHaveLength(1);
    // 트림이 연결된 후기는 차량 상세 이름을 차종 칩에 쓴다.
    expect(await screen.findByText('기아 카니발 하이브리드')).toBeInTheDocument();
  });

  test('9개씩 보여주고 후기 더보기로 다음 묶음을 불러온다', async () => {
    content.onGet('/api/content/main-page/reviews').reply(200, { items: Array.from({ length: 11 }, (_, index) => review(index + 1)) });

    renderWithProviders();

    const more = await screen.findByRole('button', { name: '후기 더보기 (2)' });
    expect(document.querySelectorAll('.rv-card')).toHaveLength(9);

    fireEvent.click(more);

    await waitFor(() => expect(document.querySelectorAll('.rv-card')).toHaveLength(11));
    expect(screen.queryByRole('button', { name: /후기 더보기/ })).not.toBeInTheDocument();
  });

  test('카드를 누르면 후기 상세 모달이 열리고, 같은 차량 견적내기는 견적 모달로 넘어간다', async () => {
    content.onGet('/api/content/main-page/reviews').reply(200, {
      items: [review(1, { extraInfo: '기아', imageUrls: ['https://cdn.example.com/extra.jpg'] })],
    });

    renderWithProviders();

    fireEvent.click(await screen.findByRole('link', { name: /후기 1/ }));

    const dialog = screen.getByRole('dialog', { name: '고객 후기' });
    expect(dialog.closest('.rvm-overlay')).toHaveClass('is-open');
    expect(within(dialog).getByText('첫 줄 1')).toBeInTheDocument();
    expect(within(dialog).getByText('둘째 줄 1')).toBeInTheDocument();
    expect(within(dialog).getAllByRole('button', { name: /번째 사진 보기/ })).toHaveLength(2);

    fireEvent.click(within(dialog).getByRole('button', { name: '같은 차량 견적내기' }));

    expect(dialog.closest('.rvm-overlay')).not.toHaveClass('is-open');
    const quote = screen.getByRole('dialog', { name: '실시간 견적 받기', hidden: true });
    expect(quote.closest('.qm-overlay')).toHaveClass('is-open');
    expect(within(quote).getByLabelText('차종')).toHaveValue('기아');
  });

  test('불러오는 동안과 후기가 없을 때 안내 문구를 보여준다', async () => {
    content.onGet('/api/content/main-page/reviews').reply(200, { items: [] });

    renderWithProviders();

    expect(screen.getByText('후기를 불러오는 중입니다...')).toBeInTheDocument();
    expect(await screen.findByText('등록된 후기가 아직 없습니다.')).toBeInTheDocument();
  });
});
