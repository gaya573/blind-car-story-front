import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import { MobileSubHeader } from '../../bcs/layout/MobileLayout';
import { SITE_NAME } from '../../bcs/site';
import { contentAPI } from '../../services/contentApi.js';
import { carAPI } from '../../services/carApi.js';
import { API_BASE_URL } from '../../config/apiConfig';
import { useCarBrandsQuery } from '../../hooks/queries/carQueries';
import { useDebounce } from '../../hooks/useDebounce';
import { useVehicleNavigation } from '../../bcs/useVehicleNavigation';
import { getPreferredBrandLabel } from '../../config/brandPriority';
import MobileBrandGrid from './MobileBrandGrid';
import MobileReviewCard from './MobileReviewCard';
import { MOBILE_BRAND_GROUPS } from './brandGroups';

const FALLBACK_IMAGE = '/bcs/images/cars/car-sedan.svg';
const TABS = [
  { key: 'all', label: '전체' },
  { key: 'car', label: '차량' },
  { key: 'review', label: '출고후기' },
];

// 검색 결과 썸네일 주소가 "/..." 로 오면 API 서버 기준으로 보정한다.
const normalizeImageUrl = (url) => {
  const trimmed = typeof url === 'string' ? url.trim() : '';
  if (!trimmed) return FALLBACK_IMAGE;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return `${(API_BASE_URL || '').replace(/\/+$/, '')}${trimmed}`;
  return trimmed;
};

const resultsPath = (params) => `/m/search/results?${new URLSearchParams(params).toString()}`;

const detailPath = (vehicleLineId, trimId) => {
  if (vehicleLineId) {
    return `/m/car-detail/${encodeURIComponent(vehicleLineId)}${trimId ? `?trimId=${encodeURIComponent(trimId)}` : ''}`;
  }
  return `/m/car-detail/${encodeURIComponent(trimId)}`;
};

const matchesKeyword = (review, keyword) =>
  [review.title, review.subtitle, review.description, review.content, review.carModel, review.model, review.authorName, review.extraInfo]
    .filter(Boolean)
    .some((field) => String(field).toLowerCase().includes(keyword));

