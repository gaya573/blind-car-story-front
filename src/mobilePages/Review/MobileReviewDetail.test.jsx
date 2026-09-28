import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import MockAdapter from 'axios-mock-adapter';
import MobileReviewDetail from './MobileReviewDetail.jsx';
import { contentHttp } from '../../services/contentApi.js';
import { carHttp } from '../../services/carApi.js';
import { BcsUiProvider } from '../../bcs/BcsUiContext.jsx';

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{`${location.pathname}${location.search}`}</p>;
}

const renderWithProviders = (route = '/m/review/58') => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <BcsUiProvider>
          <Routes>
            <Route path="/m/review/:id" element={<MobileReviewDetail />} />
            <Route path="*" element={<LocationProbe />} />
          </Routes>
        </BcsUiProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const REVIEWS = [
  {
    id: 58,
    trimId: 7112,
    title: '기아 카니발 만족스러운 이용 후기',
    description: '처음 상담부터 출고까지 빨랐습니다.\n넉넉한 공간과 승차감까지 만족합니다.',
    extraInfo: '기아',
    imageUrl: 'https://cdn.example.com/a.jpg',
    imageUrls: ['https://cdn.example.com/b.jpg', 'https://cdn.example.com/c.jpg'],
    authorName: '김영',
    rating: 5,
    createdAt: '2026-05-05T19:07:27',
  },
  { id: 57, title: '모델3 전기차 출고기', description: '만족합니다.', authorName: '박미영', rating: 5 },
];

describe('MobileReviewDetail', () => {
  let content;
  let cars;

  beforeAll(() => {
    content = new MockAdapter(contentHttp);
    cars = new MockAdapter(carHttp);
  });

  beforeEach(() => {
    content.onGet('/api/content/main-page/reviews').reply(200, REVIEWS);
    cars.onGet('/api/user/cars/7112/detail').reply(200, { vehicleLineId: 990, name: '카니발' });
  });

  afterEach(() => {
    content.reset();
    cars.reset();
  });

  afterAll(() => {
    content.restore();
    cars.restore();
  });

  test('후기 제목·작성자·별점·본문과 사진을 보여 주고 썸네일로 사진을 바꾼다', async () => {
    renderWithProviders();

    expect(await screen.findByRole('heading', { level: 1, name: '기아 카니발 만족스러운 이용 후기' })).toBeInTheDocument();
    expect(screen.getByText('김영')).toBeInTheDocument();
    expect(screen.getByLabelText('별점 5점')).toHaveTextContent('★★★★★');
    expect(screen.getByText('2026.05.05')).toBeInTheDocument();
    expect(screen.getByText('처음 상담부터 출고까지 빨랐습니다.')).toBeInTheDocument();
    expect(screen.getByText('넉넉한 공간과 승차감까지 만족합니다.')).toBeInTheDocument();

    const main = screen.getByAltText('기아 카니발 만족스러운 이용 후기 사진 1');
    expect(main).toHaveAttribute('src', 'https://cdn.example.com/a.jpg');
    fireEvent.click(screen.getByRole('button', { name: '사진 3 보기' }));
    expect(screen.getByAltText('기아 카니발 만족스러운 이용 후기 사진 3')).toHaveAttribute('src', 'https://cdn.example.com/c.jpg');
  });

  test('같은 차량 견적내기는 후기 트림의 차량 상세로 보낸다', async () => {
    renderWithProviders();
    await screen.findByRole('heading', { level: 1, name: '기아 카니발 만족스러운 이용 후기' });

    fireEvent.click(screen.getByRole('button', { name: '같은 차량 견적내기' }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/m/car-detail/990?trimId=7112'));
  });

  test('트림이 없는 후기는 차량 검색으로 보내고, 실시간 무료견적 받기는 견적 모달을 연다', async () => {
    renderWithProviders('/m/review/57');
    await screen.findByRole('heading', { level: 1, name: '모델3 전기차 출고기' });

    fireEvent.click(screen.getByRole('button', { name: '실시간 무료견적 받기' }));
    expect(document.querySelector('.qm-overlay')).toHaveClass('is-open');
    await waitFor(() => expect(screen.getByLabelText('차종')).toHaveValue('모델3 전기차 출고기'));

    fireEvent.click(screen.getByRole('button', { name: '같은 차량 견적내기' }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/m/search'));
  });

  test('없는 후기면 안내 문구를 보여 준다', async () => {
    renderWithProviders('/m/review/999');

    expect(await screen.findByText('리뷰를 찾을 수 없습니다.')).toBeInTheDocument();
  });
});
