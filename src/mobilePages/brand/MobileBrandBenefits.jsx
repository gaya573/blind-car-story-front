import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import { getPageSeo } from '../../config/seoConfig';
import { MobileSubHeader } from '../../bcs/layout/MobileLayout';
import { useBcsUi } from '../../bcs/BcsUiContext';
import styles from './MobileBrand.module.css';
import { PROMOTION_TABS, brandPromotionsQuery, promotionStatusText, toPromotionModel } from './brandPromotion';

// 배너 이미지가 없는 기획전은 퍼블리싱처럼 글자 타일로 보여 준다.
const TILE_THEMES = ['dark', 'gold', 'night'];

function PromotionCard({ promotion, index }) {
  const badge = <span className={`m-promo__badge${promotion.imageUrl ? ` ${styles.imageBadge}` : ''}`}>{promotionStatusText(promotion)}</span>;
  return (
    <Link
      className={`m-promo${promotion.ended ? ' is-ended' : ''}`}
      to={`/m/brand/detail/${promotion.id}`}
      state={{ promotion: promotion.raw }}
    >
      {promotion.imageUrl ? (
        <div className={`m-promo__tile ${styles.imageTile}`}>
          {badge}
          <img src={promotion.imageUrl} alt={promotion.title} loading="lazy" />
        </div>
      ) : (
        <div className={`m-promo__tile m-promo__tile--${TILE_THEMES[index % TILE_THEMES.length]}`}>
          {badge}
          <p className="m-promo__headline">{promotion.partner || promotion.brand || promotion.headline}</p>
          {promotion.description ? <p className="m-promo__benefit">{promotion.description}</p> : null}
        </div>
      )}
      <p className="m-promo__title">{promotion.title}</p>
      {promotion.period ? <p className="m-promo__period">{promotion.period}</p> : null}
    </Link>
  );
}

/** 브랜드별 혜택 (퍼블리싱 pages/m-brand.html). 제휴 어드민 브랜드 기획전을 진행중/종료 탭으로 나눠 보여 준다. */
function MobileBrandBenefits() {
  const { openQuote } = useBcsUi();
  const [tab, setTab] = useState(PROMOTION_TABS[0].value);
  const current = PROMOTION_TABS.find((item) => item.value === tab) ?? PROMOTION_TABS[0];
  const { data = [], isLoading } = useQuery(brandPromotionsQuery(current.position));

  const promotions = useMemo(
    () => (Array.isArray(data) ? data : []).map((item) => ({ ...toPromotionModel(item, current.position), raw: item })),
    [data, current.position],
  );

  const emptyText = isLoading
    ? '브랜드별 혜택을 불러오는 중입니다...'
    : tab === 'ongoing'
      ? '현재 진행 중인 기획전이 없습니다.'
      : '종료된 기획전이 없습니다.';

  return (
    <>
      <SeoHelmet {...getPageSeo('promotion')} image={promotions[0]?.imageUrl || undefined} />
      <MobileSubHeader title="브랜드별 혜택" />

      <main id="main-content">
        <div className="m-pagehead">
          <h1>
            브랜드별 <em>특가 혜택</em>
          </h1>
          <p>지금 계약 시 적용되는 브랜드별 즉시 출고 혜택을 한눈에 확인해 보세요.</p>
        </div>

        <div className="m-tabs2" role="tablist" aria-label="기획전 구분">
          {PROMOTION_TABS.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={tab === item.value}
              className={tab === item.value ? 'is-active' : undefined}
              onClick={() => setTab(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {promotions.length > 0 ? (
          <div className="m-card-stack" style={{ padding: '20px 16px 8px' }}>
            {promotions.map((promotion, index) => (
              <PromotionCard key={promotion.id || index} promotion={promotion} index={index} />
            ))}
          </div>
        ) : (
          <p className="m-empty">{emptyText}</p>
        )}

        <div className="m-menu-promo">
          <strong>
            최대 30곳의 비교 견적으로
            <br />
            가장 낮은 조건을 찾아드립니다
          </strong>
          <em>블라인드 카스토리 단독 물량 확보</em>
          <button
            className="m-callbar__btn"
            type="button"
            style={{ marginTop: 14, height: 44, padding: '0 22px' }}
            onClick={() => openQuote('', 'm-brand')}
          >
            실시간 무료견적 받기
          </button>
        </div>
      </main>
    </>
  );
}

export default MobileBrandBenefits;
