import React from 'react';
import { Link } from 'react-router-dom';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import { MobileFooter, MobileSubHeader } from '../../bcs/layout/MobileLayout';
import { useBcsUi } from '../../bcs/BcsUiContext';
import { SITE_NAME } from '../../bcs/site';

// 퍼블리싱 pages/m-menu.html 메뉴 순서와 배지. 출고후기는 SPA의 출고후기 목록으로 보낸다.
// 차량명 검색(/m/search/find)은 퍼블리싱에 입구가 없어 메뉴에 한 줄 더했다.
const MENU_ITEMS = [
  { label: '홈', to: '/m' },
  { label: '내 차 견적', to: '/m/search', badge: 'BEST', badgeClass: 'badge-best' },
  { label: '차량명으로 검색', to: '/m/search/find' },
  { label: '재고 특가 핫딜', to: '/m/advance', badge: 'HOT', badgeClass: 'badge-hot' },
  { label: '브랜드별 혜택', to: '/m/brand' },
  { label: '수입차 할인', to: '/m/search/results?carOrigin=imported' },
  { label: '출고후기', to: '/m/review' },
];

const MobileMenu = () => {
  const { openQuote } = useBcsUi();

  return (
    <>
      <SeoHelmet title={`전체 메뉴 | ${SITE_NAME}`} description={`${SITE_NAME} 모바일 전체 메뉴.`} />
      <MobileSubHeader title="전체 메뉴" />
      <main id="main-content">
        <div className="m-pagehead" style={{ paddingBottom: 8 }}>
          <h1>
            전체 <em>메뉴</em>
          </h1>
        </div>

        <nav className="m-menulist" aria-label="전체 메뉴">
          {MENU_ITEMS.map((item) => (
            <Link key={item.label} to={item.to}>
              {item.label}
              {item.badge ? <span className={`badge ${item.badgeClass}`}>{item.badge}</span> : null}
            </Link>
          ))}
        </nav>

        <div className="m-menu-promo">
          <strong>
            최대 30곳의 비교 견적으로
            <br />
            최저가 견적을 보내드립니다
          </strong>
          <em>{SITE_NAME} 단독 물량 확보</em>
          <button
            className="m-callbar__btn"
            type="button"
            style={{ marginTop: 14, height: 44, padding: '0 22px' }}
            onClick={() => openQuote('', 'mobile-menu')}
          >
            실시간 무료견적 받기
          </button>
        </div>

        <MobileFooter copyrightGap />
      </main>
    </>
  );
};

export default MobileMenu;
