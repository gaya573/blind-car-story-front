import React, { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import { MobileSubHeader } from '../../bcs/layout/MobileLayout';
import { useBcsUi } from '../../bcs/BcsUiContext';
import { useVehicleNavigation } from '../../bcs/useVehicleNavigation';
import { formatMonthly, formatWon, formatWonTilde } from '../../bcs/format';
import { SITE_NAME } from '../../bcs/site';
import VehicleCard from '../../bcs/components/VehicleCard';
import { carAPI } from '../../services/carApi';
import { useCarBrandsQuery } from '../../hooks/queries/carQueries';
import { getPreferredBrandLabel, isSameBrandName, sortBrandsByPriority } from '../../config/brandPriority';

// 퍼블리싱 mobile-pages.js renderResults 의 PAGE_SIZE
const PAGE_SIZE = 8;

const ORIGIN_LABEL = { domestic: '국산차', imported: '수입차' };

// 차량 종류·연료 (필터 화면 표기 → API 값)
const CAR_TYPE_MAP = {
  '경·소형 승용': '소형',
  '중형 승용': '중형',
  '대형 승용': '대형',
  'SUV·RV': 'SUV',
  '화물·승합': '화물',
};

const FUEL_MAP = {
  가솔린: '가솔린',
  '디젤(경유)': '디젤',
  LPG: 'LPG',
  하이브리드: '하이브리드',
  '전기·수소': '전기',
};

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const splitParam = (value) =>
  value
    ? value
        .replace(/\+/g, ' ')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const normalizeOrigin = (value) => {
  if (value === 'domestic') return 'domestic';
  if (value === 'import' || value === 'imported') return 'imported';
  return '';
};

const hasValue = (value) => value !== null && value !== undefined && value !== '';

/**
 * v3 차량 라인 응답을 카드 모델로 바꾼다. 가격·할인은 대표 트림 값을 우선 쓰고,
 * 없으면 차량 라인 대표값(representative*)을 쓴다.
 */
const toResultCardModel = (line, brandLabelById = {}) => {
  const trims = Array.isArray(line.trims) ? line.trims : [];
  const trim = trims.find((item) => item.id === line.representativeTrimId) || trims[0] || {};
  const trimBase = toNumber(trim.basePrice ?? trim.price);
  const trimDiscounted = toNumber(trim.discountInfo?.discountedPrice ?? trim.discountedPrice ?? trim.finalPrice);
  const lineFinal = toNumber(line.representativeFinalPrice);
  const basePrice = trimBase || toNumber(line.basePrice) || lineFinal;

  let finalPrice = trimDiscounted || lineFinal || basePrice;
  let discount = toNumber(line.representativeDiscountAmount);
  if (trimBase && trimDiscounted && trimDiscounted < trimBase) {
    discount = trimBase - trimDiscounted;
    finalPrice = trimDiscounted;
  } else if (discount > 0 && basePrice) {
    finalPrice = basePrice - discount;
  }
  const discountRate = discount > 0 && basePrice > 0 ? Math.round((discount / basePrice) * 100) : 0;

  return {
    id: line.vehicleLineId ?? line.id ?? line.modelId,
    vehicleLineId: line.vehicleLineId ?? line.id,
    trimId: line.representativeTrimId ?? trim.id,
    brandName: line.brandName || brandLabelById[line.brandId] || '',
    vehicleName: line.modelName?.trim() || line.vehicleLineName || line.name || '',
    trimName: line.representativeTrimName || trim.name || '',
    imageUrl: line.imageUrl || trim.imageUrl || '',
    basePrice: basePrice || null,
    finalPrice: finalPrice || null,
    discount,
    discountRate,
    prepayment30: trim.lowestPrepayment30MonthlyFee ?? trim.lowest_prepayment_30_monthly_fee ?? null,
    deposit30: trim.lowestDeposit30MonthlyFee ?? trim.lowest_deposit_30_monthly_fee ?? null,
    noDeposit: trim.lowestNoDepositMonthlyFee ?? trim.lowest_no_deposit_monthly_fee ?? null,
    remainingDays: null,
  };
};

/**
 * 퍼블리싱 resultCard (vehicle-card). 할인이 있으면 기존가격 · 할인가격 · 최종가격을,
 * 할인도 월 렌탈료도 없으면 차량가격만 보여준다.
 */
function ResultCard({ car }) {
  const { openQuote } = useBcsUi();
  const goToDetail = useVehicleNavigation();
  const open = () => goToDetail(car);
  const discounted = car.discount > 0;

  return (
    <article
      className="vehicle-card"
      data-trim-id={car.trimId ?? ''}
      data-vehicle-line-id={car.vehicleLineId ?? ''}
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === 'Enter') open();
      }}
    >
      <div className="vehicle-card__media">
        {car.brandName ? <span className="vehicle-card__brand">{car.brandName}</span> : null}
        {discounted ? <span className="vehicle-card__badge vehicle-card__badge--discount">{car.discountRate}% 할인</span> : null}
        <img className="vehicle-image" src={car.imageUrl || '/bcs/images/cars/car-sedan.svg'} alt={car.vehicleName} loading="lazy" />
      </div>
      <div className="vehicle-card__body">
        <div>
          <h3 className="vehicle-name">{car.vehicleName}</h3>
          <p className="vehicle-trim">{car.trimName}</p>
        </div>
        <div className="vehicle-price-block">
          {discounted ? (
            <>
              <div className="vehicle-price-row">
                <span className="vehicle-price-label">기존가격</span>
                <span className="vehicle-base-price vehicle-base-price--strike">{formatWonTilde(car.basePrice)}</span>
              </div>
              <div className="vehicle-price-row">
                <span className="vehicle-price-label">할인가격</span>
                <span className="vehicle-off-price">-{formatWon(car.discount)}</span>
              </div>
            </>
          ) : null}
          <div className="vehicle-monthly-row">
            <span className="vehicle-chip">{discounted ? '최종가격' : '차량가격'}</span>
            <strong className="vehicle-amount">
              {formatMonthly(car.finalPrice)}
              <span className="price-suffix">원~</span>
            </strong>
          </div>
        </div>
        <button
          className="vehicle-cta"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            openQuote([car.vehicleName, car.trimName].filter(Boolean).join(' '), 'mobile-search-results');
          }}
        >
          실시간 무료견적 받기
        </button>
      </div>
    </article>
  );
}

