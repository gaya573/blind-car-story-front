import React from 'react';
import { render, screen } from '@testing-library/react';
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
      { id: 1, name: '현대', country: '대한민국' },
      { id: 2, name: '기아', country: '대한민국' },
      { id: 3, name: '벤츠', country: '독일' },
      { id: 4, name: 'BMW', country: '독일' },
    ]);
  });

  afterEach(() => mock.reset());
  afterAll(() => mock.restore());

  test('renders brand selection page', () => {
    renderWithProviders(<MobleCarBrandSearch />);

    expect(screen.getByText(/제조사를 선택해주세요/)).toBeInTheDocument();
  });

  test('renders domestic brands', async () => {
    renderWithProviders(<MobleCarBrandSearch />);

    expect(screen.getByText('국내 브랜드')).toBeInTheDocument();
    expect(await screen.findByText('현대')).toBeInTheDocument();
    expect(screen.getByText('기아')).toBeInTheDocument();
  });

  test('renders import brands', async () => {
    renderWithProviders(<MobleCarBrandSearch />);

    expect(screen.getByText('수입 브랜드')).toBeInTheDocument();
    expect(await screen.findByText('벤츠')).toBeInTheDocument();
    expect(screen.getByText('BMW')).toBeInTheDocument();
  });
});















