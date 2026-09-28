import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MobileMenu from './MobileMenu.jsx';
import { BcsUiProvider } from '../../bcs/BcsUiContext.jsx';

jest.mock('../../services/consultHelper', () => ({ submitConsult: jest.fn() }));

describe('MobileMenu (퍼블리싱 m-menu)', () => {
  test('퍼블리싱 메뉴를 SPA 경로로 연결하고 견적 모달을 연다', () => {
    render(
      <MemoryRouter initialEntries={['/m/menu']}>
        <BcsUiProvider>
          <MobileMenu />
        </BcsUiProvider>
      </MemoryRouter>,
    );

    const menu = within(screen.getByRole('navigation', { name: '전체 메뉴' }));
    expect(menu.getByRole('link', { name: '홈' })).toHaveAttribute('href', '/m');
    expect(menu.getByRole('link', { name: '내 차 견적 BEST' })).toHaveAttribute('href', '/m/search');
    expect(menu.getByRole('link', { name: '재고 특가 핫딜 HOT' })).toHaveAttribute('href', '/m/advance');
    expect(menu.getByRole('link', { name: '브랜드별 혜택' })).toHaveAttribute('href', '/m/brand');
    expect(menu.getByRole('link', { name: '수입차 할인' })).toHaveAttribute('href', '/m/search/results?carOrigin=imported');
    expect(menu.getByRole('link', { name: '출고후기' })).toHaveAttribute('href', '/m/review');
    expect(document.querySelector('.m-footer')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '실시간 무료견적 받기' }));
    expect(document.querySelector('.qm-overlay')).toHaveClass('is-open');
  });
});
