import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useBcsUi } from '../BcsUiContext';
import { BUSINESS_INFO, SITE_LOGO_URL, SITE_NAME } from '../site';

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

/** 모바일 메인 전용 헤더 + 상단 바로가기 탭 (mobile.html .m-header, .m-tabs). */
export function MobileMainHeader() {
  const { openQuote } = useBcsUi();
  return (
    <>
      <header className="m-header">
        <Link to="/m/menu" className="icon-btn" aria-label="전체 메뉴">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </Link>
        <Link className="m-header__logo" to="/m" aria-label={`${SITE_NAME} 홈`}>
          <img src={SITE_LOGO_URL} alt={SITE_NAME} />
        </Link>
        <button type="button" aria-label="상담" onClick={() => openQuote('', 'mobile-header')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M5 4h4l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
          </svg>
        </button>
      </header>
      <div className="m-tabs" role="tablist" aria-label="상단 바로가기">
        <Link className="is-active" to="/m/search">
          직접견적내기
        </Link>
        <Link to="/m/advance">재고특가핫딜</Link>
        <Link to="/m/search/results?carOrigin=imported">수입차할인</Link>
      </div>
    </>
  );
}

/** 모바일 하위 페이지 헤더 (.m-sub): 뒤로 · 제목 · 전체 메뉴. */
export function MobileSubHeader({ title }) {
  const navigate = useNavigate();
  const goBack = (event) => {
    event.preventDefault();
    if (window.history.length > 1) navigate(-1);
    else navigate('/m');
  };
  return (
    <header className="m-sub">
      <a href="/m" aria-label="뒤로" onClick={goBack}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </a>
      <p className="m-sub__title">{title}</p>
      <Link to="/m/menu" aria-label="전체 메뉴">
        <MenuIcon />
      </Link>
    </header>
  );
}

/** copyrightGap: 전체 메뉴(m-menu.html)처럼 저작권 줄 위를 10px 띄울 때. */
export function MobileFooter({ copyrightGap = false }) {
  return (
    <footer className="m-footer">
      <p>{SITE_NAME}</p>
      <p>{BUSINESS_INFO.line}</p>
      <p>{BUSINESS_INFO.contact}</p>
      <p style={copyrightGap ? { marginTop: 10 } : undefined}>{BUSINESS_INFO.copyright}</p>
    </footer>
  );
}

const BOTTOM_ITEMS = [
  {
    to: '/m',
    label: '홈',
    match: (path) => path === '/m' || path === '/m/',
    icon: <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />,
    iconProps: { strokeWidth: 1.8 },
  },
  {
    to: '/m/search',
    label: '차량검색',
    // 퍼블리싱 m-car-detail 은 하단 탭을 켜지 않는다.
    match: (path) => path.startsWith('/m/search'),
    icon: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
    iconProps: { strokeWidth: 2, strokeLinecap: 'round' },
  },
  {
    to: '/m/advance',
    label: '재고 특가',
    match: (path) => path.startsWith('/m/advance'),
    icon: (
      <>
        <path d="M3 11V4h7l11 11-7 7z" />
        <circle cx="7.5" cy="7.5" r="1.4" />
      </>
    ),
    iconProps: { strokeWidth: 2, strokeLinejoin: 'round' },
  },
  {
    to: '/m/brand',
    label: '브랜드별 혜택',
    match: (path) => path.startsWith('/m/brand'),
    icon: (
      <>
        <rect x="3" y="8" width="18" height="13" rx="2" />
        <path d="M3 12h18M12 8v13" />
      </>
    ),
    iconProps: { strokeWidth: 2, strokeLinejoin: 'round' },
  },
];

export function MobileBottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="m-bottom" aria-label="하단 메뉴">
      {BOTTOM_ITEMS.map((item) => (
        <Link key={item.to} to={item.to} className={item.match(pathname) ? 'is-active' : undefined}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" aria-hidden="true" {...item.iconProps}>
            {item.icon}
          </svg>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
