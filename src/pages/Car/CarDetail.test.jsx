import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CarTrimDetail from './CarTrimDetail.jsx';
import { carHttp } from '../../services/carApi.js';
import { BcsUiProvider } from '../../bcs/BcsUiContext.jsx';
import { submitConsult } from '../../services/consultHelper';
import { getStoredUserPhone } from '../../utils/phoneStorage';

jest.mock('../../services/consultHelper', () => ({ submitConsult: jest.fn() }));
jest.mock('../../utils/phoneStorage', () => ({ getStoredUserPhone: jest.fn() }));

const renderWithProviders = (route = '/car-detail/trim/1') => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <BcsUiProvider>
          <Routes>
            <Route path="/car-detail/trim/:trimId" element={<CarTrimDetail />} />
          </Routes>
        </BcsUiProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const detailResponse = {
  id: 1,
  name: 'EV6 롱레인지',
  brandName: '기아',
  brandCountry: 'KR',
  vehicleLineId: 10,
  imageUrl: 'https://cdn.example.com/ev6.png',
  trims: [
    {
      id: 1,
      name: 'EV6 롱레인지 AWD',
      basePrice: 55000000,
      options: [{ id: 201, name: '선루프 패키지', price: 1500000, discountedPrice: 1200000 }],
      colors: [
        { id: 301, name: '크리미 화이트', hexCode: '#F5F5F5', additionalPrice: 0 },
        { id: 302, name: '어비스 블랙', hexCode: '#1A1A1A', additionalPrice: 100000 },
      ],
    },
    {
      id: 2,
      name: 'EV6 롱레인지 2WD',
      basePrice: 52000000,
      discountInfo: { discountType: 'FIXED_AMOUNT', discountValue: 2000000 },
      options: [],
      colors: [],
    },
  ],
};

