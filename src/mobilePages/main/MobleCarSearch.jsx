import React from 'react';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import { MobileSubHeader } from '../../bcs/layout/MobileLayout';
import { useBcsUi } from '../../bcs/BcsUiContext';
import { SITE_NAME } from '../../bcs/site';
import MobileBrandGrid from '../search/MobileBrandGrid';
import { MOBILE_BRAND_GROUPS } from '../search/brandGroups';

/** 퍼블리싱 pages/m-search.html : 브랜드를 골라 검색결과로 이동한다. */
export default function MobleCarSearch() {
  const { openQuote } = useBcsUi();

  return (
    <>
      <SeoHelmet title={`차량검색 | ${SITE_NAME}`} description={`${SITE_NAME} 차량검색. 브랜드를 선택해 원하는 차량을 찾아보세요.`} />
      <MobileSubHeader title="차량검색" />
      <main id="main-content">
        <div className="m-pagehead">
          <h1>
            어떤 차를 <em>찾으세요?</em>
          </h1>
          <p>브랜드를 선택하여 원하시는 차량을 찾아보세요.</p>
        </div>

        <div className="m-callbar">
          <span className="m-callbar__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" />
            </svg>
          </span>
          <span className="m-callbar__text">
            <small>지금 바로 무료 상담</small>
            <strong>1분만에 간편상담</strong>
          </span>
          <button className="m-callbar__btn" type="button" onClick={() => openQuote('', 'search-page')}>
            상담 신청
          </button>
        </div>

        {MOBILE_BRAND_GROUPS.map((group, index) => (
          <section
            key={group.origin}
            className="m-brandgroup"
            style={index === MOBILE_BRAND_GROUPS.length - 1 ? { paddingBottom: 24 } : undefined}
          >
            <h2 className="m-brandgroup__title">{group.label}</h2>
            <MobileBrandGrid origin={group.origin} brands={group.brands} />
          </section>
        ))}
      </main>
    </>
  );
}
