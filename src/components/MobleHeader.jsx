import React from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import styles from './MobleHeader.module.css';

function Icon({ name }) {
  if (name === 'back') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 18L9 12L15 6" stroke="#161616" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  if (name === 'search') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="11" cy="11" r="7" stroke="#161616" strokeWidth="2"/>
        <path d="M20 20L17 17" stroke="#161616" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
  }
  if (name === 'menu') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6H21" stroke="#161616" strokeWidth="2" strokeLinecap="round"/>
        <path d="M3 12H21" stroke="#161616" strokeWidth="2" strokeLinecap="round"/>
        <path d="M3 18H21" stroke="#161616" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
  }
  return null;
}

const MobileHeader = ({
  title = '차량검색',
  showBack = true,
  right = 'search', // 'none' | 'search' | 'menu'
  onBack,
  onRightClick,
  showNavCards = false, // 네비게이션 카드 표시 여부
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const isEstimateActive =
    pathname.startsWith('/m') && (pathname.includes('/search') || pathname.includes('/car-detail'));
  const isDealsActive = pathname.startsWith('/m/advance');
  const isPromotionActive = pathname.startsWith('/m/brand');
  const isReviewActive = pathname.startsWith('/m/review');

  return (
    <>
      <div className={styles.navBar}>
        <div className={styles.navInner}>
          <div className={styles.leftGroup}>
            {showBack && (
              <button
                className={styles.iconBtn}
                aria-label="back"
                onClick={() => (typeof onBack === 'function' ? onBack() : navigate(-1))}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 19L8 12l7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            <div className={styles.navTitle}>{title}</div>
          </div>
          {right !== 'none' && (
            <button
              className={styles.iconBtn}
              aria-label={right}
              // 기본 돋보기 클릭 시 상세 검색 페이지(/m/search/find)로 이동
              onClick={() => (typeof onRightClick === 'function' ? onRightClick() : navigate('/m/search/find'))}
            >
              {right === 'search' && (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4-4" strokeLinecap="round" />
                </svg>
              )}
              {right === 'menu' && (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 6H21" />
                  <path d="M3 12H21" />
                  <path d="M3 18H21" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* 모바일 네비게이션 카드 */}
      {showNavCards && (
        <div className={styles.navCardsContainer}>
          <nav className={styles.navCards}>
            <NavLink 
              to="/m/search"
              className={({ isActive }) => `${styles.navCard} ${(isActive || isEstimateActive) ? styles.active : ''}`}
            >
              <span className={styles.navCardBadge}>BEST</span>
              <span className={styles.navCardLabel}>실시간 무료견적 받기</span>
            </NavLink>
            
            <NavLink 
              to="/m/advance" 
              className={({ isActive }) => `${styles.navCard} ${(isActive || isDealsActive) ? styles.active : ''}`}
            >
              <span className={`${styles.navCardBadge} ${styles.hot}`}>HOT</span>
              <span className={styles.navCardLabel}>재고 특가 핫딜</span>
            </NavLink>
            
            <NavLink 
              to="/m/brand" 
              className={({ isActive }) => `${styles.navCard} ${(isActive || isPromotionActive) ? styles.active : ''}`}
            >
              <span className={styles.navCardLabel}>브랜드별 혜택</span>
            </NavLink>
            
            <NavLink 
              to="/m/review" 
              className={({ isActive }) => `${styles.navCard} ${(isActive || isReviewActive) ? styles.active : ''}`}
            >
              <span className={styles.navCardLabel}>출고후기</span>
            </NavLink>
          </nav>
        </div>
      )}
    </>
  );
};

export default MobileHeader;

