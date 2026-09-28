import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import Breadcrumb from '../../components/Breadcrumb';
import SearchBar from '../../components/SearchBar';
import CarFilterPanel from '../../components/filters/CarFilterPanel';
import CarManufacturerFilter from '../../components/CarManufacturerFilter';
import PromotionCard from '../../components/PromotionCard';
import BrowserContactModal from '../../components/BrowserContactModal.jsx';
import ConsultSuccessModal from '../../components/ConsultSuccessModal.jsx';
import Event from '../../components/mobileMain/Event.jsx';
import styles from './ExpressDeals.module.css';
import mobileMainStyles from '../../mobilePages/main/MobleMain.module.css';
import { contentAPI } from '../../services/contentApi';
import { coalitionAPI, COALITION_PAGE_TYPE } from '../../services/coalitionApi';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { matchesCarType } from '../shared/listFilterUtils';
import { PRIMARY_DOMESTIC_BRANDS } from '../../config/brandLogos';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import { getPageSeo } from '../../config/seoConfig';
import { useCarBrandsQuery } from '../../hooks/queries/carQueries';
import {
  sendToKakaoOnly,
} from '../../services/consultHelper';
import { getStoredUserPhone, setStoredUserPhone } from '../../utils/phoneStorage';
import { normalizePriceValue } from '../../utils/priceUtils';
import { KAKAO_POPUP_BLOCKED_MESSAGE } from '../../utils/kakaoPopup';

const PAGE_SIZE = 12;
const FALLBACK_IMAGE = '/placeholder/car.svg';
const CONTACT_PROMPT_DEFAULT =
  '카카오 상담을 위해 인증창을 열고 있습니다. 창이 닫히면 아래에 연락처를 남겨 주세요.';
const CONTACT_LOADING_MESSAGE =
  '카카오 상담을 위해 인증창을 열고 있습니다. 인증이 끝나면 자동으로 닫혀요.';
// 상단 하이라이트 섹션: 프로모션(PROMOTION_EVENT) 카드만 사용
const URGENT_CARD_TYPE = 'PROMOTION_EVENT';

const ExpressDeals = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('deadline');
  const [minPrice, setMinPrice] = useState(Number(searchParams.get('min') || 60));
  const [maxPrice, setMaxPrice] = useState(Number(searchParams.get('max') || 240));
  const [manufacturer, setManufacturer] = useState(searchParams.get('maker') || '전체');
  const [carType, setCarType] = useState(searchParams.get('type') || '전체');
  const [contactModalPayload, setContactModalPayload] = useState(null);
  const [contactModalMessage, setContactModalMessage] = useState(null);
  const [contactModalInitialPhone, setContactModalInitialPhone] = useState('');
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const isContactModalOpen = Boolean(contactModalPayload);
  const sanitizePhoneForStorage = useCallback((value) => {
    if (!value) return '';
    const str = String(value).trim();
    return str.length > 30 ? str.slice(0, 30) : str;
  }, []);

  const CAR_TYPE_OPTIONS = useMemo(
    () => ['전체', '소형', '중형', '대형', 'SUV', '전기', '하이브리드'],
    [],
  );
  // 재고 특가 페이지 제조사는 국산 브랜드로 고정 (CarList 국내차와 동일한 구성)
  const DOMESTIC_MANUFACTURERS = useMemo(
    () => [{ name: '전체', image: null }, ...PRIMARY_DOMESTIC_BRANDS],
    [],
  );
  const [manufacturerOptions] = useState(DOMESTIC_MANUFACTURERS);
  const priceRanges = ['60만원', '120만원', '240만원'];

const toPositiveOrNull = (value) => {
  const normalized = normalizePriceValue(value);
  return normalized > 0 ? normalized : null;
};

const normalizeBrandName = (value = '') =>
  String(value)
    .replace(/\s+/g, '')
    .toLowerCase();

const BRAND_ALIASES = {
  kgm: ['kgm', 'kg모빌리티', 'kgmobility', '쌍용', '쌍용자동차'],
};

