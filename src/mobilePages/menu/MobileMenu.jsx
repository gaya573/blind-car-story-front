import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './MobileMenu.module.css';

const MobileMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/m', { replace: true });
    }
  };

  const menuItems = useMemo(
    () => [
      { label: '홈', path: '/m' },
      { label: '내 차 견적', path: '/m/search/results?carOrigin=domestic', badge: 'BEST', badgeType: 'best' },
      { label: '특가·즉시출고', path: '/m/advance/all', badge: 'HOT', badgeType: 'hot' },
      { label: '브랜드별 혜택', path: '/m/brand' },
      { label: '수입차 할인', path: '/m/search/results?carOrigin=import', badge: '연말할인', badgeType: 'sale' },
      { label: '출고 후기', path: '/m/review' },
    ],
    [],
  );

  const isActive = (path) => {
    if (!path) return false;
    return location.pathname === path;
  };

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.brand}>블라인드 카스토리</div>
        <button className={styles.closeButton} onClick={goBack} aria-label="닫기">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </header>

      <div className={styles.menuList}>
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={`${styles.menuItem} ${isActive(item.path) ? styles.active : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className={styles.menuLabel}>{item.label}</span>
            {item.badge && (
              <span
                className={`${styles.badge} ${
                  item.badgeType === 'best'
                    ? styles.badgeBest
                    : item.badgeType === 'hot'
                    ? styles.badgeHot
                    : styles.badgeSale
                }`}
              >
                {item.badge}
              </span>
            )}
            <svg className={styles.menuArrow} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.5 15L12.5 10L7.5 5" stroke="#999999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerBox}>
          <div className={styles.footerRow}>
            <span>블라인드 카스토리</span>
          </div>
          <div className={styles.footerRow}>
            <span>전화 : 1577-8319</span>
            <span className={styles.footerSpacer}></span>
            <span>이메일 : 정보 준비중</span>
          </div>
          <div className={styles.footerRow}>
            <span>대표 : 정보 준비중</span>
            <span className={styles.footerSpacer}></span>
            <span>사업자등록번호 : 정보 준비중</span>
          </div>
          <div className={styles.footerRow}>
            <span>(C) Blind CarStory All Rights Reserved.</span>
            <span className={styles.footerDot}>·</span>
            <span>개인정보취급방침</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MobileMenu;

