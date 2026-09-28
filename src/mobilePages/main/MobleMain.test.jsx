import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import MockAdapter from 'axios-mock-adapter';
import MobleMain from './MobleMain.jsx';
import { contentHttp } from '../../services/contentApi.js';
import { BcsUiProvider } from '../../bcs/BcsUiContext.jsx';
import { submitConsult } from '../../services/consultHelper';

jest.mock('../../services/consultHelper', () => ({
  submitConsult: jest.fn(() => Promise.resolve({ success: true })),
}));

const renderWithProviders = (ui) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/m']}>
        <BcsUiProvider>{ui}</BcsUiProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const page = (items) => [200, { items, pagination: { page: 1, size: items.length, totalElements: items.length, totalPages: 1 } }];

const inDays = (days) => new Date(Date.now() + days * 86400000).toISOString();

describe('MobleMain (퍼블리싱 모바일 메인)', () => {
  let content;

  beforeAll(() => {
    content = new MockAdapter(contentHttp);
  });

  afterEach(() => {
    content.reset();
    jest.clearAllMocks();
  });

  afterAll(() => {
    content.restore();
  });

  test('제휴 배너·마감임박·재고특가·유튜브·출고후기 API 데이터를 퍼블리싱 섹션에 채운다', async () => {
    content.onGet('/api/coalition/BLINDCAR/contents').reply((config) => {
      if (config.params.contentType === 'YOUTUBE') {
        return [200, [{ id: 3, contentType: 'YOUTUBE', title: '유튜브 영상', youtubeUrl: 'https://youtu.be/abcdefghijk', active: true }]];
      }
      return [200, [{ id: 8, contentType: 'BANNER', imageUrl: 'https://cdn.example.com/main.png', title: '메인 배너', active: true }]];
    });
    content.onGet('/api/content/main-page/closing-soon').reply(() =>
      page([
        {
          id: 10,
          title: '마감 임박 차량',
          subtitle: '모던 하이브리드',
          extraInfo: '현대',
          trimId: 1,
          deadline: inDays(5),
          basePrice: 32700000,
          lowest_prepayment_30_monthly_fee: 237110,
        },
      ]),
    );
    content.onGet('/api/content/inventory').reply(() =>
      page([
        { id: 20, cardType: 'PROMOTION_EVENT', title: '프로모션 이벤트 차량', trimId: 2 },
        { id: 21, cardType: 'HOTDEAL', title: '재고 특가 차량', extraInfo: '기아', trimId: 3, lowest_no_deposit_monthly_fee: 453590 },
      ]),
    );
    content.onGet('/api/content/main-page/reviews').reply(() =>
      page([{ id: 57, title: '모델3 전기차 출고기', description: '상담이 친절했습니다.', authorName: '박미영', imageUrl: 'https://cdn.example.com/r.jpg' }]),
    );

    renderWithProviders(<MobleMain />);

    await waitFor(() => expect(screen.getByAltText('메인 배너')).toHaveAttribute('src', 'https://cdn.example.com/main.png'));

    const closing = await screen.findByText('마감 임박 차량');
    const closingCard = closing.closest('.m-vehicle');
    expect(closingCard).toHaveClass('m-vehicle--closing');
    expect(within(closingCard).getByText(/^D-\d+$/)).toBeInTheDocument();
    expect(within(closingCard).getByText('237,110')).toBeInTheDocument();
    expect(within(closingCard).getByText('32,700,000원~')).toBeInTheDocument();

    const hotDeal = (await screen.findByText('재고 특가 차량')).closest('.m-vehicle');
    expect(within(hotDeal).getByText('재고 특가')).toBeInTheDocument();
    expect(within(hotDeal).getByText('453,590')).toBeInTheDocument();
    expect(screen.queryByText('프로모션 이벤트 차량')).not.toBeInTheDocument();

    expect(await screen.findByText('유튜브 영상')).toBeInTheDocument();
    // 출고후기는 무한 슬라이드를 위해 두 벌 그리고, 두 번째 묶음은 스크린리더에서 숨긴다.
    expect(await screen.findAllByText('모델3 전기차 출고기')).toHaveLength(2);
    expect(document.querySelectorAll('.review-card[aria-hidden="true"]')).toHaveLength(1);

    // 상담 통계는 API가 없어 자리표시를 유지하고, 개인정보 동의는 기본 해제다.
    expect(screen.getAllByText('정보 준비중').length).toBeGreaterThanOrEqual(3);
    expect(screen.getByLabelText('개인정보 이용 동의')).not.toBeChecked();
    expect(document.querySelectorAll('#partners .m-slider-dot')).toHaveLength(4);
  });

  test('배너·후기가 없으면 퍼블리싱 기본 배너와 자리표시 후기를 보여주고 빈 섹션은 숨긴다', async () => {
    content.onGet(/.*/).reply((config) => (config.url.startsWith('/api/coalition') ? [200, []] : page([])));

    renderWithProviders(<MobleMain />);

    await waitFor(() => expect(document.querySelector('.m-hero__image')).toHaveAttribute('src', '/bcs/images/banner/hero-mobile.png'));
    expect(await screen.findAllByText('출고후기 준비중')).toHaveLength(4);
    expect(document.querySelector('#closing-soon')).toBeNull();
    expect(document.querySelector('#hot-deals')).toBeNull();
    expect(document.querySelector('#youtube')).toBeNull();
    expect(screen.getByRole('link', { name: /현대 · 기아 · 제네시스/ })).toHaveAttribute('href', '/m/search/results?carOrigin=domestic');
    expect(screen.getByRole('link', { name: /벤츠 · BMW · 아우디/ })).toHaveAttribute('href', '/m/search/results?carOrigin=imported');
  });

  test('비교견적 폼은 개인정보 동의 후 선택한 상품과 함께 상담을 접수한다', async () => {
    content.onGet(/.*/).reply((config) => (config.url.startsWith('/api/coalition') ? [200, []] : page([])));

    renderWithProviders(<MobleMain />);

    fireEvent.change(screen.getByPlaceholderText('숫자만 입력해주세요'), { target: { value: '01012345678' } });
    fireEvent.click(screen.getByRole('button', { name: '실시간 비교견적 받기' }));
    expect(await screen.findByText('개인정보 이용 동의에 체크해 주세요.', { selector: '.form-error' })).toBeInTheDocument();
    expect(submitConsult).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText('리스'));
    fireEvent.click(screen.getByLabelText('개인정보 이용 동의'));
    fireEvent.click(screen.getByRole('button', { name: '실시간 비교견적 받기' }));

    await waitFor(() => expect(submitConsult).toHaveBeenCalledTimes(1));
    expect(submitConsult.mock.calls[0][0]).toEqual(
      expect.objectContaining({ phone: '01012345678', source: 'mobile-main-quote-form', entryLabel: '모바일 메인 비교견적 · 리스' }),
    );
  });
});