const matchesAlias = (brandToken, targetToken) => {
  if (!brandToken || !targetToken) return false;
  const aliasEntry = Object.values(BRAND_ALIASES).find((aliases) =>
    aliases.includes(brandToken),
  );
  if (!aliasEntry) return false;
  return aliasEntry.includes(targetToken);
};

const resolveLegacyPricing = (item) => {
  const basePrice = normalizePriceValue(
    item.basePrice ?? item.price ?? item.minPrice ?? item.min_price ?? 0,
  );

  let discountAmount = 0;
  let discountPercent = 0;
  let finalPrice = basePrice;

  if (basePrice > 0) {
    const discountInfo =
      item.discountInfo ?? item.discount_info ?? item.activeTrimDiscount ?? null;

    const discountPriceFromInfo = normalizePriceValue(
      discountInfo?.discountedPrice ?? discountInfo?.discounted_price ?? 0,
    );

    let rawDiscountAmountFromInfo = 0;
    if (discountInfo?.discountType && discountInfo?.discountValue != null) {
      const value = normalizePriceValue(discountInfo.discountValue);
      if (discountInfo.discountType === 'PERCENTAGE') {
        if (value > 0) {
          rawDiscountAmountFromInfo = Math.floor((basePrice * value) / 100);
        }
      } else {
        rawDiscountAmountFromInfo = value;
      }
    }

    const legacyDiscountPrice = normalizePriceValue(
      item.discountedPrice ?? item.discounted_price ?? 0,
    );

    const rawDiscountPrice = discountPriceFromInfo || legacyDiscountPrice || 0;

    let rawDiscountAmount = rawDiscountAmountFromInfo;
    if (!rawDiscountAmount && rawDiscountPrice > 0 && rawDiscountPrice < basePrice) {
      rawDiscountAmount = basePrice - rawDiscountPrice;
    }

    if (!rawDiscountAmount) {
      rawDiscountAmount = normalizePriceValue(
        item.discountAmount ??
          item.discount_amount ??
          discountInfo?.discountAmount ??
          discountInfo?.discount_amount ??
          0,
      );
    }

    if (rawDiscountAmount > 0) {
      discountAmount = rawDiscountAmount;
      finalPrice = Math.max(basePrice - rawDiscountAmount, 0);
      discountPercent = basePrice > 0 ? Math.round((discountAmount / basePrice) * 100) : 0;
    }
  }

  return {
    basePrice,
    finalPrice,
    discountAmount,
    discountPercent,
  };
};

const resolveInventoryMonthlyPricing = (item) => {
  const trimMonthly = toPositiveOrNull(
    item.trimMonthlyRentalFee ??
      item.trim_monthly_rental_fee ??
      item.trim?.monthlyRentalFee ??
      item.trim?.monthly_rental_fee ??
      null,
  );
  const contentBaseMonthly = toPositiveOrNull(
    item.inventoryBaseMonthlyFee ??
      item.inventory_base_monthly_fee ??
      item.monthlyRentalFee ??
      item.monthly_rental_fee ??
      null,
  );
  const monthlyBase = trimMonthly ?? contentBaseMonthly ?? null;

  const contentFinalMonthly = toPositiveOrNull(
    item.inventoryFinalMonthlyFee ?? item.inventory_final_monthly_fee ?? null,
  );
  let discountedMonthly =
    contentFinalMonthly ??
    toPositiveOrNull(
      item.discountedMonthlyFee ??
        item.discounted_monthly_fee ??
        item.discountedMonthlyRentalFee ??
        null,
    );

  let monthlyDiscountPercent =
    item.monthlyDiscountPercent ?? item.monthly_discount_percent ?? null;
  if (monthlyDiscountPercent !== null && monthlyDiscountPercent !== undefined) {
    const numeric = Number(monthlyDiscountPercent);
    monthlyDiscountPercent = Number.isFinite(numeric) ? numeric : null;
  }

  if (!discountedMonthly && monthlyBase && monthlyDiscountPercent) {
    discountedMonthly = Math.max(
      Math.round(monthlyBase * (100 - monthlyDiscountPercent) / 100),
      0,
    );
  }

  if (
    monthlyDiscountPercent === null &&
    monthlyBase &&
    discountedMonthly &&
    discountedMonthly < monthlyBase
  ) {
    monthlyDiscountPercent = Math.round(((monthlyBase - discountedMonthly) / monthlyBase) * 100);
  }

  return {
    hasMonthlyPricing: Boolean(monthlyBase || discountedMonthly),
    monthlyBase: monthlyBase ?? null,
    monthlyFinal: discountedMonthly ?? null,
    monthlyDiscountPercent,
  };
};

