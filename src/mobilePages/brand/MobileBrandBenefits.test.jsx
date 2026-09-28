import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import MobileBrandBenefits from './MobileBrandBenefits.jsx';
import { contentHttp } from '../../services/contentApi.js';
import { BcsUiProvider } from '../../bcs/BcsUiContext.jsx';

const renderWithProviders = (ui) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/m/brand']}>
        <BcsUiProvider>{ui}</BcsUiProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const page = (items) => [200, { items, pagination: { page: 1, size: items.length, totalElements: items.length, totalPages: 1 } }];
const daysLater = (days) => new Date(Date.now() + days * 86400000).toISOString();

describe('MobileBrandBenefits (퍼블리싱 m-brand)', () => {
  let mock;

  beforeAll(() => {
    mock = new MockAdapter(contentHttp);
  });

  beforeEach(() => {
    mock.onGet('/api/content/promotions/brand').reply((config) => {
      if (config.params.position === 'TOP') {
        return page([
          {
            id: 83,
            position: 'TOP',
            title: '현대 투싼 (블라인드 카스토리 x IM캐피탈)',
            subtitle: '블라인드 카스토리 x IM캐피탈',
            extraInfo: '현대',
            imageUrl: 'https://cdn.example.com/tucson-banner.png',
            startDate: '2026-08-06T08:17:00',
            endDate: daysLater(22.5),
          },
        ]);
      }
      return page([
        { id: 86, position: 'BOTTOM', title: '아우디 A8 연말할인', extraInfo: '아우디', startDate: '2025-12-05T05:21:00', endDate: '2026-01-09T14:59:00' },
      ]);
    });
  });

  afterEach(() => mock.reset());
  afterAll(() => mock.restore());

  test('진행중 기획전을 배너 타일·제목·기간으로 보여 주고 상세로 연결한다', async () => {
    renderWithProviders(<MobileBrandBenefits />);

    expect(screen.getByRole('heading', { level: 1, name: '브랜드별 특가 혜택' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '진행중 기획전' })).toHaveAttribute('aria-selected', 'true');

    const title = await screen.findByText('현대 투싼 (블라인드 카스토리 x IM캐피탈)');
    const card = title.closest('a');
    expect(card).toHaveClass('m-promo');
    expect(card).toHaveAttribute('href', '/m/brand/detail/83');
    expect(screen.getByText('진행중 · D-23')).toBeInTheDocument();
    expect(screen.getByAltText('현대 투싼 (블라인드 카스토리 x IM캐피탈)')).toHaveAttribute('src', 'https://cdn.example.com/tucson-banner.png');
    expect(screen.getByText(/^2026\.08\.06 ~ /)).toBeInTheDocument();
  });

  test('종료된 기획전 탭은 BOTTOM 기획전을 종료 표시로 보여 준다', async () => {
    renderWithProviders(<MobileBrandBenefits />);
    await screen.findByText('현대 투싼 (블라인드 카스토리 x IM캐피탈)');

    fireEvent.click(screen.getByRole('tab', { name: '종료된 기획전' }));

    const title = await screen.findByText('아우디 A8 연말할인');
    expect(title.closest('a')).toHaveClass('m-promo', 'is-ended');
    expect(screen.getByText('종료')).toBeInTheDocument();
    expect(screen.getByText('2025.12.05 ~ 2026.01.09')).toBeInTheDocument();
  });

  test('기획전이 없으면 빈 안내, 하단 버튼은 견적 모달을 연다', async () => {
    mock.reset();
    mock.onGet('/api/content/promotions/brand').reply(() => page([]));

    renderWithProviders(<MobileBrandBenefits />);

    expect(await screen.findByText('현재 진행 중인 기획전이 없습니다.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '실시간 무료견적 받기' }));
    await waitFor(() => expect(document.querySelector('.qm-overlay')).toHaveClass('is-open'));
  });
});