describe('CarTrimDetail (퍼블리싱 차량 상세)', () => {
  let mock;

  beforeAll(() => {
    mock = new MockAdapter(carHttp);
  });

  beforeEach(() => {
    // 상세 페이지는 선택 상태를 window.location 쿼리에 남기고(공유 URL) 다음 진입 때 복원한다.
    window.history.replaceState(null, '', '/');
    submitConsult.mockReset();
    getStoredUserPhone.mockReset();
    getStoredUserPhone.mockReturnValue('');
  });

  afterEach(() => {
    mock.reset();
  });

  afterAll(() => {
    mock.restore();
  });

  test('트림·색상·옵션을 퍼블리싱 상세 화면에 그린다', async () => {
    mock.onGet('/api/user/cars/1/detail').reply(200, detailResponse);

    const { container } = renderWithProviders();

    expect(await screen.findByRole('heading', { level: 1, name: 'EV6 롱레인지' })).toBeInTheDocument();
    expect(container.querySelector('.bcs-page-car-detail .cd-layout')).not.toBeNull();
    expect(container.querySelector('.cd-hierarchy')).toHaveTextContent('EV6 롱레인지 → EV6 롱레인지 AWD장기렌트 · 48개월 · 선납금 30% · 20,000km');
    expect(container.querySelector('.cd-origin')).toHaveTextContent('국산차');
    expect(container.querySelector('.cd-brand__mark img')).toHaveAttribute('src', '/bcs/images/manufacturers/kia.svg');
    expect(screen.getByRole('button', { name: /EV6 롱레인지 AWD/ })).toHaveClass('is-active');
    expect(screen.getAllByText('55,000,000원').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: '크리미 화이트' })).toHaveClass('is-selected');
    expect(screen.getByRole('button', { name: /선루프 패키지/ })).toHaveTextContent('+1,200,000원');
    // 국산차는 신차구입(할부)을 고를 수 없다.
    expect(screen.queryByRole('button', { name: '신차구입(할부)' })).not.toBeInTheDocument();
  });

  test('옵션·색상·할인을 견적서 합계에 반영한다', async () => {
    mock.onGet('/api/user/cars/1/detail').reply(200, detailResponse);

    const { container } = renderWithProviders();
    await screen.findByRole('heading', { level: 1, name: 'EV6 롱레인지' });
    const total = () => container.querySelector('.cd-est-total strong');

    fireEvent.click(screen.getByRole('button', { name: /선루프 패키지/ }));
    fireEvent.click(screen.getByRole('button', { name: '어비스 블랙' }));
    // 55,000,000 + 옵션 1,200,000 + 색상 100,000
    expect(total()).toHaveTextContent('56,300,000원');

    fireEvent.click(screen.getByRole('button', { name: /EV6 롱레인지 2WD/ }));
    // 52,000,000 - 즉시할인 2,000,000 (트림을 바꾸면 옵션·색상은 초기화)
    await waitFor(() => expect(total()).toHaveTextContent('50,000,000원'));
    expect(container.querySelector('.cd-est-block--discount')).toHaveTextContent('-2,000,000원');
    expect(container.querySelector('.cd-price-row--final')).toHaveTextContent('50,000,000원');
  });

  test('보증금과 선납금 합계 40% 를 넘기면 선택하지 않고 안내한다', async () => {
    mock.onGet('/api/user/cars/1/detail').reply(200, detailResponse);

    renderWithProviders();
    await screen.findByRole('heading', { level: 1, name: 'EV6 롱레인지' });

    const depositRow = screen.getByText('보증금', { selector: '.cd-contract-row__label' }).parentElement;
    fireEvent.click(within(depositRow).getByRole('button', { name: '20%' }));
    expect(within(depositRow).getByRole('button', { name: '없음' })).toHaveClass('is-active');
    expect(screen.getByRole('status', { name: '' })).toHaveTextContent('보증금과 선납금은 합계 40%까지 선택할 수 있습니다.');

    fireEvent.click(within(depositRow).getByRole('button', { name: '10%' }));
    expect(within(depositRow).getByRole('button', { name: '10%' })).toHaveClass('is-active');

    // 리스를 고르면 자동차세 줄이 생기고 보험 연령 줄은 빠진다.
    fireEvent.click(screen.getByRole('button', { name: '리스' }));
    expect(screen.getByText('자동차세')).toBeInTheDocument();
    expect(screen.queryByText('보험 연령')).not.toBeInTheDocument();
  });

  test('동의 후 연락처를 받아 선택한 조건으로 상담을 접수한다', async () => {
    mock.onGet('/api/user/cars/1/detail').reply(200, detailResponse);
    submitConsult.mockResolvedValue({ success: true });

    const { container } = renderWithProviders();
    await screen.findByRole('heading', { level: 1, name: 'EV6 롱레인지' });
    fireEvent.click(screen.getByRole('button', { name: /선루프 패키지/ }));

    const cta = container.querySelector('.cd-estimate__cta');
    fireEvent.click(cta);
    expect(container.querySelector('.cd-estimate .form-error')).toHaveTextContent('개인정보 이용 동의에 체크해 주세요.');
    expect(submitConsult).not.toHaveBeenCalled();

    fireEvent.click(container.querySelector('#cd-privacy'));
    fireEvent.click(cta);
    const dialog = await screen.findByRole('dialog', { name: '실시간 견적 받기' });
    expect(container.querySelector('.qm-overlay.is-open .cd-contact')).not.toBeNull();

    fireEvent.change(within(dialog).getByLabelText('이름'), { target: { value: '홍길동' } });
    fireEvent.change(within(dialog).getByLabelText(/휴대폰 번호/), { target: { value: '010-1234-5678' } });
    fireEvent.click(within(dialog).getByRole('button', { name: '실시간 무료견적 받기' }));

    await waitFor(() => expect(submitConsult).toHaveBeenCalledTimes(1));
    const [payload] = submitConsult.mock.calls[0];
    expect(payload).toMatchObject({
      name: '홍길동',
      phone: '01012345678',
      brand: '기아',
      model: 'EV6 롱레인지',
      trim: 'EV6 롱레인지 AWD',
      color: '크리미 화이트',
      options: ['색상: 크리미 화이트', '선루프 패키지'],
      terms: ['장기렌탈', '48개월', '선납금 30%', '20,000km'],
      consultType: '트림상세',
      source: 'car-trim-detail',
      entryLabel: '차량 상세 > EV6 롱레인지',
    });
    expect(payload.extra).toMatchObject({ vehicleLineId: 10, trimId: '1', contractMethod: '장기렌탈', insuranceAge: '만 26세이상' });
    await waitFor(() => expect(container.querySelector('.qm-overlay.is-open .cd-contact')).toBeNull());
  });

  test('저장된 연락처가 있으면 모달 없이 바로 접수한다', async () => {
    mock.onGet('/api/user/cars/1/detail').reply(200, detailResponse);
    getStoredUserPhone.mockReturnValue('01099998888');
    submitConsult.mockResolvedValue({ success: false, message: '접수 실패' });

    const { container } = renderWithProviders();
    await screen.findByRole('heading', { level: 1, name: 'EV6 롱레인지' });

    fireEvent.click(container.querySelector('#cd-privacy'));
    fireEvent.click(container.querySelector('.cd-estimate__cta'));

    await waitFor(() => expect(submitConsult).toHaveBeenCalledTimes(1));
    expect(submitConsult.mock.calls[0][0].phone).toBe('01099998888');
    expect(container.querySelector('.qm-overlay.is-open .cd-contact')).toBeNull();
    await waitFor(() => expect(container.querySelector('.cd-estimate .form-error')).toHaveTextContent('접수 실패'));
  });

  test('로딩 중 문구를 보여준다', () => {
    mock.onGet('/api/user/cars/1/detail').reply(() => new Promise(() => {}));

    renderWithProviders();

    expect(screen.getByText('차량 정보를 불러오는 중입니다...')).toBeInTheDocument();
  });

  test('불러오지 못하면 오류 문구를 보여준다', async () => {
    mock.onGet('/api/user/cars/1/detail').reply(404);

    renderWithProviders();

    expect(await screen.findByText(/차량 정보를 불러오지 못했습니다/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이전 페이지로 돌아가기' })).toBeInTheDocument();
  });
});
