import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { contentAPI } from '../../services/contentApi.js';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import StructuredData, { getOrganizationSchema } from '../../components/StructuredData.jsx';
import { getPageSeo } from '../../config/seoConfig';
import { useCountdown } from '../../hooks/useCountdown';
import { MobileSubHeader } from '../../bcs/layout/MobileLayout';
import { useBcsUi } from '../../bcs/BcsUiContext';
import { toVehicleCardModel, earliestDeadline } from '../../bcs/vehicle';
import { deadlineBadgeText, formatMonthly, formatWonTilde } from '../../bcs/format';
import { RENTAL_CONDITION_LABEL } from '../../bcs/site';

const PROMOTION_EVENT = 'PROMOTION_EVENT';
const ORIGIN_TABS = ['전체', '국산', '수입'];
const ALL_BRANDS = '전체';

const cardTypeOf = (item) => String(item?.cardType ?? item?.card_type ?? '').toUpperCase();
const isEnded = (item, now) => Boolean(item?.endDate) && new Date(item.endDate) < now;
const pad = (value) => String(value ?? 0).padStart(2, '0');

const stockOf = (item) => {
  const raw = item?.remainingQuantity ?? item?.remaining_quantity ?? item?.stock ?? null;
  if (raw === null || raw === undefined || raw === '') return null;
  const number = Number(raw);
  return Number.isFinite(number) ? Math.max(0, number) : null;
};

/** 재고 특가 API 항목 → 퍼블리싱 m-deal 카드 모델. 트림명의 원천 데이터 구분자(&&)는 띄어쓰기로 바꾼다. */
const toDeal = (item) => {
  const model = toVehicleCardModel(item);
  return {
    ...model,
    trimName: String(model.trimName ?? '').replace(/\s*&&\s*/g, ' '),
    key: String(item?.id ?? item?.trimId ?? ''),
    stock: stockOf(item),
  };
};

const isSameDay = (a, b) => a.toDateString() === b.toDateString();

