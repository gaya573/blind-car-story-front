import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import Promotion from './Promotion.jsx';
import { contentHttp } from '../../services/contentApi.js';

function DetailProbe() {
  const location = useLocation();
  return <p>상세 이동 {location.state?.promotion?.id}</p>;
}

const renderWithProviders = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/promotion']}>
        <Routes>
          <Route path="/promotion" element={<Promotion />} />
          <Route path="/promotion/brands/detail/:id" element={<DetailProbe />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const inDays = (days) => new Date(Date.now() + days * 86400000 - 60000).toISOString();

describe('Promotion (퍼블리싱 브랜드별 혜택)', () => {
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

  test('진행중 기획전은 TOP, 종료된 기획전은 BOTTOM 위치로 불러와 카드로 보여준다', async () => {
    mock.onGet('/api/content/promotions/brand').reply((config) => {
      if (config.params.position === 'TOP') {
        expect(config.params).toEqual({ position: 'TOP', limit: 100 });
        return [
          200,
          [
            {
              id: 100,
              title: '현대 투싼 (블라인드 x IM캐피탈)',
              subtitle: '블라인드 x IM캐피탈',
              imageUrl: 'https://cdn.example.com/tucson.png',
              extraInfo: '현대',
              endDate: inDays(12),
              is_active: true,
            },
          ],
        ];
      }
      return [200, [{ id: 200, title: '아우디 A8 연말할인', extraInfo: '아우디', position: 'BOTTOM', is_active: true }]];
    });

    renderWithProviders();

    expect(screen.getByRole('heading', { level: 1, name: '브랜드별 혜택' })).toBeInTheDocument();
    expect(await screen.findByAltText('현대 투싼 (블라인드 x IM캐피탈)')).toHaveAttribute('src', 'https://cdn.example.com/tucson.png');
    expect(screen.getByText('D-12')).toBeInTheDocument();
    expect(screen.getByText('1', { selector: '.pm-listhead__count strong' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: '종료된 기획전' }));

    // 썸네일이 없으면 퍼블리싱 글자 타일로 그린다.
    expect(await screen.findByRole('heading', { level: 3, name: '아우디 A8 연말할인' })).toBeInTheDocument();
    expect(screen.getByText('종료')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '종료된 기획전' })).toHaveAttribute('aria-selected', 'true');
  });

  test('카드를 누르면 기획전 데이터를 들고 상세로 이동한다', async () => {
    mock.onGet('/api/content/promotions/brand').reply(200, [{ id: 100, title: '기아 카니발 기획전', extraInfo: '기아', is_active: true }]);

    renderWithProviders();

    fireEvent.click(await screen.findByRole('link', { name: '기아 카니발 기획전' }));
    expect(await screen.findByText('상세 이동 100')).toBeInTheDocument();
  });

  test('기획전이 없으면 퍼블리싱 빈 목록 문구를 보여준다', async () => {
    mock.onGet('/api/content/promotions/brand').reply(200, []);

    renderWithProviders();

    await waitFor(() => expect(screen.getByText('해당 구분의 기획전을 준비 중입니다.')).toBeInTheDocument());
  });
});
