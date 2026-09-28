import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './MobleCarSearchResult.module.css';
import { DropdownFilterMobile } from '../../components/filters/MobileFilters';
import OptionPopupMobile from '../../components/OptionPopupMobile';
import VehicleCardMobile from '../../components/VehicleCardMobile';
import VehicleCardDomestic from '../../components/VehicleCardDomestic';
import NoticeBox from '../../components/NoticeBox';
import BrandFilterChips from '../../components/navigation/BrandFilterChips.jsx';
import { useCarBrandsQuery, useCarListInfiniteQueryV3 } from '../../hooks/queries/carQueries';
import {
  getPreferredBrandLabel,
  isSameBrandName,
  sortBrandsByPriority,
} from '../../config/brandPriority';
import { resolveMonthlyPayment } from '../../utils/priceUtils';

const FALLBACK_IMAGE = '/placeholder/car.svg';

const noticeItems = [
  '페이지의 월 납입금 등은 예시이며, 실제 계약 시 월 납입금은 다를 수 있습니다.',
  '내 출고는 공휴일을 제외한 영업일 기준입니다.',
  '블라인드 카스토리는 금융사의 장기렌트/리스 상품을 중개합니다.',
  '고객 요청에 따라 금융사 심사를 거쳐 상품이 진행됩니다.',
  '서비스 이용 시 별도 수수료나 금전적 대가가 발생하지 않습니다.',
  '계약 전 반드시 설명서 및 약관을 확인하시기 바랍니다.',
];

// 차량 종류 매핑 (UI -> API)
const CAR_TYPE_MAP = {
  '경·소형 승용': '소형',
  '중형 승용': '중형',
  '대형 승용': '대형',
  'SUV·RV': 'SUV',
  '화물·승합': '화물',
};

const FUEL_MAP = {
  '가솔린': '가솔린',
  '디젤(경유)': '디젤',
  'LPG': 'LPG',
  '하이브리드': '하이브리드',
  '전기·수소': '전기',
};

