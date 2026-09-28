import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueries } from '@tanstack/react-query';
import { navigateToDetail } from '../utils/navigateDetail.js';
import styles from './MobileAdvance.module.css';
import mobileMainStyles from '../main/MobleMain.module.css';
import { ButtonLarge } from '../../components/Buttons.jsx';
import BrandFilterChips from '../../components/navigation/BrandFilterChips.jsx';
import PromotionCardMobile from '../../components/PromotionCardMobile.jsx';
import BrowserContactModal from '../../components/BrowserContactModal.jsx';
import ConsultSuccessModal from '../../components/ConsultSuccessModal.jsx';
import Event from '../../components/mobileMain/Event.jsx';
import { contentAPI } from '../../services/contentApi.js';
import { carAPI } from '../../services/carApi.js';
import { useCarBrandsQuery } from '../../hooks/queries/carQueries';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import StructuredData, { getOrganizationSchema } from '../../components/StructuredData.jsx';
import { getPageSeo } from '../../config/seoConfig';
import {
  sendToKakaoOnly,
  acquireContactViaKakao,
  KAKAO_OAUTH_CANCELLED_MESSAGE,
} from '../../services/consultHelper';
import { getStoredUserPhone, setStoredUserPhone } from '../../utils/phoneStorage';
import { KAKAO_POPUP_BLOCKED_MESSAGE } from '../../utils/kakaoPopup';
import { normalizePriceValue } from '../../utils/priceUtils';

const FALLBACK_IMAGE = '/placeholder/car.svg';
const CONTACT_PROMPT_DEFAULT =
  '카카오 상담을 위해 인증창을 열고 있습니다. 창이 닫히면 아래에 연락처를 남겨 주세요.';
const CONTACT_LOADING_MESSAGE =
  '카카오 상담을 위해 인증창을 열고 있습니다. 인증이 끝나면 자동으로 닫혀요.';

// 브랜드명 → 로고 파일 경로 매핑
const getBrandLogoPath = (brandName) => {
  if (!brandName) return null;
  
  const brandNameLower = brandName.toLowerCase();
  
  // 국산 브랜드 매핑
  const domesticBrands = {
    '현대': '/brand/현대.svg',
    '기아': '/brand/kia.svg',
    'kia': '/brand/kia.svg',
    '제네시스': '/brand/제네시스.svg',
    'kgm': '/brand/kgm.svg',
    '르노삼성': '/brand/르노삼성.svg',
    '르노': '/brand/르노삼성.svg',
    '삼성': '/brand/르노삼성.svg',
    '쉐보레': '/brand/쉐보레.svg',
  };
  
  // 수입 브랜드 매핑
  const importBrands = {
    'bmw': '/importbrands/bmw.svg',
    '벤츠': '/importbrands/벤츠.svg',
    'mercedes': '/importbrands/벤츠.svg',
    'mercedes-benz': '/importbrands/벤츠.svg',
    '볼보': '/importbrands/volvo.svg',
    'volvo': '/importbrands/volvo.svg',
    '아우디': '/importbrands/아우디.svg',
    'audi': '/importbrands/아우디.svg',
    '포드': '/importbrands/포드.svg',
    'ford': '/importbrands/포드.svg',
    '폴스타': '/importbrands/폴스타.svg',
    'polestar': '/importbrands/폴스타.svg',
    'byd': '/importbrands/byd.svg',
    '도요타': '/importbrands/도요타.svg',
    'toyota': '/importbrands/도요타.svg',
    '렉서스': '/importbrands/렉서스.svg',
    'lexus': '/importbrands/렉서스.svg',
    '테슬라': '/importbrands/테슬라.svg',
    'tesla': '/importbrands/테슬라.svg',
    '폭스바겐': '/importbrands/폭스바겐.svg',
    'volkswagen': '/importbrands/폭스바겐.svg',
  };
  
  // 먼저 원래 이름으로 검색, 그 다음 소문자로 검색
  return domesticBrands[brandName] || 
         domesticBrands[brandNameLower] || 
         importBrands[brandName] || 
         importBrands[brandNameLower] || 
         null;
};

// 재고 특가(Advance) 페이지 — Immediate 페이지와 유사한 레이아웃 재사용
const heroDeal = {
  title: '재고 특가 핫딜',
  subtitle: '실시간 재고 기반, 한정 수량 재고 특가 차량',
  badge: 'SALE',
  cta: '혜택 확인하기',
  image:
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=260&fit=crop&q=80'
};

const filterTabs = ['전체', '국산', '수입'];

// @brand 폴더 기준 국산 브랜드 하드코딩
// public/brand 폴더: 제네시스.svg, 르노삼성.svg, kia.svg, kgm.svg, 현대.svg, 쉐보레.svg
const DOMESTIC_BRAND_ITEMS = [
  { key: '전체', label: '전체' },
  { key: '현대', label: '현대' },
  { key: '기아', label: '기아' }, // kia.svg
  { key: '제네시스', label: '제네시스' },
  { key: 'KGM', label: 'KGM' }, // kgm.svg
  { key: '르노삼성', label: '르노삼성' },
  { key: '쉐보레', label: '쉐보레' },
];