const enrichInventoryItem = (item) => {
  const monthlyPricing = resolveInventoryMonthlyPricing(item);
  
  // trim 객체 생성 (PromotionCard가 기대하는 형식)
  const trim = item.trim || {
    lowestPrepayment30MonthlyFee: toPositiveOrNull(
      item.lowestPrepayment30MonthlyFee ?? 
      item.lowest_prepayment_30_monthly_fee ?? 
      null
    ),
    lowestDeposit30MonthlyFee: toPositiveOrNull(
      item.lowestDeposit30MonthlyFee ?? 
      item.lowest_deposit_30_monthly_fee ?? 
      null
    ),
    lowestNoDepositMonthlyFee: toPositiveOrNull(
      item.lowestNoDepositMonthlyFee ?? 
      item.lowest_no_deposit_monthly_fee ?? 
      null
    ),
  };
  
  if (monthlyPricing.hasMonthlyPricing) {
    // 월 렌탈료 정보만 추가하고, 차량 가격은 원본 유지
    const monthlyRentalFee =
      monthlyPricing.monthlyBase && monthlyPricing.monthlyBase > 0
        ? monthlyPricing.monthlyBase
        : null;
    const discountedMonthlyFee =
      monthlyPricing.monthlyFinal && monthlyPricing.monthlyFinal > 0
        ? monthlyPricing.monthlyFinal
        : null;

    // 차량 원본 가격 정보는 resolveLegacyPricing으로 계산
    const legacy = resolveLegacyPricing(item);

    return {
      ...item,
      ...legacy,
      monthlyRentalFee,
      discountedMonthlyFee,
      monthlyDiscountPercent: monthlyPricing.monthlyDiscountPercent ?? null,
      trim, // trim 객체 추가
    };
  }

  const legacy = resolveLegacyPricing(item);
  return {
    ...item,
    ...legacy,
    monthlyRentalFee: null,
    discountedMonthlyFee: null,
    monthlyDiscountPercent: null,
    trim, // trim 객체 추가
  };
};

  const breadcrumbItems = useMemo(
    () => [
      { label: '홈', link: '/' },
      { label: '재고출고' },
    ],
    [],
  );

  const { data: highlightDataRaw } = useQuery({
    queryKey: ['express-deals', 'highlight'],
    // 재고 특가(HOTDEAL) 하이라이트만 조회 — 모바일 선구매와 동일 fetch
    queryFn: () => contentAPI.getUrgentInventory(30, null, null, URGENT_CARD_TYPE),
    staleTime: 1000 * 60,
  });

  const highlightData = useMemo(
    () =>
      (highlightDataRaw || []).filter((item) => {
        const cardType = item.cardType ?? item.card_type ?? null;
        return !cardType || cardType === URGENT_CARD_TYPE;
      }),
    [highlightDataRaw],
  );

  const highlightItems = useMemo(
    () => (highlightData || []).map((item) => enrichInventoryItem(item)),
    [highlightData],
  );

  // 배너 데이터 가져오기 - 제휴사 어드민의 "특가차량" 배너
  const { data: bannerData } = useQuery({
    queryKey: ['coalition', 'banners', COALITION_PAGE_TYPE.SPECIAL],
    queryFn: () => coalitionAPI.getBanners(COALITION_PAGE_TYPE.SPECIAL),
    staleTime: 1000 * 60 * 5, // 5분
  });

  // 배너 목록 추출
  const banners = useMemo(() => {
    if (bannerData) {
      // items 배열이 있는 경우
      if (bannerData.items && Array.isArray(bannerData.items)) {
        return bannerData.items.filter(b => b.imageUrl || b.image_url);
      }
      // 배열인 경우
      if (Array.isArray(bannerData)) {
        return bannerData.filter(b => b.imageUrl || b.image_url);
      }
      // 단일 객체인 경우
      if (bannerData.imageUrl || bannerData.image_url) {
        return [bannerData];
      }
    }
    return [];
  }, [bannerData]);

  // 배너 슬라이드 상태
  const [bannerIndex, setBannerIndex] = useState(0);

  // 배너 데이터 변경 시 인덱스 리셋
  useEffect(() => {
    setBannerIndex(0);
  }, [banners.length]);

  const syncParams = (next) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([k, v]) => {
      if (v === '전체' || v === undefined || v === null) {
        params.delete(k);
      } else {
        params.set(k, String(v));
      }
    });
    setSearchParams(params, { replace: true });
  };

  const handleMinPriceChange = (e) => {
    const value = Number(e.target.value) / 10000; // 원을 만원으로 변환
    if (value <= maxPrice - 10) {
      setMinPrice(value);
      syncParams({ min: value, max: maxPrice });
    }
  };

  const handleMaxPriceChange = (e) => {
    const value = Number(e.target.value) / 10000; // 원을 만원으로 변환
    if (value >= minPrice + 10) {
      setMaxPrice(value);
      syncParams({ min: minPrice, max: value });
    }
  };

  const handleSelectManufacturer = (manufacturerOption) => {
    const name = manufacturerOption?.name ?? '전체';
    setManufacturer(name);
    syncParams({ maker: name === '전체' ? undefined : name });
  };

  const handleSelectCarType = (value) => {
    setCarType(value);
    syncParams({ type: value });
  };

  const getRemainingInfo = (item) => {
    const remaining =
      item?.remainingQuantity !== undefined && item?.remainingQuantity !== null
        ? item.remainingQuantity
        : item?.remaining_quantity !== undefined && item?.remaining_quantity !== null
          ? item.remaining_quantity
          : null;

    if (remaining === null || Number.isNaN(Number(remaining))) {
      return { badgeText: null, badgeVariant: 'yellow' };
    }

    return {
      badgeText: `재고출고 ${remaining}대 남음`,
      badgeVariant: 'red',
    };
  };

  // 차량 브랜드 목록 (브랜드 이름 -> ID 매핑용)
  const { data: brandsData = [] } = useCarBrandsQuery(null, { staleTime: 1000 * 60 * 5 });

  // 선택된 제조사 이름을 brandId로 매핑
  const selectedBrandId = useMemo(() => {
    if (!manufacturer || manufacturer === '전체') return null;
    const target = normalizeBrandName(manufacturer);
    const brand = brandsData.find((b) => {
      if (!b?.name) return false;
      const normalized = normalizeBrandName(b.name);
      return (
        normalized === target ||
        normalized.includes(target) ||
        target.includes(normalized) ||
        matchesAlias(normalized, target) ||
        matchesAlias(target, normalized)
      );
    });
    return brand?.id ?? null;
  }, [manufacturer, brandsData]);

  const apiCarType = useMemo(() => (carType === '전체' ? null : carType), [carType]);

  const {
    data: listData = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['express-deals', 'list', { sortBy, selectedBrandId, apiCarType }],
    // 재고 특가 목록: 모바일 선구매와 동일하게 brandId, carType 서버 필터 적용
    queryFn: () => contentAPI.getUrgentInventory(200, selectedBrandId, apiCarType, null),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const items = useMemo(
    () => (listData || []).map((item) => enrichInventoryItem(item)),
    [listData],
  );

  const isInitialLoading = isLoading && !(items.length);
  const showListError = isError && !(items.length);

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const now = new Date();
    
    // 종료된 항목 필터링 (endDate가 있고 현재 시간보다 이전인 경우)
    // 하단 리스트는 모든 재고특가 표시 (PROMOTION_EVENT 포함)
    let next = items.filter((item) => {
      // PROMOTION_EVENT도 하단 리스트에 표시하도록 변경
      // const cardType = (item.cardType ?? item.card_type ?? '').toUpperCase();
      // if (cardType === URGENT_CARD_TYPE) return false;

      if (item.endDate) {
        const endDate = new Date(item.endDate);
        if (endDate < now) return false; // 종료된 항목 제외
      }
      return true;
    });
    
    // 차량 종류 필터링 (현재 UI에서는 비활성화지만, 향후 확장 대비 유지)
    if (carType !== '전체') {
      next = next.filter((item) => matchesCarType(item, carType));
    }
    
    // 가격 필터링 (가격 정보가 있다면 - 현재는 데이터 구조상 제외)
    
    // 검색어 필터링
    if (keyword) {
      next = next.filter((item) => {
        const title = item.title?.toLowerCase() ?? '';
        const desc = item.description?.toLowerCase() ?? '';
        const brand = item.extraInfo?.toLowerCase() ?? '';
        return title.includes(keyword) || desc.includes(keyword) || brand.includes(keyword);
      });
    }

    const sorted = [...next];
    switch (sortBy) {
      case 'title':
        sorted.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''));
        break;
      case 'deadline':
        sorted.sort((a, b) => new Date(a.deadline ?? 0) - new Date(b.deadline ?? 0));
        break;
      case 'recent':
        sorted.sort((a, b) => new Date(b.updatedAt ?? 0) - new Date(a.updatedAt ?? 0));
        break;
      default:
        break;
    }
    return sorted;
  }, [items, search, sortBy, manufacturer, carType]);

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, sortBy, manufacturer, carType]);

  const visibleItems = useMemo(
    () => filteredItems.slice(0, visibleCount),
    [filteredItems, visibleCount],
  );

  const hasMoreInMemory = visibleCount < filteredItems.length;

  const handleIntersection = useCallback(() => {
    if (hasMoreInMemory) {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredItems.length));
      return false;
    }
    return true;
  }, [hasMoreInMemory, filteredItems.length]);

  const { observerRef } = useInfiniteScroll({
    fetchNextPage: () => {},
    hasNextPage: false,
    isFetchingNextPage: false,
    onIntersect: handleIntersection,
  });

  useEffect(() => {
    if (!manufacturerOptions.find((option) => option.name === manufacturer)) {
      setManufacturer('전체');
      syncParams({ maker: undefined });
    }
  }, [manufacturerOptions, manufacturer]);

  useEffect(() => {
    if (!CAR_TYPE_OPTIONS.includes(carType)) {
      setCarType('전체');
      syncParams({ type: undefined });
    }
  }, [CAR_TYPE_OPTIONS, carType]);

  const buildConsultPayload = useCallback(
    (item) => ({
      brand: item.extraInfo ?? item.brand ?? '',
      model: item.title ?? item.name ?? '',
      trim: item.trimId ?? item.id ?? null,
      consultType: '재고문의',
      source: 'express-deals',
      entryLabel: `express-deals > 재고문의 > ${item.title ?? item.name ?? ''}`,
    }),
    [],
  );

  const persistContactInfo = useCallback((phoneValue, nameValue) => {
    const sanitizedPhone = sanitizePhoneForStorage(phoneValue);
    if (!sanitizedPhone) return;
    setStoredUserPhone(sanitizedPhone);
    if (nameValue) {
      localStorage.setItem('wgl_user_name', nameValue);
    }
  }, [sanitizePhoneForStorage]);

  const openContactModalWithPayload = useCallback(
    (payload, message = CONTACT_PROMPT_DEFAULT, initialPhone = '') => {
      setContactModalPayload(payload);
      setContactModalMessage(message);
      setContactModalInitialPhone(initialPhone || payload?.phone || '');
    },
    [],
  );

  const handleContactModalClose = useCallback(() => {
    if (isContactSubmitting) return;
    setContactModalPayload(null);
    setContactModalMessage(null);
    setContactModalInitialPhone('');
  }, [isContactSubmitting]);

  const handleConsultClick = useCallback(
    async (item) => {
      if (!item) return;
      const payload = buildConsultPayload(item);
      try {
        // 1. 로컬 스토리지에서 저장된 연락처 확인
        const savedPhone = sanitizePhoneForStorage(getStoredUserPhone());
        const savedName = localStorage.getItem('wgl_user_name');

        // 2. 연락처 없으면 바로 모달 오픈 (카카오 OAuth 제거!)
        if (!savedPhone) {
          openContactModalWithPayload(
            payload,
            '휴대폰 번호를 남겨주시면 담당 매니저가 빠르게 도와드립니다.',
            '',
          );
          return;
        }

        // 3. 연락처가 있으면 바로 전송
        const enriched = { ...payload, phone: savedPhone, name: savedName || '' };
        // eslint-disable-next-line no-console
        console.info('[ExpressDeals] handleConsultClick: using stored phone', enriched);
        const result = await sendToKakaoOnly(enriched);
        
        // API 호출이 성공하면 무조건 성공 모달 표시
        if (result?.success) {
          persistContactInfo(enriched.phone, enriched.name);
          setIsSuccessModalOpen(true);
          return;
        }
        
        // 실패 시 모달 오픈
        openContactModalWithPayload(
          { ...enriched, phone: '' },
          '카카오톡으로 보내는 데 실패했습니다. 아래에 연락처를 남겨 주세요.',
          enriched.phone || '',
        );
      } catch (error) {
        console.error('[ExpressDeals] 상담 신청 실패', error);
        openContactModalWithPayload(
          payload,
          '상담 신청에 실패했습니다. 아래에 연락처를 남겨 주세요.',
          '',
        );
      }
    },
    [buildConsultPayload, openContactModalWithPayload, persistContactInfo],
  );

  const handleCardClick = useCallback(
    (item) => {
      handleConsultClick(item);
    },
    [handleConsultClick],
  );

  const handleContactModalSubmit = useCallback(
    async (phoneValue, nameValue) => {
      if (!contactModalPayload) return;
      const phone = sanitizePhoneForStorage(phoneValue || '');
      const name = (nameValue || '').trim();

      if (!phone) {
        setContactModalMessage('연락처를 입력해 주세요.');
        return;
      }
      setIsContactSubmitting(true);
      try {
        const enriched = {
          ...contactModalPayload,
          phone,
          name,
        };
        // eslint-disable-next-line no-console
        console.info('[ExpressDeals] handleContactModalSubmit: submitting to backend', enriched);
        const result = await sendToKakaoOnly(enriched);

        // API 호출이 성공하면 무조건 성공 모달 표시
        if (result?.success) {
          persistContactInfo(phone, name);
          setContactModalPayload(null);
          setContactModalMessage(null);
          setContactModalInitialPhone('');
          setIsSuccessModalOpen(true);
        } else {
          setContactModalMessage(
            result?.message || '연락처 등록에 실패했습니다. 다시 시도해주세요.',
          );
        }
      } catch (error) {
        console.error('[ExpressDeals] handleContactModalSubmit: 연락처 등록 실패', error);
        setContactModalMessage('연락처 등록에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setIsContactSubmitting(false);
      }
    },
    [contactModalPayload],
  );

  // 배너 클릭 핸들러
  const handleBannerClick = (banner) => {
    if (banner?.linkUrl || banner?.link_url) {
      const url = banner.linkUrl || banner.link_url;
      if (url.startsWith('http://') || url.startsWith('https://')) {
        window.open(url, '_blank');
      } else {
        navigate(url);
      }
    }
  };

  // 이벤트 상담 신청 핸들러
  const handleEventSubmit = useCallback(async ({ name, phone, carModel }) => {
    setEventSubmitting(true);
    try {
      const payload = {
        name: name || '',
        phone: sanitizePhoneForStorage(phone || ''),
        carModel: carModel || '',
        consultType: '이벤트상담',
        source: 'express-deals-event',
        entryLabel: 'express-deals > 이벤트 섹션',
      };
      
      const result = await sendToKakaoOnly(payload);
      
      if (result?.success) {
        persistContactInfo(payload.phone, payload.name);
        setIsSuccessModalOpen(true);
      } else {
        alert(result?.message || '상담 신청에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('[ExpressDeals] 이벤트 상담 신청 실패', error);
      alert('상담 신청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setEventSubmitting(false);
    }
  }, [persistContactInfo, sanitizePhoneForStorage]);

  // SEO용 대표 이미지: SPECIAL_OFFER 배너 > 상단 긴급 카드 > 리스트 첫 카드 순
  const seoImage = useMemo(() => {
    const firstBanner = banners[0];
    const bannerUrl = firstBanner?.imageUrl || firstBanner?.image_url;
    if (bannerUrl) return bannerUrl;

    const firstHighlight = (highlightItems ?? [])[0];
    const highlightImg = firstHighlight?.imageUrl || firstHighlight?.image_url;
    if (highlightImg) return highlightImg;

    const firstListItem = (visibleItems ?? [])[0] || (filteredItems ?? [])[0];
    const listImg = firstListItem?.imageUrl || firstListItem?.image_url;
    if (listImg) return listImg;

    return undefined;
  }, [banners, highlightItems, visibleItems, filteredItems]);

  const { title: seoTitle, description: seoDescription, keywords: seoKeywords } = getPageSeo('express-deals');

  return (
    <>
      <SeoHelmet
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        image={seoImage}
      />
    <div className={styles['express-page']}>
      <div className={styles['breadcrumb-container']}>
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {/* 상단 전체 폭 재고특가 배너 (1920 x 644 비율) */}
      {banners.length > 0 && (
        <div className={styles['express-banner-wrapper']}>
          <div
            className={styles['express-banner-track']}
            style={{ transform: `translateX(-${bannerIndex * 100}%)` }}
          >
            {banners.map((banner, index) => (
              <div
                key={banner.id || index}
                className={styles['express-banner']}
                onClick={() => handleBannerClick(banner)}
                style={{
                  cursor: banner?.linkUrl || banner?.link_url ? 'pointer' : 'default',
                  ...(banner?.imageUrl || banner?.image_url
                    ? {
                        backgroundImage: `url("${banner.imageUrl || banner.image_url}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : {}),
                }}
              >
                <div className={styles['express-banner-inner']} />
              </div>
            ))}
          </div>
          {banners.length > 1 && (
            <div className={styles['express-banner-pager']}>
              <button
                type="button"
                className={styles['express-banner-arrow']}
                onClick={() => setBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)}
                aria-label="이전"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span className={styles['express-banner-pager-text']}>
                {bannerIndex + 1}/{banners.length}
              </span>
              <button
                type="button"
                className={styles['express-banner-arrow']}
                onClick={() => setBannerIndex((prev) => (prev + 1) % banners.length)}
                aria-label="다음"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      <div className={styles['express-container']}>
   
        <section className={styles['express-top-highlights']}>
          <div className={styles['section-header']}>
            <h3 className={styles['section-title']}>
              <img 
                src="/즉시출고.png" 
                alt="긴급" 
                className={styles['section-title-icon']}
              />
              <span className={styles['section-title-text']}>[긴급] 오늘 놓치면 마감 차량</span>
            </h3>
          </div>
          <div className={styles['top-grid-scroll']}>
            <div className={styles['top-grid']}>
              {highlightItems.slice(0, 4).map((item) => {
                // 트림 데이터 추출
                const trim = item.trim || item.trims?.[0] || {};
                
                // 콘솔 로그 추가
                console.log('🚗 ExpressDeals Highlight Car Data:', {
                  name: item.title,
                  discountPercent: item.discountPercent,
                  monthlyDiscountPercent: item.monthlyDiscountPercent,
                  basePrice: item.basePrice,
                  finalPrice: item.finalPrice,
                  trim: {
                    lowestPrepayment30MonthlyFee: trim.lowestPrepayment30MonthlyFee,
                    lowestDeposit30MonthlyFee: trim.lowestDeposit30MonthlyFee,
                    lowestNoDepositMonthlyFee: trim.lowestNoDepositMonthlyFee,
                  }
                });
                
                return (
                <PromotionCard
                  key={item.id}
                  {...getRemainingInfo(item)}
                  id={item.id}
                  name={item.title ?? '재고출고 차량'}
                  desc={item.subtitle ?? item.description ?? '빠른 출고 가능'}
                  img={item.imageUrl ?? FALLBACK_IMAGE}
                  brand={item.extraInfo ?? '블라인드 카스토리'}
                  basePrice={item.basePrice}
                  finalPrice={item.finalPrice}
                  discountPercent={item.discountPercent}
                  monthlyRentalFee={item.monthlyRentalFee}
                  discountedMonthlyFee={item.discountedMonthlyFee}
                  monthlyDiscountPercent={item.monthlyDiscountPercent}
                  variant="medium"
                  onClick={() => handleCardClick(item)}
                  trim={trim}
                  onButtonClick={() => handleConsultClick(item)}
                  buttonText="실시간 무료견적 받기"
                />
                );
              })}
            </div>
          </div>
        </section>

        {/* 제조사 필터 */}
        <div className={styles['manufacturer-section']}>
          <h3 className={styles['manufacturer-title']}>제조사</h3>
          <div className={styles['manufacturer-section-content']}>
          <CarManufacturerFilter
            manufacturers={manufacturerOptions}
            selectedManufacturer={manufacturer}
            onSelectManufacturer={handleSelectManufacturer}
          />
          </div>
        </div>

        {/* 리스트 제목 바 */}
        <div className={styles['express-list-section']}>
          <div className={styles['express-list-header']}>
            <h3 className={styles['express-list-title']}>차량선택</h3>
          </div>
          
          <div className={styles['express-list-content']}>
            <p className={styles['express-list-notice']}>
              *동일 차량 라인에 여러 할인율이 있을 경우 가장 높은 할인율 기준으로 표시됩니다.
            </p>

            {isInitialLoading ? (
              <div className={styles['express-empty']}>즉시 출고 차량을 불러오는 중입니다...</div>
            ) : showListError ? (
              <div className={styles['express-empty']}>즉시 출고 차량을 불러오지 못했습니다.</div>
            ) : filteredItems.length === 0 ? (
              <div className={styles['express-empty']}>
                선택하신 제조사/조건에 맞는 즉시 출고 차량이 없습니다.
                <br />
                다른 제조사나 조건으로 다시 선택해 주세요.
              </div>
            ) : (
              <>
                <div id="deals-list" className={styles['carlist-grid']}>
                  {visibleItems.map((item) => {
                    // 트림 데이터 추출
                    const trim = item.trim || item.trims?.[0] || {};
                    
                    // 콘솔 로그 추가
                    console.log('🚗 ExpressDeals List Car Data:', {
                      name: item.title,
                      discountPercent: item.discountPercent,
                      monthlyDiscountPercent: item.monthlyDiscountPercent,
                      basePrice: item.basePrice,
                      finalPrice: item.finalPrice,
                      trim: {
                        lowestPrepayment30MonthlyFee: trim.lowestPrepayment30MonthlyFee,
                        lowestDeposit30MonthlyFee: trim.lowestDeposit30MonthlyFee,
                        lowestNoDepositMonthlyFee: trim.lowestNoDepositMonthlyFee,
                      }
                    });
                    
                    return (
                    <PromotionCard
                      key={item.id}
                      {...getRemainingInfo(item)}
                      id={item.id}
                      name={item.title ?? '재고출고 차량'}
                      desc={item.subtitle ?? item.description ?? ''}
                      img={item.imageUrl ?? FALLBACK_IMAGE}
                      brand={item.extraInfo ?? '블라인드 카스토리'}
                      basePrice={item.basePrice}
                      finalPrice={item.finalPrice}
                      discountPercent={item.discountPercent}
                      monthlyRentalFee={item.monthlyRentalFee}
                      discountedMonthlyFee={item.discountedMonthlyFee}
                      monthlyDiscountPercent={item.monthlyDiscountPercent}
                      onClick={() => handleCardClick(item)}
                      onButtonClick={() => handleConsultClick(item)}
                      trim={trim}
                      buttonText="실시간 무료견적 받기"
                      variant="medium"
                    />
                    );
                  })}
                </div>

                <div ref={observerRef} style={{ height: '20px', marginTop: '20px' }} />
              </>
            )}
          </div>
        </div>

      </div>
      <BrowserContactModal
        open={isContactModalOpen}
        onClose={handleContactModalClose}
        onSubmit={handleContactModalSubmit}
        isSubmitting={isContactSubmitting}
        description={contactModalMessage || undefined}
        initialPhone=""
      />
      <ConsultSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
      />
    </div>
    </>
  );
};

export default ExpressDeals;