/** 퍼블리싱 pages/m-search-results.html. URL 조건: carOrigin, brand, types, fuels, keyword */
export default function MobleCarSearchResult() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const origin = normalizeOrigin(searchParams.get('carOrigin'));
  const brandNames = splitParam(searchParams.get('brand'));
  const types = splitParam(searchParams.get('types'));
  const fuelNames = splitParam(searchParams.get('fuels'));
  const keyword = searchParams.get('keyword')?.trim() || '';

  const brandsQuery = useCarBrandsQuery();
  const brands = useMemo(() => (Array.isArray(brandsQuery.data) ? brandsQuery.data : []), [brandsQuery.data]);
  const brandLabelById = useMemo(
    () => Object.fromEntries(brands.map((brand) => [brand.id, getPreferredBrandLabel(brand)])),
    [brands],
  );

  // 칩: 국산/수입 구분에 맞는 브랜드만 우선순위대로
  const chipBrands = useMemo(() => {
    const list = brands.filter((brand) => {
      if (origin === 'domestic') return brand.country === 'KR';
      if (origin === 'imported') return brand.country !== 'KR';
      return true;
    });
    return sortBrandsByPriority(list);
  }, [brands, origin]);

  const selectedBrand = brandNames.length ? brands.find((brand) => isSameBrandName(brand.name, brandNames[0])) : null;
  // 브랜드 이름을 id로 바꿀 수 있을 때까지 목록을 부르지 않는다. 목록에 없는 브랜드면 준비 중 안내를 띄운다.
  const brandPending = brandNames.length > 0 && !selectedBrand && brandsQuery.isPending;
  const unknownBrand = brandNames.length > 0 && !selectedBrand && !brandPending;

  const carType = types.map((type) => CAR_TYPE_MAP[type]).find(Boolean) ?? (origin === 'domestic' ? '국산' : origin === 'imported' ? '수입' : undefined);
  const fuel = fuelNames.map((name) => FUEL_MAP[name]).find(Boolean);

  const params = { brandId: selectedBrand?.id, carType, fuel, keyword: keyword || undefined, sort: 'percent_desc' };
  const listQuery = useInfiniteQuery({
    queryKey: ['cars', 'list', 'infinite', 'v3', params],
    queryFn: ({ pageParam = 1 }) => carAPI.findTrimsV3({ ...params, page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.pagination;
      return pagination && pagination.page < pagination.totalPages ? pagination.page + 1 : undefined;
    },
    enabled: !brandPending && !unknownBrand,
    staleTime: 1000 * 60 * 5,
  });
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = listQuery;

  const cars = useMemo(() => {
    if (unknownBrand) return [];
    const lines = (data?.pages ?? []).flatMap((page) => page?.items ?? []);
    return lines.map((line) => toResultCardModel(line, brandLabelById));
  }, [data, brandLabelById, unknownBrand]);

  const loading = brandPending || (!unknownBrand && listQuery.isPending);
  const total = unknownBrand ? 0 : toNumber(data?.pages?.[0]?.pagination?.totalElements) || cars.length;
  const rest = Math.max(0, total - cars.length);

  const selectBrand = (name) => {
    const next = new URLSearchParams(searchParams);
    next.delete('keyword'); // 브랜드를 바꾸면 검색어 조건은 푼다
    if (name) next.set('brand', name);
    else next.delete('brand');
    navigate(`/m/search/results?${next.toString()}`, { replace: true });
  };

  const activeName = selectedBrand?.name ?? brandNames[0] ?? '';
  const title = `${ORIGIN_LABEL[origin] ? `${ORIGIN_LABEL[origin]} ` : ''}검색결과`;
  let emptyMessage = keyword ? '검색 결과가 없습니다.' : '해당 브랜드의 차량 정보를 준비 중입니다.';
  if (listQuery.isError) emptyMessage = '차량 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';

  return (
    <>
      <SeoHelmet title={`${title} | ${SITE_NAME}`} description={`${SITE_NAME} 차량 검색결과. 브랜드별 할인 조건을 비교해 보세요.`} />
      <MobileSubHeader title={title} />
      <main id="main-content">
        <div className="m-chips">
          <button className={`m-chip${activeName ? '' : ' is-active'}`} type="button" onClick={() => selectBrand('')}>
            전체
          </button>
          {chipBrands.map((brand) => (
            <button
              key={brand.id ?? brand.name}
              className={`m-chip${activeName && isSameBrandName(brand.name, activeName) ? ' is-active' : ''}`}
              type="button"
              onClick={() => selectBrand(brand.name)}
            >
              {getPreferredBrandLabel(brand)}
            </button>
          ))}
        </div>

        <div className="m-listbar">
          <span>{keyword ? `'${keyword}' 검색결과` : '검색결과'}</span>
          <span>
            <strong>{total.toLocaleString('ko-KR')}</strong>대
          </span>
        </div>

        <div className="m-card-stack m-resultlist">
          {cars.map((car) => {
            const key = `${car.id}-${car.trimId}`;
            const hasMonthly = [car.prepayment30, car.deposit30, car.noDeposit].some(hasValue);
            // 할인 없이 월 렌탈료가 있는 차량(주로 국산차)은 메인과 같은 월 렌탈료 카드로 보여준다.
            return car.discount > 0 || !hasMonthly ? (
              <ResultCard key={key} car={car} />
            ) : (
              <VehicleCard key={key} vehicle={car} showBadge={false} source="mobile-search-results" />
            );
          })}
        </div>
        {loading ? <p className="m-empty">검색 중...</p> : null}
        {!loading && cars.length === 0 ? <p className="m-empty">{emptyMessage}</p> : null}

        <div className="m-more">
          <button
            className="m-more__btn"
            type="button"
            hidden={!hasNextPage || rest <= 0}
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            {isFetchingNextPage ? '불러오는 중...' : `차량 더보기 (${rest})`}
          </button>
        </div>

        <p className="m-fine" style={{ borderTop: 0 }}>
          <strong>안내</strong>
          표기 가격은 공식 할인 기준이며, 계약 조건에 따라 달라질 수 있습니다.
        </p>
      </main>
    </>
  );
}
