import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import styles from './MobleMain.module.css';

const EMPTY_LIST = Object.freeze([]);
const ZERO_TIME_LEFT = Object.freeze({ days: 0, hours: 0, minutes: 0, seconds: 0 });
import { contentAPI } from '../../services/contentApi.js';
import { coalitionAPI, COALITION_PAGE_TYPE } from '../../services/coalitionApi.js';
import { getBrandLogoPath } from '../../utils/brandMapper';
import YoutubeCardMobile from '../../components/YoutubeCardMobile';
import VehicleCardMobile from '../../components/VehicleCardMobile';
import VehicleCardSimple from '../../components/VehicleCardSimple';
import PromotionCardMobile from '../../components/PromotionCardMobile';
import BrowserContactModal from '../../components/BrowserContactModal.jsx';
import ConsultSuccessModal from '../../components/ConsultSuccessModal.jsx';
import {
  sendToKakaoOnly,
  submitConsult,
} from '../../services/consultHelper';
import {
  getPhoneValidationMessage,
  getStoredUserPhone,
  sanitizePhoneForStorage as sanitizeStoredPhone,
  setStoredUserPhone,
} from '../../utils/phoneStorage';
import { KAKAO_POPUP_BLOCKED_MESSAGE } from '../../utils/kakaoPopup';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import StructuredData, { getOrganizationSchema, getLocalBusinessSchema } from '../../components/StructuredData.jsx';
import { getPageSeo } from '../../config/seoConfig';

const FALLBACK_IMAGE = '/placeholder/car.svg';
const CONTACT_PROMPT_DEFAULT = '카카오 상담을 위해 인증창을 열고 있습니다. 창이 닫히면 아래에 연락처를 남겨 주세요.';
const CONTACT_LOADING_MESSAGE = '카카오 상담을 위해 인증창을 열고 있습니다. 인증이 끝나면 자동으로 닫혀요.';

// 제휴 파트너사 카드 데이터 (홈과 동일)
const MOBILE_PARTNER_CARDS = [
  { name: '현대카드', image: '/card/현대.svg' },
  { name: '신한카드', image: '/card/신한카드.svg' },
  { name: '삼성카드', image: '/card/삼성카드.svg' },
  { name: '우리카드', image: '/card/우리카드.svg' },
  { name: 'KB카드', image: '/card/kb카드.svg' },
  { name: '아마존카', image: '/card/아마존카.svg' },
  { name: '롯데렌터카', image: '/card/롯데렌터카.svg' },
  { name: '하모니렌트카', image: '/card/하모니렌터카.svg' },
  { name: '하나캐피탈', image: '/card/하나캐피탈.svg' },
  { name: 'ORIX', image: '/card/orix.svg' },
  { name: 'AJU', image: '/card/aj.svg' },
  { name: 'SK렌터카', image: '/card/sk렌터카.svg' },
];

