import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useBcsUi } from '../BcsUiContext';
import { useConsultForm } from '../useConsultForm';
import PrivacyRow from '../components/PrivacyRow';
import { BUSINESS_INFO, CONSULT_PHONE, CONSULT_PHONE_HREF, SITE_LOGO_URL, SITE_NAME } from '../site';

const NAV_ITEMS = [
  { to: '/carlist/domestic', label: '내 차 견적', badge: ['badge-best', 'BEST'], match: (path) => path.startsWith('/carlist/domestic') || path.startsWith('/car-detail') },
  { to: '/express-deals', label: '재고 특가 핫딜', badge: ['badge-hot', 'HOT'], match: (path) => path.startsWith('/express-deals') },
  { to: '/promotion', label: '브랜드별 혜택', match: (path) => path.startsWith('/promotion') },
  { to: '/carlist/imported', label: '수입차 할인', match: (path) => path.startsWith('/carlist/imported') },
  { to: '/review', label: '출고후기', match: (path) => path.startsWith('/review') },
];

const SearchIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export function PcHeader() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [keyword, setKeyword] = useState('');

  const handleSearch = (event) => {
    event.preventDefault();
    const term = keyword.trim();
    navigate(term ? `/carlist/domestic?keyword=${encodeURIComponent(term)}` : '/carlist/domestic');
  };

  return (
    <header className="pc-header">
      <div className="pc-header__middle">
        <Link className="brand-logo" to="/" aria-label={`${SITE_NAME} 홈`}>
          <img src={SITE_LOGO_URL} alt={SITE_NAME} width="124" height="124" />
          <span className="brand-logo__eyebrow">신차장기렌트 · 리스</span>
        </Link>
        <form className="site-search" role="search" onSubmit={handleSearch}>
          <label className="visually-hidden" htmlFor="pc-search">
            검색어
          </label>
          <input
            id="pc-search"
            type="search"
            placeholder="검색어를 입력해 주세요"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <button type="submit" aria-label="검색">
            <SearchIcon />
          </button>
        </form>
      </div>
      <nav className="pc-nav" aria-label="주요 메뉴">
        {NAV_ITEMS.map((item) => (
          <div className="pc-nav__item" key={item.to}>
            {item.badge ? <span className={`badge ${item.badge[0]}`}>{item.badge[1]}</span> : null}
            <NavLink className={() => `pc-nav__link${item.match(pathname) ? ' is-active' : ''}`} to={item.to}>
              {item.label}
            </NavLink>
          </div>
        ))}
      </nav>
    </header>
  );
}

export function PcFooter() {
  return (
    <footer className="pc-footer">
      <div className="container">
        <div>
          <p>{SITE_NAME}</p>
          <p>{BUSINESS_INFO.line}</p>
          <p>{BUSINESS_INFO.contact}</p>
        </div>
        <div>{BUSINESS_INFO.copyright}</div>
      </div>
    </footer>
  );
}

const COLLAPSE_WIDTH = 1280;
const TopIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 15l7-7 7 7" />
  </svg>
);

/** 오른쪽 플로팅 상담창. 1280px 미만에서는 본문을 가리지 않도록 접힌 채로 시작한다. */
export function QuickConsultAside() {
  const { openQuote } = useBcsUi();
  const { handleSubmit, error, submitting } = useConsultForm({ source: 'quick-sidebar', entryLabel: '플로팅 상담창' });
  const userToggled = useRef(false);
  const [closed, setClosed] = useState(() => typeof window !== 'undefined' && window.innerWidth < COLLAPSE_WIDTH);

  useEffect(() => {
    const onResize = () => {
      if (!userToggled.current) setClosed(window.innerWidth < COLLAPSE_WIDTH);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggle = () => {
    userToggled.current = true;
    setClosed((value) => !value);
  };
  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <aside className={`quick-consult${closed ? ' is-closed' : ''}`}>
      <div className="quick-card">
        <form className="quick-form" onSubmit={handleSubmit} noValidate>
          <div className="quick-fields">
            <h3>실시간 견적문의</h3>
            <div className="quick-row">
              <label htmlFor="quick-name">
                성함<span className="required">*</span>
              </label>
              <input id="quick-name" name="name" type="text" placeholder="ex) 홍길동" />
            </div>
            <div className="quick-row">
              <label htmlFor="quick-phone">
                연락처<span className="required">*</span>
              </label>
              <input id="quick-phone" name="phone" type="tel" inputMode="numeric" placeholder="ex) 01012345678" />
            </div>
            <div className="quick-row">
              <label htmlFor="quick-model">차종</label>
              <input id="quick-model" name="carModel" type="text" placeholder="ex) 쏘렌토" />
            </div>
            <PrivacyRow id="quick-privacy" label="[필수] 개인정보 이용 동의" />
            <p className="form-error">{error}</p>
          </div>
          <button className="quick-submit" type="submit" disabled={submitting}>
            {submitting ? '접수 중…' : '실시간 무료견적 받기'}
          </button>
        </form>
      </div>
      <div className="quick-methods">
        <a className="method-btn method-btn--phone" href={CONSULT_PHONE_HREF}>
          <span className="method-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" />
            </svg>
          </span>
          <span className="method-text">
            <small>전문상담원과 간편 전화상담</small>
            <strong>{CONSULT_PHONE}</strong>
          </span>
        </a>
        <span className="method-divider" aria-hidden="true" />
        <button className="method-btn method-btn--kakao" type="button" onClick={() => openQuote('', 'quick-kakao')}>
          <span className="method-icon method-icon--kakao" aria-hidden="true">
            TALK
          </span>
          <span className="method-text">
            <small>1분만에 스으윽~~~</small>
            <strong>카톡 간편 상담 신청</strong>
          </span>
        </button>
      </div>
      <div className="quick-actions">
        <button className="quick-pill quick-pill--fold" type="button" onClick={toggle} aria-expanded={!closed}>
          상담창
          <br />
          접어두기
        </button>
        <button className="quick-pill quick-pill--top" type="button" onClick={scrollTop}>
          <TopIcon />
          TOP
        </button>
      </div>
      <div className="unfold-wrap">
        <button className="quick-pill quick-pill--fold" type="button" onClick={toggle} aria-expanded={!closed}>
          상담창
          <br />
          펼치기
        </button>
        <button className="quick-pill quick-pill--top" type="button" onClick={scrollTop}>
          <TopIcon />
          TOP
        </button>
      </div>
    </aside>
  );
}