/** 차량 키워드 검색 (/m/search/find). 퍼블리싱 m-search 계열 클래스로 그린다. */
export default function MobileSearch() {
  const [value, setValue] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const keyword = useDebounce(value.trim(), 300);
  const goToDetail = useVehicleNavigation();

  const carQuery = useQuery({
    queryKey: ['mobile-search', 'cars', keyword],
    queryFn: () => carAPI.searchTrims({ keyword, limit: 5 }),
    enabled: keyword.length > 0,
    staleTime: 1000 * 30,
  });

  // 후기 검색은 공개 후기 목록 안에서 거른다.
  const reviewQuery = useQuery({
    queryKey: ['mobile-search', 'reviews'],
    queryFn: () => contentAPI.getReviews(100),
    staleTime: 1000 * 60 * 5,
  });

  const brandsQuery = useCarBrandsQuery();
  const brandLabelById = useMemo(() => {
    const brands = Array.isArray(brandsQuery.data) ? brandsQuery.data : [];
    return Object.fromEntries(brands.map((brand) => [brand.id, getPreferredBrandLabel(brand)]));
  }, [brandsQuery.data]);

  const suggestions = useMemo(() => {
    const data = carQuery.data ?? {};
    const brandRows = (data.brands ?? []).slice(0, 5).map((brand) => ({
      key: `brand-${brand.id}`,
      label: getPreferredBrandLabel(brand),
      thumb: brand.logoUrl || '',
      to: resultsPath({ brand: brand.name }),
    }));
    const lineRows = (data.vehicleLines ?? []).slice(0, 5).map((line) => {
      const brandName = brandLabelById[line.brandId] || '';
      return {
        key: `line-${line.id}`,
        label: brandName ? `${brandName} - ${line.name}` : line.name,
        thumb: normalizeImageUrl(line.imageUrl || line.thumbnailUrl || line.mainImageUrl),
        to: resultsPath(brandName ? { brand: brandName, keyword: line.name } : { keyword: line.name }),
      };
    });
    const trimRows = (data.trims ?? []).slice(0, 5).map((trim) => {
      const brandName = brandLabelById[trim.brandId] || '';
      const vehicleLineId = trim.vehicleLineId || trim.vehicleLine_id || trim.vehicleLine?.id || null;
      return {
        key: `trim-${trim.id}`,
        label: brandName ? `${brandName} - ${trim.name}` : trim.name,
        thumb: normalizeImageUrl(trim.imageUrl || trim.thumbnailUrl || trim.mainImageUrl || trim.images?.[0]),
        to: detailPath(vehicleLineId, trim.id),
        // 검색 API 트림에는 차량 라인 id가 없어서, 트림 상세로 차량 라인을 찾아 이동한다.
        vehicle: vehicleLineId ? null : { trimId: trim.id },
      };
    });
    return [...brandRows, ...lineRows, ...trimRows].slice(0, 7);
  }, [carQuery.data, brandLabelById]);

  const reviews = useMemo(() => {
    const list = Array.isArray(reviewQuery.data) ? reviewQuery.data : [];
    if (!keyword) return list.slice(0, 5);
    const lower = keyword.toLowerCase();
    return list.filter((review) => matchesKeyword(review, lower)).slice(0, 5);
  }, [reviewQuery.data, keyword]);

  const showCars = activeTab !== 'review';
  const showReviews = activeTab !== 'car';
  const searching = keyword.length > 0;

  return (
    <>
      <SeoHelmet title={`차량 검색 | ${SITE_NAME}`} description={`${SITE_NAME} 차량 검색. 브랜드·모델·트림 이름으로 차량과 출고후기를 찾아보세요.`} />
      <MobileSubHeader title="차량 검색" />
      <main id="main-content">
        <div className="m-pagehead" style={{ paddingBottom: 12 }}>
          <h1>
            찾으실 차량을 <em>검색해주세요</em>
          </h1>
          <p>브랜드, 모델, 트림 이름으로 차량과 출고후기를 찾아보세요.</p>
        </div>

        <form className="field" role="search" style={{ padding: '0 16px 14px' }} onSubmit={(event) => event.preventDefault()}>
          <label className="visually-hidden" htmlFor="m-search-keyword">
            검색어
          </label>
          <input
            id="m-search-keyword"
            type="search"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="찾으실 차량을 검색해주세요"
            autoComplete="off"
            enterKeyHint="search"
          />
        </form>

        <div className="m-chips" role="group" aria-label="검색 구분">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`m-chip${activeTab === tab.key ? ' is-active' : ''}`}
              type="button"
              aria-pressed={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {showCars && !searching
          ? MOBILE_BRAND_GROUPS.map((group) => (
              <section key={group.origin} className="m-brandgroup">
                <h2 className="m-brandgroup__title">{group.label}</h2>
                <MobileBrandGrid origin={group.origin} brands={group.brands} />
              </section>
            ))
          : null}

        {showCars && searching ? (
          <section aria-label="차량 검색 결과">
            {carQuery.isPending ? <p className="m-empty">검색 중...</p> : null}
            {!carQuery.isPending && suggestions.length === 0 ? <p className="m-empty">검색 결과가 없습니다.</p> : null}
            {suggestions.length > 0 ? (
              <nav className="m-menulist" aria-label="차량 검색 결과">
                {suggestions.map((item) => (
                  <Link
                    key={item.key}
                    to={item.to}
                    onClick={(event) => {
                      if (!item.vehicle) return;
                      event.preventDefault();
                      goToDetail(item.vehicle);
                    }}
                  >
                    <img
                      src={item.thumb || FALLBACK_IMAGE}
                      alt=""
                      style={{ width: 40, height: 40, flexShrink: 0, padding: 4, borderRadius: 8, background: '#f6f6f7', objectFit: 'contain' }}
                    />
                    <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14 }}>{item.label}</span>
                  </Link>
                ))}
              </nav>
            ) : null}
          </section>
        ) : null}

        {showReviews ? (
          <section className="m-section" aria-labelledby="m-search-review-title">
            <div className="m-section__head">
              <h2 id="m-search-review-title">출고후기</h2>
              <Link to="/m/review">
                전체보기 <span aria-hidden="true">›</span>
              </Link>
            </div>
            {reviewQuery.isPending ? <p className="m-empty">불러오는 중...</p> : null}
            {!reviewQuery.isPending && reviews.length === 0 ? (
              <p className="m-empty">{searching ? '검색 결과가 없습니다.' : '출고후기 콘텐츠는 준비 중입니다.'}</p>
            ) : null}
            {reviews.length > 0 ? (
              <div className="m-review-slider" role="region" aria-label="출고후기 목록">
                <div className="m-review-track">
                  {reviews.map((review) => (
                    <MobileReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </main>
    </>
  );
}
