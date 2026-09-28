import React, { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import styles from './MobileAdvance.module.css';
import mobileMainStyles from '../main/MobleMain.module.css';
import BrandFilterChips from '../../components/navigation/BrandFilterChips.jsx';
import { contentAPI } from '../../services/contentApi.js';
import { useCarBrandsQuery } from '../../hooks/queries/carQueries';
import { carAPI } from '../../services/carApi.js';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import { getPageSeo } from '../../config/seoConfig';
import Event from '../../components/mobileMain/Event.jsx';
import { sendToKakaoOnly } from '../../services/consultHelper';
import { getStoredUserPhone, setStoredUserPhone } from '../../utils/phoneStorage';
import PromotionCardMobile from '../../components/PromotionCardMobile.jsx';
import BrowserContactModal from '../../components/BrowserContactModal.jsx';
import ConsultSuccessModal from '../../components/ConsultSuccessModal.jsx';
import { normalizePriceValue } from '../../utils/priceUtils';

const FALLBACK_IMAGE = '/placeholder/car.svg';
const filterTabs = ['전체', '국산', '수입'];

const toPositiveOrNull = (value) => {
  const normalized = normalizePriceValue(value);
  return normalized > 0 ? normalized : null;
};

const buildTrimObject = (item) => {
  if (item.trim) return item.trim;
  return {
    lowestPrepayment30MonthlyFee: toPositiveOrNull(
      item.lowestPrepayment30MonthlyFee ?? item.lowest_prepayment_30_monthly_fee ?? null,
    ),
    lowestDeposit30MonthlyFee: toPositiveOrNull(
      item.lowestDeposit30MonthlyFee ?? item.lowest_deposit_30_monthly_fee ?? null,
    ),
    lowestNoDepositMonthlyFee: toPositiveOrNull(
      item.lowestNoDepositMonthlyFee ?? item.lowest_no_deposit_monthly_fee ?? null,
    ),
  };
};

const DOMESTIC_BRAND_ITEMS = [
  { key: '전체', label: '전체' },
  { key: '현대', label: '현대' },
  { key: '기아', label: '기아' },
  { key: '제네시스', label: '제네시스' },
  { key: 'KGM', label: 'KGM' },
  { key: '르노삼성', label: '르노삼성' },
  { key: '쉐보레', label: '쉐보레' },
];

const IMPORT_BRAND_ITEMS = [
  { key: '전체', label: '전체' },
  { key: 'BMW', label: 'BMW' },
  { key: '벤츠', label: '벤츠' },
  { key: '볼보', label: '볼보' },
  { key: '아우디', label: '아우디' },
  { key: '포드', label: '포드' },
  { key: '폴스타', label: '폴스타' },
  { key: 'BYD', label: 'BYD' },
  { key: '도요타', label: '도요타' },
  { key: '렉서스', label: '렉서스' },
  { key: '테슬라', label: '테슬라' },
];

const ALL_BRAND_ITEMS = [
  { key: '전체', label: '전체' },
  ...DOMESTIC_BRAND_ITEMS.filter((item) => item.key !== '전체'),
  ...IMPORT_BRAND_ITEMS.filter((item) => item.key !== '전체'),
];

export default function MobileAdvanceAll() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(filterTabs[0]);
  const [activeBrand, setActiveBrand] = useState('전체');
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [contactModalPayload, setContactModalPayload] = useState(null);
  const [contactModalMessage, setContactModalMessage] = useState('');
  const [contactModalInitialPhone, setContactModalInitialPhone] = useState('');
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const { data: brandsData = [] } = useCarBrandsQuery();

  const selectedBrandId = useMemo(() => {
    if (activeBrand === '전체') return null;
    const brand = brandsData.find((b) => b.name === activeBrand);
    return brand?.id || null;
  }, [activeBrand, brandsData]);

  const carType = useMemo(() => {
    if (activeTab === '국산') return '국산';
    if (activeTab === '수입') return '수입';
    return null;
  }, [activeTab]);

  const brandItems = useMemo(() => {
    if (activeTab === '국산') return DOMESTIC_BRAND_ITEMS;
    if (activeTab === '수입') return IMPORT_BRAND_ITEMS;
    return ALL_BRAND_ITEMS;
  }, [activeTab]);

  // 재고 특가 리스트 (프로모션 제외)
  const { data: inventoryData = [], isLoading } = useQuery({
    queryKey: ['mobile-advance-all', selectedBrandId, carType],
    queryFn: async () => {
      const result = await contentAPI.getUrgentInventory(200, selectedBrandId, carType, null);
      if (!Array.isArray(result)) return [];
      return result.filter(
        (item) => (item.cardType ?? item.card_type ?? '').toUpperCase() !== 'PROMOTION_EVENT',
      );
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // 표시용: 고유 trimId 추출
  const uniqueTrimIds = useMemo(() => {
    const trimIdSet = new Set();
    (inventoryData || []).forEach((item) => {
      if (item.trimId) {
        trimIdSet.add(item.trimId);
      }
    });
    return Array.from(trimIdSet);
  }, [inventoryData]);

  // 표시용: 각 trimId에 대해 차량 상세 정보 가져오기
  const trimDetailsQueries = useQueries({
    queries: uniqueTrimIds.map((trimId) => ({
      queryKey: ['car-detail-advance-all', trimId],
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

  const deals = useMemo(() => {
    const now = new Date();
    const activeList = (inventoryData || []).filter((item) => {
      if (item.endDate) {
        const endDate = new Date(item.endDate);
        if (endDate < now) return false;
      }
      return true;
    });

    return activeList.map((item) => {
      const carDetail = item.trimId ? trimDetailsMap.get(item.trimId) : null;
      const brandName =
        item.brandName ||
        carDetail?.brandName ||
        brandsData.find((b) => b.id === carDetail?.brandId)?.name ||
        item.extraInfo ||
        '블라인드 카스토리';
      const remainingQuantity =
        item.remainingQuantity !== undefined
          ? item.remainingQuantity
          : item.remaining_quantity !== undefined
            ? item.remaining_quantity
            : null;

      const monthly =
        item.discountedMonthlyFee ??
        item.discounted_monthly_fee ??
        item.monthlyRentalFee ??
        item.monthly_rental_fee ??
        null;

      const monthlyBase =
        item.monthlyRentalFee ??
        item.monthly_rental_fee ??
        null;

      const monthlyDiscountPercent =
        item.monthlyDiscountPercent ??
        item.monthly_discount_percent ??
        null;

      const vehiclePrice =
        item.originalPrice ??
        item.original_price ??
        item.basePrice ??
        item.finalPrice ??
        item.price ??
        carDetail?.originalPrice ??
        carDetail?.original_price ??
        carDetail?.basePrice ??
        carDetail?.price ??
        carDetail?.consumerPrice ??
        null;

      const badgeQuantity =
        remainingQuantity !== null && remainingQuantity !== undefined && !Number.isNaN(Number(remainingQuantity))
          ? Math.max(0, Number(remainingQuantity))
          : null;

      const badgeText = badgeQuantity !== null
        ? `${String(badgeQuantity).padStart(2, '0')}대 보유`
        : '마감임박';

      const detailPayload = item.trimId
        ? { trimId: item.trimId }
        : { carId: item.id?.toString() || 'unknown' };

      return {
        id: item.id?.toString() || `adv-deal-${Math.random()}`,
        title: item.title || carDetail?.name || '재고 특가',
        subtitle: brandName,
        monthly,
        monthlyBase,
        monthlyDiscountPercent,
        vehiclePrice,
        image: carDetail?.imageUrl || item.imageUrl || FALLBACK_IMAGE,
        detailPayload,
        badgeText,
        discountPercent: item.discountPercent ?? null,
        discountAmount: item.discountAmount ?? null,
        trim: buildTrimObject(item),
      };
    });
  }, [inventoryData, trimDetailsMap, brandsData]);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setActiveBrand('전체');
  }, []);

  const sanitizePhone = useCallback((value) => {
    if (!value) return '';
    const digits = String(value).replace(/\D/g, '');
    const trimmed = digits.slice(0, 30);
    return trimmed;
  }, []);

  const persistContactInfo = useCallback((phoneValue, nameValue) => {
    const sanitized = sanitizePhone(phoneValue);
    if (sanitized) {
      setStoredUserPhone(sanitized);
    }
    if (nameValue) {
      localStorage.setItem('wgl_user_name', nameValue);
    }
  }, [sanitizePhone]);

  const handleEventSubmit = useCallback(
    async ({ name, phone, carModel }) => {
      const payload = {
        name: name || '',
        phone: sanitizePhone(phone || ''),
        carModel: carModel || '',
        consultType: '이벤트상담',
        source: 'mobile-advance-all',
        entryLabel: 'mobile-advance-all > 이벤트 섹션',
      };

      setEventSubmitting(true);
      try {
        const result = await sendToKakaoOnly(payload);

        if (result?.success) {
          persistContactInfo(payload.phone, payload.name);
          setIsSuccessModalOpen(true);
        } else {
          setContactModalPayload({
            ...payload,
            consultType: '이벤트상담',
          });
          setContactModalMessage(result?.message || '연락처를 남겨 주세요.');
          setContactModalInitialPhone(payload.phone || '');
        }
      } catch (error) {
        setContactModalPayload({
          ...payload,
          consultType: '이벤트상담',
        });
        setContactModalMessage('연락처를 남겨 주세요.');
        setContactModalInitialPhone(payload.phone || '');
      } finally {
        setEventSubmitting(false);
      }
    },
    [persistContactInfo, sanitizePhone],
  );

  const openContactModalWithPayload = useCallback(
    (payload, message = '연락처를 입력해 주세요.', initialPhone = '') => {
      setContactModalPayload(payload);
      setContactModalMessage(message);
      setContactModalInitialPhone(initialPhone || payload?.phone || '');
    },
    [],
  );

  const handleContactModalClose = useCallback(() => {
    if (isContactSubmitting) return;
    setContactModalPayload(null);
    setContactModalMessage('');
    setContactModalInitialPhone('');
  }, [isContactSubmitting]);

  const handleContactModalSubmit = useCallback(
    async (phoneValue, nameValue) => {
      if (!contactModalPayload) return;
      const phone = sanitizePhone(phoneValue);
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
          setContactModalMessage('');
          setContactModalInitialPhone('');
          setIsSuccessModalOpen(true);
        } else {
          setContactModalMessage(result?.message || '카카오톡 전송에 실패했습니다. 다시 시도해주세요.');
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[MobileAdvanceAll] 연락처 등록 실패', error);
        setContactModalMessage('카카오톡 전송에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setIsContactSubmitting(false);
      }
    },
    [contactModalPayload, persistContactInfo, sanitizePhone],
  );

  const handleConsultClick = useCallback(
    async (card) => {
      if (!card) return;
      const savedPhone = sanitizePhone(
        getStoredUserPhone() ||
        localStorage.getItem('wgl_user_phone') ||
        localStorage.getItem('wgl_phone') ||
        localStorage.getItem('wglPhone')
      );
      const savedName = localStorage.getItem('wgl_user_name');
      const payload = {
        brand: card.subtitle ?? '',
        model: card.title ?? '',
        trim: card.detailPayload?.trimId ?? card.detailPayload?.carId ?? card.id ?? null,
        consultType: '재고문의',
        source: 'mobile-advance-all',
        entryLabel: `mobile-advance-all > 재고문의 > ${card.title ?? ''}`,
        phone: savedPhone || '',
        name: savedName || '',
      };

      // 저장된 연락처가 있으면 바로 전송
      if (payload.phone) {
        try {
          const result = await sendToKakaoOnly(payload);
          if (result?.success) {
            persistContactInfo(payload.phone, payload.name);
            setIsSuccessModalOpen(true);
          } else {
            // 실패 시 입력 모달로 폴백
            openContactModalWithPayload(
              { ...payload, phone: '' },
              result?.message || '카카오톡 전송에 실패했습니다. 아래에 연락처를 남겨 주세요.',
              '',
            );
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('[MobileAdvanceAll] 재고 상담 전송 실패', error);
          openContactModalWithPayload(
            { ...payload, phone: '' },
            '카카오톡 전송에 실패했습니다. 아래에 연락처를 남겨 주세요.',
            '',
          );
        }
        return;
      }

      // 저장된 연락처가 없으면 입력 모달 오픈
      openContactModalWithPayload(payload, '연락처를 입력해 주세요.', '');
    },
    [openContactModalWithPayload, persistContactInfo, sanitizePhone],
  );

  const {
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords,
  } = getPageSeo('express-deals');

  // SEO용 대표 이미지: 첫 카드 이미지 사용
  const seoImage = useMemo(() => {
    const first = deals[0];
    if (!first) return undefined;
    return first.image || undefined;
  }, [deals]);

  return (
    <>
      <SeoHelmet
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        image={seoImage}
      />
      <div className={styles.page}>
      <div className={styles.container}>
        <section className={styles.topNoticeSection}>
          <div className={styles.topNoticeRow}>
            <span className={styles.topNoticeIcon} role="img" aria-label="urgent">🚨</span>
            <div className={styles.topNoticeTexts}>
              <div className={styles.topNoticeTitle}>[긴급] 오늘 출고 마감 차량!</div>
              <div className={styles.topNoticeSub}>실시간 재고 확인 후 빠르게 상담받으세요</div>
            </div>
          </div>
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
              onChange={(brand) => setActiveBrand(brand)}
            />
          </section>
        )}

        <section className={styles.dealSection}>
          {isLoading ? (
            <div className={styles.loading}>차량 정보를 불러오는 중...</div>
          ) : deals.length === 0 ? (
            <div className={styles.empty}>재고 특가 차량이 없습니다.</div>
          ) : (
            <div className={styles.listGrid}>
              {deals.map((card) => (
                <PromotionCardMobile
                  key={card.id}
                  id={card.id}
                  name={card.title}
                  desc={card.subtitle}
                  img={card.image}
                  brand={card.subtitle}
                  badgeText={card.badgeText}
                  badgeVariant="red"
                  basePrice={card.vehiclePrice}
                  finalPrice={card.vehiclePrice}
                  monthlyRentalFee={card.monthlyBase ?? card.monthly}
                  discountedMonthlyFee={card.monthly ?? card.monthlyBase}
                  monthlyDiscountPercent={card.monthlyDiscountPercent}
                  discountPercent={card.discountPercent}
                  discountAmount={card.discountAmount}
                  discountDisplay="monthly"
                  trim={card.trim}
                  onClick={() => handleConsultClick(card)}
                  onButtonClick={() => handleConsultClick(card)}
                  buttonText="카카오로 상담"
                />
              ))}
            </div>
          )}
        </section>
      </div>
      <div className={styles.bottomSpacer} />
    </div>
    <Event
      styles={mobileMainStyles}
      onSubmitEvent={handleEventSubmit}
      isSubmitting={eventSubmitting}
      variant="yellow"
    />
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
    </>
  );
}