// @importbrands 폴더 기준 수입 브랜드 하드코딩
// public/importbrands 폴더: 포드.svg, 폴스타.svg, byd.svg, 도요타.svg, 렉서스.svg,
// 아우디.svg, volvo.svg, bmw.svg, 벤츠.svg, 테슬라.svg
const IMPORT_BRAND_ITEMS = [
  { key: '전체', label: '전체' },
  { key: 'BMW', label: 'BMW' },
  { key: '벤츠', label: '벤츠' },
  { key: '볼보', label: '볼보' }, // volvo.svg
  { key: '아우디', label: '아우디' },
  { key: '포드', label: '포드' },
  { key: '폴스타', label: '폴스타' },
  { key: 'BYD', label: 'BYD' },
  { key: '도요타', label: '도요타' },
  { key: '렉서스', label: '렉서스' },
  { key: '테슬라', label: '테슬라' },
];

// 전체 탭에서 사용할 브랜드 목록 (국산 + 수입 합쳐서, '전체'는 한 번만)
const ALL_BRAND_ITEMS = [
  { key: '전체', label: '전체' },
  // 국산 브랜드들 (전체 제외)
  ...DOMESTIC_BRAND_ITEMS.filter((item) => item.key !== '전체'),
  // 수입 브랜드들 (전체 제외)
  ...IMPORT_BRAND_ITEMS.filter((item) => item.key !== '전체'),
];

// 가격/월렌탈료 계산을 익스프레스딜스와 동일하게 맞추기 위한 유틸
const toPositiveOrNull = (value) => {
  const normalized = normalizePriceValue(value);
  return normalized > 0 ? normalized : null;
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
      Math.round((monthlyBase * (100 - monthlyDiscountPercent)) / 100),
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
  const legacy = resolveLegacyPricing(item);

  // trim 객체 생성 (PromotionCardMobile이 기대하는 형식)
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

  return {
    ...item,
    ...legacy,
    monthlyRentalFee: monthlyPricing.monthlyBase,
    discountedMonthlyFee: monthlyPricing.monthlyFinal,
    monthlyDiscountPercent: monthlyPricing.monthlyDiscountPercent ?? null,
    trim, // trim 객체 추가
  };
};

