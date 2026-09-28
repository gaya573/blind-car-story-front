import React from 'react';
import { render, screen } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ExpressDealsAll from './ExpressDealsAll.jsx';
import { contentHttp } from '../../services/contentApi.js';

const renderWithProviders = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ExpressDealsAll />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const inDays = (days) => new Date(Date.now() + days * 86400000 - 60000).toISOString();

describe('ExpressDealsAll', () => {
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

  test('전체 재고를 마감 순으로 보여주고 마감된 재고는 뺀다', async () => {
    mock.onGet('/api/content/inventory').reply((config) => {
      expect(config.params).toEqual({ page: 1, limit: 100 });
      return [
        200,
        {
          items: [
            { id: 1, title: '늦은 마감', deadline: inDays(9), endDate: inDays(9) },
            { id: 2, title: '이미 마감', deadline: inDays(-1), endDate: inDays(-1) },
            { id: 3, title: '빠른 마감', deadline: inDays(1), endDate: inDays(1) },
          ],
        },
      ];
    });

    renderWithProviders();

    expect(await screen.findByText('빠른 마감')).toBeInTheDocument();
    const names = screen.getAllByRole('heading', { level: 3 }).map((node) => node.textContent);
    expect(names.slice(0, 2)).toEqual(['빠른 마감', '늦은 마감']);
    expect(screen.queryByText('이미 마감')).not.toBeInTheDocument();
    expect(screen.getByText('D-1')).toBeInTheDocument();
    // 하단 상담 배너의 개인정보 동의는 기본 해제
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });
});
