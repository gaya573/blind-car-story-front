import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import { getPageSeo } from '../../config/seoConfig';
import { useCarBrandsQuery } from '../../hooks/queries/carQueries';
import { brandLogoUrl, isSameBrand } from '../ExpressDeals/brandMarks';
import { PromotionGrid, PromotionTabs } from './Promotion';
import { promotionListQuery, resolveTab } from './promotionModel';
import './promotion-bcs.css';

const ALL = '전체';

/** 기획전의 브랜드: 추가정보(extraInfo) 우선, 없으면 제목 속 브랜드 이름. */
const brandOf = (item, brands) => {
  if (item?.extraInfo) return item.extraInfo;
  const title = String(item?.title ?? '');
  return brands.find((brand) => brand?.name && title.includes(brand.name))?.name ?? '';
};

/**
 * 브랜드별 혜택 전체. 퍼블리싱 전용 화면이 없어 브랜드별 혜택(promotion.html) 구성에
 * 재고 특가 핫딜의 제조사 필터(.ex-brands)를 더했다. 그래서 두 페이지 범위 클래스를 함께 단다.
 */
export default function PromotionBrands() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = resolveTab(searchParams.get('tab'));
  const maker = searchParams.get('maker') || ALL;

  const { data, isLoading, isError } = useQuery(promotionListQuery(tab));
  const { data: brandsData } = useCarBrandsQuery();
  const brands = useMemo(() => (Array.isArray(brandsData) ? brandsData : []), [brandsData]);
  const items = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const brandNames = useMemo(() => {
    const names = [];
    items.forEach((item) => {
      const name = brandOf(item, brands);
      if (name && !names.some((known) => isSameBrand(known, name))) names.push(name);
    });
    if (maker !== ALL && !names.some((known) => isSameBrand(known, maker))) names.push(maker);
    return [ALL, ...names.sort((a, b) => a.localeCompare(b, 'ko'))];
  }, [items, brands, maker]);

  const displayed = useMemo(() => {
    if (maker === ALL) return items;
    return items.filter((item) => isSameBrand(brandOf(item, brands), maker) || String(item.title ?? '').includes(maker));
  }, [items, brands, maker]);

  const updateParams = (next) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (!value || value === ALL || (key === 'tab' && value === 'active')) params.delete(key);
      else params.set(key, value);
    });
    setSearchParams(params, { replace: true });
  };

  const { title: seoTitle, description: seoDescription, keywords: seoKeywords } = getPageSeo('promotion');

  return (
    <div className="bcs-page-promotion bcs-page-express">
      <SeoHelmet title={`[브랜드별 전체] ${seoTitle}`} description={seoDescription} keywords={seoKeywords} />
      <section className="promotion-page">
        <div className="container">
          <nav className="pm-breadcrumb" aria-label="현재 위치">
            <Link to="/">홈</Link>
            <span aria-hidden="true">›</span>
            <Link to="/promotion">브랜드별 혜택</Link>
            <span aria-hidden="true">›</span>
            <strong>브랜드별 혜택 전체</strong>
          </nav>

          <div className="pm-header">
            <h1 className="pm-header__title">
              <em>브랜드별</em> 혜택 전체
            </h1>
            <p className="pm-header__sub">브랜드 선택 후, 진행중/종료된 기획전을 확인하세요</p>
          </div>

          <PromotionTabs value={tab} onChange={(value) => updateParams({ tab: value })} />

          <div className="ex-brands pm-brand-filter" aria-label="브랜드 선택">
            {brandNames.map((name) => {
              const active = name === maker || (maker !== ALL && isSameBrand(name, maker));
              const logo = name === ALL ? '' : brandLogoUrl(name);
              return (
                <button
                  key={name}
                  type="button"
                  className={`ex-brand${active ? ' is-active' : ''}`}
                  aria-pressed={active}
                  onClick={() => updateParams({ maker: name })}
                >
                  <span className="ex-brand__mark">{logo ? <img src={logo} alt="" /> : name}</span>
                  <span className="ex-brand__name">{name}</span>
                </button>
              );
            })}
          </div>

          <div className="pm-listhead">
            <p className="pm-listhead__note">브랜드·제휴사 조건에 따라 혜택 내용과 적용 기간이 다를 수 있습니다.</p>
            <p className="pm-listhead__count">
              <strong>{displayed.length.toLocaleString('ko-KR')}</strong>건
            </p>
          </div>

          <PromotionGrid items={displayed} isLoading={isLoading} isError={isError} ended={tab === 'ended'} />

          <p className="disclaimer">* 기획전 혜택은 제휴사 조건과 재고 상황에 따라 변경될 수 있습니다.</p>
        </div>
      </section>
    </div>
  );
}