function MobileAdvance() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(filterTabs[0]);
  const [visibleCount, setVisibleCount] = useState(6);
  const [activeBrand, setActiveBrand] = useState('전체');
  const [contactModalPayload, setContactModalPayload] = useState(null);
  const [contactModalMessage, setContactModalMessage] = useState(null);
  const [contactModalInitialPhone, setContactModalInitialPhone] = useState('');
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [urgentCardIndex, setUrgentCardIndex] = useState(0);
  const urgentScrollRef = useRef(null);
  const isScrollingRef = useRef(false);

  // 브랜드 API 호출
  const { data: brandsData = [] } = useCarBrandsQuery();

  // 긴급 카드 스크롤 핸들러 (무한 스크롤)
  const handleUrgentScroll = useCallback((urgentCardsLength) => {
    if (!urgentScrollRef.current || isScrollingRef.current || urgentCardsLength === 0) return;
    
    const scrollLeft = urgentScrollRef.current.scrollLeft;
    const cardWidth = 166 + 12;
    const pageWidth = cardWidth * 2; // 2개씩 보임
    const totalPages = Math.ceil(urgentCardsLength / 2);
    
    // 현재 페이지 계산 (15세트 중 중간 세트 기준)
    const currentAbsolutePage = Math.round(scrollLeft / pageWidth);
    const currentPage = currentAbsolutePage % totalPages;
    
    setUrgentCardIndex(currentPage);
    
    // 무한 스크롤: 양 끝에 도달하면 중간으로 순간이동 (애니메이션 없이)
    // 15배 복사: 0번째~14번째 세트, 중간은 7번째 세트
    const middleSetStart = totalPages * 7; // 7번째 세트 시작
    
    if (currentAbsolutePage < totalPages * 3) {
      // 0~2번째 세트 → 7번째 세트로 순간이동
      const pageInSet = currentAbsolutePage % totalPages;
      const targetScroll = (middleSetStart + pageInSet) * pageWidth;
      urgentScrollRef.current.scrollLeft = targetScroll;
    } else if (currentAbsolutePage >= totalPages * 12) {
      // 12~14번째 세트 → 7번째 세트로 순간이동
      const pageInSet = currentAbsolutePage % totalPages;
      const targetScroll = (middleSetStart + pageInSet) * pageWidth;
      urgentScrollRef.current.scrollLeft = targetScroll;
    }
  }, []);

  const scrollToUrgentPage = useCallback((targetPageIndex, urgentCardsLength) => {
    if (!urgentScrollRef.current || urgentCardsLength === 0) return;
    
    const cardWidth = 166 + 12;
    const pageWidth = cardWidth * 2;
    const totalPages = Math.ceil(urgentCardsLength / 2);
    const currentScrollLeft = urgentScrollRef.current.scrollLeft;
    const currentAbsolutePage = Math.round(currentScrollLeft / pageWidth);
    const currentPage = currentAbsolutePage % totalPages;
    
    // 같은 페이지 클릭 시 아무것도 안 함
    if (currentPage === targetPageIndex) return;
    
    // 항상 오른쪽 방향으로 이동
    let targetAbsolutePage;
    if (targetPageIndex > currentPage) {
      // 타겟이 현재보다 큰 경우: 같은 세트 내에서 이동
      targetAbsolutePage = currentAbsolutePage + (targetPageIndex - currentPage);
    } else {
      // 타겟이 현재보다 작은 경우: 다음 세트의 타겟으로 이동
      targetAbsolutePage = currentAbsolutePage + (totalPages - currentPage + targetPageIndex);
    }
    
    // 스크롤 중 플래그 설정
    isScrollingRef.current = true;
    
    // 목표 페이지로 스크롤
    const targetScroll = targetAbsolutePage * pageWidth;
    urgentScrollRef.current.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
    
    // 페이지 인덱스 즉시 업데이트 (UX 개선)
    setUrgentCardIndex(targetPageIndex);
    
    // 스크롤 완료 후 플래그 해제 (800ms는 smooth scroll 완료 시간 고려)
    setTimeout(() => {
      isScrollingRef.current = false;
      
      // 스크롤 완료 후 무한 스크롤 재조정 확인 (15배 복사 기준)
      if (urgentScrollRef.current) {
        const finalScrollLeft = urgentScrollRef.current.scrollLeft;
        const finalAbsolutePage = Math.round(finalScrollLeft / pageWidth);
        const middleSetStart = totalPages * 7; // 7번째 세트
        
        // 끝 세트에 있으면 중간 세트(7번째)로 순간이동
        if (finalAbsolutePage < totalPages * 4 || finalAbsolutePage > totalPages * 11) {
          const pageInSet = finalAbsolutePage % totalPages;
          const middlePosition = (middleSetStart + pageInSet) * pageWidth;
          urgentScrollRef.current.scrollLeft = middlePosition;
        }
      }
    }, 800);
  }, []);

  // 탭이 변경되면 브랜드 필터도 리셋
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setActiveBrand('전체');
  };

  // 브랜드명으로 브랜드 ID 찾기
  const selectedBrandId = useMemo(() => {
    if (activeBrand === '전체') return null;
    const brand = brandsData.find(b => b.name === activeBrand);
    return brand?.id || null;
  }, [activeBrand, brandsData]);

  // carType 결정 (activeTab에 따라)
  const carType = useMemo(() => {
    if (activeTab === '국산') return '국산';
    if (activeTab === '수입') return '수입';
    return null;
  }, [activeTab]);

  // 브랜드 필터용: 필터링 없이 모든 인벤토리 데이터 가져오기 (상단/브랜드 탭 공통)
  const { data: allHotDealsDataForBrands = [] } = useQuery({
    queryKey: ['mobile-advance', 'all-inventory-for-brands'],
    queryFn: async () => {
      const result = await contentAPI.getUrgentInventory(1000, null, null, null); // 카드 타입 필터 없이 전체
      return result;
    },
    staleTime: 1000 * 60 * 5, // 브랜드 목록은 자주 변경되지 않으므로 캐시 시간을 길게
  });

  // 상단 오늘 마감 섹션용: ExpressDeals와 동일하게 PROMOTION_EVENT만 조회 (필터 없이 전체)
  const { data: hotDealsData = [] } = useQuery({
    queryKey: ['mobile-advance', 'inventory-promotions-all'],
    queryFn: async () => {
      const result = await contentAPI.getUrgentInventory(30, null, null, 'PROMOTION_EVENT');
      return Array.isArray(result)
        ? result.filter((item) => (item.cardType ?? item.card_type ?? '').toUpperCase() === 'PROMOTION_EVENT')
        : [];
    },
    staleTime: 1000 * 60, // 1분 캐시
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // 하단 리스트용: ExpressDeals와 동일하게 PROMOTION_EVENT 제외한 전체 재고 조회 (브랜드/탭 필터 적용)
  const { data: nonHotDealsData = [] } = useQuery({
    queryKey: ['mobile-advance', 'inventory-non-promotion', selectedBrandId, carType],
    queryFn: async () => {
      const result = await contentAPI.getUrgentInventory(200, selectedBrandId, carType, null);
      if (!Array.isArray(result)) return [];
      return result.filter((item) => (item.cardType ?? item.card_type ?? '').toUpperCase() !== 'PROMOTION_EVENT');
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // 브랜드 필터용: 모든 선구매 데이터에서 고유한 trimId 추출
  const enrichedNonHotDealsData = useMemo(
    () => (nonHotDealsData || []).map((item) => enrichInventoryItem(item)),
    [nonHotDealsData],
  );

  const allUniqueTrimIdsForBrands = useMemo(() => {
    const trimIdSet = new Set();
    allHotDealsDataForBrands.forEach((item) => {
      if (item.trimId) {
        trimIdSet.add(item.trimId);
      }
    });
    return Array.from(trimIdSet);
  }, [allHotDealsDataForBrands]);

  // 브랜드 필터용: 각 trimId에 대해 차량 상세 정보 가져오기
  const allTrimDetailsQueriesForBrands = useQueries({
    queries: allUniqueTrimIdsForBrands.map((trimId) => ({
      queryKey: ['car-detail-for-brands-advance', trimId],
      queryFn: () => carAPI.getCarDetail(trimId),
      enabled: Boolean(trimId),
      staleTime: 1000 * 60 * 5,
    })),
  });

  // 표시용: 상단/하단에서 사용하는 모든 인벤토리 데이터의 고유 trimId 추출
  const listSourceData = useMemo(
    () => [...hotDealsData, ...enrichedNonHotDealsData],
    [hotDealsData, enrichedNonHotDealsData],
  );

  const uniqueTrimIds = useMemo(() => {
    const trimIdSet = new Set();
    listSourceData.forEach((item) => {
      if (item.trimId) {
        trimIdSet.add(item.trimId);
      }
    });
    return Array.from(trimIdSet);
  }, [listSourceData]);

  // 표시용: 각 trimId에 대해 차량 상세 정보 가져오기
  const trimDetailsQueries = useQueries({
    queries: uniqueTrimIds.map((trimId) => ({
      queryKey: ['car-detail-advance', trimId],
      queryFn: () => carAPI.getCarDetail(trimId),
      enabled: Boolean(trimId),
      staleTime: 1000 * 60 * 5,
    })),
  });

  // trimId로 차량 상세 정보 맵 생성 (표시용)
  const trimDetailsMap = useMemo(() => {
    const map = new Map();
    trimDetailsQueries.forEach((query, index) => {
      const trimId = uniqueTrimIds[index];
      if (trimId && query.data) {
        map.set(trimId, query.data);
      }
    });
    return map;
  }, [trimDetailsQueries, uniqueTrimIds]);

  // 브랜드 필터 아이템 생성 (선택된 탭에 따라 변경)
  const brandItems = useMemo(() => {
    if (activeTab === '국산') {
      return DOMESTIC_BRAND_ITEMS;
    }
    if (activeTab === '수입') {
      return IMPORT_BRAND_ITEMS;
    }
    // 전체 탭은 국산+수입 모두 노출
    return ALL_BRAND_ITEMS;
  }, [activeTab]);

  useEffect(() => {
    if (!brandItems.some((item) => item.key === activeBrand)) {
      setActiveBrand('전체');
    }
  }, [brandItems, activeBrand]);

  useEffect(() => {
    setVisibleCount(6);
  }, [activeTab, activeBrand]);

  const sanitizePhoneForStorage = useCallback((value) => {
    if (!value) return '';
    const str = String(value).trim();
    return str.length > 30 ? str.slice(0, 30) : str;
  }, []);

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

  const startKakaoContactFlow = useCallback(
    async (payload) => {
      const contactInfo = await acquireContactViaKakao(
        payload,
        {
          openModal: () =>
            openContactModalWithPayload(
              payload,
              CONTACT_LOADING_MESSAGE,
              payload?.phone || '',
            ),
          updateModal: (stage) => {
            if (stage === 'start') {
              setContactModalMessage(
                '카카오 로그인 창이 열렸습니다. 창을 닫으면 아래에 연락처를 남겨 주세요.',
              );
            } else if (stage === 'success') {
              setContactModalMessage('카카오 인증이 완료되었습니다. 상담창을 준비하고 있어요.');
            } else if (stage === 'fail') {
              setContactModalMessage(KAKAO_OAUTH_CANCELLED_MESSAGE);
            }
          },
          closeModal: () => handleContactModalClose(),
        },
        { requirePhone: false },
      );

      if (contactInfo?.phoneMissing) {
        const sanitizedPhone = sanitizePhoneForStorage(contactInfo.data?.phone);
        openContactModalWithPayload(
          {
            ...(contactInfo.data ?? payload),
            phone: sanitizedPhone,
          },
          contactInfo?.kakaoCancelled ? KAKAO_OAUTH_CANCELLED_MESSAGE : CONTACT_PROMPT_DEFAULT,
          sanitizedPhone || '',
        );
        return null;
      }

      return contactInfo;
    },
    [handleContactModalClose, openContactModalWithPayload, sanitizePhoneForStorage],
  );

  const buildConsultPayload = useCallback(
    (item) => ({
      brand: item.brandName ?? item.brand ?? '',
      model: item.title ?? item.name ?? '',
      trim: item.detailPayload?.trimId ?? item.detailPayload?.carId ?? item.id ?? null,
      consultType: '재고문의',
      source: 'mobile-advance',
      entryLabel: `mobile-advance > 재고문의 > ${item.title ?? item.name ?? ''}`,
    }),
    [],
  );

  const handleConsultClick = useCallback(
    async (item) => {
      if (!item) return;
      const payload = buildConsultPayload(item);
      try {
        // 1. 로컬 스토리지에서 저장된 연락처 확인
        const savedPhone = sanitizePhoneForStorage(getStoredUserPhone());
        const savedName = localStorage.getItem('wgl_user_name');

        if (savedPhone) {
          // 연락처가 있으면 바로 전송
          const enriched = { ...payload, phone: savedPhone, name: savedName || '' };
          // eslint-disable-next-line no-console
          console.info('[MobileAdvance] handleConsultClick: using stored phone, calling sendToKakaoOnly', enriched);
          const result = await sendToKakaoOnly(enriched);
          
          // API 호출이 성공하면 무조건 성공 모달 표시
          if (result?.success) {
            persistContactInfo(enriched.phone, enriched.name);
            setIsSuccessModalOpen(true);
            return;
          }
          
          if (result?.reason === 'popup_blocked' && enriched.phone) {
            return;
          }
          openContactModalWithPayload(
            { ...enriched, phone: '' },
            '카카오톡으로 보내는 데 실패했습니다. 아래에 연락처를 남겨 주세요.',
            enriched.phone || '',
          );
          return;
        }

        const contactInfo = await startKakaoContactFlow(payload);
        if (!contactInfo) {
          return;
        }
        const enriched = {
          ...(contactInfo?.data ?? payload),
          phone: sanitizePhoneForStorage(contactInfo?.data?.phone),
        };
        // eslint-disable-next-line no-console
        console.info('[MobileAdvance] handleConsultClick: calling sendToKakaoOnly with Kakao contact', enriched);
        const result = await sendToKakaoOnly(enriched);
        
        // API 호출이 성공하면 무조건 성공 모달 표시
        if (result?.success) {
          persistContactInfo(enriched.phone, enriched.name);
          setIsSuccessModalOpen(true);
          return;
        }

        if (result?.reason === 'popup_blocked') {
          if (enriched.phone) {
            return;
          }
          openContactModalWithPayload(
            { ...enriched, phone: '' },
            KAKAO_POPUP_BLOCKED_MESSAGE,
            enriched.phone || '',
          );
        } else {
          openContactModalWithPayload(
            { ...enriched, phone: '' },
            '카카오 상담 전송에 실패했습니다. 아래에 연락처를 남겨 주세요.',
            enriched.phone || '',
          );
        }
      } catch (error) {
        console.error('[MobileAdvance] 연락처 확보 실패', error);
        openContactModalWithPayload(
          payload,
          '연락처를 자동으로 확보하지 못했습니다. 아래에 연락처를 남겨 주세요.',
          '',
        );
      }
    },
    [buildConsultPayload, openContactModalWithPayload, persistContactInfo, startKakaoContactFlow, sanitizePhoneForStorage],
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
        console.info('[MobileAdvance] handleContactModalSubmit: submitting to backend', enriched);
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
        console.error('[MobileAdvance] handleContactModalSubmit: 연락처 등록 실패', error);
        setContactModalMessage('연락처 등록에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setIsContactSubmitting(false);
      }
    },
    [contactModalPayload, persistContactInfo, sanitizePhoneForStorage],
  );

  // 이벤트 상담 신청 핸들러
  const handleEventSubmit = useCallback(async ({ name, phone, carModel }) => {
    setEventSubmitting(true);
    try {
      const payload = {
        name: name || '',
        phone: sanitizePhoneForStorage(phone || ''),
        carModel: carModel || '',
        consultType: '이벤트상담',
        source: 'mobile-advance-event',
        entryLabel: 'mobile-advance > 이벤트 섹션',
      };
      
      const result = await sendToKakaoOnly(payload);
      
      if (result?.success) {
        persistContactInfo(payload.phone, payload.name);
        setIsSuccessModalOpen(true);
      } else {
        alert(result?.message || '상담 신청에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('[MobileAdvance] 이벤트 상담 신청 실패', error);
      alert('상담 신청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setEventSubmitting(false);
    }
  }, [persistContactInfo, sanitizePhoneForStorage]);

  const logMappingSample = useCallback((label, raw, mapped) => {
    const seen = new WeakSet();
    const replacer = (_key, value) => {
      if (typeof value === 'function') return '[Function]';
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return '[Circular]';
        seen.add(value);
      }
      return value;
    };
    try {
      console.log(label, JSON.stringify({ raw, mapped }, replacer, 2));
    } catch (error) {
      console.log(label, { raw, mapped, error: error?.message ?? error });
    }
  }, []);

  // 오늘 마감 차량 카드 (PromotionCardMobile용) - 원본
  const urgentCardsOriginal = useMemo(() => {
    return hotDealsData.map((item) => {
      const enrichedItem = enrichInventoryItem(item);
      const carDetail = item.trimId ? trimDetailsMap.get(item.trimId) : null;
      const heroImage = carDetail?.imageUrl || item.imageUrl || FALLBACK_IMAGE;
      const brandName =
        item.brandName ||
        carDetail?.brandName ||
        item.extraInfo ||
        carDetail?.manufacturerName ||
        '블라인드 카스토리';
      
      const subtitleText =
        item.subtitle ||
        item.description ||
        item.modelName ||
        item.trimName ||
        item.vehicleLineName ||
        carDetail?.modelName ||
        carDetail?.vehicleLineName ||
        '재고 특가 차량';
      const displayTitle =
        item.title ||
        item.name ||
        carDetail?.name ||
        `${brandName} 재고 특가 핫딜`;
      
      const remainingQuantity =
        item.remainingQuantity !== undefined
          ? item.remainingQuantity
          : item.remaining_quantity !== undefined
            ? item.remaining_quantity
            : null;
      
      let badgeText = '긴급';
      let badgeVariant = 'red';
      
      if (remainingQuantity !== null && remainingQuantity !== undefined && !Number.isNaN(Number(remainingQuantity))) {
        const parsedQuantity = Number(remainingQuantity);
        const safeQuantity = Math.max(0, parsedQuantity);
        if (safeQuantity > 0) {
          badgeText = `${safeQuantity.toLocaleString()}대 보유`;
          badgeVariant = 'red';
        } else {
          badgeText = '마감임박';
          badgeVariant = 'red';
        }
      }

      const detailPayload = item.trimId
        ? { trimId: item.trimId }
        : { carId: item.id?.toString() || 'unknown' };
      
      return {
        id: item.id?.toString() || `adv-urg-${Math.random()}`,
        title: displayTitle,
        subtitle: subtitleText,
        image: heroImage,
        brandName,
        badge: badgeText,
        badgeVariant,
        detailPayload,
        monthlyRentalFee: enrichedItem.monthlyRentalFee,
        discountedMonthlyFee: enrichedItem.discountedMonthlyFee,
        vehiclePrice: enrichedItem.basePrice || carDetail?.price || carDetail?.consumerPrice || null,
        monthlyDiscountPercent: enrichedItem.monthlyDiscountPercent,
        trim: enrichedItem.trim,
      };
    });
  }, [hotDealsData, trimDetailsMap]);

  // 무한 스크롤을 위해 카드를 15배로 복사 (매우 부드러운 무한 스크롤)
  const urgentCards = useMemo(() => {
    if (urgentCardsOriginal.length === 0) return [];
    const copies = [];
    for (let i = 0; i < 15; i++) {
      copies.push(
        ...urgentCardsOriginal.map((card, idx) => ({ 
          ...card, 
          id: `${card.id}-copy-${i}-${idx}` 
        }))
      );
    }
    return copies;
  }, [urgentCardsOriginal]);

  // 초기 스크롤 위치를 중간 세트(7번째)로 설정
  useEffect(() => {
    if (!urgentScrollRef.current || urgentCardsOriginal.length === 0) return;
    const cardWidth = 166 + 12;
    const pageWidth = cardWidth * 2;
    const totalPages = Math.ceil(urgentCardsOriginal.length / 2);
    // 15배 복사 중 중간(7번째 세트)에 위치
    const middleSetStart = totalPages * 7 * pageWidth;
    
    // 약간의 지연을 두고 스크롤 위치 설정 (DOM 렌더링 완료 후)
    setTimeout(() => {
      if (urgentScrollRef.current) {
        urgentScrollRef.current.scrollLeft = middleSetStart;
      }
    }, 0);
  }, [urgentCardsOriginal.length]);

  // 재고 특가 카드 데이터 변환 (백엔드에서 이미 필터링됨)
  const parseBadgeQuantity = (badgeValue) => {
    if (!badgeValue) return null;
    const text = String(badgeValue);
    const match = text.match(/(\d+)(?=\s*(?:개|대))/);
    if (match && match[1]) {
      const parsed = Number(match[1]);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
  };

  const dealCards = useMemo(() => {
    const now = new Date();
    
    // 종료된 항목 필터링 (endDate가 있고 현재 시간보다 이전인 경우)
    const activeListData = enrichedNonHotDealsData.filter((item) => {
      if (item.endDate) {
        const endDate = new Date(item.endDate);
        if (endDate < now) return false; // 종료된 항목 제외
      }
      return true;
    });
    
    const cards = activeListData.map((item) => {
      const carDetail = item.trimId ? trimDetailsMap.get(item.trimId) : null;
      const brandName =
        item.brandName ||
        carDetail?.brandName ||
        brandsData.find((b) => b.id === carDetail?.brandId)?.name ||
        '블라인드 카스토리';
      const remainingQuantity =
        item.remainingQuantity !== undefined
          ? item.remainingQuantity
          : item.remaining_quantity !== undefined
            ? item.remaining_quantity
            : null;
      const fallbackQuantity = parseBadgeQuantity(item.badge || item.ribbonText || item.badgeText);
      const priceValue =
        item.discountedMonthlyFee ??
        item.monthlyRentalFee ??
        item.price ??
        item.salePrice ??
        carDetail?.priceInfo?.monthlyPrice ??
        null;

      const subtitle =
        item.subtitle ||
        item.description ||
        carDetail?.modelName ||
        carDetail?.vehicleLineName ||
        '재고 특가 차량';
      const deadline = item.deadline || item.endDate || null;
      let badgeText = item.badge || '재고 특가';
      let badgeVariant = 'yellow';

      if (remainingQuantity !== null && remainingQuantity !== undefined && !Number.isNaN(Number(remainingQuantity))) {
        const parsedQuantity = Number(remainingQuantity);
        const safeQuantity = Math.max(0, parsedQuantity);
        if (safeQuantity > 0) {
          badgeText = `${safeQuantity.toLocaleString()}대`;
          badgeVariant = 'red';
        } else {
          badgeText = '마감임박';
          badgeVariant = 'red';
        }
      } else if (fallbackQuantity !== null) {
        const safeQuantity = Math.max(0, fallbackQuantity);
        if (safeQuantity > 0) {
          badgeText = `${safeQuantity.toLocaleString()}대`;
          badgeVariant = 'red';
        } else {
          badgeText = '마감임박';
          badgeVariant = 'red';
        }
      } else {
        // remainingQuantity가 없을 때 기본값
        badgeText = '마감임박';
        badgeVariant = 'red';
      }
      const titleText = carDetail?.name || item.title || '재고 특가 핫딜';
      
      return {
        id: item.id?.toString() || `adv-deal-${Math.random()}`,
        title: titleText,
        subtitle,
        badge: badgeText,
        badgeVariant,
        remainingQuantity,
        image: carDetail?.imageUrl || item.imageUrl || FALLBACK_IMAGE,
        detailPayload: item.trimId
          ? { trimId: item.trimId }
          : { carId: item.id?.toString() || 'unknown' },
        brandName: brandName,
        price: priceValue,
        monthlyRentalFee: item.monthlyRentalFee,
        discountedMonthlyFee: item.discountedMonthlyFee ?? item.inventory_final_monthly_fee ?? null,
        vehiclePrice:
          item.finalPrice ||
          item.basePrice ||
          carDetail?.price ||
          carDetail?.consumerPrice ||
          item.consumerPrice ||
          null,
        discountPercent: item.discountPercent,
        discountAmount: item.discountAmount,
        monthlyDiscountPercent: item.monthlyDiscountPercent,
        trim: item.trim,
      };
    });
    return cards;
  }, [nonHotDealsData, trimDetailsMap, brandsData]);

  useEffect(() => {
    if (hotDealsData.length > 0 && urgentCardsOriginal.length > 0) {
      logMappingSample('[MobileAdvance] 긴급 카드 매핑 샘플 (PROMOTION_EVENT 상단)', hotDealsData[0], urgentCardsOriginal[0]);
    }
  }, [hotDealsData, urgentCardsOriginal, logMappingSample]);

  useEffect(() => {
    if (nonHotDealsData.length > 0 && dealCards.length > 0) {
      logMappingSample('[MobileAdvance] 재고 리스트 카드 매핑 샘플 (PROMOTION_EVENT 제외)', nonHotDealsData[0], dealCards[0]);
    }
  }, [nonHotDealsData, dealCards, logMappingSample]);

  const {
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords,
  } = getPageSeo('express-deals');

  // SEO용 대표 이미지: 오늘 출고 마감 카드 > 재고 특가 리스트 첫 카드 이미지 순
  const seoImage = useMemo(() => {
    const firstUrgent = urgentCardsOriginal[0];
    if (firstUrgent?.image) return firstUrgent.image;

    const firstDeal = dealCards[0];
    if (firstDeal?.image) return firstDeal.image;

    return undefined;
  }, [urgentCardsOriginal, dealCards]);

  return (
    <>
      <SeoHelmet
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        image={seoImage}
      />
      <StructuredData data={getOrganizationSchema()} />
      <div className={styles.page}>
      <div className={styles.container}>
        {/* 상단 재고 특가 핫딜 안내 영역 (모바일 즉시출고와 동일한 형태) */}
        <section className={styles.topHeroSection}>
          <div className={styles.topHeroInner}>
            <img
              src="/mobile/모바일_재고특가.svg"
              alt="재고 특가 핫딜"
              className={styles.topHeroImage}
              loading="lazy"
            />
            <h1 className={styles.topHeroTitle}>재고 특가 핫딜</h1>
            <p className={styles.topHeroSubtitle}>
              실시간 재고 기반으로 빠르게 이용 가능한 차량을 한곳에 모았습니다.
            </p>
          </div>
        </section>

        {/* 오늘 출고 마감 차량 섹션 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleWrap}>
              <span className={styles.sectionIcon} role="img" aria-label="긴급">🚨</span>
              <h2 className={styles.sectionTitle}>[긴급] 오늘 출고 마감 차량</h2>
            </div>
            <button type="button" className={styles.sectionLink} onClick={() => navigate('/m/advance/all')}>
              더보기
            </button>
          </div>
          {urgentCards.length > 0 && (
            <>
              <div 
                ref={urgentScrollRef}
                className={styles.urgentScrollContainer}
                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                onMouseDown={(e) => {
                  // 드래그 시 파란 선택 영역이 생기는 문제 방지
                  e.preventDefault();
                }}
                onScroll={() => handleUrgentScroll(urgentCardsOriginal.length)}
              >
                <div className={styles.urgentCardGrid}>
                  {urgentCards.map((card) => (
                    <PromotionCardMobile
                      key={card.id}
                      id={card.id}
                      name={card.title}
                      desc={card.subtitle}
                      img={card.image}
                      brand={card.brandName}
                      badgeText={card.badge}
                      badgeVariant={card.badgeVariant}
                      basePrice={card.vehiclePrice}
                      finalPrice={card.vehiclePrice}
                      monthlyRentalFee={card.monthlyRentalFee}
                      discountedMonthlyFee={card.discountedMonthlyFee}
                      monthlyDiscountPercent={card.monthlyDiscountPercent}
                      trim={card.trim}
                      onClick={() => handleConsultClick(card)}
                      onButtonClick={() => handleConsultClick(card)}
                      buttonText="실시간 무료견적 받기"
                    />
                  ))}
                </div>
              </div>
              {urgentCardsOriginal.length > 2 && (
                <div className={styles.paginationDots}>
                  {Array.from({ length: Math.ceil(urgentCardsOriginal.length / 2) }).map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`${styles.dot} ${urgentCardIndex === index ? styles.dotActive : ''}`}
                      onClick={() => scrollToUrgentPage(index, urgentCardsOriginal.length)}
                      aria-label={`${index + 1}페이지로 이동`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <section className={styles.tabsSection}>
          <nav className={styles.tabList} aria-label="차량 분류">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`${styles.tabItem} ${activeTab === tab ? styles.tabItemActive : ''}`}
                onClick={() => handleTabChange(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>
        </section>

        {brandItems.length > 0 && (
          <section className={styles.brandsSection}>
            <BrandFilterChips
              items={brandItems}
              activeKey={activeBrand}
              onChange={(brand) => {
                setActiveBrand(brand);
              }}
            />
          </section>
        )}

        <section className={styles.dealSection}>
          {dealCards.length > 0 && (
            <>
              <div
                className={styles.dealGrid}
                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                onMouseDown={(e) => e.preventDefault()}
              >
                {dealCards.slice(0, visibleCount).map((card) => (
                  <PromotionCardMobile
                    key={card.id}
                    id={card.id}
                    name={card.title}
                    desc={card.subtitle}
                    img={card.image}
                    brand={card.brandName}
                    badgeText={card.badge}
                    badgeVariant={card.badgeVariant}
                    basePrice={card.vehiclePrice}
                    finalPrice={card.vehiclePrice}
                    monthlyRentalFee={card.monthlyRentalFee ?? card.price}
                    discountedMonthlyFee={card.discountedMonthlyFee ?? card.price}
                    monthlyDiscountPercent={card.monthlyDiscountPercent}
                    trim={card.trim}
                    onClick={() => handleConsultClick(card)}
                    onButtonClick={() => handleConsultClick(card)}
                    buttonText="실시간 무료견적 받기"
                  />
                ))}
              </div>
              {visibleCount < dealCards.length && (
                <div className={styles.loadMoreWrap}>
                  <button
                    type="button"
                    className={styles.loadMoreBtn}
                    onClick={() => setVisibleCount((c) => Math.min(c + 6, dealCards.length))}
                  >
                    더보기
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* 이벤트 상담 섹션 */}
  
      </div>

      <BrowserContactModal
        open={Boolean(contactModalPayload)}
        onClose={handleContactModalClose}
        onSubmit={handleContactModalSubmit}
        isSubmitting={isContactSubmitting}
        description={contactModalMessage || undefined}
        initialPhone={contactModalInitialPhone || ''}
      />
      <ConsultSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
      />

    </div>
    </>
  );
}

export default MobileAdvance;
