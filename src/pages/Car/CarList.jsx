import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCarBrandsQuery, useCarListInfiniteQueryV3 } from '../../hooks/queries/carQueries';
import { carAPI } from '../../services/carApi';
import { coalitionAPI, COALITION_PAGE_TYPE } from '../../services/coalitionApi';
import { PRIMARY_DOMESTIC_BRANDS, PRIMARY_DOMESTIC_BRAND_NAMES, FALLBACK_IMPORT_BRANDS } from '../../config/brandLogos';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import { getPageSeo } from '../../config/seoConfig';
import { useBcsUi } from '../../bcs/BcsUiContext';
import { formatWon } from '../../bcs/format';
import {
  buildBrandNameMap,
  buildCarCard,
  isSameBrandName,
  matchesKeyword,
  normalizeBrandAliasKey,
  processListItems,
  resolveBrandInfo,
  resolveDetailPath,
} from './carListModel';
import { brandDisplayLabel, resolveBrandLogoUrl } from './carBrandLogos';
import './CarPages.css';

const PAGE_SIZE = 12;
// 검색어가 있을 때는 목록 전체를 한 번에 받아 화면에서 거른다(국산 약 100대, 수입 약 250대).
const KEYWORD_FETCH_LIMIT = 1000;
const BRAND_SCROLL_STEP = 240;
const PLACEHOLDER_IMAGE = '/bcs/images/cars/car-sedan.svg';

const CATEGORY = {
  domestic: {
    label: '국산차',
    country: 'KR',
    apiCarType: '국산',
    bannerType: COALITION_PAGE_TYPE.DOMESTIC,
    hero: {
      src: '/bcs/images/banner/hero-domestic.png',
      alt: '블라인드 카스토리 국산차 비교견적 - 국산차 공식 혜택 한 번에 비교. 브랜드별 프로모션부터 빠른 출고 정보까지 한눈에 확인해보세요.',
    },
  },
  imported: {
    label: '수입차',
    country: '수입',
    apiCarType: '수입',
    bannerType: COALITION_PAGE_TYPE.IMPORTED,
    hero: {
      src: '/bcs/images/banner/hero-imported.png',
      alt: '블라인드 카스토리 수입차 비교견적 - 수입차 공식 할인 한 번에 비교. 브랜드별 프로모션부터 재고·출고 일정까지 빠르게 확인해보세요.',
    },
  },
};

const listOf = (value) => (Array.isArray(value) ? value : []);

// 퍼블리싱 carlist.js formatDiscount. 기존 카드처럼 만원 미만은 버린다.
const formatDiscount = (value) =>
  value >= 10000 ? `-${Math.floor(value / 10000).toLocaleString('ko-KR')}만원 할인` : `-${value.toLocaleString('ko-KR')}원 할인`;

const PrevIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 5l-7 7 7 7" />
  </svg>
);
const NextIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 5l7 7-7 7" />
  </svg>
);

function CarListHero({ banner, fallback }) {
  const src = banner?.imageUrl || banner?.image_url;
  if (!src) {
    return (
      <div className="cl-hero">
        <img className="cl-hero__image" src={fallback.src} alt={fallback.alt} />
      </div>
    );
  }
  const link = banner.linkUrl || banner.link_url;
  const image = <img className="cl-hero__image" src={src} alt={banner.title || fallback.alt} />;
  if (!link) return <div className="cl-hero">{image}</div>;
  const external = /^https?:\/\//.test(link);
  return (
    <div className="cl-hero">
      {external ? (
        <a href={link} target="_blank" rel="noopener noreferrer">
          {image}
        </a>
      ) : (
        <Link to={link}>{image}</Link>
      )}
    </div>
  );
}

