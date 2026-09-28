import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CarLineDetail from './CarLineDetail.jsx';
import { carHttp } from '../../services/carApi.js';
import { BcsUiProvider } from '../../bcs/BcsUiContext.jsx';
import { submitConsult } from '../../services/consultHelper';
import { getStoredUserPhone } from '../../utils/phoneStorage';

jest.mock('../../services/consultHelper', () => ({ submitConsult: jest.fn() }));
jest.mock('../../utils/phoneStorage', () => ({ getStoredUserPhone: jest.fn() }));

const renderWithProviders = (route = '/car-detail/car/887') => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <BcsUiProvider>
          <Routes>
            <Route path="/car-detail/car/:carId" element={<CarLineDetail />} />
          </Routes>
        </BcsUiProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const gasolineTrims = [
  { id: 6525, name: '2.0 투어링 320i', basePrice: 62400000, discountInfo: { discountType: 'FIXED_AMOUNT', discountValue: 12000000 } },
  { id: 6516, name: '2.0 세단 320i M Sport', basePrice: 64900000 },
];
const dieselTrims = [{ id: 7001, name: '2.0 세단 320d', basePrice: 62700000 }];

const detailFor = (id) => ({
  id,
  name: id === 7001 ? '3 Series 디젤' : '3 Series 가솔린',
  brandName: 'BMW',
  brandCountry: 'IMPORT',
  imageUrl: `https://cdn.example.com/${id}.png`,
  trims: [...gasolineTrims, ...dieselTrims].map((trim) => ({
    ...trim,
    options: [],
    colors: [
      { id: 1, name: 'Alpine White', hexCode: '#EAEAEA', vehicleInterior: false },
      { id: 2, name: 'Black', hexCode: '#282828', vehicleInterior: true },
    ],
  })),
});

describe('CarLineDetail (퍼블리싱 차량 상세 · 차량 라인)', () => {
  let mock;

  beforeAll(() => {
    mock = new MockAdapter(carHttp);
  });

  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    submitConsult.mockReset();
    getStoredUserPhone.mockReset();
    getStoredUserPhone.mockReturnValue('');
    mock.onGet('/api/user/cars/models').reply((config) => {
      expect(config.params).toEqual({ vehicleLineId: 887 });
      return [200, [{ id: 1555, name: '3 Series 가솔린' }, { id: 1556, name: '3 Series 디젤' }]];
    });
    mock.onGet('/api/user/cars/trims').reply((config) => [200, config.params.modelId === 1555 ? gasolineTrims : dieselTrims]);
    mock.onGet(/\/api\/user\/cars\/\d+\/detail$/).reply((config) => [200, detailFor(Number(config.url.split('/')[4]))]);
  });

  afterEach(() => {
    mock.reset();
  });

  afterAll(() => {
    mock.restore();
  });

  test('모델 선택 줄과 선택한 모델의 트림을 보여주고, 수입차 할인·할부 조건을 반영한다', async () => {
    const { container } = renderWithProviders();

    expect(await screen.findByRole('heading', { level: 1, name: '3 Series 가솔린' })).toBeInTheDocument();
    const tabs = container.querySelector('.cd-model-tabs');
    expect(within(tabs).getByRole('button', { name: '3 Series 가솔린' })).toHaveClass('is-active');
    expect(container.querySelectorAll('.cd-trim')).toHaveLength(2);

    await waitFor(() => expect(container.querySelector('.cd-origin')).toHaveTextContent('수입차'));
    expect(container.querySelector('.cd-price-row--final')).toHaveTextContent('50,400,000원');
    expect(container.querySelector('.cd-est-total strong')).toHaveTextContent('50,400,000원');
    // 외장색이 있으면 실내색은 칩에서 뺀다.
    expect(screen.getByRole('button', { name: 'Alpine White' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Black' })).not.toBeInTheDocument();

    // 수입차는 24개월 대신 일시불, 신차구입(할부)을 고르면 할부기간·이자율 안내로 바뀐다.
    expect(screen.getByRole('button', { name: '일시불' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '신차구입(할부)' }));
    expect(screen.getByText('할부기간')).toBeInTheDocument();
    expect(screen.getByText(/기준 이자율 4.9%/)).toBeInTheDocument();

    fireEvent.click(within(tabs).getByRole('button', { name: '3 Series 디젤' }));
    expect(container.querySelectorAll('.cd-trim')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /2.0 세단 320d/ }));
    await waitFor(() => expect(container.querySelector('.cd-hierarchy')).toHaveTextContent('3 Series 디젤 → 2.0 세단 320d'));
    expect(container.querySelector('.cd-est-total strong')).toHaveTextContent('62,700,000원');
  });

  test('차량 라인 상세 출처로 상담을 접수한다', async () => {
    submitConsult.mockResolvedValue({ success: true });
    const { container } = renderWithProviders();
    await screen.findByRole('heading', { level: 1, name: '3 Series 가솔린' });
    await waitFor(() => expect(container.querySelector('.cd-origin')).toHaveTextContent('수입차'));

    fireEvent.click(container.querySelector('#cd-privacy'));
    fireEvent.click(container.querySelector('.cd-estimate__cta'));
    const dialog = await screen.findByRole('dialog', { name: '실시간 견적 받기' });
    fireEvent.change(within(dialog).getByLabelText(/휴대폰 번호/), { target: { value: '01012345678' } });
    fireEvent.click(within(dialog).getByRole('button', { name: '실시간 무료견적 받기' }));

    await waitFor(() => expect(submitConsult).toHaveBeenCalledTimes(1));
    expect(submitConsult.mock.calls[0][0]).toMatchObject({
      brand: 'BMW',
      model: '3 Series 가솔린',
      trim: '2.0 투어링 320i',
      color: 'Alpine White',
      consultType: '차량라인상세',
      source: 'car-line-detail',
      entryLabel: '차량 라인 상세 > 3 Series 가솔린',
      extra: expect.objectContaining({ vehicleLineId: 887, trimId: '6525' }),
    });
  });

  test('모델이 없으면 오류 문구를 보여준다', async () => {
    mock.reset();
    mock.onGet('/api/user/cars/models').reply(200, []);

    renderWithProviders();

    expect(await screen.findByText(/차량 정보를 불러오지 못했습니다/)).toBeInTheDocument();
  });
});
