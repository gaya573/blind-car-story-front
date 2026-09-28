import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import styles from './MobleMainV2.module.css';

// Components
import MobileHeroBanner from '../../components/MobileHeroBanner';
import YoutubeCardMobile from '../../components/YoutubeCardMobile';
import PromotionCardMobile from '../../components/PromotionCardMobile';
import MobileContactModal from '../../components/MobileContactModal.jsx';
import ConsultSuccessModal from '../../components/ConsultSuccessModal.jsx';
import PrivacyConsentCheckbox from '../../components/PrivacyConsentCheckbox.jsx';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import StructuredData, { getOrganizationSchema, getLocalBusinessSchema } from '../../components/StructuredData.jsx';
import ReviewCardMobile from '../../components/ReviewCardMobile';
import Event from '../../components/mobileMain/Event.jsx';
import TrustSection from '../../components/mobileMain/TrustSection.jsx';
import ComparisonSection from '../../components/mobileMain/ComparisonSection.jsx';

// Services & Utils
import { contentAPI } from '../../services/contentApi.js';
import { coalitionAPI, COALITION_PAGE_TYPE } from '../../services/coalitionApi.js';
import { getPageSeo } from '../../config/seoConfig';
import { submitConsult } from '../../services/consultHelper.js';
import { handleKakaoPopupBlocked } from '../../utils/kakaoPopup';
import { getStoredUserPhone, setStoredUserPhone } from '../../utils/phoneStorage';
import { getBrandLogoPath, getBrandLogoFallbackPath } from '../../utils/brandMapper';

// Assets
const FALLBACK_IMAGE = '/placeholder/car.svg';
const assetPath = (file) => encodeURI(`/mobileMain/${file}`);
const ASSETS = {
  consultPenguin: assetPath('찾아보기 펭귄 1.png'),
  immediateCar: assetPath('자동차.png'),
  advanceMegaphone: assetPath('확성기.png'),
  call: assetPath('Call.svg'),
};
  

const BRAND_LIST = [
  { name: '현대', image: '/brand/현대.svg', type: 'domestic' },
  { name: '기아', image: '/brand/kia.svg', type: 'domestic' },
  { name: '제네시스', image: '/brand/제네시스.svg', type: 'domestic' },
  { name: 'KGM', image: '/brand/kgm.svg', type: 'domestic' },
  { name: '르노코리아', image: '/brand/르노삼성.svg', type: 'domestic' },
  { name: '쉐보레', image: '/brand/쉐보레.svg', type: 'domestic' },
  { name: 'BMW', image: '/importbrands/bmw.svg', type: 'import' },
  { name: '벤츠', image: '/importbrands/벤츠.svg', type: 'import' },
  { name: '아우디', image: '/importbrands/아우디.svg', type: 'import' },
  { name: '폭스바겐', image: '/importbrands/폭스바겐.svg', type: 'import' },
  { name: '포드', image: '/importbrands/포드.svg', type: 'import' },
  { name: '테슬라', image: '/importbrands/테슬라.svg', type: 'import' },
];

const CHIPS = [
  { label: '쏘렌토', query: 'keyword=쏘렌토' },
  { label: '아우디', query: 'brand=아우디' },
  { label: '그랜저', query: 'keyword=그랜저' },
  { label: '카니발', query: 'keyword=카니발' },
  { label: '3시리즈', query: 'keyword=3시리즈' },
  { label: '수입차', query: 'carOrigin=import' },
  { label: 'BMW', query: 'brand=BMW' },
  { label: '기아', query: 'brand=기아' },
];

/**
 * Mobile Search Bar Component (Pixso Design)
 * @param {Object} props
 * @param {function} props.onClick
 */
const MobileSearchBar = ({ onClick }) => (
  <div className={styles.searchBar} onClick={onClick}>
    <svg
      className={styles.searchIcon}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.33333 14.1667C11.555 14.1667 14.1667 11.555 14.1667 8.33333C14.1667 5.11167 11.555 2.5 8.33333 2.5C5.11167 2.5 2.5 5.11167 2.5 8.33333C2.5 11.555 5.11167 14.1667 8.33333 14.1667Z"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.3"
      />
      <path
        d="M17.5 17.5L12.5 12.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.33333 14.1667C11.555 14.1667 14.1667 11.555 14.1667 8.33333C14.1667 5.11167 11.555 2.5 8.33333 2.5C5.11167 2.5 2.5 5.11167 2.5 8.33333C2.5 11.555 5.11167 14.1667 8.33333 14.1667Z"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    <input
      type="text"
      className={styles.searchInput}
      placeholder="차량 모델을 입력하세요.  ex) 쏘렌토"
      readOnly
    />
  </div>
);

/**
 * Brand Item Component (Pixso Design item-id=1:2372)
 * 카드 크기: 76x76px, 아이콘: 40x40px, 텍스트: 14px Pretendard Regular
 * @param {Object} props
 * @param {string} props.name
 * @param {string} props.image
 * @param {string} props.type - 'domestic' | 'import'
 * @param {function} props.onClick
 */
const BrandItem = ({ name, image, type, onClick }) => (
  <div 
    className={styles.brandItem} 
    onClick={onClick} 
    role="button" 
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }}
  >
    <div className={styles.brandIconBox}>
      <img 
        src={image} 
        alt={`${name} 로고`} 
        className={styles.brandIcon} 
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
    <span className={styles.brandName}>{name}</span>
  </div>
);

/**
 * Chip Component
 * @param {Object} props
 * @param {string} props.label
 * @param {function} props.onClick
 */
const Chip = ({ label, onClick }) => (
  <div className={styles.headerChip} onClick={onClick} role="button" tabIndex={0}>
    {label}
  </div>
);

