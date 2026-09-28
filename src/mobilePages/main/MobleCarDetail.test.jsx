import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MockAdapter from 'axios-mock-adapter';
import MobleCarDetail from './MobleCarDetail.jsx';
import { carHttp } from '../../services/carApi.js';
import { BcsUiProvider } from '../../bcs/BcsUiContext.jsx';

const renderWithProviders = (route = '/m/car-detail/995?trimId=2') => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <BcsUiProvider>
          <Routes>
            <Route path="/m/car-detail/:carId" element={<MobleCarDetail />} />
          </Routes>
        </BcsUiProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const detailOf = (trim) => ({
  name: '투싼 하이브리드',
  brandName: '현대',
  brandCountry: 'KR',
  vehicleLineId: 995,
  imageUrl: 'https://cdn.example.com/tucson.png',
  trims: [
    {
      ...trim,
      options: [{ id: 77, name: '하이패스', price: 200000 }],
      colors: [
        { id: 5, name: '크리미 화이트 펄', hexCode: 'F2F1EE', vehicleInterior: false },
        { id: 6, name: '블랙 인테리어', hexCode: '111111', vehicleInterior: true },
      ],
    },
  ],
});

describe('MobleCarDetail (퍼블리싱 m-car-detail)', () => {
  let mock;

  beforeAll(() => {
    mock = new MockAdapter(carHttp);
  });

  beforeEach(() => {
    // 상세 화면은 선택 내용을 주소창(history.replaceState)에 남기고 다음 진입 때 복원하므로 테스트마다 비운다.
    window.history.replaceState(null, '', '/');
    mock.onGet('/api/user/cars/models').reply(200, [
      { id: 10, name: '투싼 가솔린' },
      { id: 11, name: '투싼 하이브리드' },
    ]);
    mock.onGet('/api/user/cars/trims').reply((config) => {
      if (config.params?.modelId === 10) return [200, [{ id: 1, name: '모던', basePrice: 28050000 }]];
      return [
        200,
        [
          { id: 2, name: '모던 HEV', basePrice: 32700000, originalPrice: 34220000 },
          { id: 3, name: '프리미엄 HEV', basePrice: 35000000 },
        ],
      ];
    });
    mock.onGet('/api/user/cars/2/detail').reply(200, detailOf({ id: 2, name: '모던 HEV', basePrice: 32700000, originalPrice: 34220000 }));
    mock.onGet('/api/user/cars/3/detail').reply(200, detailOf({ id: 3, name: '프리미엄 HEV', basePrice: 35000000 }));
  });

  afterEach(() => {
    mock.reset();
  });

  afterAll(() => {
    mock.restore();
  });

  test('불러오는 동안 안내 문구를 보여 준다', () => {
    mock.reset();
    mock.onGet('/api/user/cars/models').reply(() => new Promise(() => {}));

    renderWithProviders();

    expect(screen.getByText(/차량 정보를 불러오는 중/)).toBeInTheDocument();
  });

  test('트림·색상·옵션·계약조건을 퍼블리싱 블록으로 그리고 견적서 금액을 계산한다', async () => {
    const { container } = renderWithProviders();

    expect(await screen.findByRole('heading', { level: 1, name: '투싼 하이브리드' })).toBeInTheDocument();
    expect(screen.getByText('현대')).toBeInTheDocument();
    expect(screen.getByText('국산차')).toHaveClass('m-cd-origin');

    // 외장 색상만 스와치로 보여 주고 첫 색상을 고른다.
    const swatches = container.querySelectorAll('.m-cd-swatch');
    expect(swatches).toHaveLength(1);
    expect(swatches[0]).toHaveClass('is-selected');
    expect(screen.getAllByText('크리미 화이트 펄').length).toBeGreaterThan(0);

    // 선택한 트림은 체크 표시, 가격은 세제혜택 반영가(basePrice)
    const selectedTrim = screen.getByRole('button', { name: /모던 HEV/ });
    expect(selectedTrim).toHaveClass('m-cd-trim', 'is-active');
    expect(within(selectedTrim).getByText('32,700,000원')).toBeInTheDocument();

    const total = container.querySelector('.m-cd-sum--total strong');
    expect(total).toHaveTextContent('32,700,000원');
    expect(container.querySelector('.m-cd-bar__price strong')).toHaveTextContent('32,700,000원');

    // 옵션을 고르면 견적서와 하단 바 합계에 더해진다.
    fireEvent.click(screen.getByRole('button', { name: /하이패스/ }));
    const optionSum = screen.getByText('하이패스', { selector: '.m-cd-sum span' }).closest('.m-cd-sum');
    expect(optionSum).toHaveTextContent('+200,000원');
    expect(total).toHaveTextContent('32,900,000원');
    expect(container.querySelector('.m-cd-bar__price strong')).toHaveTextContent('32,900,000원');

    // 다른 모델 그룹은 접혀 있다가 펼칠 수 있다.
    expect(screen.queryByRole('button', { name: /^모던\s/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /투싼 가솔린/ }));
    expect(screen.getByRole('button', { name: /^모던\s*28,050,000원$/ })).toBeInTheDocument();
  });

  test('다른 트림을 고르면 견적서 트림과 금액이 바뀐다', async () => {
    const { container } = renderWithProviders();
    await screen.findByRole('heading', { level: 1, name: '투싼 하이브리드' });

    fireEvent.click(screen.getByRole('button', { name: /프리미엄 HEV/ }));

    await waitFor(() => expect(container.querySelector('.m-cd-sum--total strong')).toHaveTextContent('35,000,000원'));
    expect(container.querySelector('.m-cd-sum span')).toHaveTextContent('프리미엄 HEV');
  });

  test('보증금과 선납금 합계가 40%를 넘으면 토스트로 막는다', async () => {
    renderWithProviders();
    await screen.findByRole('heading', { level: 1, name: '투싼 하이브리드' });

    const depositRow = screen.getByText('보증금', { selector: '.m-cd-row__label' }).closest('.m-cd-row');
    fireEvent.click(within(depositRow).getByRole('button', { name: '30%' }));

    expect(screen.getByRole('status')).toHaveTextContent('보증금과 선납금의 합계는 40%를 넘을 수 없습니다.');
    expect(within(depositRow).getByRole('button', { name: '없음' })).toHaveClass('is-active');
  });

  test('실시간 견적받기는 선택한 차량으로 견적 모달을 연다', async () => {
    renderWithProviders();
    await screen.findByRole('heading', { level: 1, name: '투싼 하이브리드' });

    fireEvent.click(screen.getByRole('button', { name: '실시간 견적받기' }));

    expect(document.querySelector('.qm-overlay')).toHaveClass('is-open');
    await waitFor(() => expect(screen.getByLabelText('차종')).toHaveValue('현대 투싼 하이브리드 · 모던 HEV'));
  });

  test('하단 고정 바 여백용 body 클래스를 붙였다가 떠나면 뗀다', async () => {
    const { unmount } = renderWithProviders();
    await screen.findByRole('heading', { level: 1, name: '투싼 하이브리드' });
    expect(document.body).toHaveClass('has-cd-bar');

    unmount();
    expect(document.body).not.toHaveClass('has-cd-bar');
  });
});