const MobleMain = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('직접견적내기');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [carType, setCarType] = useState('장기렌트');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [agreePrivacy, setAgreePrivacy] = useState(true);
  const videoRef = useRef(null);
  
  // 검색 버튼 애니메이션 상태
  const [isSearchBtnVisible, setIsSearchBtnVisible] = useState(false);
  const searchSectionRef = useRef(null);
  
  // 상담 모달 상태
  const [contactModalPayload, setContactModalPayload] = useState(null);
  const [contactModalMessage, setContactModalMessage] = useState(null);
  const [contactModalInitialPhone, setContactModalInitialPhone] = useState('');
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Toast 알림 상태
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      const playback = videoRef.current.play();
      if (playback && typeof playback.catch === 'function') {
        playback.catch(() => {
          // 비디오 자동 재생 실패 시 무시
        });
      }
    }
  }, []);

  // The admin's MAIN/TOP banner is the canonical home banner on every viewport.
  // MOBILE_MAIN is retained as a legacy fallback only when no main banner exists.
  const { data: mainBannersData = EMPTY_LIST } = useQuery({
    queryKey: ['coalition', 'banners', 'main'],
    queryFn: () => coalitionAPI.getBanners(COALITION_PAGE_TYPE.MAIN),
    staleTime: 1000 * 60,
  });

  // 제휴사 콘텐츠에는 모바일 전용 페이지 타입이 없어 메인 홈 배너를 그대로 쓴다.
  const mobileBannersData = EMPTY_LIST;

  const mobileBannerSlides = useMemo(() => {
    const mainItems = Array.isArray(mainBannersData)
      ? mainBannersData
      : (mainBannersData ? [mainBannersData] : []);
    const fallbackItems = Array.isArray(mobileBannersData)
      ? mobileBannersData
      : (mobileBannersData ? [mobileBannersData] : []);
    const items = mainItems.length > 0 ? mainItems : fallbackItems;

    return items.flatMap((item) => {
      if (Array.isArray(item?.imageUrls) && item.imageUrls.length > 0) {
        return item.imageUrls.map((image) => ({ image, linkUrl: item.linkUrl }));
      }
      const image = item?.imageUrl || item?.image_url;
      return image ? [{ image, linkUrl: item.linkUrl }] : [];
    });
  }, [mainBannersData, mobileBannersData]);

  const { data: closingSoonData = EMPTY_LIST, isLoading: closingSoonLoading, isError: closingSoonError } = useQuery({
    queryKey: ['mobile-main', 'closing-soon'],
    queryFn: () => contentAPI.getClosingSoon(3),
    staleTime: 1000 * 60,
  });

  // 재고특가핫딜 데이터 - getHotDeals API 사용 (선구매 핫딜 = PRE_PURCHASE_HOT_DEAL)
  const { data: hotDealData = EMPTY_LIST, isLoading: hotDealLoading } = useQuery({
    queryKey: ['mobile-main', 'hot-deals'],
    queryFn: async () => {
      const result = await contentAPI.getUrgentInventory(200, null, null, null);
      if (!Array.isArray(result)) return [];
      // PROMOTION_EVENT 카드 타입 제외
      return result.filter((item) => (item.cardType ?? item.card_type ?? '').toUpperCase() !== 'PROMOTION_EVENT').slice(0, 5);
    },
    staleTime: 1000 * 60,
  });

  // 출고후기 데이터 (10개 가져오기)
  const { data: reviewsData = EMPTY_LIST } = useQuery({
    queryKey: ['mobile-main', 'reviews'],
    queryFn: () => contentAPI.getReviews(10),
    staleTime: 1000 * 60,
  });

  // 출고후기 자동 슬라이드 상태
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const reviewScrollRef = useRef(null);
  const isReviewScrollingRef = useRef(false);
  const reviewAutoScrollDisabled = useRef(false); // 자동 스크롤 영구 비활성화 플래그

  // 15배 복사하여 무한 스크롤 구현
  const reviewsRepeated = useMemo(() => {
    if (!reviewsData || reviewsData.length === 0) return [];
    const copies = [];
    for (let i = 0; i < 15; i++) {
      copies.push(...reviewsData.map((item, idx) => ({
        ...item,
        _uniqueKey: `${i}-${idx}-${item.id || idx}`
      })));
    }
    return copies;
  }, [reviewsData]);

  const closingSoonCards = useMemo(() => {
    return (closingSoonData ?? []).slice(0, 2).map((item, index) => {
      const deadline = item.deadline
        ? new Date(item.deadline)
        : item.endDate
        ? new Date(item.endDate)
        : null;
      
      // 실제 API 데이터 사용 (모든 가능한 필드명 확인)
      const basePrice = item.basePrice ?? item.base_price ?? 0;
      const monthlyFee = item.trimMonthlyRentalFee ?? item.trim_monthly_rental_fee ?? item.monthlyRentalFee ?? item.monthly_rental_fee ?? 0;
      
      // 할인 정보 계산
      let discountPercent = 0;
      if (item.discountInfo) {
        if (typeof item.discountInfo === 'string') {
          // "24% 할인" 형태의 문자열에서 숫자 추출
          const match = item.discountInfo.match(/(\d+(?:\.\d+)?)\s*%/);
          if (match) {
            discountPercent = Math.round(parseFloat(match[1]));
          }
        } else if (item.discountInfo.discountType === 'PERCENTAGE') {
          discountPercent = Math.round(Number(item.discountInfo.discountValue ?? 0));
        }
      }
      
      // discountInfo가 없으면 basePrice와 discountedPrice로 계산
      if (discountPercent === 0 && item.discountedPrice && basePrice > 0 && item.discountedPrice < basePrice) {
        discountPercent = Math.round(((basePrice - item.discountedPrice) / basePrice) * 100);
      }
      
      // trim 객체 생성
      const trim = item.trim || {
        lowestPrepayment30MonthlyFee: item.lowestPrepayment30MonthlyFee ?? item.lowest_prepayment_30_monthly_fee ?? null,
        lowestDeposit30MonthlyFee: item.lowestDeposit30MonthlyFee ?? item.lowest_deposit_30_monthly_fee ?? null,
        lowestNoDepositMonthlyFee: item.lowestNoDepositMonthlyFee ?? item.lowest_no_deposit_monthly_fee ?? null,
      };
      
      // 렌탈료 우선순위: lowestPrepayment30 > discountedMonthlyFee > monthlyFee
      const finalMonthlyFee = trim.lowestPrepayment30MonthlyFee ?? item.discountedMonthlyFee ?? item.discounted_monthly_fee ?? monthlyFee;
      
      return {
        id: item.id ?? item.trimId ?? `closing-${index}`,
        name: item.title ?? item.name ?? '미정',
        desc: item.subtitle ?? item.description ?? '',
        img: item.imageUrl ?? FALLBACK_IMAGE,
        brand: item.extraInfo ?? '',
        trimId: item.trimId ?? item.id,
        deadline,
        basePrice,
        remainingQuantity: item.remainingQuantity ?? item.remaining_quantity ?? null,
        // 실제 데이터 기반으로 텍스트 생성 (fallback 제공)
        discountText: discountPercent > 0 ? `${discountPercent}% 할인` : '24% 할인',
        originalPriceText: basePrice > 0 ? `차량가 ${basePrice.toLocaleString()}원~` : '차량가 4,050,000원~',
        rentalPriceText: finalMonthlyFee > 0 ? `월 렌탈료 ${finalMonthlyFee.toLocaleString()}원` : '월 렌탈료 263,512원',
        trimText: item.trimText ?? (item.subtitle ?? '2.0 디젤 4WD 프레스티지'),
        trim, // trim 객체 추가
      };
    });
  }, [closingSoonData]);

  const [timeLeft, setTimeLeft] = useState(ZERO_TIME_LEFT);
  useEffect(() => {
    if (!closingSoonCards.length) {
      setTimeLeft((current) => (
        current.days || current.hours || current.minutes || current.seconds
          ? ZERO_TIME_LEFT
          : current
      ));
      return;
    }
    const deadlines = closingSoonCards
      .map((c) => c.deadline)
      .filter((d) => d instanceof Date && !Number.isNaN(d.getTime()));

    if (!deadlines.length) return;

    const shortest = deadlines.reduce((min, current) => (current < min ? current : min), deadlines[0]);
    const update = () => {
      const now = new Date();
      const diff = shortest.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft((current) => (
          current.days || current.hours || current.minutes || current.seconds
            ? ZERO_TIME_LEFT
            : current
        ));
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [closingSoonCards]);

  // 검색 버튼 섹션 Intersection Observer (스크롤 시 애니메이션)
  useEffect(() => {
    if (!searchSectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isSearchBtnVisible) {
            setIsSearchBtnVisible(true);
          }
        });
      },
      {
        threshold: 1.0, // 100% 보일 때 트리거
        rootMargin: '-200px 0px -100px 0px', // 위쪽으로 200px, 아래쪽으로 100px 더 스크롤 필요
      }
    );

    observer.observe(searchSectionRef.current);

    return () => {
      if (searchSectionRef.current) {
        observer.unobserve(searchSectionRef.current);
      }
    };
  }, [isSearchBtnVisible]);

  // 출고후기 초기 스크롤 위치 설정 (중간 세트로)
  useEffect(() => {
    if (!reviewScrollRef.current || reviewsRepeated.length === 0) return;

    const cardWidth = 150 + 10; // 카드 너비 + 간격
    const itemsPerPage = 2; // 한 화면에 보이는 카드 수
    const pageWidth = cardWidth * itemsPerPage;
    const totalOriginalPages = Math.ceil(reviewsData.length / itemsPerPage);
    const middleSetStart = totalOriginalPages * 7 * pageWidth; // 7번째 세트 시작 지점

    // 초기 스크롤 시 자동 스크롤 비활성화 방지
    isReviewScrollingRef.current = true;
    
    setTimeout(() => {
      if (reviewScrollRef.current) {
        reviewScrollRef.current.scrollLeft = middleSetStart;
      }
      // 초기 스크롤 완료 후 플래그 해제
      setTimeout(() => {
        isReviewScrollingRef.current = false;
      }, 100);
    }, 0);
  }, [reviewsRepeated.length, reviewsData.length]);

  // 특정 페이지로 스크롤
  const scrollToReviewPage = useCallback((targetPageIndex, totalItems, isAutoScroll = false) => {
    if (!reviewScrollRef.current || totalItems === 0) return;

    const cardWidth = 150 + 10;
    const itemsPerPage = 2;
    const pageWidth = cardWidth * itemsPerPage;
    const totalOriginalPages = Math.ceil(totalItems / itemsPerPage);
    const currentScrollLeft = reviewScrollRef.current.scrollLeft;
    const currentAbsolutePage = Math.round(currentScrollLeft / pageWidth);
    const currentPageInOriginalSet = currentAbsolutePage % totalOriginalPages;

    if (currentPageInOriginalSet === targetPageIndex && !isAutoScroll) return;

    isReviewScrollingRef.current = true;

    // 중간 세트(7번째) 기준으로 목표 스크롤 위치 계산
    const middleSetStartPage = totalOriginalPages * 7;
    const targetAbsolutePage = middleSetStartPage + targetPageIndex;
    const targetScrollLeft = targetAbsolutePage * pageWidth;

    reviewScrollRef.current.scrollTo({
      left: targetScrollLeft,
      behavior: 'smooth',
    });

    setCurrentReviewIndex(targetPageIndex);

    // 스크롤 완료 후 플래그 해제
    setTimeout(() => {
      isReviewScrollingRef.current = false;
      const finalScrollLeft = reviewScrollRef.current.scrollLeft;
      const finalAbsolutePage = Math.round(finalScrollLeft / pageWidth);
      const finalPageInOriginalSet = finalAbsolutePage % totalOriginalPages;

      // 끝 세트에 있으면 중간 세트로 순간이동
      if (finalAbsolutePage < totalOriginalPages * 4 || finalAbsolutePage > totalOriginalPages * 11) {
        const middlePosition = (middleSetStartPage + finalPageInOriginalSet) * pageWidth;
        reviewScrollRef.current.scrollLeft = middlePosition;
      }
    }, 800);
  }, [reviewsData.length]);

  // 출고후기 자동 슬라이드
  useEffect(() => {
    if (!reviewScrollRef.current || reviewsData.length <= 1 || reviewAutoScrollDisabled.current) return;

    const cardWidth = 150 + 10;
    const itemsPerPage = 2;
    const pageWidth = cardWidth * itemsPerPage;
    const totalOriginalPages = Math.ceil(reviewsData.length / itemsPerPage);

    const interval = setInterval(() => {
      // 사용자가 터치했거나 스크롤 중이면 자동 스크롤 중지
      if (isReviewScrollingRef.current || reviewAutoScrollDisabled.current) return;

      const currentScrollLeft = reviewScrollRef.current?.scrollLeft;
      if (currentScrollLeft === undefined) return;
      
      const currentAbsolutePage = Math.round(currentScrollLeft / pageWidth);
      const nextAbsolutePage = currentAbsolutePage + 1;

      scrollToReviewPage(nextAbsolutePage % totalOriginalPages, reviewsData.length, true);
    }, 4000); // 4초마다 슬라이드

    return () => clearInterval(interval);
  }, [reviewsData.length, scrollToReviewPage]);

  // 출고후기 스크롤 핸들러 (무한 스크롤)
  const handleReviewScroll = useCallback(() => {
    if (!reviewScrollRef.current || reviewsData.length === 0) return;

    // 사용자가 직접 스크롤하면 자동 스크롤 비활성화
    if (!isReviewScrollingRef.current) {
      reviewAutoScrollDisabled.current = true;
    }

    const scrollLeft = reviewScrollRef.current.scrollLeft;
    const cardWidth = 150 + 10;
    const itemsPerPage = 2;
    const pageWidth = cardWidth * itemsPerPage;
    const totalOriginalPages = Math.ceil(reviewsData.length / itemsPerPage);
    const totalCopies = 15;

    const currentAbsolutePage = Math.round(scrollLeft / pageWidth);
    const currentPageInOriginalSet = currentAbsolutePage % totalOriginalPages;

    setCurrentReviewIndex(currentPageInOriginalSet);

    // 무한 스크롤 로직: 양 끝에 도달하면 중간 세트로 순간이동
    const middleSetStartPage = totalOriginalPages * Math.floor(totalCopies / 2); // 7번째 세트

    if (currentAbsolutePage < totalOriginalPages * 3) { // 0~2번째 세트
      const targetScroll = (middleSetStartPage + currentPageInOriginalSet) * pageWidth;
      if (!isReviewScrollingRef.current) {
        reviewScrollRef.current.scrollLeft = targetScroll;
      }
    } else if (currentAbsolutePage >= totalOriginalPages * (totalCopies - 3)) { // 12~14번째 세트
      const targetScroll = (middleSetStartPage + currentPageInOriginalSet) * pageWidth;
      if (!isReviewScrollingRef.current) {
        reviewScrollRef.current.scrollLeft = targetScroll;
      }
    }
  }, [reviewsData.length]);

  // 사용자가 터치하면 자동 슬라이드 영구 중지
  const handleReviewTouchStart = () => {
    isReviewScrollingRef.current = true;
    reviewAutoScrollDisabled.current = true; // 자동 스크롤 영구 비활성화
  };

  const handleReviewTouchEnd = () => {
    setTimeout(() => {
      isReviewScrollingRef.current = false;
      // reviewAutoScrollDisabled는 그대로 유지 (자동 스크롤 재개하지 않음)
    }, 500);
  };

  // 제휴 파트너사 무한 루프를 위한 2배 복제
  const loopPartnerCards = useMemo(
    () => [...MOBILE_PARTNER_CARDS, ...MOBILE_PARTNER_CARDS],
    []
  );

  // 상담 관련 헬퍼 함수들
  const sanitizePhoneForStorage = useCallback((value) => {
    return sanitizeStoredPhone(value);
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

  const buildConsultPayload = useCallback(
    (item) => ({
      brand: item.brandName ?? item.brand ?? item.extraInfo ?? '',
      model: item.title ?? item.name ?? '',
      trim: item.trimId ?? item.id ?? null,
      consultType: '재고문의',
      source: 'mobile-main',
      entryLabel: `mobile-main > 재고문의 > ${item.title ?? item.name ?? ''}`,
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
        console.error('[MobleMain] 상담 신청 실패', error);
        openContactModalWithPayload(
          payload,
          '상담 신청에 실패했습니다. 아래에 연락처를 남겨 주세요.',
          '',
        );
      }
    },
    [buildConsultPayload, openContactModalWithPayload, persistContactInfo, sanitizePhoneForStorage],
  );

  const handleContactModalSubmit = useCallback(
    async (phoneValue, nameValue) => {
      if (!contactModalPayload) return;
      const phoneValidationMessage = getPhoneValidationMessage(phoneValue || '');
      if (phoneValidationMessage) {
        setContactModalMessage(phoneValidationMessage);
        return;
      }

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
        const result = await sendToKakaoOnly(enriched);

        if (result?.success) {
          persistContactInfo(phone, name);
          setContactModalPayload(null);
          setIsSuccessModalOpen(true);
        } else {
          setContactModalMessage(
            result?.message || '연락처 등록에 실패했습니다. 다시 시도해주세요.',
          );
        }
      } catch (error) {
        console.error('[MobleMain] handleContactModalSubmit: 연락처 등록 실패', error);
        setContactModalMessage('연락처 등록에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setIsContactSubmitting(false);
      }
    },
    [contactModalPayload, persistContactInfo, sanitizePhoneForStorage],
  );

  // Toast 알림 표시 함수
  const showToastMessage = useCallback((message) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(message);
    setShowToast(true);
    toastTimerRef.current = setTimeout(() => {
      setShowToast(false);
    }, 1000); // 1초 후 사라짐
  }, []);

  // Toast 타이머 정리
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // 헤더 연락처 버튼 클릭 핸들러
  const handleHeaderContactClick = useCallback(async () => {
    const basePayload = {
      consultType: '연락처상담',
      source: 'header-contact-btn',
      entryLabel: '모바일 / 헤더 / 연락처남기기',
      model: '모바일 헤더 연락처상담',
    };

    try {
      const savedPhone = getStoredUserPhone();
      const savedName = localStorage.getItem('wgl_user_name');

      if (savedPhone) {
        const result = await submitConsult({
          ...basePayload,
          phone: savedPhone,
          name: savedName || '',
        });
        
        if (result?.success) {
          setIsSuccessModalOpen(true);
          return;
        }
      }

      // 저장된 연락처가 없으면 모달 표시
      setContactModalPayload(basePayload);
      setContactModalMessage('연락처를 남겨주시면 빠르게 상담해 드리겠습니다.');
      setContactModalInitialPhone('');
    } catch (error) {
      console.error('[MobleMain] 헤더 연락처 버튼 처리 실패', error);
      setContactModalPayload(basePayload);
      setContactModalMessage('연락처를 남겨주시면 빠르게 상담해 드리겠습니다.');
      setContactModalInitialPhone('');
    }
  }, []);

  // 빠른 견적신청 제출 핸들러
  const handleQuoteSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      
      // 유효성 검사: 연락처만 필수
      const phoneValidationMessage = getPhoneValidationMessage(contact, '연락처를 입력해주세요.');
      if (phoneValidationMessage) {
        showToastMessage(phoneValidationMessage);
        return;
      }
      const sanitizedContact = sanitizePhoneForStorage(contact);
      
      if (!agreePrivacy) {
        showToastMessage('개인정보 이용에 동의해주세요.');
        return;
      }

      const payload = {
        brand: '',
        model: '30개사 비교견적',
        trim: null,
        consultType: carType,
        source: 'mobile-main-quote-form',
        entryLabel: `mobile-main > 빠른견적신청 > ${carType}`,
        phone: sanitizedContact,
        name: name.trim() || '',
      };

      try {
        const result = await sendToKakaoOnly(payload);
        
        if (result?.success) {
          persistContactInfo(sanitizedContact, name.trim());
          setIsSuccessModalOpen(true);
          // 폼 초기화 (선택사항)
          // setName('');
          // setContact('');
          return;
        }

        // 실패 시
        showToastMessage(result?.message || '견적 신청에 실패했습니다. 다시 시도해주세요.');
      } catch (error) {
        console.error('[MobleMain] 견적 신청 실패', error);
        showToastMessage('견적 신청에 실패했습니다. 다시 시도해주세요.');
      }
    },
    [contact, name, carType, agreePrivacy, sanitizePhoneForStorage, persistContactInfo, showToastMessage],
  );

  const { title: seoTitle, description: seoDescription, keywords: seoKeywords } = getPageSeo('home');

  return (
    <>
      <SeoHelmet
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
      />
      <StructuredData data={getOrganizationSchema()} />
      <StructuredData data={getLocalBusinessSchema()} />
      <div className={styles.page}>
        {/* 헤더 */}
        <header className={styles.header}>
          <button className={styles.menuBtn} onClick={() => navigate('/m/menu')}>
            <img src="/모바일메인/서랍식.svg" alt="메뉴" />
          </button>
          <h2 className={styles.logo}>블라인드 카스토리</h2>
          <button className={styles.phoneBtn} onClick={handleHeaderContactClick}>
            <img src="/모바일메인/연락처.svg" alt="연락처남기기" />
          </button>
        </header>

      {/* 탭 메뉴 */}
      <div className={styles.tabsContainer}>
              <button
          className={`${styles.tab} ${activeTab === '직접견적내기' ? styles.tabActive : ''}`}
                onClick={() => {
            setActiveTab('직접견적내기');
            navigate('/m/search/results?carOrigin=domestic');
          }}
              >
          직접견적내기
        </button>
        <button 
          className={`${styles.tab} ${activeTab === '재고특가핫딜' ? styles.tabActive : ''}`}
          onClick={() => {
            setActiveTab('재고특가핫딜');
            navigate('/m/advance');
          }}
        >
          재고특가핫딜
              </button>
              <button
          className={`${styles.tab} ${activeTab === '수입차할인' ? styles.tabActive : ''}`}
                onClick={() => {
            setActiveTab('수입차할인');
            navigate('/m/search/results?carOrigin=imported');
          }}
              >
          수입차할인
              </button>
            </div>

      {/* 메인 콘텐츠 */}
      <main className={styles.mainContent}>
        {/* 모바일 메인 배너 / 기본 비디오 섹션 */}
        <div className={styles.penguinSection}>
          {mobileBannerSlides.length > 0 ? (
            <div className={styles.mobileMainBannerScroller}>
              {mobileBannerSlides.map((banner, index) => (
                <button
                  key={`${banner.image}-${index}`}
                  type="button"
                  className={styles.mobileMainBannerSlide}
                  onClick={() => {
                    if (banner.linkUrl) {
                      window.location.href = banner.linkUrl;
                    }
                  }}
                >
                  <img
                    src={banner.image}
                    alt={`모바일 메인 배너 ${index + 1}`}
                    className={styles.mobileMainBannerImage}
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                </button>
              ))}
            </div>
          ) : (
            <video
              ref={videoRef}
              className={styles.penguinVideo}
              autoPlay
              muted
              playsInline
            >
              <source src="/모바일메인영상.mp4" type="video/mp4" />
            </video>
          )}
          </div>

        {/* 견적 신청 폼 */}
        <section className={styles.quoteFormSection}>
          <div className={styles.quoteFormCard}>
            {/* 타이틀 */}
            <h2 className={styles.formTitle}>
              <span className={styles.titleHighlight}>30개사</span> 실시간 비교견적 신청
            </h2>

            {/* 통계 카드 */}
            <div className={styles.statsCard}>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>62,087</div>
                <div className={styles.statLabel}>전체상담</div>
            </div>
              <div className={styles.statDivider}></div>
              <div className={styles.statItem}>
                <div className={`${styles.statNumber} ${styles.statNumberBlue}`}>102</div>
                <div className={`${styles.statLabel} ${styles.statLabelBlue}`}>오늘상담</div>
                </div>
              <div className={styles.statDivider}></div>
              <div className={styles.statItem}>
                <div className={`${styles.statNumber} ${styles.statNumberBlue}`}>9,386</div>
                <div className={`${styles.statLabel} ${styles.statLabelBlue}`}>전체계약건수</div>
              </div>
            </div>

            {/* 라디오 버튼 */}
            <div className={styles.radioGroup}>
              <label className={`${styles.radioButton} ${carType === '장기렌트' ? styles.radioActive : ''}`}>
                <input
                  type="radio"
                  name="carType"
                  value="장기렌트"
                  checked={carType === '장기렌트'}
                  onChange={(e) => setCarType(e.target.value)}
                />
                <span className={styles.radioLabel}>장기렌트</span>
              </label>
              <label className={`${styles.radioButton} ${carType === '리스' ? styles.radioActive : ''}`}>
                <input
                  type="radio"
                  name="carType"
                  value="리스"
                  checked={carType === '리스'}
                  onChange={(e) => setCarType(e.target.value)}
                />
                <span className={styles.radioLabel}>리스</span>
              </label>
          </div>

            {/* 입력 필드 */}
            <div className={styles.formFields}>
              <div className={styles.inputWrapper}>
                <label className={styles.inputLabel}>
                  이름
                </label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="이름을 입력해주세요 (선택)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className={styles.inputWrapper}>
                <label className={styles.inputLabel}>
                  연락처 <span className={styles.required}>*</span>
                </label>
                <input
                  type="tel"
                  className={styles.input}
                  placeholder="숫자만 입력해주세요"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
              />
            </div>
              </div>

            {/* 개인정보 동의 */}
            <div className={styles.privacyCheck}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                />
                <span className={styles.checkboxText}>
                  [필수] 개인정보 이용 동의 <span className={styles.viewLink}>[보기]</span>
                </span>
              </label>
            </div>

            {/* 제출 버튼 */}
            <button className={styles.submitBtn} onClick={handleQuoteSubmit}>
              실시간 비교견적 받기
            </button>
          </div>
        </section>

        {/* 검색 버튼 섹션 */}
        <section className={styles.searchSection} ref={searchSectionRef}>
          <h2 className={styles.searchTitle}>검색해보세요!</h2>
          
          <div className={styles.searchButtons}>
            {/* 국산차 버튼 */}
            <button 
              className={`${styles.domesticCarBtn} ${isSearchBtnVisible ? styles.animate : ''}`}
              onClick={() => navigate('/m/search/results?carOrigin=domestic')}
            >
              <div className={styles.btnContent}>
                <div className={styles.btnTextGroup}>
                  <h3 className={styles.btnTitle}>국산차</h3>
                  <p className={styles.btnSubtitle}>현대 · 기아 · 제네시스 · 르노 ...</p>
                </div>
                <div className={styles.btnCarImageWrapper}>
                  <img src="/모바일메인/흰색차.svg" alt="국산차" className={styles.btnCarImage} />
                </div>
              </div>
            </button>
          
            {/* 수입차 버튼 */}
            <button 
              className={`${styles.importCarBtn} ${isSearchBtnVisible ? styles.animate : ''}`}
              onClick={() => navigate('/m/search/results?carOrigin=imported')}
            >
              <div className={styles.btnContent}>
                <div className={styles.btnTextGroup}>
                  <h3 className={styles.btnTitle}>수입차</h3>
                  <p className={styles.btnSubtitle}>벤츠 · BMW · 아우디 · 폭스 ...</p>
                </div>
                <div className={styles.btnCarImageWrapper}>
                  <img src="/모바일메인/검은차.svg" alt="수입차" className={styles.btnCarImage} />
                </div>
              </div>
            </button>
          </div>
        </section>
    
        {/* 마감임박 섹션 */}
        <section className={styles.closingSection}>
          <div className={styles.closingContainer}>
            {/* Header: 마감임박 Icon + Text */}
            <div className={styles.closingHeaderNew}>
              <div className={styles.closingIconWrapper}>
                <img src="/마감임박_스톱워치.png" alt="마감임박 아이콘" className={styles.closingIconNew} loading="lazy" />
              </div>
              <h2 className={styles.closingTitleNew}>마감임박</h2>
            </div>
            
            {/* Subtitle */}
            <p className={styles.closingSubtitleNew}>현재 인기 차종, 잔여 재고 빠르게 소진 중</p>
            
            {!closingSoonLoading && !closingSoonError && closingSoonCards.length > 0 && (
              <>
                {/* Countdown Timer */}
                <div className={styles.countdownNew}>
                  <div className={styles.timerGroup}>
                    <div className={styles.timerBox}>
                      <span className={styles.timerNum}>{timeLeft.days}</span>
                    </div>
                    <span className={styles.timerLabel}>일</span>
                  </div>
                  <div className={styles.timerGroup}>
                    <div className={styles.timerBox}>
                      <span className={styles.timerNum}>{timeLeft.hours}</span>
                    </div>
                    <span className={styles.timerLabel}>시</span>
                  </div>
                  <div className={styles.timerGroup}>
                    <div className={styles.timerBox}>
                      <span className={styles.timerNum}>{timeLeft.minutes}</span>
                    </div>
                    <span className={styles.timerLabel}>분</span>
                  </div>
                  <div className={styles.timerGroup}>
                    <div className={styles.timerBox}>
                      <span className={styles.timerNum}>{timeLeft.seconds}</span>
                    </div>
                    <span className={styles.timerLabel}>초</span>
                  </div>
                </div>
                
                {/* Car Cards Grid */}
                <div className={styles.cardsGrid}>
                  {closingSoonCards.map((car) => (
                    <PromotionCardMobile
                      key={car.id}
                      id={car.id}
                      name={car.name}
                      desc={car.trimText}
                      img={car.img}
                      brand={car.brand}
                      brandLogo={getBrandLogoPath(car.brand)}
                      onClick={() => handleConsultClick(car)}
                      onButtonClick={() => handleConsultClick(car)}
                      buttonText="실시간 무료견적 받기"
                      remainingQuantity={car.remainingQuantity}
                      badgeText={car.discountText}
                      badgeVariant="red"
                      basePrice={car.basePrice}
                      trim={car.trim}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* 수입차 할인 특가 배너 */}
        <section className={styles.importDiscountSection}>
          <button 
            className={styles.importDiscountBanner}
            onClick={() => navigate('/m/search/results?carOrigin=imported')}
          >
            <img 
              src="/모바일메인/고급자동차버튼.svg" 
              alt="수입차 할인 특가 프로모션" 
              className={styles.importBannerImage}
            />
          </button>
        </section>

        {/* 재고특가핫딜 섹션 */}
        <section className={styles.hotDealSection}>
          <div className={styles.hotDealHeader}>
            <div className={styles.hotDealTitleGroup}>
              <h2 className={styles.hotDealTitle}>재고특가핫딜</h2>
              <p className={styles.hotDealSubtitle}>실시간 재고 기반으로 인기 차량을 특가 가격에!</p>
          </div>
            <button 
              className={styles.viewAllButton}
              onClick={() => navigate('/m/advance')}
            >
              <span className={styles.viewAllText}>전체보기</span>
              <img src="/모바일메인/화살표_오른쪽.svg" alt="전체보기" className={styles.viewAllIcon} />
            </button>
          </div>

          <div className={styles.hotDealList}>
            {hotDealLoading && (
              <div className={styles.loading}>재고특가핫딜을 불러오는 중...</div>
            )}
            {!hotDealLoading && hotDealData.length === 0 && (
              <div className={styles.empty}>현재 재고특가핫딜이 없습니다.</div>
            )}
            {!hotDealLoading && hotDealData.slice(0, 5).map((deal, index) => {
              const carName = deal.title || deal.name || '차량명 미정';
              const trimText = deal.subtitle || deal.description || deal.trimText || '';
              const imageUrl = deal.imageUrl || '/placeholder/car.svg';
              
              // 백엔드에서 이미 계산된 값을 그대로 사용
              const basePrice = deal.basePrice ?? deal.base_price ?? 0;
              const finalPrice = deal.discountedPrice ?? deal.finalPrice ?? basePrice;
              
              // 할인율: discountInfo에서 직접 가져오기 (MobileAdvanceAll과 동일한 로직)
              let discountPercent = 0;
              
              if (deal.discountInfo) {
                if (typeof deal.discountInfo === 'string') {
                  // "24% 할인" 형태의 문자열에서 숫자 추출
                  const match = deal.discountInfo.match(/(\d+(?:\.\d+)?)\s*%/);
                  if (match) {
                    discountPercent = Math.round(parseFloat(match[1]));
                  }
                } else if (deal.discountInfo.discountType === 'PERCENTAGE') {
                  discountPercent = Math.round(Number(deal.discountInfo.discountValue ?? 0));
                }
              }
              
              // trim 객체 생성 (3가지 렌탈플랜 모두 포함)
              const trim = deal.trim || {
                lowestPrepayment30MonthlyFee: deal.lowestPrepayment30MonthlyFee ?? deal.lowest_prepayment_30_monthly_fee ?? null,
                lowestDeposit30MonthlyFee: deal.lowestDeposit30MonthlyFee ?? deal.lowest_deposit_30_monthly_fee ?? null,
                lowestNoDepositMonthlyFee: deal.lowestNoDepositMonthlyFee ?? deal.lowest_no_deposit_monthly_fee ?? null,
              };
              
              // 완전무보증 렌탈료만 사용 (모바일에서는 완전무보증만 표시)
              const finalMonthlyFee = trim.lowestNoDepositMonthlyFee ?? 0;
              const monthlyBase = deal.trimMonthlyRentalFee ?? deal.trim_monthly_rental_fee ?? deal.monthlyRentalFee ?? deal.monthly_rental_fee ?? 0;
              
              // 월 렌트료로 할인율 계산 (우선순위 1: 월 렌트료)
              if (discountPercent === 0 && monthlyBase > 0 && finalMonthlyFee > 0 && finalMonthlyFee < monthlyBase) {
                discountPercent = Math.round(((monthlyBase - finalMonthlyFee) / monthlyBase) * 100);
              }
              
              // discountInfo가 없고 월 렌트료로도 계산 안 되면 basePrice와 finalPrice로 계산 (우선순위 2: 차량가격)
              if (discountPercent === 0 && basePrice > 0 && finalPrice > 0 && finalPrice < basePrice) {
                discountPercent = Math.round(((basePrice - finalPrice) / basePrice) * 100);
              }
              
              // 콘솔 로그 추가
              console.log('🚗 MobleMain Car Data:', {
                name: carName,
                discountPercent: discountPercent,
                monthlyDiscountPercent: deal.monthlyDiscountPercent,
                basePrice: basePrice,
                finalPrice: finalPrice,
                trim: {
                  lowestPrepayment30MonthlyFee: trim.lowestPrepayment30MonthlyFee,
                  lowestDeposit30MonthlyFee: trim.lowestDeposit30MonthlyFee,
                  lowestNoDepositMonthlyFee: trim.lowestNoDepositMonthlyFee,
                }
              });
              
              return (
                <VehicleCardSimple
                  key={deal.id || deal.trimId || index}
                  name={carName}
                  subtitle={trimText}
                  image={imageUrl}
                  priceValue={deal.basePrice > 0 ? `${deal.basePrice.toLocaleString()}원~` : '가격 문의'}
                  monthlyValue={finalMonthlyFee > 0 ? finalMonthlyFee.toLocaleString() : '가격 문의'}
                  trim={trim}
                  onClick={() => handleConsultClick(deal)}
                />
              );
            })}
          </div>
        </section>

        {/* 유튜브 섹션 */}
        <YoutubeCardMobile />

        {/* 출고후기 섹션 */}
        <section className={styles.reviewSection}>
          <div className={styles.reviewHeader}>
            <div className={styles.reviewHeaderLeft}>
              <h2 className={styles.reviewTitle}>출고후기</h2>
          </div>
            <button className={styles.reviewViewAllBtn} onClick={() => navigate('/m/review')}>
              <span className={styles.reviewViewAllText}>전체보기</span>
              <img src="/모바일메인/화살표_오른쪽.svg" alt="전체보기" className={styles.reviewViewAllIcon} />
            </button>
              </div>
          <p className={styles.reviewSubtitle}>블라인드 카스토리를 선택한 이유, 직접 확인해보세요.</p>
          
          <div 
            className={styles.reviewScrollContainer}
            ref={reviewScrollRef}
            onScroll={handleReviewScroll}
            onTouchStart={handleReviewTouchStart}
            onTouchEnd={handleReviewTouchEnd}
          >
            <div className={styles.reviewGrid}>
              {reviewsRepeated.length === 0 ? (
                <div className={styles.empty}>리뷰가 없습니다.</div>
              ) : (
                reviewsRepeated.map((review, i) => (
                  <div
                    key={review._uniqueKey || i}
                    className={styles.reviewCard}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/m/review/${review.id || i + 1}`, { state: { review } })}
                  >
                    <div className={styles.reviewImageWrapper}>
                      <img 
                        src={review.imageUrls?.[0] || review.images?.[0] || review.imageUrl || FALLBACK_IMAGE} 
                        alt={review.title || review.carModel || review.model || '차량'} 
                        className={styles.reviewImage}
                loading="lazy"
              />
            </div>
                    <p className={styles.reviewText}>
                      {review.description || review.content || review.reviewContent || ''}
              </p>
            </div>
                ))
              )}
          </div>
          </div>

          {/* 인디케이터 */}
          {reviewsData.length > 1 && (
            <div className={styles.reviewIndicators}>
              {Array.from({ length: Math.ceil(reviewsData.length / 2) }).map((_, index) => (
                <button
                  key={`indicator-${index}`}
                  type="button"
                  className={index === currentReviewIndex ? styles.reviewIndicatorActive : styles.reviewIndicator}
                  onClick={() => {
                    reviewAutoScrollDisabled.current = true; // 인디케이터 클릭 시 자동 스크롤 비활성화
                    scrollToReviewPage(index, reviewsData.length);
                  }}
                  aria-label={`${index + 1}페이지로 이동`}
                />
              ))}
            </div>
          )}
        </section>

        {/* 제휴 파트너사 섹션 */}
        <section className={styles.partnerSection}>
          <div className={styles.partnerHeader}>
            <h2 className={styles.partnerTitle}>제휴 파트너사</h2>
            <p className={styles.partnerSubtitle}>국내 30여개 제휴사의 비교분석을 통해 최저가 견적만을 제시합니다.</p>
            </div>
          <div className={styles.partnerGrid}>
            {loopPartnerCards.map((card, index) => (
              <div 
                key={`${card.name}-${index}`}
                className={styles.partnerCard}
              >
                <div className={styles.partnerLogoBox}>
                  <img 
                    src={card.image} 
                    alt={card.name} 
                    className={styles.partnerLogo}
                    onError={(e) => {
                      e.target.src = `/placeholder/car.svg)}`;
                    }}
                  />
          </div>
                <p className={styles.partnerName}>{card.name}</p>
          </div>
            ))}
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p className={styles.footerAddress}>
            블라인드 카스토리
          </p>
          <div className={styles.footerInfo}>
            <span className={styles.footerText}>대표 : 정보 준비중</span>
            <span className={styles.footerText}>전화 : 1577-8319</span>
            <span className={styles.footerText}>이메일 : 정보 준비중</span>
          </div>
          <p className={styles.footerBusiness}>사업자등록번호 : 정보 준비중</p>
          <p className={styles.footerCopyright}>(C) Blind CarStory All Rights Reserved.</p>
          </div>
      </footer>

      {/* 서랍식 메뉴 */}
      {drawerOpen && (
        <>
          <div className={styles.drawerOverlay} onClick={() => setDrawerOpen(false)}></div>
          <aside className={styles.drawer}>
            <div className={styles.drawerContent}>
              <button className={styles.drawerItem}>홈</button>
              <button className={styles.drawerItem}>견적내기</button>
              <button className={styles.drawerItem}>재고차량</button>
              <button className={styles.drawerItem}>수입차</button>
              <button className={styles.drawerItem}>문의하기</button>
          </div>
          </aside>
        </>
      )}

      {/* 상담 모달 */}
      <BrowserContactModal
        open={Boolean(contactModalPayload)}
          onClose={handleContactModalClose}
          onSubmit={handleContactModalSubmit}
          isSubmitting={isContactSubmitting}
        description={contactModalMessage || undefined}
        initialPhone={contactModalInitialPhone || ''}
        />
        
      {/* 성공 모달 */}
        <ConsultSuccessModal
          isOpen={isSuccessModalOpen}
          onClose={() => setIsSuccessModalOpen(false)}
        />

      {/* Toast 알림 */}
      {showToast && (
        <div className={styles.toast}>
          {toastMessage}
        </div>
      )}
      </div>
    </>
  );
};

export default MobleMain;
