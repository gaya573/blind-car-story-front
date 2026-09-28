import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import MockAdapter from 'axios-mock-adapter';
import MobileAdvanceAll from './MobileAdvanceAll.jsx';
import { contentHttp } from '../../services/contentApi.js';

const renderWithProviders = (ui) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('MobileAdvanceAll', () => {
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

  test('renders loading state initially', () => {
    mock.onGet('/api/content/inventory').reply(() => new Promise(() => {}));

    renderWithProviders(<MobileAdvanceAll />);

    expect(screen.getByText(/차량 정보를 불러오는 중/)).toBeInTheDocument();
  });

  test('renders hot deals', async () => {
    mock.onGet('/api/content/inventory').reply(200, [
      {
        id: 50,
        title: '선구매 핫딜',
        subtitle: '선구매 전용 할인',
        description: '상세 설명',
        imageUrl: 'https://example.com/image.jpg',
        extraInfo: 'HYUNDAI',
        price: 60,
        stockLeft: 5,
      },
    ]);

    renderWithProviders(<MobileAdvanceAll />);

    await waitFor(() => {
      expect(screen.getByText('선구매 핫딜')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('shows empty state when no data', async () => {
    mock.onGet('/api/content/inventory').reply(200, []);

    renderWithProviders(<MobileAdvanceAll />);

    await waitFor(() => {
      expect(screen.getByText(/재고 특가 차량이 없습니다/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});









