import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import { getPageSeo } from '../../config/seoConfig';
import PromotionTileCard from './PromotionTileCard';
import { PROMOTION_TABS, promotionListQuery, toPromotionModel } from './promotionModel';
import './promotion-bcs.css';

export function PromotionTabs({ value, onChange }) {
  return (
    <div className="pm-tabs" role="tablist" aria-label="기획전 구분">
      {PROMOTION_TABS.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            className={`pm-tab${active ? ' is-active' : ''}`}
            role="tab"
            aria-selected={active}
            data-promo-tab={tab.value}
            onClick={() => onChange(tab.value)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/** 목록 상태(불러오는 중·오류·빈 목록)와 카드 그리드. 브랜드별 혜택 전체 화면도 함께 쓴다. */
export function PromotionGrid({ items, isLoading, isError, ended }) {
  const promos = useMemo(
    () => items.map((item, index) => ({ raw: item, promo: toPromotionModel(item, { ended, index }) })),
    [items, ended],
  );

  if (isLoading) return <p className="pm-empty">기획전을 불러오는 중입니다...</p>;
  if (isError && promos.length === 0) return <p className="pm-empty">기획전 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>;
  if (promos.length === 0) return <p className="pm-empty">해당 구분의 기획전을 준비 중입니다.</p>;
  return (
    <div className="pm-grid">
      {promos.map(({ raw, promo }) => (
        <PromotionTileCard key={promo.id} promo={promo} raw={raw} />
      ))}
    </div>
  );
}

export default function Promotion() {
  const [tab, setTab] = useState('active');
  const { data, isLoading, isError } = useQuery(promotionListQuery(tab));
  const items = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const { title: seoTitle, description: seoDescription, keywords: seoKeywords } = getPageSeo('promotion');

  return (
    <div className="bcs-page-promotion">
      <SeoHelmet title={seoTitle} description={seoDescription} keywords={seoKeywords} image={items[0]?.imageUrl || undefined} />
      <section className="promotion-page">
        <div className="container">
          <nav className="pm-breadcrumb" aria-label="현재 위치">
            <Link to="/">홈</Link>
            <span aria-hidden="true">›</span>
            <strong>브랜드별 혜택</strong>
          </nav>

          <div className="pm-header">
            <h1 className="pm-header__title">
              <em>브랜드별</em> 혜택
            </h1>
            <p className="pm-header__sub">블라인드 카스토리가 제안하는 브랜드 혜택, 지금 확인해보세요</p>
          </div>

          <PromotionTabs value={tab} onChange={setTab} />

          <div className="pm-listhead">
            <p className="pm-listhead__note">브랜드·제휴사 조건에 따라 혜택 내용과 적용 기간이 다를 수 있습니다.</p>
            <p className="pm-listhead__count">
              <strong>{items.length.toLocaleString('ko-KR')}</strong>건
            </p>
          </div>

          <PromotionGrid items={items} isLoading={isLoading} isError={isError} ended={tab === 'ended'} />

          <p className="disclaimer">* 기획전 혜택은 제휴사 조건과 재고 상황에 따라 변경될 수 있습니다.</p>
        </div>
      </section>
    </div>
  );
}
