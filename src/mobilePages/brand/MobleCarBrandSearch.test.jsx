import React from 'react';
import { render, screen, within } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import MobleCarBrandSearch from './MobleCarBrandSearch.jsx';
import { carHttp } from '../../services/carApi.js';

const renderWithProviders = (ui) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('MobleCarBrandSearch', () => {
  let mock;

  beforeAll(() => {
    mock = new MockAdapter(carHttp);
  });

  beforeEach(() => {
    mock.onGet('/api/user/cars/brands').reply(200, [
      { id: 95, name: '현대', country: 'KR' },
      { id: 84, name: '기아', country: '대한민국' },
      { id: 88, name: '벤츠', country: 'IMPORT' },
      { id: 96, name: 'GMC', country: 'IMPORT' },
    ]);
  });

  afterEach(() => mock.reset());
  afterAll(() => mock.restore());

  test('제조사 선택 머리말을 보여 준다', () => {
    renderWithProviders(<MobleCarBrandSearch />);

    expect(screen.getByRole('heading', { level: 1, name: '제조사를 선택해 주세요' })).toBeInTheDocument();
  });

  test('국산차(KR)와 수입차를 나눠 브랜드 검색결과로 연결한다', async () => {
    renderWithProviders(<MobleCarBrandSearch />);

    const hyundai = await screen.findByRole('link', { name: '현대' });
    const domestic = screen.getByRole('heading', { name: '국산차' }).closest('section');
    const imported = screen.getByRole('heading', { name: '수입차' }).closest('section');

    expect(within(domestic).getByRole('link', { name: '기아' })).toBeInTheDocument();
    expect(hyundai).toHaveAttribute('href', `/m/search/results?carOrigin=domestic&brand=${encodeURIComponent('현대')}`);
    expect(within(imported).getByRole('link', { name: '벤츠' })).toHaveAttribute(
      'href',
      `/m/search/results?carOrigin=imported&brand=${encodeURIComponent('벤츠')}`,
    );

    // 퍼블리싱 제조사 로고가 있으면 로고를, 없으면 이름을 표시한다.
    expect(hyundai.querySelector('img')).toHaveAttribute('src', '/bcs/images/manufacturers/hyundai.svg');
    expect(within(imported).getByRole('link', { name: /GMC/ }).querySelector('img')).toBeNull();
  });
});
