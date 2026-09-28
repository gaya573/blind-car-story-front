import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { contentAPI } from '../../services/contentApi';
import { useCarBrandsQuery } from '../../hooks/queries/carQueries';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import { getPageSeo } from '../../config/seoConfig';
import { earliestDeadline } from '../../bcs/vehicle';
import ExpressCard from './ExpressCard';
import UrgentTimer from './UrgentTimer';
import {
  EXPRESS_BRANDS,
  EXPRESS_PAGE_SIZE,
  URGENT_CARD_TYPE,
  compareByDeadline,
  findBrandId,
  isExpired,
  matchesMaker,
  resolveMaker,
  toExpressCard,
} from './expressModel';
import './express-bcs.css';

const listOf = (data) => (Array.isArray(data) ? data : []);

function BrandFilter({ value, onChange }) {
  return (
    <div className="ex-brands">
      {EXPRESS_BRANDS.map((brand) => {
        const active = brand.name === value;
        return (
          <button
            key={brand.name}
            type="button"
            className={`ex-brand${active ? ' is-active' : ''}`}
            data-brand={brand.name}
            aria-pressed={active}
            onClick={() => onChange(brand.name)}
          >
            <span className="ex-brand__mark">{brand.logoUrl ? <img src={brand.logoUrl} alt="" /> : brand.label}</span>
            <span className="ex-brand__name">{brand.label}</span>
          </button>
        );
      })}
    </div>
  );
}

const ExpressDeals = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [maker, setMaker] = useState(() => resolveMaker(searchParams.get('maker')));
  const [visible, setVisible] = useState(EXPRESS_PAGE_SIZE);

  // 상단 긴급 영역: 프로모션(PROMOTION_EVENT) 재고만
  const urgentQuery = useQuery({
    queryKey: ['express-deals', 'highlight'],
    queryFn: () => contentAPI.getUrgentInventory(30, null, null, URGENT_CARD_TYPE),
    staleTime: 1000 * 60,
  });

  // 제조사 이름 → 브랜드 id (재고 API 는 brandId 로 거른다)
  const brandsQuery = useCarBrandsQuery(null, { staleTime: 1000 * 60 * 5 });
  const brandId = findBrandId(listOf(brandsQuery.data), maker);
  const brandReady = maker === '전체' || brandsQuery.isFetched;

  const listQuery = useQuery({
    queryKey: ['express-deals', 'list', { brandId }],
    queryFn: () => contentAPI.getUrgentInventory(200, brandId, null, null),
    enabled: brandReady,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const urgentItems = useMemo(
    () =>
      listOf(urgentQuery.data)
        .filter((item) => !item.cardType || item.cardType === URGENT_CARD_TYPE)
        .filter((item) => !isExpired(item))
        .slice(0, 4),
    [urgentQuery.data],
  );
  const urgentCards = useMemo(() => urgentItems.map(toExpressCard), [urgentItems]);
  const urgentDeadline = useMemo(() => earliestDeadline(urgentItems), [urgentItems]);

  const listCards = useMemo(
    () =>
      listOf(listQuery.data)
        .filter((item) => !isExpired(item))
        // 브랜드 id 를 못 찾았을 때만 이름으로 거른다.
        .filter((item) => brandId !== null || matchesMaker(item, maker))
        .sort(compareByDeadline)
        .map(toExpressCard),
    [listQuery.data, brandId, maker],
  );
  const shown = listCards.slice(0, visible);
  const rest = listCards.length - shown.length;
  const listLoading = !brandReady || listQuery.isLoading;

  const selectMaker = (name) => {
    setMaker(name);
    setVisible(EXPRESS_PAGE_SIZE);
    const params = new URLSearchParams(searchParams);
    if (name === '전체') params.delete('maker');
    else params.set('maker', name);
    setSearchParams(params, { replace: true });
  };

  const { title: seoTitle, description: seoDescription, keywords: seoKeywords } = getPageSeo('express-deals');
  const seoImage = urgentCards[0]?.imageUrl || listCards[0]?.imageUrl || undefined;

  return (
    <div className="bcs-page-express">
      <SeoHelmet title={seoTitle} description={seoDescription} keywords={seoKeywords} image={seoImage} />
      <section className="express-page">
        <div className="container">
          <nav className="ex-breadcrumb" aria-label="현재 위치">
            <Link to="/">홈</Link>
            <span aria-hidden="true">›</span>
            <strong>재고 특가 핫딜</strong>
          </nav>

          {urgentCards.length === 0 && <h1 className="visually-hidden">재고 특가 핫딜</h1>}
          {urgentCards.length > 0 && (
            <section className="ex-urgent" aria-labelledby="ex-urgent-title">
              <div className="ex-urgent__head">
                <div>
                  <h1 className="ex-urgent__title" id="ex-urgent-title">
                    <span className="ex-urgent__flag">긴급</span>
                    오늘 놓치면 마감 차량
                  </h1>
                  <p className="ex-urgent__desc">출고 대기 없이 바로 인도 가능한 재고 차량입니다. 계약 순서에 따라 조기 마감됩니다.</p>
                </div>
                <UrgentTimer deadline={urgentDeadline} />
              </div>
              <div className="ex-urgent__grid">
                {urgentCards.map((car) => (
                  <ExpressCard key={car.id} car={car} urgent source="express-deals-urgent" />
                ))}
              </div>
              <p className="ex-urgent__note">* 재고 수량과 마감일은 계약 진행 상황에 따라 변동될 수 있습니다.</p>
            </section>
          )}

          <section className="ex-brands-section" aria-labelledby="ex-brand-title">
            <div className="ex-section-head">
              <h2 className="ex-section-title" id="ex-brand-title">
                제조사
              </h2>
            </div>
            <BrandFilter value={maker} onChange={selectMaker} />
          </section>

          <section className="ex-list-section" aria-labelledby="ex-list-title">
            <div className="ex-section-head">
              <h2 className="ex-section-title" id="ex-list-title">
                차량선택
              </h2>
              <p className="ex-section-count">
                <strong>{listCards.length.toLocaleString('ko-KR')}</strong>대
              </p>
            </div>
            <p className="ex-list-notice">* 동일 차량 라인에 여러 할인율이 있을 경우 가장 높은 할인율 기준으로 표시됩니다.</p>

            {listLoading ? (
              <p className="ex-empty">재고 차량을 불러오는 중입니다...</p>
            ) : listQuery.isError && listCards.length === 0 ? (
              <p className="ex-empty">재고 차량을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
            ) : listCards.length === 0 ? (
              <p className="ex-empty">해당 제조사의 재고 차량을 준비 중입니다.</p>
            ) : (
              <div className="ex-grid">
                {shown.map((car) => (
                  <ExpressCard key={car.id} car={car} source="express-deals-list" />
                ))}
              </div>
            )}

            {rest > 0 && (
              <div className="ex-more">
                <button className="ex-more__btn" type="button" onClick={() => setVisible((count) => count + EXPRESS_PAGE_SIZE)}>
                  차량 더보기 ({rest})
                </button>
              </div>
            )}
          </section>

          <p className="disclaimer">* 재고 특가 혜택은 재고 소진 시 예고 없이 종료될 수 있습니다.</p>
        </div>
      </section>
    </div>
  );
};

export default ExpressDeals;