function CarListCard({ car, brandLabel, isImported, source, onOpen }) {
  const { openQuote } = useBcsUi();
  const title = car.modelName || car.name || car.vehicleLineName || '차량';
  const trimName = car.representativeTrimName || car.vehicleLineDescription || title;
  const hasBasePrice = car.basePrice > 0;
  const hasDiscount = hasBasePrice && car.discountAmount > 0;
  const { prepayment30, deposit30, noDeposit } = car.monthlyFees;
  const monthlyRows = [
    ['선납금 30%', prepayment30],
    ['보증금 30%', deposit30],
    ['완전무보증', noDeposit],
  ];

  return (
    <article
      className="cl-card"
      data-car-id={car.id}
      data-brand-id={car.brandId}
      role="link"
      tabIndex={0}
      onClick={() => onOpen(car)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onOpen(car);
      }}
    >
      <div className="cl-card__head">
        <span className="cl-card__brand">{brandLabel}</span>
      </div>
      <div className="cl-card__media">
        <img
          src={car.imageUrl || PLACEHOLDER_IMAGE}
          alt={title}
          loading="lazy"
          onError={(event) => {
            if (!event.currentTarget.src.endsWith(PLACEHOLDER_IMAGE)) event.currentTarget.src = PLACEHOLDER_IMAGE;
          }}
        />
      </div>
      <div className="cl-card__body">
        <h3 className="cl-card__name">{title}</h3>
        <p className="cl-card__trim">{trimName}</p>
        {isImported ? (
          <dl className="cl-card__prices">
            <div className="cl-price-row">
              <dt>차량 가격</dt>
              <dd className={`cl-price-base${hasDiscount ? '' : ' is-plain'}`}>{hasBasePrice ? formatWon(car.basePrice) : '가격 문의'}</dd>
            </div>
            <div className="cl-price-row">
              <dt>{hasDiscount ? '최대할인가' : '할인율변동'}</dt>
              <dd>
                <span className="cl-price-discount">{hasDiscount ? formatDiscount(car.discountAmount) : '상담후 최저가 안내'}</span>
              </dd>
            </div>
            <div className="cl-price-row cl-price-row--final">
              <dt>이달의 프로모션가</dt>
              <dd className="cl-price-final">
                {car.finalPrice > 0 ? formatWon(car.finalPrice) : hasBasePrice ? formatWon(car.basePrice) : '가격 문의'}
              </dd>
            </div>
          </dl>
        ) : (
          <dl className="cl-card__prices">
            <div className="cl-price-row">
              <dt>차량 가격</dt>
              <dd className="cl-price-base is-plain">{hasBasePrice ? `${formatWon(car.basePrice)}~` : '가격 문의'}</dd>
            </div>
            <div className="cl-price-row cl-price-row--label">
              <dt>월 렌탈료</dt>
            </div>
            {monthlyRows.map(([label, value]) => (
              <div className="cl-price-row" key={label}>
                <dt>
                  <span className="vehicle-chip">{label}</span>
                </dt>
                <dd className="cl-price-monthly">
                  {value > 0 ? (
                    <>
                      {value.toLocaleString('ko-KR')}
                      <span className="price-suffix">원</span>
                    </>
                  ) : (
                    '가격 문의'
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
        <button
          className="cl-card__cta"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            openQuote([title, car.representativeTrimName].filter(Boolean).join(' '), source);
          }}
        >
          실시간 무료견적 받기
        </button>
      </div>
    </article>
  );
}

const CarList = () => {
  const { carType: carTypeParam } = useParams();
  const carType = carTypeParam === 'imported' ? 'imported' : 'domestic';
  const otherType = carType === 'domestic' ? 'imported' : 'domestic';
  const category = CATEGORY[carType];
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const brandParam = searchParams.get('brand');
  const keyword = (searchParams.get('keyword') ?? '').trim();

  const [selectedBrandId, setSelectedBrandId] = useState(brandParam ? Number(brandParam) : undefined);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const brandTrackRef = useRef(null);
  const previousCarTypeRef = useRef(carType);

  // 국산/수입 탭을 바꾸면 브랜드 필터만 초기화한다. 검색어(keyword)는 탭을 옮겨도 유지한다.
  useEffect(() => {
    if (previousCarTypeRef.current === carType) return;
    previousCarTypeRef.current = carType;
    setSelectedBrandId(undefined);
    if (searchParams.has('brand')) {
      const next = new URLSearchParams(searchParams);
      next.delete('brand');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carType]);

  const { data: brandsData } = useCarBrandsQuery(category.country);
  const brands = listOf(brandsData);

  // URL 의 brand 가 바뀌거나 브랜드 목록이 준비되면 선택 상태를 맞춘다.
  useEffect(() => {
    if (!brandParam) {
      setSelectedBrandId(undefined);
      return;
    }
    if (!brands.length) return;
    const exists = brands.some((brand) => brand.id === Number(brandParam));
    setSelectedBrandId(exists ? Number(brandParam) : undefined);
  }, [brands, brandParam]);

  const manufacturers = useMemo(() => {
    const byKey = new Map(brands.map((brand) => [normalizeBrandAliasKey(brand.name), brand]));
    const toItem = (name, id) => ({ name, id, label: brandDisplayLabel(name), logoUrl: resolveBrandLogoUrl(name) });

    if (carType === 'imported') {
      const ordered = FALLBACK_IMPORT_BRANDS.map((fallback) => toItem(fallback.name, byKey.get(normalizeBrandAliasKey(fallback.name))?.id));
      brands
        .filter((brand) => !FALLBACK_IMPORT_BRANDS.some((fallback) => isSameBrandName(fallback.name, brand.name)))
        .forEach((brand) => ordered.push(toItem(brand.name, brand.id)));
      return ordered;
    }

    const primary = PRIMARY_DOMESTIC_BRANDS.map((item) => toItem(item.name, byKey.get(normalizeBrandAliasKey(item.name))?.id));
    const remaining = brands
      .filter((brand) => !PRIMARY_DOMESTIC_BRAND_NAMES.some((name) => isSameBrandName(name, brand.name)))
      .map((brand) => toItem(brand.name, brand.id));
    return [...primary, ...remaining].slice(0, 6);
  }, [brands, carType]);

  const brandNameMap = useMemo(() => buildBrandNameMap(brands), [brands]);
  const brandIdSet = useMemo(() => new Set(brands.filter((brand) => brand?.id != null).map((brand) => Number(brand.id))), [brands]);

  const bannerQuery = useQuery({
    queryKey: ['coalition', 'banners', category.bannerType, 'carlist'],
    queryFn: () => coalitionAPI.getBanners(category.bannerType),
    staleTime: 1000 * 60 * 5,
  });
  const banners = useMemo(() => {
    const data = bannerQuery.data;
    const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : data ? [data] : [];
    return items.filter((banner) => banner?.imageUrl || banner?.image_url);
  }, [bannerQuery.data]);

  const listParams = useMemo(
    () => ({ brandId: selectedBrandId, carType: category.apiCarType, limit: PAGE_SIZE, sort: 'percent_desc' }),
    [selectedBrandId, category.apiCarType],
  );
  const pagedQuery = useCarListInfiniteQueryV3(listParams);
  const { data: pagedData, fetchNextPage, hasNextPage, isFetchingNextPage } = pagedQuery;

  const keywordQuery = useQuery({
    queryKey: ['cars', 'list', 'v3', 'all', { brandId: selectedBrandId, carType: category.apiCarType }],
    queryFn: () =>
      carAPI.findTrimsV3({ brandId: selectedBrandId, carType: category.apiCarType, page: 1, limit: KEYWORD_FETCH_LIMIT, sort: 'percent_desc' }),
    enabled: Boolean(keyword),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [listParams, keyword]);

  const processOptions = { carType, brandIdSet, brandNameMap, selectedBrandId };
  const pagedItems = useMemo(
    () => processListItems((pagedData?.pages ?? []).flatMap((page) => page.items || []), processOptions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pagedData, carType, brandIdSet, brandNameMap, selectedBrandId],
  );
  const keywordItems = useMemo(
    () =>
      keyword
        ? processListItems(keywordQuery.data?.items ?? [], processOptions).filter((item) => matchesKeyword(item, keyword, brandNameMap))
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keyword, keywordQuery.data, carType, brandIdSet, brandNameMap, selectedBrandId],
  );

  const items = keyword ? keywordItems : pagedItems;
  const isLoading = keyword ? keywordQuery.isLoading : pagedQuery.isLoading;
  const isError = keyword ? keywordQuery.isError : pagedQuery.isError;
  const serverTotal = pagedData?.pages?.[0]?.pagination?.totalElements ?? 0;
  const totalCount = keyword || !hasNextPage ? items.length : Math.max(serverTotal, items.length);

  // 더보기로 늘어난 만큼 다음 페이지를 미리 받아 둔다.
  useEffect(() => {
    if (keyword || !hasNextPage || isFetchingNextPage) return;
    if (pagedItems.length < visibleCount + PAGE_SIZE) fetchNextPage().catch(() => {});
  }, [keyword, hasNextPage, isFetchingNextPage, pagedItems.length, visibleCount, fetchNextPage]);

  // 국산차에서 찾지 못한 검색어가 수입차(또는 반대)에 있는지 확인해 안내한다.
  const noMatch = Boolean(keyword) && !isLoading && !isError && items.length === 0;
  const otherCategory = CATEGORY[otherType];
  const { data: otherBrands } = useCarBrandsQuery(otherCategory.country, { enabled: noMatch });
  const otherQuery = useQuery({
    queryKey: ['cars', 'list', 'v3', 'all', { brandId: undefined, carType: otherCategory.apiCarType }],
    queryFn: () => carAPI.findTrimsV3({ carType: otherCategory.apiCarType, page: 1, limit: KEYWORD_FETCH_LIMIT, sort: 'percent_desc' }),
    enabled: noMatch,
    staleTime: 1000 * 60 * 5,
  });
  const otherMatchCount = useMemo(() => {
    if (!noMatch || !otherQuery.data) return 0;
    const list = listOf(otherBrands);
    const nameMap = buildBrandNameMap(list);
    const idSet = new Set(list.filter((brand) => brand?.id != null).map((brand) => Number(brand.id)));
    return processListItems(otherQuery.data.items ?? [], { carType: otherType, brandIdSet: idSet, brandNameMap: nameMap }).filter((item) =>
      matchesKeyword(item, keyword, nameMap),
    ).length;
  }, [noMatch, otherQuery.data, otherBrands, otherType, keyword]);

  const cards = useMemo(
    () => items.slice(0, visibleCount).map((item) => buildCarCard(item, carType)).filter(Boolean),
    [items, visibleCount, carType],
  );
  const restCount = Math.max(totalCount - Math.min(visibleCount, items.length), 0);
  const showMore = restCount > 0 && (keyword ? visibleCount < items.length : visibleCount < items.length || hasNextPage);

  const updateParams = (next) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') params.delete(key);
      else params.set(key, String(value));
    });
    params.delete('page');
    setSearchParams(params, { replace: true });
  };

  const selectBrand = (manufacturer) => {
    if (!manufacturer) {
      setSelectedBrandId(undefined);
      updateParams({ brand: undefined });
      return;
    }
    const fallbackBrand =
      brands.find((brand) => isSameBrandName(brand.name, manufacturer.name)) ||
      brands.find((brand) => {
        if (manufacturer.name === 'KG모빌리티') return brand.name.toLowerCase().includes('kg');
        if (manufacturer.name === '쉐보레') return brand.name.includes('쉐보레') || brand.name.includes('한국지엠');
        if (manufacturer.name === '르노코리아') return brand.name.replace(/\s+/g, '') === '르노코리아';
        return false;
      });
    const brandId = manufacturer.id ?? fallbackBrand?.id;
    setSelectedBrandId(brandId);
    updateParams({ brand: brandId });
  };

  const selectedManufacturer = selectedBrandId
    ? manufacturers.find((item) => item.id === selectedBrandId) ?? { id: selectedBrandId }
    : null;

  const openDetail = (car) => {
    const path = resolveDetailPath(car) ?? resolveDetailPath(cards[0]);
    if (path) navigate(path);
  };

  const scrollBrands = (direction) => brandTrackRef.current?.scrollBy?.({ left: direction * BRAND_SCROLL_STEP, behavior: 'smooth' });

  const categoryPath = (type) => `/carlist/${type}${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''}`;

  const { title: seoTitle, description: seoDescription, keywords: seoKeywords } = getPageSeo(`carlist-${carType}`);
  const primaryBanner = banners[0] ?? null;
  const seoImage = primaryBanner?.imageUrl || primaryBanner?.image_url || cards[0]?.imageUrl || undefined;

  let emptyMessage = null;
  if (isLoading) emptyMessage = '차량 정보를 불러오는 중입니다...';
  else if (isError) emptyMessage = '차량 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
  else if (!items.length) {
    emptyMessage = keyword
      ? `‘${keyword}’에 해당하는 ${category.label} 정보가 없습니다.`
      : '선택하신 제조사/조건에 맞는 차량이 없습니다. 다른 제조사나 조건으로 다시 선택해 주세요.';
  }

  return (
    <div className="bcs-page-carlist">
      <SeoHelmet title={seoTitle} description={seoDescription} keywords={seoKeywords} image={seoImage} />
      <section className="carlist-page">
        <div className="container">
          <nav className="breadcrumb" aria-label="현재 위치">
            <Link to="/">홈</Link>
            <span aria-hidden="true">›</span>
            <span data-crumb-current>{category.label} 견적내기</span>
          </nav>

          <CarListHero banner={primaryBanner} fallback={category.hero} />

          <div className="cl-tabs" role="tablist" aria-label="차량 구분">
            {Object.entries(CATEGORY).map(([type, info]) => (
              <button
                key={type}
                className={`cl-tab${type === carType ? ' is-active' : ''}`}
                type="button"
                role="tab"
                aria-selected={type === carType}
                onClick={() => {
                  if (type !== carType) navigate(categoryPath(type));
                }}
              >
                {info.label}
              </button>
            ))}
          </div>

          <div className="cl-brands">
            <button className="cl-brands__arrow cl-brands__arrow--prev" type="button" aria-label="브랜드 이전" onClick={() => scrollBrands(-1)}>
              <PrevIcon />
            </button>
            <div className="cl-brands__track" ref={brandTrackRef}>
              <button className={`cl-brand${selectedManufacturer ? '' : ' is-active'}`} type="button" aria-pressed={!selectedManufacturer} onClick={() => selectBrand(null)}>
                <span className="cl-brand__mark" aria-hidden="true">전체</span>
                <span className="cl-brand__name">전체</span>
              </button>
              {manufacturers.map((item) => {
                const active = Boolean(selectedManufacturer) && item.id != null && item.id === selectedManufacturer.id;
                return (
                  <button
                    key={item.name}
                    className={`cl-brand${active ? ' is-active' : ''}`}
                    type="button"
                    data-brand={item.id ?? ''}
                    aria-pressed={active}
                    onClick={() => selectBrand(item)}
                  >
                    <span className="cl-brand__mark" aria-hidden="true">{item.logoUrl ? <img src={item.logoUrl} alt="" /> : item.label}</span>
                    <span className="cl-brand__name">{item.label}</span>
                  </button>
                );
              })}
            </div>
            <button className="cl-brands__arrow cl-brands__arrow--next" type="button" aria-label="브랜드 다음" onClick={() => scrollBrands(1)}>
              <NextIcon />
            </button>
          </div>

          <div className="cl-listhead">
            <p className="cl-listhead__note">
              {keyword ? (
                <>
                  <strong className="cl-keyword">‘{keyword}’</strong> 검색 결과입니다.{' '}
                  <Link className="cl-keyword__clear" to={`/carlist/${carType}`}>
                    전체 차량 보기
                  </Link>
                </>
              ) : (
                '동일 차량 라인에 여러 할인율이 있을 경우 가장 높은 할인율 기준으로 표시됩니다.'
              )}
            </p>
            <p className="cl-listhead__count">
              <strong>{totalCount.toLocaleString('ko-KR')}</strong>대
            </p>
          </div>

          {cards.length > 0 && (
            <div className="cl-grid">
              {cards.map((car) => {
                const brandName = resolveBrandInfo(car.brandId, brands)?.name ?? '';
                return (
                  <CarListCard
                    key={car.id}
                    car={car}
                    brandLabel={brandDisplayLabel(brandName) || category.label}
                    isImported={carType === 'imported'}
                    source={`carlist-${carType}`}
                    onOpen={openDetail}
                  />
                );
              })}
            </div>
          )}
          {emptyMessage && (
            <p className="cl-empty" role="status">
              {emptyMessage}
              {noMatch && otherMatchCount > 0 && (
                <>
                  <br />
                  <Link to={`/carlist/${otherType}?keyword=${encodeURIComponent(keyword)}`}>
                    {otherCategory.label}에서 {otherMatchCount.toLocaleString('ko-KR')}대를 찾았습니다. {otherCategory.label} 보기 →
                  </Link>
                </>
              )}
            </p>
          )}

          {showMore && (
            <div className="cl-more">
              <button className="cl-more__btn" type="button" disabled={isFetchingNextPage} onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
                차량 더보기 ({restCount.toLocaleString('ko-KR')})
              </button>
            </div>
          )}

          <p className="disclaimer">* 표기 가격·할인 조건은 계약 조건과 재고 상황에 따라 달라질 수 있습니다.</p>
        </div>
      </section>
    </div>
  );
};

export default CarList;
