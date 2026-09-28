import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MobleCarSearch from './MobleCarSearch.jsx';
import { BcsUiProvider } from '../../bcs/BcsUiContext.jsx';

jest.mock('../../services/consultHelper', () => ({ submitConsult: jest.fn() }));

const renderWithProviders = () =>
  render(
    <MemoryRouter initialEntries={['/m/search']}>
      <BcsUiProvider>
        <MobleCarSearch />
      </BcsUiProvider>
    </MemoryRouter>,
  );

describe('MobleCarSearch (퍼블리싱 m-search)', () => {
  test('브랜드 선택 화면을 그린다', () => {
    renderWithProviders();

    expect(screen.getByRole('heading', { name: '어떤 차를 찾으세요?' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '국산차' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '수입차' })).toBeInTheDocument();
  });

  test('브랜드를 누르면 국산/수입 구분과 브랜드 이름으로 검색결과에 간다', () => {
    renderWithProviders();

    expect(screen.getByRole('link', { name: '현대' })).toHaveAttribute('href', `/m/search/results?carOrigin=domestic&brand=${encodeURIComponent('현대')}`);
    expect(screen.getByRole('link', { name: 'BMW' })).toHaveAttribute('href', '/m/search/results?carOrigin=imported&brand=BMW');
    // 로고가 없는 테슬라는 이름을 마크로 쓴다.
    expect(screen.getByRole('link', { name: '테슬라 테슬라' })).toBeInTheDocument();
  });

  test('상담 신청 버튼은 실시간 견적 모달을 연다', () => {
    renderWithProviders();

    fireEvent.click(screen.getByRole('button', { name: '상담 신청' }));
    expect(document.querySelector('.qm-overlay')).toHaveClass('is-open');
  });
});
