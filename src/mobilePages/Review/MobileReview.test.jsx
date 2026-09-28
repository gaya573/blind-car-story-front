import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import MockAdapter from 'axios-mock-adapter';
import MobileReview from './MobileReview.jsx';
import { contentHttp } from '../../services/contentApi.js';
import { BcsUiProvider } from '../../bcs/BcsUiContext.jsx';

const renderWithProviders = (ui) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/m/review']}>
        <BcsUiProvider>{ui}</BcsUiProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const REVIEWS = [
  {
    id: 57,
    title: '모델3 전기차 출고기',
    description: '상담도 친절하게 진행해주셔서\n믿고 계약할 수 있었습니다.',
    imageUrl: 'https://cdn.example.com/review-57.jpg',
    authorName: '박미영',
    rating: 4,
    createdAt: '2026-05-06T04:05:21',
    is_active: true,
  },
  {
    id: 58,
    title: '기아 카니발 만족스러운 이용 후기',
    description: '넉넉한 공간과 편안한 승차감까지 만족합니다.',
    imageUrls: ['https://cdn.example.com/review-58.jpg'],
    authorName: '김영',
    rating: 5,
    createdAt: '2026-05-05T19:07:27',
    is_active: true,
  },
];

describe('MobileReview', () => {
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

  test('후기를 불러오는 동안 안내 문구를 보여 준다', () => {
    mock.onGet('/api/content/main-page/reviews').reply(() => new Promise(() => {}));

    renderWithProviders(<MobileReview />);

    expect(screen.getByText(/리뷰를 불러오는 중/)).toBeInTheDocument();
  });

  test('후기 API 항목을 최신순 review-card 로 그리고 상세로 연결한다', async () => {
    mock.onGet('/api/content/main-page/reviews').reply(200, REVIEWS);

    const { container } = renderWithProviders(<MobileReview />);

    const first = await screen.findByText('모델3 전기차 출고기');
    expect(first.closest('a')).toHaveClass('review-card');
    expect(first.closest('a')).toHaveAttribute('href', '/m/review/57');
    expect(screen.getByAltText('모델3 전기차 출고기')).toHaveAttribute('src', 'https://cdn.example.com/review-57.jpg');
    expect(screen.getByText(/박미영/)).toHaveTextContent('박미영 · ★★★★☆ · 2026.05.06');
    expect(container.querySelector('.m-listbar strong')).toHaveTextContent('2');

    const titles = () => Array.from(container.querySelectorAll('.review-card h3')).map((node) => node.textContent);
    expect(titles()).toEqual(['모델3 전기차 출고기', '기아 카니발 만족스러운 이용 후기']);

    fireEvent.click(screen.getByRole('button', { name: '별점 높은 순' }));
    expect(titles()).toEqual(['기아 카니발 만족스러운 이용 후기', '모델3 전기차 출고기']);
  });

  test('후기가 없으면 퍼블리싱 준비중 카드를 보여 준다', async () => {
    mock.onGet('/api/content/main-page/reviews').reply(200, []);

    renderWithProviders(<MobileReview />);

    expect(await screen.findByText('출고후기 준비중')).toBeInTheDocument();
    expect(screen.getByText('출고후기 콘텐츠는 준비 중입니다.')).toBeInTheDocument();
  });

  test('하단 배너 버튼은 견적 모달을 연다', async () => {
    mock.onGet('/api/content/main-page/reviews').reply(200, REVIEWS);

    renderWithProviders(<MobileReview />);
    await screen.findByText('모델3 전기차 출고기');

    fireEvent.click(screen.getByRole('button', { name: '실시간 무료견적 받기' }));
    await waitFor(() => expect(document.querySelector('.qm-overlay')).toHaveClass('is-open'));
  });
});