export default function MobleCarSearchResult() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeSort, setActiveSort] = useState('recent');
  const [isSortPopupOpen, setIsSortPopupOpen] = useState(false);
  const [navigatingCardId, setNavigatingCardId] = useState(null);

  const { data: brandsData = [] } = useCarBrandsQuery();

  // URL 파라미터
  const brandParam = searchParams.get('brand');
  const carOrigin = searchParams.get('carOrigin');
  const isImportMode = useMemo(() => carOrigin === 'import' || carOrigin === 'imported', [carOrigin]);
  const typesParam = searchParams.get('types') ? decodeURIComponent(searchParams.get('types')).replace(/\+/g, ' ') : null;
  const fuelsParam = searchParams.get('fuels') ? decodeURIComponent(searchParams.get('fuels')).replace(/\+/g, ' ') : null;
  const keyword = searchParams.get('keyword');
  
  // 다중 브랜드 이름 파싱
  const brandNames = useMemo(() => {
    if (!brandParam) return [];
    return brandParam.split(',').map(b => b.trim()).filter(Boolean);
  }, [brandParam]);

  // 선택된 브랜드 ID 확인 (첫 번째 브랜드 사용)
  const selectedBrandId = useMemo(() => {
    if (brandNames.length === 0) return undefined;
    const firstBrandName = brandNames[0];
    const found = brandsData.find((b) => isSameBrandName(b.name, firstBrandName));
    return found?.id;
  }, [brandNames, brandsData]);

  // 필터용 API 파라미터 계산
  const apiCarType = useMemo(() => {
    if (typesParam) {
      const types = typesParam.split(',').map((t) => CAR_TYPE_MAP[t.trim()]).filter(Boolean);
      if (types.length > 0) return types[0];
    }
    // 백엔드 v3는 '국산'/'수입' 값도 허용하므로 데스크탑 CarList와 동일하게 맞춤
    if (carOrigin === 'domestic') return '국산';
    if (carOrigin === 'import' || carOrigin === 'imported') return '수입';
    return undefined;
  }, [carOrigin, typesParam]);

  const fuels = useMemo(() => {
    if (!fuelsParam) return undefined;
    const fuelList = fuelsParam.split(',').map((f) => FUEL_MAP[f.trim()]).filter(Boolean);
    return fuelList.length > 0 ? fuelList[0] : undefined;
  }, [fuelsParam]);

  // 정렬 옵션 변환
  const sortOption = useMemo(() => {
    switch (activeSort) {
      case 'priceAsc':
        return { sort: 'price_asc' };
      case 'priceDesc':
        return { sort: 'price_desc' };
      // 최신순 -> 할인율 높은 순으로 백엔드에 위임
      default:
        return { sort: 'percent_desc' };
    }
  }, [activeSort]);

  // v3 무한 스크롤 쿼리 사용
  const PAGE_SIZE = 20;
  
  // 쿼리 파라미터 구성
  const queryParams = useMemo(() => ({
    brandId: selectedBrandId,
    carType: apiCarType, // 'domestic', 'import', '소형', 'SUV' 등
    fuel: fuels,
    keyword: keyword || undefined,
    limit: PAGE_SIZE,
    sort: sortOption.sort,
  }), [selectedBrandId, apiCarType, fuels, keyword, sortOption]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError
  } = useCarListInfiniteQueryV3(queryParams);

  // 데이터 Flattening
  const vehicleLineItems = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.items || []);
  }, [data]);

  // v3 응답을 단순 매핑 (대표 트림/가격/할인 값은 백엔드에서 계산됨)
  const processedItems = useMemo(() => {
    if (!vehicleLineItems || vehicleLineItems.length === 0) return [];

    return vehicleLineItems.map((vehicleLine) => {
      const toNumber = (value) => {
        const num = Number(value);
        return Number.isFinite(num) ? num : 0;
      };

      // 백엔드 v3에서 내려주는 대표 트림 가격/할인 정보 사용 (없으면 0)
      const basePriceLine = toNumber(vehicleLine.basePrice);
      const finalPriceLine = toNumber(vehicleLine.representativeFinalPrice);

      const trims = Array.isArray(vehicleLine.trims) ? vehicleLine.trims : [];
      const representativeTrim =
        trims.find((t) => t.id === vehicleLine.representativeTrimId) || trims[0] || null;

      // 트림 기반 차량가/할인
      const trimBasePrice = representativeTrim
        ? toNumber(
            representativeTrim.basePrice ??
              representativeTrim.price ??
              representativeTrim.consumerPrice ??
              representativeTrim.msrtPrice,
          )
        : 0;
      const trimDiscountedPrice = representativeTrim
        ? toNumber(
            representativeTrim.discountInfo?.discountedPrice ??
              representativeTrim.discountInfo?.discounted_price ??
              representativeTrim.discountedPrice ??
              representativeTrim.discounted_price ??
              representativeTrim.finalPrice ??
              representativeTrim.final_price,
          )
        : 0;

      const computedBasePrice = trimBasePrice > 0 ? trimBasePrice : basePriceLine ?? 0;
      const computedFinalPrice =
        trimDiscountedPrice > 0
          ? trimDiscountedPrice
          : trimBasePrice > 0
            ? trimBasePrice
            : finalPriceLine ?? 0;

      let discountAmount = vehicleLine.representativeDiscountAmount ?? 0;
      let discountPercent = vehicleLine.representativeDiscountPercent ?? 0;
      if (trimBasePrice > 0 && trimDiscountedPrice > 0 && trimDiscountedPrice < trimBasePrice) {
        discountAmount = trimBasePrice - trimDiscountedPrice;
        discountPercent = Math.round((discountAmount / trimBasePrice) * 100);
      }

      const monthlyRentalFee =
        representativeTrim?.discountedMonthlyFee ??
        representativeTrim?.discounted_monthly_fee ??
        representativeTrim?.monthlyRentalFee ??
        representativeTrim?.monthly_rental_fee ??
        null;

      const monthlyBase =
        representativeTrim?.monthlyRentalFee ??
        representativeTrim?.monthly_rental_fee ??
        null;

      const monthlyDiscountPercent =
        representativeTrim?.monthlyDiscountPercent ??
        representativeTrim?.monthly_discount_percent ??
        null;

      // 3가지 렌탈플랜 데이터 추출
      const lowestPrepayment30MonthlyFee =
        representativeTrim?.lowestPrepayment30MonthlyFee ??
        representativeTrim?.lowest_prepayment_30_monthly_fee ??
        null;
      const lowestDeposit30MonthlyFee =
        representativeTrim?.lowestDeposit30MonthlyFee ??
        representativeTrim?.lowest_deposit_30_monthly_fee ??
        null;
      const lowestNoDepositMonthlyFee =
        representativeTrim?.lowestNoDepositMonthlyFee ??
        representativeTrim?.lowest_no_deposit_monthly_fee ??
        null;

      return {
        id: vehicleLine.modelId || vehicleLine.model_id || vehicleLine.representativeTrimId || vehicleLine.vehicleLineId || vehicleLine.id,
        modelId: vehicleLine.modelId || vehicleLine.model_id,
        vehicleLineId: vehicleLine.vehicleLineId || vehicleLine.id,
        vehicleLineName: vehicleLine.vehicleLineName || vehicleLine.name,
        modelName: vehicleLine.modelName, // 모델 그룹명 필드 추가 매핑 (있으면 사용)
        brandId: vehicleLine.brandId,
        brandName: vehicleLine.brandName,
        representativeTrimName: vehicleLine.representativeTrimName || '',
        representativeTrimId: vehicleLine.representativeTrimId,
        imageUrl: vehicleLine.imageUrl || vehicleLine.image || FALLBACK_IMAGE,
        basePrice: computedBasePrice,
        finalPrice: computedFinalPrice,
        discountAmount,
        discountPercent,
        monthlyRentalFee: monthlyBase ?? null,
        discountedMonthlyFee: monthlyRentalFee ?? null,
        monthlyDiscountPercent: monthlyDiscountPercent ?? null,
        hasMonthlyRentalFee: Boolean(monthlyBase || monthlyRentalFee),
        trimsCount: trims.length,
        // 3가지 렌탈플랜 데이터 추가
        lowestPrepayment30MonthlyFee,
        lowestDeposit30MonthlyFee,
        lowestNoDepositMonthlyFee,
      };
    });
  }, [vehicleLineItems]);


  // 필터 칩 (브랜드)
  const filteredBrands = useMemo(() => {
    if (!brandsData.length) return [];
    let list = brandsData;
    if (carOrigin === 'domestic') {
      list = brandsData.filter((b) => b.country === 'KR');
    } else if (carOrigin === 'import' || carOrigin === 'imported') {
      list = brandsData.filter((b) => b.country !== 'KR');
    }
    const sorted = sortBrandsByPriority(list);
    return [
      { key: '전체', label: '전체', name: '전체' },
      ...sorted.map((b) => ({
        key: b.name,
        label: getPreferredBrandLabel(b),
        name: b.name,
      })),
    ];
  }, [carOrigin, brandsData]);

  // 필터 핸들러
  const handleBrandChipChange = (nextKey) => {
    const params = new URLSearchParams(searchParams);
    params.delete('keyword'); // 브랜드 변경시 검색어 초기화
    
    if (nextKey === '전체') {
      params.delete('brand');
    } else {
      params.set('brand', nextKey);
    }
    // 페이지 리셋은 query key 변경으로 자동 처리됨 (infinite query)
    navigate(`/m/search/results?${params.toString()}`, { replace: true });
  };

  const activeBrandKey = useMemo(() => {
    if (brandNames.length === 0) return '전체';
    const matchedBrand = filteredBrands.find((brand) => isSameBrandName(brand.key, brandNames[0]));
    return matchedBrand?.key ?? brandNames[0];
  }, [brandNames, filteredBrands]);

  // 카드 클릭 이동
  const handleCardNavigate = useCallback((item) => {
      if (navigatingCardId) return;
      setNavigatingCardId(item.id);
      
      // 상세 페이지 이동
      const targetId = item.vehicleLineId;
      const trimQuery = item.representativeTrimId ? `?trimId=${item.representativeTrimId}` : '';
      
      navigate(`/m/car-detail/${targetId}${trimQuery}`);
      setNavigatingCardId(null);
  }, [navigate, navigatingCardId]);

  // 무한 스크롤 Trigger
  const loadMoreRef = useRef(null);
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const el = loadMoreRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]);

  return (
    <div className={styles.page}>
      {filteredBrands.length > 0 && (
        <div className={styles.brandChipsBar}>
          <BrandFilterChips
            items={filteredBrands}
            activeKey={activeBrandKey}
            onChange={handleBrandChipChange}
          />
        </div>
      )}
      
      <div className={styles.sortWrap}>
        <DropdownFilterMobile
          value={activeSort}
          placeholder="정렬"
          options={[
            { value: 'recent', label: '최신 순' },
            { value: 'priceAsc', label: '차량 가격 낮은 순' },
            { value: 'priceDesc', label: '차량 가격 높은 순' },
          ]}
          onChange={(value) => setActiveSort(value)}
          onOpen={() => setIsSortPopupOpen(true)}
        />
      </div>

      <div className={styles.list}>
        {isLoading ? (
          <div className={styles.loading}>검색 중...</div>
        ) : processedItems.length === 0 ? (
          <div className={styles.empty}>검색 결과가 없습니다.</div>
        ) : (
          processedItems.map((item) => {
            const monthlyDisplay = resolveMonthlyPayment({
              monthlyRentalFee: item.monthlyRentalFee,
              discountedMonthlyFee: item.discountedMonthlyFee,
              fallbackBasePrice: item.basePrice,
              fallbackDiscountedPrice: item.finalPrice,
              months: 48,
            });
            
            const monthlyValue =
              monthlyDisplay.monthlyValue && monthlyDisplay.monthlyValue > 0
                ? monthlyDisplay.monthlyValue.toLocaleString()
                : '가격 문의';
            const shouldShowOriginal =
              monthlyDisplay.monthlyOriginal &&
              monthlyDisplay.monthlyOriginal > 0 &&
              monthlyValue !== '가격 문의' &&
              (item.hasMonthlyRentalFee ? monthlyDisplay.monthlyOriginal > monthlyDisplay.monthlyValue : true);
            // 월렌탈 할인율 우선, 없으면 차량 가격 할인율 사용
            const effectiveDiscountPercent =
              (item.monthlyDiscountPercent != null && item.monthlyDiscountPercent > 0)
                ? item.monthlyDiscountPercent
                : (item.discountPercent > 0 ? item.discountPercent : 0);
            const hasDiscount = effectiveDiscountPercent > 0;
            const monthlyOriginal =
              shouldShowOriginal && hasDiscount && monthlyDisplay.monthlyOriginal
                ? `${monthlyDisplay.monthlyOriginal.toLocaleString()}원`
              : '';
            
            const effectivePrice = item.finalPrice > 0 ? item.finalPrice : item.basePrice;
            const priceValue = effectivePrice > 0 
              ? `${effectivePrice.toLocaleString()}원~` 
              : '가격 문의';

            const badgeText = hasDiscount ? `${effectiveDiscountPercent}% 할인` : '';
            // 수입차 모드에서 할인율이 있으면 원가 표시
            const priceOriginalLabel =
              isImportMode && hasDiscount && item.basePrice > 0
                ? `${item.basePrice.toLocaleString()}원~`
                : '';
            const priceDiscountLabel =
              isImportMode && hasDiscount ? `${effectiveDiscountPercent}% 할인` : '';

            const cardName = item.modelName && item.modelName.trim() !== ''
              ? item.modelName
              : item.vehicleLineName;
            
            // 트림 데이터 추출 (3가지 렌탈플랜 모두 포함)
            const trim = {
              lowestPrepayment30MonthlyFee: item.lowestPrepayment30MonthlyFee ?? null,
              lowestDeposit30MonthlyFee: item.lowestDeposit30MonthlyFee ?? null,
              lowestNoDepositMonthlyFee: item.lowestNoDepositMonthlyFee ?? null,
            };

            // 국산차: VehicleCardDomestic 사용 (3가지 렌탈플랜 표시)
            // 수입차: VehicleCardMobile 사용 (기존 방식 유지)
            if (!isImportMode) {
              return (
                <VehicleCardDomestic
                  key={`${item.id}-${item.representativeTrimId}`}
                  name={cardName}
                  subtitle={item.representativeTrimName}
                  priceValue={priceValue}
                  image={item.imageUrl}
                  trim={trim}
                  onClick={() => handleCardNavigate(item)}
                />
              );
            }

            // 수입차는 VehicleCardMobile 사용
            return (
              <VehicleCardMobile
                key={`${item.id}-${item.representativeTrimId}`}
                name={cardName}
                subtitle={item.representativeTrimName}
                discountPercent={effectiveDiscountPercent}
                badgeText={badgeText}
                
                monthlyLabel="월 렌트료"
                monthlyValue={monthlyValue}
                monthlyOriginal={monthlyOriginal}
                monthlyUnit={monthlyValue !== '가격 문의' ? '원' : ''}
                showMonthlyRow={!isImportMode}
                
                priceLabel="차량가격"
                priceValue={priceValue}
                priceOriginal={priceOriginalLabel}
                priceDiscountLabel={priceDiscountLabel}
                priceVariant={isImportMode ? 'imported' : 'default'}
                
                image={item.imageUrl}
                onClick={() => handleCardNavigate(item)}
                trim={trim}
              />
            );
          })
        )}
      </div>

      {/* Infinite Scroll Sentinel */}
      <div ref={loadMoreRef} style={{ height: '20px', margin: '10px 0' }}>
        {isFetchingNextPage && <div className={styles.loading}>더 불러오는 중...</div>}
      </div>

      <div className={styles.noticeSection}>
        <NoticeBox title="안내드립니다" items={noticeItems} />
      </div>

      {isSortPopupOpen && (
        <OptionPopupMobile
          size="small"
          title="정렬"
          sortOptions={[
            { name: '최신 순', value: 'recent' },
            { name: '차량 가격 낮은 순', value: 'priceAsc' },
            { name: '차량 가격 높은 순', value: 'priceDesc' },
          ]}
          selectedSort={activeSort}
          onSortSelect={(value) => {
            setActiveSort(value);
            setIsSortPopupOpen(false);
          }}
          onClose={() => setIsSortPopupOpen(false)}
        />
      )}
    </div>
  );
}