/** 퍼블리싱 .m-timer: 오늘 출고 마감 차량 중 가장 이른 마감까지 남은 시간. */
function DealTimer({ deadline }) {
  const { days, hours, minutes, seconds } = useCountdown(deadline);
  const today = isSameDay(deadline, new Date());
  const items = [...(days > 0 ? [[days, '일']] : []), [hours, '시'], [minutes, '분'], [seconds, '초']];
  return (
    <div className="m-timer">
      <span className="m-timer__label">{today ? '오늘 마감까지' : '마감까지'}</span>
      <div className="countdown" aria-label={`${today ? '오늘 ' : ''}마감까지 남은 시간`}>
        {items.map(([value, unit]) => (
          <div className="countdown__item" key={unit}>
            <div className="countdown__value">{pad(value)}</div>
            <span className="countdown__unit">{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DealRow({ label, value }) {
  return (
    <div className="m-deal__row">
      <span className="m-deal__chip">{label}</span>
      <span className="m-deal__amount">
        {formatMonthly(value)}
        <em>원</em>
      </span>
    </div>
  );
}

/** 퍼블리싱 mobile-pages.js dealCard. 카드나 버튼을 누르면 실시간 견적 모달을 연다. */
function DealCard({ deal, urgent, source }) {
  const { openQuote } = useBcsUi();
  const quote = () => openQuote([deal.vehicleName, deal.trimName].filter(Boolean).join(' '), source);

  let badge = null;
  if (urgent) {
    const dday = deadlineBadgeText(deal.remainingDays);
    badge = <span className="m-deal__badge">{dday ? `긴급 ${dday}` : '긴급'}</span>;
  } else if (deal.stock !== null) {
    badge = <span className="m-deal__badge m-deal__badge--stock">{deal.stock > 0 ? `재고 ${deal.stock}대` : '마감임박'}</span>;
  } else if (typeof deal.remainingDays === 'number') {
    badge = <span className="m-deal__badge m-deal__badge--stock">{deadlineBadgeText(deal.remainingDays)}</span>;
  }

  return (
    <article className={`m-deal${urgent ? ' m-deal--urgent' : ''}`} data-trim-id={deal.trimId ?? ''} onClick={quote}>
      <div className="m-deal__top">
        {badge}
        {deal.brandName ? <span className="m-deal__brand">{deal.brandName}</span> : null}
      </div>
      <h3 className="m-deal__name">{deal.vehicleName}</h3>
      {deal.trimName ? <p className="m-deal__trim">{deal.trimName}</p> : null}
      <div className="m-deal__media">
        <img src={deal.imageUrl || '/bcs/images/cars/car-suv.svg'} alt={deal.vehicleName || '차량 이미지'} loading="lazy" />
      </div>
      <div className="m-deal__price">
        <span>차량가격</span>
        <strong>{formatWonTilde(deal.basePrice)}</strong>
      </div>
      <div className="m-deal__monthly">
        <DealRow label="선납금 30%" value={deal.prepayment30} />
        <DealRow label="보증금 30%" value={deal.deposit30} />
        <DealRow label="완전무보증" value={deal.noDeposit} />
      </div>
      <p className="m-deal__note">{RENTAL_CONDITION_LABEL}</p>
      <button
        className="m-deal__cta"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          quote();
        }}
      >
        실시간 무료견적 받기
      </button>
    </article>
  );
}

/**
 * 재고 특가 핫딜 (퍼블리싱 pages/m-express.html).
 * - 상단 "오늘 출고 마감 차량": 재고 API cardType=PROMOTION_EVENT
 * - 하단 "전체 재고 차량": PROMOTION_EVENT 를 뺀 재고 (국산/수입·브랜드 필터)
 * showUrgent=false 이면 하단 목록만 보여 준다 (/m/advance/all).
 */
export default function ExpressDealsPage({ showUrgent = true, pageSize = 6 }) {
  const [originTab, setOriginTab] = useState(ORIGIN_TABS[0]);
  const [brand, setBrand] = useState(ALL_BRANDS);
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const carType = originTab === ORIGIN_TABS[0] ? null : originTab;

  const urgentQuery = useQuery({
    queryKey: ['mobile-advance', 'inventory-promotions-all'],
    queryFn: async () => {
      const result = await contentAPI.getUrgentInventory(30, null, null, PROMOTION_EVENT);
      return Array.isArray(result) ? result.filter((item) => cardTypeOf(item) === PROMOTION_EVENT) : [];
    },
    enabled: showUrgent,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  const listQuery = useQuery({
    queryKey: ['mobile-advance', 'inventory-non-promotion', carType],
    queryFn: async () => {
      const result = await contentAPI.getUrgentInventory(200, null, carType, null);
      return Array.isArray(result) ? result.filter((item) => cardTypeOf(item) !== PROMOTION_EVENT) : [];
    },
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  const urgentDeals = useMemo(() => {
    const now = new Date();
    return (urgentQuery.data ?? []).filter((item) => !isEnded(item, now)).map(toDeal);
  }, [urgentQuery.data]);

  const allDeals = useMemo(() => {
    const now = new Date();
    return (listQuery.data ?? []).filter((item) => !isEnded(item, now)).map(toDeal);
  }, [listQuery.data]);

  // 브랜드 칩은 지금 목록에 있는 브랜드로 만든다.
  const brandChips = useMemo(() => {
    const names = [];
    allDeals.forEach((deal) => {
      if (deal.brandName && !names.includes(deal.brandName)) names.push(deal.brandName);
    });
    return [ALL_BRANDS, ...names];
  }, [allDeals]);

  const deals = useMemo(
    () => (brand === ALL_BRANDS ? allDeals : allDeals.filter((deal) => deal.brandName === brand)),
    [allDeals, brand],
  );

  useEffect(() => {
    if (!brandChips.includes(brand)) setBrand(ALL_BRANDS);
  }, [brandChips, brand]);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [originTab, brand, pageSize]);

  const deadline = useMemo(() => earliestDeadline(urgentDeals), [urgentDeals]);
  const rest = deals.length - Math.min(visibleCount, deals.length);
  const { title: seoTitle, description: seoDescription, keywords: seoKeywords } = getPageSeo('express-deals');
  const seoImage = urgentDeals[0]?.imageUrl || deals[0]?.imageUrl || undefined;

  return (
    <>
      <SeoHelmet title={seoTitle} description={seoDescription} keywords={seoKeywords} image={seoImage} />
      {showUrgent ? <StructuredData data={getOrganizationSchema()} /> : null}
      <MobileSubHeader title="재고 특가 핫딜" />

      <main id="main-content">
        <div className="m-pagehead">
          <h1 className="m-title-icon">
            <img src="/bcs/images/banner/hotdeal-timer.svg" alt="" aria-hidden="true" />
            재고 <em>특가 핫딜</em>
          </h1>
          <p>실시간 재고 기반으로 바로 출고 가능한 차량을 한곳에 모았습니다.</p>
        </div>

        {showUrgent ? (
          <>
            {deadline ? <DealTimer deadline={deadline} /> : null}

            <div className="m-urgent-head">
              <span className="m-urgent-head__flag">긴급</span>
              <h2>오늘 출고 마감 차량</h2>
            </div>
            {urgentDeals.length > 0 ? (
              <div className="m-card-stack" style={{ padding: '0 16px' }}>
                {urgentDeals.map((deal) => (
                  <DealCard key={deal.key} deal={deal} urgent source="m-express-urgent" />
                ))}
              </div>
            ) : (
              <p className="m-empty" style={{ padding: '24px 16px' }}>
                {urgentQuery.isLoading ? '차량 정보를 불러오는 중...' : '오늘 출고 마감 차량이 없습니다.'}
              </p>
            )}
          </>
        ) : null}

        <div className="m-tabs2" role="tablist" aria-label="국산·수입 구분" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: showUrgent ? 24 : 0 }}>
          {ORIGIN_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={originTab === tab}
              className={originTab === tab ? 'is-active' : undefined}
              onClick={() => {
                setOriginTab(tab);
                setBrand(ALL_BRANDS);
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        {brandChips.length > 1 ? (
          <div className="m-chips" aria-label="브랜드 선택">
            {brandChips.map((name) => (
              <button
                key={name}
                type="button"
                className={`m-chip${brand === name ? ' is-active' : ''}`}
                aria-pressed={brand === name}
                onClick={() => setBrand(name)}
              >
                {name}
              </button>
            ))}
          </div>
        ) : null}

        <div className="m-listbar">
          <span>전체 재고 차량</span>
          <span>
            <strong>{deals.length.toLocaleString('ko-KR')}</strong>대
          </span>
        </div>
        {deals.length > 0 ? (
          <div className="m-card-stack" style={{ padding: '0 16px' }}>
            {deals.slice(0, visibleCount).map((deal) => (
              <DealCard key={deal.key} deal={deal} source="m-express-card" />
            ))}
          </div>
        ) : (
          <p className="m-empty">{listQuery.isLoading ? '차량 정보를 불러오는 중...' : '조건에 맞는 재고 차량이 없습니다.'}</p>
        )}

        {rest > 0 ? (
          <div className="m-more">
            <button className="m-more__btn" type="button" onClick={() => setVisibleCount((count) => count + pageSize)}>
              차량 더보기 ({rest})
            </button>
          </div>
        ) : null}

        <p className="m-fine" style={{ borderTop: 0, marginTop: 8 }}>
          <strong>안내</strong>
          재고 수량과 마감일은 계약 진행 상황에 따라 변동될 수 있습니다.
        </p>
      </main>
    </>
  );
}