const MobleMainV2 = () => {
  const navigate = useNavigate();
  const [contactModalConfig, setContactModalConfig] = useState(null);
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const isContactModalOpen = Boolean(contactModalConfig);

  // 제휴사 콘텐츠에는 모바일 전용 페이지 타입이 없어 메인 홈 배너를 그대로 쓴다.
  const { data: bannersData = [] } = useQuery({
    queryKey: ['coalition', 'banners', 'main'],
    queryFn: () => coalitionAPI.getBanners(COALITION_PAGE_TYPE.MAIN),
    staleTime: 1000 * 60,
  });

  const bannerSlides = useMemo(() => {
    const items = Array.isArray(bannersData) ? bannersData : (bannersData ? [bannersData] : []);
    if (items.length > 0) {
      if (Array.isArray(items[0].imageUrls) && items[0].imageUrls.length > 0) {
        return items[0].imageUrls.map((img) => ({ image: img }));
      }
      return items
        .map((item) => item?.imageUrl || item?.image_url)
        .filter(Boolean)
        .map((url) => ({ image: url }));
    }
    return [];
  }, [bannersData]);

  const { data: closingSoonData = [], isLoading: closingSoonLoading, isError: closingSoonError } = useQuery({
    queryKey: ['mobile-main', 'closing-soon'],
    queryFn: () => contentAPI.getClosingSoon(3),
    staleTime: 1000 * 60,
  });

  const closingSoonCards = useMemo(() => {
    return (closingSoonData ?? []).slice(0, 2).map((item, index) => {
      const deadline = item.deadline
        ? new Date(item.deadline)
        : item.endDate
        ? new Date(item.endDate)
        : null;
      
      // 실제 API 데이터 사용
      const basePrice = item.basePrice ?? 0;
      const monthlyFee = item.trim_monthly_rental_fee ?? item.trimMonthlyRentalFee ?? 0;
      
      // 할인 정보 계산
      let discountPercent = 0;
      if (item.discountInfo && item.discountInfo.discountType === 'PERCENTAGE') {
        discountPercent = Math.round(Number(item.discountInfo.discountValue ?? 0));
      } else if (item.discountedPrice && basePrice > 0 && item.discountedPrice < basePrice) {
        discountPercent = Math.round(((basePrice - item.discountedPrice) / basePrice) * 100);
      }
      
      // trim 객체 생성
      const trim = item.trim || {
        lowestPrepayment30MonthlyFee: item.lowestPrepayment30MonthlyFee ?? item.lowest_prepayment_30_monthly_fee ?? null,
        lowestDeposit30MonthlyFee: item.lowestDeposit30MonthlyFee ?? item.lowest_deposit_30_monthly_fee ?? null,
        lowestNoDepositMonthlyFee: item.lowestNoDepositMonthlyFee ?? item.lowest_no_deposit_monthly_fee ?? null,
      };
      
      // 렌탈료 우선순위: lowestPrepayment30 > discountedMonthlyFee > monthlyFee
      const finalMonthlyFee = trim.lowestPrepayment30MonthlyFee ?? item.discountedMonthlyFee ?? monthlyFee;
      
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

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    if (!closingSoonCards.length) {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
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
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
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

  const { data: reviewsData = [] } = useQuery({
    queryKey: ['mobile-main', 'reviews'],
    queryFn: () => contentAPI.getReviews(3),
    staleTime: 1000 * 60,
  });

  const openContactModal = useCallback((payload, options = {}, meta = {}) => {
    setContactModalConfig({
      payload,
      options,
      successMessage: meta.successMessage,
    });
  }, []);

  const handleContactModalClose = useCallback(() => {
    if (isContactSubmitting) return;
    setContactModalConfig(null);
  }, [isContactSubmitting]);

  const handleContactModalSubmit = useCallback(
    async (phoneValue, nameValue) => {
      if (!contactModalConfig) return;
      const phone = (phoneValue || '').trim();
      const name = (nameValue || '').trim();

      if (!phone) {
        alert('연락처를 입력해 주세요.');
        return;
      }

      setIsContactSubmitting(true);
      try {
        const result = await submitConsult(
          {
            ...contactModalConfig.payload,
            phone,
            name,
          },
          contactModalConfig.options || {},
        );

        // API 호출이 성공하면 무조건 성공 모달 표시
        if (result.success) {
          // 전송 성공 시 로컬 스토리지에 저장
          setStoredUserPhone(phone);
          if (name) {
            localStorage.setItem('wgl_user_name', name);
          }
          
          // 성공 모달 표시
          setIsSuccessModalOpen(true);

          let msg = contactModalConfig.successMessage || '연락처가 등록되었습니다. 곧 상담사가 연락드립니다.';
          
          // 연락처는 정상 등록되었으나 팝업이 차단된 경우 메시지 보강
          if (result.meta?.popupBlocked) {
             msg = '상담 신청이 정상적으로 접수되었습니다.\n(카카오톡 팝업이 차단되어 채팅창이 열리지 않았으나, 담당자가 곧 연락드립니다.)';
          }
          alert(msg);
          setContactModalConfig(null);
          
          // 팝업 차단 처리 (모달 표시 이후에 처리)
          handleKakaoPopupBlocked(result);
        } else if (result?.meta?.phoneMissing) {
          alert('연락처를 다시 확인해 주세요.');
        } else {
          alert(result.message || '연락처 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
        }
      } catch (error) {
        console.error('[MobleMain] 연락처 등록 실패', error);
        alert('연락처 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        setIsContactSubmitting(false);
      }
    },
    [contactModalConfig],
  );

  // 스크롤 감지 로직
  const [showFloating, setShowFloating] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowFloating(true);
      } else {
        setShowFloating(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [isHeroPrivacyAgreed, setIsHeroPrivacyAgreed] = useState(true);
  // 단순 숫자만 추출하여 연락처 정제
  const sanitizePhone = useCallback((value) => (value || '').replace(/\D/g, ''), []);

  // Event 섹션용 제출 핸들러 (Home.jsx의 당일 견적 확인 폼과 유사)
  const handleEventSubmit = useCallback(
    async ({ name, phone, carModel }) => {
      const sanitized = sanitizePhone(phone);
      if (!sanitized) {
        alert('연락처를 입력해 주세요.');
        return;
      }
      setEventSubmitting(true);
      try {
        const payload = {
          name: name?.trim() || '',
          phone: sanitized,
          model: carModel?.trim() || '',
          consultType: '비대면견적',
          source: 'mobile-main-event',
          entryLabel: '모바일 메인 > 이벤트 상담',
        };

        const result = await submitConsult(payload, { openKakaoOnSuccess: true, kakaoOpenTarget: '_blank' });
        
        // API 호출이 성공하면 무조건 성공 모달 표시
        if (result?.success) {
          setStoredUserPhone(sanitized);
          if (name) localStorage.setItem('wgl_user_name', name.trim());
          setIsSuccessModalOpen(true);
          
          // 팝업 차단 처리 (모달 표시 이후에 처리)
          handleKakaoPopupBlocked(result);
        } else {
          alert(result?.message || '상담 신청에 실패했습니다. 잠시 후 다시 시도해주세요.');
        }
      } catch (error) {
        console.error('[MobleMain] 이벤트 상담 신청 실패', error);
        alert('상담 신청에 실패했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        setEventSubmitting(false);
      }
    },
    [sanitizePhone],
  );

  const { title: seoTitle, description: seoDescription, keywords: seoKeywords } = getPageSeo('home');
  const seoImage = useMemo(() => bannerSlides[0]?.image, [bannerSlides]);

  // 마감임박 카드 클릭 시: 디테일 이동 대신 재고 상담 카카오톡 전송 플로우
  const handleClosingSoonConsult = useCallback(
    async (car) => {
      if (!car) return;
      const savedPhone = sanitizePhone(
        getStoredUserPhone() ||
          localStorage.getItem('wgl_user_phone') ||
          localStorage.getItem('wgl_phone') ||
          localStorage.getItem('wglPhone') ||
          '',
      );
      const savedName = localStorage.getItem('wgl_user_name');

      const payload = {
        consultType: '재고문의',
        source: 'mobile-main-closing-soon',
        entryLabel: `모바일 메인 > 마감임박 > ${car.name || ''}`,
        brand: car.brand || '',
        model: car.name || '',
        trim: car.trimId || car.id || null,
        name: savedName || '',
      };

      // 저장된 연락처가 있으면 모달 없이 바로 전송
      if (savedPhone) {
        const enriched = { ...payload, phone: savedPhone };
        try {
          const result = await submitConsult(enriched, {
            openKakaoOnSuccess: true,
            kakaoOpenTarget: '_blank',
            useKakao: false,
          });
          // 성공 시 펭귄 모달
          if (result?.success) {
            setStoredUserPhone(savedPhone);
            if (savedName) localStorage.setItem('wgl_user_name', savedName);
            setIsSuccessModalOpen(true);
            // 팝업 차단 안내 처리 (성공 후에도 필요 시)
            handleKakaoPopupBlocked(result);
            return;
          }
          // 실패 시 연락처 입력 모달로 폴백
          openContactModal(
            { ...payload, phone: '' },
            {
              initialPhone: '',
              openKakaoOnSuccess: true,
              kakaoOpenTarget: '_blank',
              useKakao: false,
            },
            { successMessage: '재고 상담이 접수되었습니다. 곧 연락드릴게요.' },
          );
          return;
        } catch (error) {
          console.error('[MobleMain] 재고 상담 전송 실패', error);
          // 전송 실패 시 연락처 입력 모달로 폴백
          openContactModal(
            { ...payload, phone: '' },
            {
              initialPhone: '',
              openKakaoOnSuccess: true,
              kakaoOpenTarget: '_blank',
              useKakao: false,
            },
            { successMessage: '재고 상담이 접수되었습니다. 곧 연락드릴게요.' },
          );
          return;
        }
      }

      // 저장된 연락처가 없으면 입력 모달 오픈
      openContactModal(
        payload,
        {
          initialPhone: '',
          openKakaoOnSuccess: true,
          kakaoOpenTarget: '_blank',
          useKakao: false,
        },
        { successMessage: '재고 상담이 접수되었습니다. 곧 연락드릴게요.' },
      );
    },
    [openContactModal, sanitizePhone],
  );


  return (
    <>
      <SeoHelmet
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        image={seoImage}
      />
      <StructuredData data={getOrganizationSchema()} />
      <StructuredData data={getLocalBusinessSchema()} />
      <div className={styles.page}>
        {/* Header Section */}
        <div className={styles.topBar}>
          <div className={styles.logoWrapper}>
            <h2 className={styles.logoText}>블라인드 카스토리</h2>
            <img 
              src="/mobileMain/문서모양.svg" 
              alt="문서" 
              className={styles.logoIcon} 
              onClick={() => navigate('/m/menu')}
              role="button"
              tabIndex={0}
            />
          </div>
          <MobileSearchBar onClick={() => navigate('/m/search/find')} />
          <div className={styles.chipScroll}>
            {CHIPS.map((chip, idx) => (
              <Chip 
                key={idx} 
                label={chip.label} 
                onClick={() => navigate(`/m/search/results?${chip.query}`)} 
              />
            ))}
          </div>
        </div>

        {/* Brand Grid Section */}
        <section className={styles.brandGridSection}>
          <div className={styles.brandGrid}>
            {BRAND_LIST.map((brand) => (
              <BrandItem
                key={brand.name}
                name={brand.name}
                image={brand.image}
                type={brand.type}
                onClick={() => navigate(`/m/search/results?brand=${brand.name}${brand.type === 'domestic' ? '&carOrigin=domestic' : '&carOrigin=import'}`)}
              />
            ))}
          </div>
        </section>

        {/* Hero Banner Section + Floating Buttons */}
        <section className={styles.sectionFull}>
          <div className={styles.heroWrapper}>
            <MobileHeroBanner slides={bannerSlides} showPager />

            <div className={styles.heroFloatingBtns}>
              <button
                type="button"
                className={styles.floatCallBtn}
                aria-label="대표번호 1577-8319 전화상담"
                onClick={() => {
                  // 모바일에서 tel 링크 우선
                  window.location.href = 'tel:15778319';
                }}
              >
                <svg
                  className={styles.floatCallIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.86.31 1.7.57 2.5a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.58-1.09a2 2 0 0 1 2.11-.45c.8.26 1.64.45 2.5.57A2 2 0 0 1 22 16.92z" />
                </svg>
                <div>1577-</div>
                <div>8319</div>
              </button>

              <button
                type="button"
                className={styles.floatTopBtn}
                aria-label="맨 위로"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <svg
                  className={styles.floatTopArrow}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="18 15 12 9 6 15" />
                </svg>
                <div>TOP</div>
              </button>
            </div>
          </div>
        </section>

        {/* Info & Consult Section - Pixso Design item-id=1:2323 */}
        <section className={styles.infoSectionNew}>
          {/* 전화번호 카드 */}
          <div 
            className={styles.phoneCard}
            role="button"
            tabIndex={0}
            onClick={() => {
              if (!isHeroPrivacyAgreed) {
                alert('개인정보 이용 동의에 체크해 주세요.');
                return;
              }
              const savedPhone = getStoredUserPhone();
              const savedName = localStorage.getItem('wgl_user_name');
              const payload = {
                consultType: '신차장기렌트상담',
                model: '모바일 메인 > 하단 전화번호 카드',
                source: 'mobile-main-bottom-phone-card',
                entryLabel: '모바일 메인 > 하단 전화번호 카드 상담',
              };

              openContactModal(
                { ...payload, name: savedName || '' },
                {
                  initialPhone: savedPhone || '',
                  openKakaoOnSuccess: true,
                  kakaoOpenTarget: '_blank',
                  useKakao: false,
                },
                { successMessage: '상담 신청이 접수되었습니다. 곧 상담사가 연락드립니다.' }
              );
            }}
          >
            <div className={styles.phoneCardPenguin}>
              <img src={ASSETS.consultPenguin} alt="펭귄" className={styles.phonePenguinImg} loading="lazy" />
            </div>
            <div className={styles.phoneCardContent}>
              <div className={styles.phoneNumberGroup}>
                <div className={styles.phoneIconWrapper}>
                  <img src={ASSETS.call} alt="전화" className={styles.phoneIcon} />
                </div>
                <h3 className={styles.phoneNumber}>1577-8319</h3>
              </div>
              <p className={styles.phoneDescription}>국내 최저가·빠른 출고 신차 장기렌트 바로 상담</p>
            </div>
          </div>

          {/* 미니 카드 그리드 */}
          <div className={styles.miniGridNew}>
            <div
              className={styles.miniCardNew}
              role="button"
              tabIndex={0}
              onClick={() => navigate('/m/advance')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate('/m/advance');
                }
              }}
            >
              <div className={styles.miniCardText}>
                <div className={styles.miniCardTitle}>견적 대기</div>
                <div className={styles.miniCardDesc}>1분 간편 접수<br />빠른 진행 확인</div>
              </div>
              <img
                src={ASSETS.immediateCar}
                alt="견적 대기"
                className={styles.miniCardIcon}
                loading="lazy"
              />
            </div>
            <div
              className={styles.miniCardNew}
              role="button"
              tabIndex={0}
              onClick={() => navigate('/m/brand')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate('/m/brand');
                }
              }}
            >
              <div className={styles.miniCardText}>
                <div className={styles.miniCardTitle}>재고 특가 핫딜</div>
                <div className={styles.miniCardDesc}>한정 수량<br />선착순 혜택</div>
              </div>
              <img
                src={ASSETS.advanceMegaphone}
                alt="재고 특가 핫딜"
                className={styles.miniCardIcon}
                loading="lazy"
              />
            </div>
          </div>

          {/* 카카오 배너 */}
          <div 
            className={styles.kakaoBannerNew}
            role="button"
            tabIndex={0}
            onClick={() => navigate('/m/search/find')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/m/search/find');
              }
            }}
          >
        
         
              <button className={styles.kakaoImageButton} aria-label="직접 견적내보기">
                <img src="/mobile/메인버튼.svg" alt="직접 견적내보기" className={styles.kakaoButtonImg} loading="lazy" />
              </button>
          
          </div>
        </section>
    

        {/* Closing Soon Section - Pixso Design item-id=1:2916 */}
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
                      onClick={() => handleClosingSoonConsult(car)}
                      onButtonClick={() => handleClosingSoonConsult(car)}
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

        <YoutubeCardMobile />
        
        {/* Reviews Section - 출고후기 */}
        <section className={styles.section24}>
          <h2 className={styles.reviewsHeader}>출고후기</h2>
          <p className={styles.reviewsSub}>블라인드 카스토리를 선택한 이유, 직접 확인해보세요.</p>
          <div className={styles.reviewsBox}>
            {reviewsData.length === 0 ? (
              <div className={styles.empty}>리뷰가 없습니다.</div>
            ) : (
              reviewsData.map((review, i) => (
                <div
                  key={review.id || i}
                  className={styles.reviewCard}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/m/review/${review.id || i + 1}`, { state: { review } })}
                >
                  <div className={styles.reviewCardInner}>
                    <div className={styles.reviewCarImage}>
                      <img 
                        src={review.imageUrls?.[0] || review.images?.[0] || review.imageUrl || FALLBACK_IMAGE} 
                        alt={review.carModel || review.model || '차량'} 
                        loading="lazy"
                      />
                    </div>
                    <div className={styles.reviewContent}>
                      <div className={styles.reviewHeader}>
                        <div className={styles.reviewTag}>신차구매</div>
                        <div className={styles.reviewRating}>
                          <div className={styles.reviewStars}>
                            {[...Array(5)].map((_, idx) => {
                              const rating = review.rating || 4.0;
                              const isFilled = idx < Math.floor(rating);
                              return (
                                <svg key={idx} width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path 
                                    d="M6 1L7.545 4.13L11 4.635L8.5 7.07L9.09 10.51L6 8.885L2.91 10.51L3.5 7.07L1 4.635L4.455 4.13L6 1Z" 
                                    fill={isFilled ? '#FFD600' : 'none'} 
                                    stroke={isFilled ? '#FFD600' : '#E5E5EC'} 
                                    strokeWidth="1"
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                    opacity={isFilled ? '1' : '0.3'}
                                  />
                                </svg>
                              );
                            })}
                          </div>
                          <span className={styles.reviewRatingText}>{review.rating || '4.0'}</span>
                        </div>
                      </div>
                      <div className={styles.reviewTitle}>{review.carModel || review.model || review.title || '아반떼 구매했습니다.'}</div>
                      <div className={styles.reviewText}>
                        {review.content || review.description || '블라인드 카스토리 유튜브 보다가 좋은 조건에 나왔길래 바로 구매하였습니다. 덕분에 좋은 조건으로 구매할 수 있었습니다.'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div className={styles.reviewsCTA}>
              <button onClick={() => navigate('/m/review')}>더 많은 후기 보러가기</button>
            </div>
          </div>
        </section>

        {/* Special Deal Section - Pixso item-id=1:2412 - PIXEL PERFECT */}
        <section className={styles.pixsoFrame1_2412}>
          {/* Top Copy with Yellow Highlight */}
          <div className={styles.pixsoGroup1_2414}>
            <div className={styles.pixsoRectangle1_2415}></div>
            <span className={styles.pixsoText1_2416}>
              <span className={styles.pixsoSpan1_2416_1}>블라인드 카스토리는 </span>
              <span className={styles.pixsoSpan1_2416_2}>중간단계 없이,</span>
            </span>
          </div>
          <span className={styles.pixsoText1_2413}>공장 특판 혜택을 그대로 제공합니다.</span>
          <div className={styles.pixsoVector1_2417}></div>

          {/* Car Image */}
          <div className={styles.pixsoRectangle1_2418}>
            <img src="/mobileMain/쏘렌토.png" alt="쏘렌토" loading="lazy" />
          </div>

          {/* Car Info Card */}
          <div className={styles.pixsoFrame1_2419}>
            <div className={styles.pixsoFrame1_2420}>
              <span className={styles.pixsoText1_2421}>쏘렌토  2026년형 가솔린 터보 2.5</span>
              <span className={styles.pixsoText1_2422}>선납금 30% / 48개월 / 2만km 기준</span>
            </div>
          </div>

          {/* Description Text - Blue Background */}
          <div className={styles.descriptionText}>
            <p>블라인드 카스토리는 <span style={{ fontWeight: 600 }}>공장 공급 조건</span>을 기반으로</p>
            <p>중간 마진을 제거한 <span className={styles.yellowHighlight}>수수료 0%</span> 견적을 제공합니다.</p>
            <p>대리점·영업사원 수수료가 포함된 일반 견적과 달리</p>
            <p className={styles.lastParagraph}>
              <span style={{ fontWeight: 600 }}>공장 특판 조건</span>을
              <span style={{ fontWeight: 600 }}> 직접 적용해 더 합리적인 월 렌탈료를 제공합니다.</span>
            </p>
          </div>

          {/* Rate Table */}
          <div className={styles.pixsoFrame1_2426}>
            <div className={styles.pixsoFrame1_2427}> 
              {/* Header Row with Logos */}
              <div className={styles.pixsoFrame1_2428}>
                <div className={styles.pixsoFrame1_2429}></div>
                <div className={styles.pixsoFrame1_2430}>
                  <div className={styles.pixsoFrame1_2431}>
                    <img src="/card/cc/농협.svg" alt="NH캐피탈" className={styles.capitalLogo} />
                    <span className={styles.pixsoText1_2433}>NH캐피탈</span>
                  </div>
                </div>
                <div className={styles.pixsoFrame1_2434}>
                  <div className={styles.pixsoFrame1_2435}>
                    <img src="/card/cc/롯데.svg" alt="롯데캐피탈" className={styles.capitalLogo} />
                    <span className={styles.pixsoText1_2437}>롯데캐피탈</span>
                  </div>
                </div>
                <div className={styles.pixsoFrame1_2438}>
                  <div className={styles.pixsoFrame1_2439}>
                    <img src="/card/cc/신한.svg" alt="신한카드" className={styles.capitalLogo} />
                    <span className={styles.pixsoText1_2441}>신한카드</span>
                  </div>
                </div>
                <div className={styles.pixsoFrame1_2442}>
                  <div className={styles.pixsoFrame1_2443}>
                    <img src="/card/cc/bnk.svg" alt="BNK캐피탈" className={styles.capitalLogo} />
                    <span className={styles.pixsoText1_2445}>캐피탈</span>
                  </div>
                </div>
              </div>
              {/* Row 1 - 블라인드 카스토리 0% */}
              <div className={styles.pixsoFrame1_2446}>
                <div className={styles.pixsoFrame1_2447}>
                  <div className={styles.pixsoFrame1_2448}>
                    <span className={styles.pixsoText1_2449}>블라인드 카스토리</span>
                    <span className={styles.pixsoText1_2450}>
                      <span className={styles.pixsoSpan1_2450_1}>수수료<br /></span>
                      <span className={styles.pixsoSpan1_2450_2}>0%</span>
                    </span>
                  </div>
                  <div className={styles.pixsoVector1_2451}></div>
                </div>
                <div className={styles.pixsoFrame1_2452}>
                  <span className={styles.pixsoText1_2453}>252,303</span>
                </div>
                <div className={styles.pixsoFrame1_2454}>
                  <span className={styles.pixsoText1_2455}>258,800</span>
                </div>
                <div className={styles.pixsoFrame1_2456}>
                  <span className={styles.pixsoText1_2457}>265,400</span>
                </div>
                <div className={styles.pixsoFrame1_2458}>
                  <span className={styles.pixsoText1_2459}>267,160</span>
                </div>
              </div>
              {/* Row 2 - 타 업체 5~7% */}
              <div className={styles.pixsoFrame1_2460}>
                <div className={styles.pixsoFrame1_2461}>
                  <div className={styles.pixsoFrame1_2462}>
                    <span className={styles.pixsoText1_2463}>타 업체</span>
                    <span className={styles.pixsoText1_2464}>
                      <span className={styles.pixsoSpan1_2464_1}>수수료<br /></span>
                      <span className={styles.pixsoSpan1_2464_2}>5~7%</span>
                    </span>
                  </div>
                </div>
                <div className={styles.pixsoFrame1_2465}>
                  <span className={styles.pixsoText1_2466}>264,918</span>
                </div>
                <div className={styles.pixsoFrame1_2467}>
                  <span className={styles.pixsoText1_2468}>271,740</span>
                </div>
                <div className={styles.pixsoFrame1_2469}>
                  <span className={styles.pixsoText1_2470}>27,8,670</span>
                </div>
                <div className={styles.pixsoFrame1_2471}>
                  <span className={styles.pixsoText1_2472}>280,518</span>
                </div>
              </div>
            </div>
            <span className={styles.pixsoText1_2473}>*차종·제휴사 정책에 따라 적용 조건은 달라질 수 있습니다.</span>
          </div>

          {/* Penguin Image */}
          <div className={styles.pixsoRectangle1_2474}>
            <img src="/mobileMain/찾아보기 펭귄 5.svg" alt="상담 펭귄" loading="lazy" />
          </div>

          {/* Bottom CTA */}
          <div className={styles.pixsoFrame1_2475}>
            <span className={styles.pixsoText1_2476}>지금 블라인드 카스토리에서 공장 특판 견적을 받으면</span>
            <span className={styles.pixsoText1_2477}> 수수료 0% !!</span>
          </div>
        </section>

        {/* Final Consult Section - Pixso Design item-id=1:2994 - PIXEL PERFECT */}
        <Event
          styles={styles}
          onSubmitEvent={handleEventSubmit}
          isSubmitting={eventSubmitting}
        />

        {/* Long-term Rent Section - Pixso Design item-id=1:2478 - MOVED TO END */}
        <section className={styles.longTermRentSection}>
          {/* Title Container */}
          <div className={styles.rentTitleContainer}>
            <span className={styles.rentTitleBlue}>장기렌트,</span>
            <span className={styles.rentTitleBlack}>일시불·할부보다 저렴합니다.</span>
          </div>

          {/* Highlight Group with Blue Boxes */}
          <div className={styles.rentHighlightGroup}>
            <div className={styles.rentHighlightBox1}></div>
            <div className={styles.rentHighlightBox2}></div>
            <div className={styles.rentHighlightText}>
              <div>
                <span className={styles.rentHighlightSpan1}>보증금 100%, 일시불 비교시 장기렌트가 </span>
                <span className={styles.rentHighlightSpan2}>최대 1,100만원 이상 저렴</span>
              </div>
              <div>
                <span className={styles.rentHighlightSpan1}>보증금 0%, 풀할부 비교시 장기렌트가 </span>
                <span className={styles.rentHighlightSpan2}>최대 2~300만원 이상 저렴</span>
              </div>
            </div>
          </div>

          {/* Description Text */}
          <span className={styles.rentDescText}>
            선납금은 장기렌트 렌탈료에서 단순히 1/N으로 나눈값! <br />보증금기준은 10%당 무려 연 6.6% 의 예금금리와 동일한값
          </span>

          {/* Car Image Group */}
          <div className={styles.rentCarGroup}>
            <div className={styles.rentCarBg}></div>
            <div className={styles.rentCarImage}>
              <img 
                src="/mobileMain/right_auto.svg" 
                alt="팰리세이드" 
                loading="lazy"
              />
            </div>
            <span className={styles.rentCarTitle}>장기렌트 보증금 0%시 </span>
            <span className={styles.rentCarSubtitle}>(신형 팰리세이드 하이브리드 기준)</span>
          </div>

          {/* Bottom Text */}
          <span className={styles.rentBottomText}>이제 보증금 견적으로 해결하세요!</span>
        </section>

        {/* Comparison Section - Pixso Design item-id=1:2494 */}
        <section className={styles.comparisonSection}>
          {/* Penguin Image - 158x160px at left:108px, top:142px */}
          <div className={styles.comparisonPenguin}>
            <img 
              src="/mobileMain/고민하는 펭귄 1.svg" 
              alt="penguin"
              className={styles.comparisonPenguinImg}
            />
          </div>

          {/* Speech Bubble - 304x98px centered at top:40px */}
          <div className={styles.comparisonSpeechBubble}>
            <img 
              src="/mobileMain/아래로말풍선.svg" 
              alt="speech bubble"
              className={styles.comparisonSpeechBg}
            />
          </div>

          {/* Table Title - at left:252px, top:243px */}
          <span className={styles.comparisonTableTitle}>장기렌트 vs 할부/리스 비교</span>

          {/* Comparison Table - 360px centered at top:259px */}
          <div className={styles.comparisonTable}>
            {/* Header Row */}
            <div className={styles.comparisonHeaderRow}>
              <div className={styles.comparisonHeaderCell1}>항목</div>
              <div className={styles.comparisonHeaderCell2}>장기렌트</div>
              <div className={styles.comparisonHeaderCell3}>할부 구매</div>
              <div className={styles.comparisonHeaderCell4}>오토리스</div>
            </div>

            {/* Row 1: 초기비용 */}
            <div className={styles.comparisonRow}>
              <div className={styles.comparisonCell}>초기비용</div>
              <div className={styles.comparisonCellHighlight}>0원~100가능</div>
              <div className={styles.comparisonCell}>차량가의<br />10~30%</div>
              <div className={styles.comparisonCell}>10~30%</div>
            </div>

            {/* Row 2: 보험포함 */}
            <div className={styles.comparisonRow}>
              <div className={styles.comparisonCell}>보험포함</div>
              <div className={styles.comparisonCellHighlightIcon}>
                <img src="/mobileMain/tick-front-color.svg" alt="check" className={styles.comparisonCheckIcon} />
                <span>포함</span>
              </div>
              <div className={styles.comparisonCell}>별도</div>
              <div className={styles.comparisonCell}>별도</div>
            </div>

            {/* Row 3: 등록세 */}
            <div className={styles.comparisonRow}>
              <div className={styles.comparisonCell}>등록세</div>
              <div className={styles.comparisonCellHighlightIcon}>
                <img src="/mobileMain/tick-front-color.svg" alt="check" className={styles.comparisonCheckIcon} />
                <span>없음</span>
              </div>
              <div className={styles.comparisonCell}>있음</div>
              <div className={styles.comparisonCell}>있음</div>
            </div>

            {/* Row 4: 소유권 */}
            <div className={styles.comparisonRow}>
              <div className={styles.comparisonCell}>소유권</div>
              <div className={styles.comparisonCellHighlight}>렌트사</div>
              <div className={styles.comparisonCell}>본인</div>
              <div className={styles.comparisonCell}>리스사</div>
            </div>

            {/* Row 5: 계약 종료 시 */}
            <div className={styles.comparisonRow}>
              <div className={styles.comparisonCell}>계약 종료 시</div>
              <div className={styles.comparisonCellHighlight}>반납/인수 선택</div>
              <div className={styles.comparisonCell}>본인 소유</div>
              <div className={styles.comparisonCell}>반납/인수 선택</div>
            </div>
          </div>

          {/* Section 1: 장기렌트 - at left:50%, top:519px */}
          <div className={styles.comparisonInfo1}>
            <div className={styles.comparisonInfoTitle}>
              <svg className={styles.comparisonInfoIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 13L9 17L19 7" stroke="#111111" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>장기렌트 – 사업자 경비처리 최대 100% 가능!</span>
            </div>
            <div className={styles.comparisonInfoContent}>
              <div className={styles.comparisonInfoItem}>
                <svg className={styles.comparisonInfoCheckSmall} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 13L9 17L19 7" stroke="#111111" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>개인 - 일시불대비 총비용 최대 1,000~1,100만원 이상 저렴<br />(팰리세이드 하이브리드기준)</span>
              </div>
              <div className={styles.comparisonInfoItem}>
                <svg className={styles.comparisonInfoCheckSmall} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 13L9 17L19 7" stroke="#111111" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>개인사업자 - 경비처리 1,600만원 이상 추가 절세(7년 장기렌트시)</span>
              </div>
              <p className={styles.comparisonInfoNote}>
                *업종·차량 용도에 따라 경비 인정 범위가 달라질 수 있으므로,<br /> 세무사 상담을 통해 절세 가능 여부를 확인하세요.
              </p>
            </div>
          </div>

          {/* Section 2: 할부 구매 - at left:28px, top:628px */}
          <div className={styles.comparisonInfo2}>
            <div className={styles.comparisonInfoTitle}>
              <svg className={styles.comparisonInfoIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 13L9 17L19 7" stroke="#111111" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>할부 구매 – 개인이 수입차를 살 땐 이게 정답!</span>
            </div>
            <p className={styles.comparisonInfo2Text}>
              국산차는 개인도, 장기렌트가 저렴하지만, 개인이 수입차 구매시 가장 유리.
            </p>
          </div>

          {/* Section 3: 운용리스 - at left:28px, top:679px */}
          <div className={styles.comparisonInfo3}>
            <div className={styles.comparisonInfoTitle}>
              <svg className={styles.comparisonInfoIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 13L9 17L19 7" stroke="#111111" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>운용리스 – 사업자 수입차 리스 시 최강 혜택!</span>
            </div>
            <p className={styles.comparisonInfo3Text}>
              <span className={styles.comparisonInfo3Gray}>법인/개인사업자에게 가장 유리. </span>
              <span className={styles.comparisonInfo3Black}>경비처리 무려 93% 가능.</span>
            </p>
          </div>
        </section>

        {/* 장기렌트 비교 섹션 - Pixso Design item-id=1:2584 */}
        <section className={styles.rentComparisonSection}>
          {/* Top Title */}
          <div className={styles.rentTopTitleGroup}>
            <div className={styles.rentTopRow}>
              <span className={styles.rentMainTitle}>일시불보다 1,000만원<br />저렴하게 구입할 수 있는<br />장기렌트!</span>
            </div>
            <span className={styles.rentSubtitle}>
              디 올 뉴 팰리세이드 2025년형 가솔린 터보 2.5 하이브리드<br />
              (7인승) 익스클루시브 2WD A/T - 현대 스마트센스, 컴포트
            </span>
          </div>

          {/* Price with Underline */}
          <div className={styles.rentPriceGroup}>
            <span className={styles.rentPriceText}>54,260,000원</span>
            <div className={styles.rentPriceUnderline}></div>
          </div>

          {/* Car Image */}
          <div className={styles.rentCarImageWrapper}>
            <img src="/mobileMain/ss/펠리세이드 신형 4.png" alt="팰리세이드" loading="lazy" />
          </div>

          {/* Speech Bubble - 개인 (이미지) */}
          <div className={styles.rentSpeechBubbleImage}>
            <img src="/mobileMain/ss/개인이장기렌트.png" alt="개인이 장기렌트가 유리한 이유는?" loading="lazy" />
          </div>

          {/* Penguin Image - 위 (개인 섹션) */}
          <div className={styles.rentPenguinImage}>
            <img src="/mobileMain/ss/고민하는 펭귄 1-1.png" alt="고민하는 펭귄" loading="lazy" />
          </div>

          {/* Comparison Table - 개인 */}
          <div className={styles.rentComparisonTable}>
            {/* Header Row */}
            <div className={styles.rentTableRow}>
              <div className={`${styles.rentTableCell} ${styles.rentTableHeaderCell1}`}>항목</div>
              <div className={`${styles.rentTableCell} ${styles.rentTableHeaderCell2}`}>개인 일시불</div>
              <div className={`${styles.rentTableCell} ${styles.rentTableHeaderCell3}`}>개인 장기렌트카</div>
            </div>

            {/* Data Rows */}
            <div className={styles.rentTableRow}>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell1}`}>월 납입금</div>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell2}`}>월 0원</div>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell3}`}>월 556,820원<br />총 46,772,880원</div>
            </div>

            <div className={styles.rentTableRow}>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell1}`}>취등록세(선납)</div>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell2}`}>총 66,683,347원</div>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell3}`}>0원</div>
            </div>

            <div className={styles.rentTableRow}>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell1}`}>보험료</div>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell2}`} style={{ fontSize: '10px' }}>
                년 1,000,000원<br />총 7,000,000원 (견적에 포함)
              </div>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell3}`}>0원</div>
            </div>

            <div className={styles.rentTableRow}>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell1}`}>자동차세</div>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell2}`} style={{ fontSize: '10px' }}>
                년 649,220원<br />총 350만원 (견적에 포함)
              </div>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell3}`}>0원</div>
            </div>

            <div className={styles.rentTableRow}>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell1}`}>잔존가치</div>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell2}`}>0원</div>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell3}`}>9,701,000원</div>
            </div>

            <div className={styles.rentTableRow}>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell1}`} style={{ borderRadius: '0 0 0 10px' }}>합계</div>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell2}`}>총 66,683,349원</div>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell3}`} style={{ borderRadius: '0 0 10px 0' }}>총 56,473,880원</div>
            </div>
          </div>

          {/* Estimate Carousel */}
          <div className={styles.rentEstimateCarousel}>
            <div className={styles.rentEstimateHeader}>
              <span className={styles.rentEstimateHeaderText}>실제 견적 기준</span>
            </div>
            <div className={styles.rentEstimateImageGroup}>
              <button className={styles.rentEstimateArrowLeft} aria-label="이전">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 18L9 12L15 6" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className={styles.rentEstimateImageWrapper}>
                <img src="/mobileMain/ss/실제이력.png" alt="실제 견적" loading="lazy" />
              </div>
              <button className={styles.rentEstimateArrowRight} aria-label="다음">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18L15 12L9 6" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Business Speech Bubble - 사업자 (이미지) */}
          <div className={styles.rentBusinessSpeechBubbleImage}>
            <img src="/mobileMain/ss/사업자도.png" alt="사업자도 장기렌트가 유리한 이유는?" loading="lazy" />
          </div>

          {/* Business Penguin Image - 아래 (사업자 섹션) */}
          <div className={styles.rentBusinessPenguinImage}>
            <img src="/mobileMain/ss/고민하는 펭귄 1.png" alt="고민하는 펭귄" loading="lazy" />
          </div>

          {/* Business Rent Table */}
          <div className={styles.rentBusinessTable}>
            {/* Header Row */}
            <div className={styles.rentTableRow}>
              <div className={`${styles.rentTableCell} ${styles.rentTableHeaderCell1}`} style={{ fontSize: '10px' }}>항목</div>
              <div className={`${styles.rentTableCell} ${styles.rentTableHeaderCell2}`} style={{ fontSize: '10px' }}>사업자 미구입시</div>
              <div className={`${styles.rentTableCell} ${styles.rentTableHeaderCell3}`} style={{ fontSize: '10px' }}>
                사업자 장기렌트<br />(7년 기준)
              </div>
            </div>

            {/* Data Rows */}
            <div className={styles.rentTableRow}>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell1}`} style={{ fontSize: '10px' }}>차량 총비용</div>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell2}`} style={{ fontSize: '10px' }}>해당없음</div>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell3}`} style={{ fontSize: '10px' }}>
                56,473,880원<br />(월 556,820원 x 84개월)
              </div>
            </div>

            <div className={styles.rentTableRow}>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell1}`} style={{ fontSize: '10px' }}>연간 렌트비</div>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell2}`} style={{ fontSize: '10px' }}>해당없음</div>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell3}`} style={{ fontSize: '10px' }}>
                6,681,840원<br />(556,820 x 12개월)
              </div>
            </div>

            <div className={styles.rentTableRow}>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell1}`} style={{ fontSize: '10px' }}>연간 경비처리<br />가능액</div>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell2}`} style={{ fontSize: '10px' }}>해당없음</div>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell3}`} style={{ fontSize: '10px' }}>
                6,681,840원<br />(100% 비용처리)
              </div>
            </div>

            <div className={styles.rentTableRow}>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell1}`} style={{ fontSize: '10px' }}>과세표준</div>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell2}`} style={{ fontSize: '10px' }}>100,000,000원</div>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell3}`} style={{ fontSize: '10px' }}>
                93,318,160원<br />(소득 - 비용)
              </div>
            </div>

            <div className={styles.rentTableRow}>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell1}`} style={{ fontSize: '10px' }}>연간 세금</div>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell2}`} style={{ fontSize: '10px' }}>19,560,000원</div>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell3}`} style={{ fontSize: '10px' }}>17,221,356원</div>
            </div>

            <div className={styles.rentTableRow}>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell1}`} style={{ fontSize: '10px' }}>연간 절세효과</div>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell2}`} style={{ fontSize: '10px' }}>해당없음</div>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell3}`} style={{ fontSize: '10px' }}>2,338,644원</div>
            </div>

            <div className={styles.rentTableRow}>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell1}`} style={{ fontSize: '10px', borderRadius: '0 0 0 10px' }}>
                7년간 절세 총액
              </div>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell2}`} style={{ fontSize: '10px' }}>-</div>
              <div className={`${styles.rentTableCell} ${styles.rentTableDataCell3}`} style={{ fontSize: '10px', borderRadius: '0 0 10px 0' }}>
                16,370,508원
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <span className={styles.rentDisclaimerNote}>
            *실제 절세효과는 사업자별 상황(매입세액공제·소득공제 등)에 따라 달라질 수 있습니다.
          </span>

          {/* Youtube Comment Section */}
          <div className={styles.rentYoutubeSection}>
            <span className={styles.rentYoutubeHeader}>Youtube 채널 실제댓글</span>
            <button className={styles.rentYoutubeArrowLeft} aria-label="이전">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className={styles.rentYoutubeImageWrapper}>
              <img src="/mobileMain/ss/유튜브댓글.svg" alt="유튜브 댓글" loading="lazy" />
            </div>
            <button className={styles.rentYoutubeArrowRight} aria-label="다음">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </section>
    {/* 추가 이벤트 섹션 2회차 */}
    <Event
          styles={styles}
          onSubmitEvent={handleEventSubmit}
          isSubmitting={eventSubmitting}
          variant="yellow"
        />

        {/* 수입차 비교 섹션 - Pixso item-id=1:2726 */}
        <section className={styles.importCompareSection}>
          <div className={styles.importTitleWrapper}>
            <h2 className={styles.importTitle}>수입차는{'\n'}무조건 '비교'입니다.</h2>
            <p className={styles.importSubtitle}>같은 차, 더 싸게 살 수 있는 이유가 있죠.</p>
          </div>

          <div className={`${styles.importCard} ${styles.importCardBlue}`}>
            <h3 className={styles.importCardTitle}>평균 8개 딜러사 비교</h3>
            <p className={styles.importCardDesc}>
              대한민국엔 평균 8개의 수입차 딜러사가 있습니다.<br />
              블라인드 카스토리는 모든 딜러의 실시간 조건을 비교해,
            </p>
            <p className={styles.importCardText}>
              영업사원 수당 100% 포함가 기준으로<br />
              진짜 <span className={styles.importHighlight}>'최저가'</span>를 제시합니다.
            </p>
            <button className={styles.importButton} type="button">견적요청</button>
          </div>

          <div className={`${styles.importCard} ${styles.importCardWhite}`}>
            <h3 className={styles.importCardTitle}>일시불 구매도 가능</h3>
            <p className={styles.importCardDesc}>
              복잡한 조건 없이, 단순하게 가격만 비교하시면 됩니다.
            </p>
            <p className={styles.importCardText}>
              일시불은 물론, 리스와 장기렌트 방식에도<br />
              <span className={styles.importHighlight}>동일한 할인</span> 혜택이 적용됩니다.
            </p>
            <button className={styles.importButton} type="button">견적요청</button>
          </div>

          <div className={`${styles.importCard} ${styles.importCardBlue}`}>
            <h3 className={styles.importCardTitle}>제휴할인 추가 300만 원</h3>
            <p className={styles.importCardDesc}>
              제휴 할인 자동 적용, 따로 요청할 필요도 없습니다.
            </p>
            <p className={styles.importCardTextSmall}>
              블라인드 카스토리는 에이전시와의 제휴를 통해<br />
              딜러사 견적 외 추가 <span className={styles.importHighlight}>300만 원 할인</span> 혜택까지<br />
              자동으로 적용해드립니다.
            </p>
            <button className={styles.importButton} type="button">견적요청</button>
          </div>
        </section>

    
        {/* Trust Section - 신용 걱정 NO! (Pixso Design item-id=1:2806) */}
        <TrustSection styles={styles} />

        <MobileContactModal
          open={isContactModalOpen}
          onClose={handleContactModalClose}
          onSubmit={handleContactModalSubmit}
          isSubmitting={isContactSubmitting}
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

export default MobleMainV2;
