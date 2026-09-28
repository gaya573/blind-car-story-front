import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home.jsx';
import { contentHttp } from '../../services/contentApi.js';
import { carHttp } from '../../services/carApi.js';
import { BcsUiProvider } from '../../bcs/BcsUiContext.jsx';

const renderWithProviders = (ui) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <BcsUiProvider>{ui}</BcsUiProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const page = (items) => [200, { items, pagination: { page: 1, size: items.length, totalElements: items.length, totalPages: 1 } }];

describe('Home page (퍼블리싱 메인)', () => {
  let content;
  let cars;

  beforeAll(() => {
    content = new MockAdapter(contentHttp);
    cars = new MockAdapter(carHttp);
  });

  afterEach(() => {
    content.reset();
    cars.reset();
  });

  afterAll(() => {
    content.restore();
    cars.restore();
  });

  test('제휴 메인 배너와 콘텐츠 API 데이터를 퍼블리싱 섹션에 채운다', async () => {
    content.onGet('/api/coalition/BLINDCAR/contents').reply((config) => {
      if (config.params.contentType === 'YOUTUBE') {
        return [200, [{ id: 3, contentType: 'YOUTUBE', title: '유튜브 영상', youtubeUrl: 'https://youtu.be/abcdefghijk', active: true }]];
      }
      expect(config.params).toEqual({ pageType: 'MAIN', contentType: 'BANNER' });
      return [200, [{ id: 8, contentType: 'BANNER', imageUrl: 'https://cdn.example.com/main.png', title: '메인 배너', active: true }]];
    });
    content.onGet('/api/content/main-page/closing-soon').reply(() =>
      page([{ id: 10, title: '마감 임박 차량', subtitle: '곧 마감됩니다', extraInfo: '기아', trimId: 1, lowest_prepayment_30_monthly_fee: 237110 }]),
    );
    content.onGet('/api/content/main-page/top-cars').reply(() => page([{ id: 20, rank: 1, title: '주간 인기 차량', trimId: 2 }]));
    content.onGet('/api/content/pre-purchase').reply(() => page([{ id: 40, title: '특가 차량', trimId: 3 }]));
    content.onGet(/.*/).reply(() => page([]));
    cars.onGet('/api/user/cars/brands').reply(200, [{ id: 95, name: '현대' }]);

    renderWithProviders(<Home />);

    await waitFor(() => expect(screen.getByAltText('메인 배너')).toHaveAttribute('src', 'https://cdn.example.com/main.png'));
    expect(await screen.findByText('마감 임박 차량')).toBeInTheDocument();
    expect(screen.getByText('237,110')).toBeInTheDocument();
    expect(await screen.findByText('주간 인기 차량')).toBeInTheDocument();
    expect(await screen.findByText('특가 차량')).toBeInTheDocument();
    expect(await screen.findByText('유튜브 영상')).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: '현대' })).toBeInTheDocument();

    // 예시 수치에는 예시 표기를, 개인정보 동의는 기본 해제를 유지한다.
    expect(screen.getByText('동일 조건 비교 예시')).toBeInTheDocument();
    screen.getAllByRole('checkbox').forEach((checkbox) => expect(checkbox).not.toBeChecked());
  });

  test('제휴 메인 배너가 없으면 퍼블리싱 기본 배너를 보여준다', async () => {
    content.onGet(/.*/).reply((config) => (config.url.startsWith('/api/coalition') ? [200, []] : page([])));
    cars.onGet(/.*/).reply(200, []);

    renderWithProviders(<Home />);

    await waitFor(() =>
      expect(document.querySelector('.hero-slide--fit img')).toHaveAttribute('src', '/bcs/images/banner/hero-main.png'),
    );
    expect(document.querySelector('.closing-section')).toBeNull();
  });
});
