import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { contentAPI } from '../../services/contentApi';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import { getPageSeo } from '../../config/seoConfig';
import ConsultBannerForm from '../../bcs/components/ConsultBannerForm';
import ExpressCard from './ExpressCard';
import { EXPRESS_PAGE_SIZE, compareByDeadline, isExpired, toExpressCard } from './expressModel';
import './express-bcs.css';

/**
 * 재고 특가 전체보기. 퍼블리싱 전용 화면이 없어 재고 특가 핫딜의 "차량선택" 목록 구성을 그대로 쓴다.
 */
const ExpressDealsAll = () => {
  const [visible, setVisible] = useState(EXPRESS_PAGE_SIZE);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['express-deals', 'all'],
    queryFn: () => contentAPI.getUrgentInventory(100, null, null, null),
    staleTime: 1000 * 60,
  });

  const cards = useMemo(
    () =>
      (Array.isArray(data) ? data : [])
        .filter((item) => !isExpired(item))
        .sort(compareByDeadline)
        .map(toExpressCard),
    [data],
  );
  const shown = cards.slice(0, visible);
  const rest = cards.length - shown.length;

  const { title: seoTitle, description: seoDescription, keywords: seoKeywords } = getPageSeo('express-deals');

  return (
    <div className="bcs-page-express">
      <SeoHelmet title={`[전체보기] ${seoTitle}`} description={seoDescription} keywords={seoKeywords} image={cards[0]?.imageUrl || undefined} />
      <section className="express-page">
        <div className="container">
          <nav className="ex-breadcrumb" aria-label="현재 위치">
            <Link to="/">홈</Link>
            <span aria-hidden="true">›</span>
            <Link to="/express-deals">재고 특가 핫딜</Link>
            <span aria-hidden="true">›</span>
            <strong>전체 보기</strong>
          </nav>

          <section className="ex-list-section ex-list-section--top" aria-labelledby="ex-all-title">
            <div className="ex-section-head">
              <h1 className="ex-section-title" id="ex-all-title">
                재고 특가 전체 차량
              </h1>
              <p className="ex-section-count">
                <strong>{cards.length.toLocaleString('ko-KR')}</strong>대
              </p>
            </div>
            <p className="ex-list-notice">* 마감이 빠른 순서로 표시됩니다. 계약 순서에 따라 조기 마감될 수 있습니다.</p>

            {isLoading ? (
              <p className="ex-empty">재고 차량을 불러오는 중입니다...</p>
            ) : isError && cards.length === 0 ? (
              <p className="ex-empty">재고 차량을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
            ) : cards.length === 0 ? (
              <p className="ex-empty">재고 차량을 준비 중입니다.</p>
            ) : (
              <div className="ex-grid">
                {shown.map((car) => (
                  <ExpressCard key={car.id} car={car} source="express-deals-all" />
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

          <ConsultBannerForm idPrefix="express-all-banner" source="express-deals-all-bottom" entryLabel="재고 특가 전체보기 상담 배너" />

          <p className="disclaimer">* 재고 특가 혜택은 재고 소진 시 예고 없이 종료될 수 있습니다.</p>
        </div>
      </section>
    </div>
  );
};

export default ExpressDealsAll;
