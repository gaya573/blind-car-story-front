import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import SearchBar from '../SearchBar';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const isSearchPageRef = useRef(false);
  const pathname = location.pathname;
  const isHomeActive = pathname === '/';
  const isDomesticActive = pathname.startsWith('/carlist/domestic');
  const isImportActive = pathname.startsWith('/carlist/imported');
  const isDealsActive = pathname.startsWith('/express-deals') || pathname.startsWith('/prepurchase-deals');
  const isPromotionActive = pathname.startsWith('/promotion') || pathname.startsWith('/card-promotion');
  const isReviewActive = pathname.startsWith('/review');

  // URL 파라미터에서 검색어 읽어오기 (검색 페이지가 아닐 때만)
  useEffect(() => {
    const isSearchPage = location.pathname === '/search';
    
    // 검색 페이지가 아니면 검색어 초기화
    if (!isSearchPage) {
      if (isSearchPageRef.current) {
        // 검색 페이지에서 다른 페이지로 이동할 때만 초기화
        setSearchQuery('');
      }
      isSearchPageRef.current = false;
      return;
    }
    
    // 검색 페이지로 처음 진입할 때만 URL에서 검색어 읽어오기
    if (isSearchPage && !isSearchPageRef.current) {
      const params = new URLSearchParams(location.search);
      const q = params.get('q');
      if (q) {
        setSearchQuery(q);
      }
      isSearchPageRef.current = true;
    }
    // 검색 페이지에 있을 때는 URL 변경을 무시 (사용자 입력을 보호)
  }, [location.pathname]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (keyword) => {
    const searchTerm = keyword !== undefined ? keyword : searchQuery;
    if (searchTerm && searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/search');
    }
  };

  return (
    <header className="header">
      {/* 중간 바: 왼쪽 로고 / 오른쪽 검색 */}
      <div className="middle-bar">
        <Link to="/" className="logo-section">
          <img
            src="/logo/carstory-logo.svg"
            alt="블라인드 카스토리"
            className="logo-icon"
          />
          <div className="logo-text-group">
            <span className="logo-sub-text">신차장기렌트 · 리스</span>
            <span className="logo-main-text">블라인드 카스토리</span>
          </div>
        </Link>

        <div className="right-area">
          <SearchBar 
            value={searchQuery}
            onChange={handleSearch}
            placeholder="검색어를 입력해 주세요"
            className="header-search"
            variant="compact"
            rounded={false}
            onSubmit={handleSearchSubmit}
          />
        </div>
      </div>

      {/* 하단 내비게이션 (PC 전용 텍스트 메뉴 + BEST/HOT 배지) */}
      <div className="bottom-nav">
        <nav className="bottom-nav-inner">
          {/* 직접 견적내기 */}
          <div className="nav-item">
            <span className="nav-item-badge best">BEST</span>
            <NavLink 
              to="/carlist/domestic"
              className={({ isActive }) => `nav-item-link ${(isActive || isDomesticActive) ? 'active' : ''}`}
            >
              내 차 견적
            </NavLink>
          </div>

          {/* 재고 특가 핫딜 */}
          <div className="nav-item">
            <span className="nav-item-badge hot">HOT</span>
            <NavLink 
              to="/express-deals"
              className={({ isActive }) => `nav-item-link ${(isActive || isDealsActive) ? 'active' : ''}`}
            >
              재고 특가 핫딜
            </NavLink>
          </div>

          {/* 브랜드별 혜택 */}
          <div className="nav-item">
            <NavLink 
              to="/promotion"
              className={({ isActive }) => `nav-item-link ${(isActive || isPromotionActive) ? 'active' : ''}`}
            >
              브랜드별 혜택
            </NavLink>
          </div>

          {/* 수입차 할인 */}
          <div className="nav-item">
            <NavLink 
              to="/carlist/imported"
              className={({ isActive }) => `nav-item-link ${(isActive || isImportActive) ? 'active' : ''}`}
            >
              수입차 할인
            </NavLink>
          </div>

          {/* 출고후기 */}
          <div className="nav-item">
            <NavLink 
              to="/review"
              className={({ isActive }) => `nav-item-link ${(isActive || isReviewActive) ? 'active' : ''}`}
            >
              출고후기
            </NavLink>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
