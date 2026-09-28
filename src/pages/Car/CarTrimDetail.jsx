import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb';
import QuickConsultCard from '../../components/QuickConsultCard';
import Toast from '../../components/Toast.jsx';
import styles from './CarDetail.module.css';
import { useCarDetailQuery } from '../../hooks/queries/carQueries';
import { useShareableConsultUrl } from '../../utils/shareableUrl';
import MobileContactModal from '../../components/MobileContactModal.jsx';
import BrowserContactModal from '../../components/BrowserContactModal.jsx';
import ConsultSuccessModal from '../../components/ConsultSuccessModal.jsx';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import { buildCarDetailSeo } from '../../utils/seoBuilders';
import { getStoredUserPhone } from '../../utils/phoneStorage';
import { findBestMatchingColorImageUrl } from '../../utils/colorImageFallback';
import { formatTrimDisplayName } from '../../utils/trimDisplayName';

const parsePriceValue = (value) => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const numeric = Number(value.replace(/[^\d.-]/g, ''));
    return Number.isNaN(numeric) ? 0 : numeric;
  }
  return 0;
};

const formatCurrency = (value) => {
  const numeric = parsePriceValue(value);
  return numeric ? `${numeric.toLocaleString()}원` : '가격 정보 없음';
};

const formatOptionPrice = (value) => {
  const numeric = parsePriceValue(value);
  return `+${numeric.toLocaleString()}원`;
};

const normalizeId = (value) => (value ?? value === 0 ? String(value) : null);

const resolveColorImageUrl = (color) => {
  const raw =
    color?.imageUrl ||
    color?.image_url ||
    color?.cloudfrontUrl ||
    color?.cloudfront_url ||
    color?.s3Url ||
    color?.s3_url ||
    '';
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
};

// hex / rgb / rgba 모두 안전하게 처리하는 색상 변환 유틸 (CarDetail.jsx 와 동일)
const resolveChipColor = (color) => {
  const raw =
    color?.hexCode ||
    color?.colorCode ||
    color?.rgb ||
    color?.rgbCode ||
    '';

  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // 이미 rgb(...) / rgba(...) 형태이면 그대로 사용
  if (/^rgba?\(/i.test(trimmed)) {
    return trimmed;
  }

  // hex 형태: "#AABBCC" 또는 "AABBCC" 만 허용 (실제 16진수만)
  const hexMatch = trimmed.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!hexMatch) {
    // PM2 / RRR 같은 제조사 코드에는 색상을 그리지 않고 무시
    return null;
  }
  const hex = hexMatch[1];
  return `#${hex}`;
};

// 실제 CSS 색상으로 사용할 수 있는 코드만 true
const hasColorCode = (color) => {
  const raw =
    color?.hexCode ||
    color?.colorCode ||
    color?.rgb ||
    color?.rgbCode ||
    '';
  if (typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (/^rgba?\(/i.test(trimmed)) return true;
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed);
};

const isMobileDevice = () =>
  typeof window !== 'undefined' &&
  typeof navigator !== 'undefined' &&
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );

const CONTACT_PROMPT_DEFAULT =
  '휴대폰 번호를 남겨주시면 담당 매니저가 빠르게 도와드립니다.';

const CarTrimDetail = () => {
  const { trimId } = useParams();
  const navigate = useNavigate();
  const {
    data,
    isLoading,
    isError,
  } = useCarDetailQuery(trimId);

  const [selectedTrimId, setSelectedTrimId] = useState(trimId ? String(trimId) : null);
  const [selectedColorId, setSelectedColorId] = useState(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState(new Set());
  const [expandedSections, setExpandedSections] = useState({
    trim: true,
    options: true,
    contract: true,
  });
  const [contractMethod, setContractMethod] = useState('장기렌탈');
  const [contractPeriod, setContractPeriod] = useState('48개월');
  const [deposit, setDeposit] = useState('없음');
  const [prepayment, setPrepayment] = useState('30%');
  const [mileage, setMileage] = useState('20,000km');
  const [carTax, setCarTax] = useState('포함');
  const [insuranceAge, setInsuranceAge] = useState('만 26세이상');
  const [showPercentToast, setShowPercentToast] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [mobileContactMessage, setMobileContactMessage] = useState('');
  const [isBrowserContactModalOpen, setIsBrowserContactModalOpen] = useState(false);
  const [browserContactMessage, setBrowserContactMessage] = useState('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isBrowserContactSubmitting, setIsBrowserContactSubmitting] = useState(false);
  const isMobileView = isMobileDevice();

  const openContactFallback = useCallback(
    (message = CONTACT_PROMPT_DEFAULT) => {
      if (isMobileView) {
        setMobileContactMessage(message);
        setIsContactModalOpen(true);
      } else {
        setBrowserContactMessage(message);
        setIsBrowserContactModalOpen(true);
      }
    },
    [isMobileView],
  );

  const handleRotateLoadingClose = useCallback(() => {
    // 아무것도 하지 않음 - onEstimateClick에서 이미 처리함
  }, []);

  const handleMobileContactClose = useCallback(() => {
    setIsContactModalOpen(false);
    setMobileContactMessage('');
  }, []);

  const handleBrowserContactModalClose = useCallback(() => {
    setIsBrowserContactModalOpen(false);
    setBrowserContactMessage('');
  }, []);

  const trimGroups = useMemo(() => {
    if (!data) return [];
    const trims = data.trims ?? [];
    if (!trims.length) {
      return [];
    }
    const modelName = data.name ?? '세부모델';
    return [
      {
        key: data.id ?? 'trim-detail',
        modelId: data.id ?? 'trim-detail',
        modelName,
        trims: trims.map((trim) => ({
          id: normalizeId(trim.id),
          name: formatTrimDisplayName(trim.name ?? trim.trimName ?? '', modelName, trim),
          rawName: trim.name ?? trim.trimName ?? '',
          basePrice: parsePriceValue(trim.originalPrice ?? trim.original_price ?? trim.basePrice ?? trim.price ?? 0),
          options: trim.options ?? [],
          colors: trim.colors ?? [],
          discountInfo: trim.discountInfo ?? null,
          activeTrimDiscount: trim.activeTrimDiscount ?? null,
          discountAmount: trim.discountAmount ?? trim.discount_amount ?? null,
          discountedPrice: trim.discountedPrice ?? trim.discounted_price ?? null,
        })),
      },
    ];
  }, [data]);

  const allTrims = useMemo(
    () => trimGroups.flatMap((group) => group.trims),
    [trimGroups],
  );

  const selectedTrim = useMemo(
    () => allTrims.find((trim) => trim.id === selectedTrimId) ?? null,
    [allTrims, selectedTrimId],
  );

  const sharedDiscountInfo = useMemo(() => {
    const discounts = data?.activeTrimDiscounts ?? data?.trimDiscounts ?? [];
    if (!Array.isArray(discounts) || !selectedTrim?.id) return null;
    return discounts.find(
      (discount) =>
        String(discount?.trimId ?? discount?.trim_id ?? discount?.trim) === String(
          selectedTrim.id,
        ),
    );
  }, [data?.activeTrimDiscounts, data?.trimDiscounts, selectedTrim?.id]);

  useEffect(() => {
    if (!selectedTrim && allTrims.length > 0) {
      setSelectedTrimId(allTrims[0].id);
    }
  }, [selectedTrim, allTrims]);

  const rawTrimOptions = selectedTrim?.options ?? [];
  const trimOptions = useMemo(
    () =>
      rawTrimOptions.filter((option) => {
        const price = parsePriceValue(
          option?.discountedPrice ?? option?.price ?? option?.amount ?? 0,
        );
        return price > 0;
      }),
    [rawTrimOptions],
  );
  const trimColors = selectedTrim?.colors ?? (data?.availableColors ?? []);
  const visibleColors = useMemo(
    () =>
      Array.isArray(trimColors)
        ? trimColors.filter((color) => !color?.vehicleInterior && hasColorCode(color))
        : [],
    [trimColors],
  );

  // 트림이 바뀔 때만 옵션/색상 초기화 (무한 루프 방지)
  useEffect(() => {
    if (!selectedTrim) return;

    setSelectedOptionIds(new Set());

    const firstColorWithCode = visibleColors[0] ?? null;

    const firstColorId = firstColorWithCode ? normalizeId(firstColorWithCode.id) : null;

    setSelectedColorId(firstColorId);
  }, [selectedTrimId, visibleColors]);

  // 오른쪽 견적 카드에는 사용자가 체크한 옵션만 노출
  const selectedOptionsForCard = useMemo(
    () =>
      trimOptions.filter((option) =>
        selectedOptionIds.has(normalizeId(option.id)),
      ),
    [trimOptions, selectedOptionIds],
  );

  const optionItemsForCard = useMemo(
    () =>
      selectedOptionsForCard.map((option) => ({
        name: option.name,
        price: parsePriceValue(option.discountedPrice ?? option.price ?? option.amount ?? 0),
      })),
    [selectedOptionsForCard],
  );

  const selectedColor = useMemo(
    () => visibleColors.find((color) => normalizeId(color.id) === selectedColorId) ?? null,
    [visibleColors, selectedColorId],
  );

  const colorPrice = useMemo(
    () => parsePriceValue(selectedColor?.additionalPrice ?? selectedColor?.price ?? 0),
    [selectedColor],
  );

  const basePriceValue = parsePriceValue(selectedTrim?.originalPrice ?? selectedTrim?.original_price ?? selectedTrim?.basePrice ?? 0);

  const consultModelName = data?.name ?? '';
  const brandName = data?.brandName ?? '';

  // 히어로 영역 타이틀/이미지 (트림 상세 전용)
  const heroTitle = consultModelName || selectedTrim?.name || '차량 상세';
  const heroImage =
    // 색상별 이미지가 있으면 우선 사용
    resolveColorImageUrl(selectedColor) ||
    findBestMatchingColorImageUrl(selectedColor, [
      selectedTrim,
      data,
      trimGroups,
    ]) ||
    // 없으면 차량 메인 이미지 사용
    data?.imageUrl ||
    null;
  const seoImage = heroImage || '/특가차량.png';

  const detailSegment = data?.segment || data?.segmentName || null;
  const detailFuel =
    data?.fuelType || data?.fuel || data?.fuelOrType || null;

  // 브랜드 국적 기반으로 국산/수입 레이블 계산 (API 응답에서 직접 사용)
  const brandOrigin = useMemo(() => {
    if (!data?.brandCountry) return null;
    const country = (data.brandCountry || '').toUpperCase();
    if (!country) return null;
    const isDomestic =
      country === 'KR' ||
      country.includes('KOREA') ||
      country.includes('한국') ||
      country.includes('대한민국');
    return isDomestic ? '국산차' : '수입차';
  }, [data?.brandCountry]);

  // 트림 할인 (백엔드 트림별 할인 정보 기반, 프론트에서 별도 5% 하드코딩 없음)
  const {
    discountAmount,
    discountedBasePrice,
    discountPercent,
  } = useMemo(() => {
    if (!selectedTrim || !basePriceValue) {
      return {
        discountAmount: 0,
        discountedBasePrice: 0,
        discountPercent: 0,
      };
    }

    // 1) 백엔드 DiscountInfo(신규 구조) 우선 사용
    const discountInfo =
      selectedTrim?.discountInfo ??
      selectedTrim?.activeTrimDiscount ??
      sharedDiscountInfo ??
      null;

    const discountPriceFromInfo = parsePriceValue(
      discountInfo?.discountedPrice ?? discountInfo?.discounted_price ?? 0,
    );

    let rawDiscountAmountFromInfo = 0;
    if (discountInfo?.discountType && discountInfo?.discountValue != null) {
      const value = parsePriceValue(discountInfo.discountValue);
      if (discountInfo.discountType === 'PERCENTAGE') {
        if (value > 0) {
          rawDiscountAmountFromInfo = Math.floor((basePriceValue * value) / 100);
        }
      } else {
        // FIXED_AMOUNT 또는 그 외 타입은 정액 할인으로 간주
        rawDiscountAmountFromInfo = value;
      }
    }

    // 2) 구형 필드(직접 내려오던 discountedPrice/discountAmount)와 병합
    const legacyDiscountPrice = parsePriceValue(
      selectedTrim?.discountedPrice ?? selectedTrim?.discounted_price ?? 0,
    );

    const rawDiscountPrice = discountPriceFromInfo || legacyDiscountPrice || 0;

    let rawDiscountAmount = rawDiscountAmountFromInfo;
    if (!rawDiscountAmount) {
      rawDiscountAmount = parsePriceValue(
        selectedTrim?.discountAmount ??
          selectedTrim?.discount_amount ??
          selectedTrim?.activeTrimDiscount?.discountAmount ??
          0,
      );
    }

    const hasDiscountPrice = rawDiscountPrice > 0 && rawDiscountPrice < basePriceValue;

    if (!rawDiscountAmount && hasDiscountPrice) {
      rawDiscountAmount = basePriceValue - rawDiscountPrice;
    }

    if (!rawDiscountAmount) {
      return {
        discountAmount: 0,
        discountedBasePrice: 0,
        discountPercent: 0,
      };
    }

    const effectiveDiscounted = Math.max(basePriceValue - rawDiscountAmount, 0);
    const percent =
      basePriceValue > 0 ? Math.round((rawDiscountAmount / basePriceValue) * 100) : 0;

    return {
      discountAmount: rawDiscountAmount,
      discountedBasePrice: effectiveDiscounted,
      discountPercent: percent,
    };
  }, [selectedTrim, basePriceValue, brandOrigin]);

  const {
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords,
  } = useMemo(
    () =>
      buildCarDetailSeo({
        brand: brandName,
        model: consultModelName || heroTitle,
        segment: detailSegment,
        fuelOrType: detailFuel,
        period: contractPeriod,
        mileage,
      }),
    [brandName, consultModelName, heroTitle, detailSegment, detailFuel, contractPeriod, mileage],
  );

  const contractPeriodOptions = ['24개월', '36개월', '48개월', '60개월'];
  const depositOptions = ['없음', '10%', '20%', '30%', '40%'];
  const prepaymentOptions = ['없음', '10%', '20%', '30%', '40%'];
  const mileageOptions = ['10,000km', '20,000km', '30,000km', '40,000km', '50,000km'];

  const parsePercent = (value) => {
    if (!value || value === '없음') return 0;
    const match = String(value).match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  };

  const availableMethods = useMemo(() => {
    // 수입차일 때만 신차구입(할부) 노출
    if (brandOrigin === '수입차') {
      return ['장기렌탈', '리스', '신차구입(할부)'];
    }
    return ['장기렌탈', '리스'];
  }, [brandOrigin]);

  useEffect(() => {
    // 브랜드/국적이 바뀌어 현재 이용방법이 유효하지 않으면 기본값으로 리셋
    if (!availableMethods.includes(contractMethod)) {
      setContractMethod(availableMethods[0] || '장기렌탈');
    }
  }, [availableMethods, contractMethod]);

  const isFinanceMode = brandOrigin === '수입차' && contractMethod === '신차구입(할부)';

  const renderContractForm = () => (
    <>
      {/* 이용방법 탭 */}
      <div className={styles['contract-row']}>
        <span className={styles['contract-label']}>이용방법</span>
        <div className={styles['contract-options']}>
          {availableMethods.map((method) => (
            <button
              key={method}
              type="button"
              className={`${styles['contract-btn']} ${
                contractMethod === method ? styles['contract-btn-active'] : ''
              }`}
              onClick={() => setContractMethod(method)}
            >
              {method === '장기렌탈' ? '장기렌트' : method}
            </button>
          ))}
        </div>
      </div>

      {/* 공통/모드별 필드 */}
      <div className={styles['contract-row']}>
        <span className={styles['contract-label']}>{isFinanceMode ? '할부기간' : '계약기간'}</span>
        <div className={styles['contract-options-grid']}>
          {contractPeriodOptions.map((option) => (
            <button
              type="button"
              key={option}
              className={`${styles['contract-btn']} ${
                contractPeriod === option ? styles['contract-btn-active'] : ''
              }`}
              onClick={() => setContractPeriod(option)}
            >
              {brandOrigin === '수입차' && option === '24개월' ? '일시불' : option}
            </button>
          ))}
        </div>
      </div>

      {/* 렌트/리스 전용: 보증금, 선납금, 연간 운행거리, (국산 장기렌트일 때만 자동차세/보험 연령) */}
      {!isFinanceMode && (
        <>
          <div className={styles['contract-row']}>
            <span className={styles['contract-label']}>보증금</span>
            <div className={styles['contract-options-grid']}>
              {depositOptions.map((option) => (
                <button
                  type="button"
                  key={option}
                  className={`${styles['contract-btn']} ${
                    deposit === option ? styles['contract-btn-active'] : ''
                  }`}
                  onClick={() => {
                    const next = option;
                    const total = parsePercent(next) + parsePercent(prepayment);
                    if (total > 40) {
                      setShowPercentToast(true);
                      return;
                    }
                    setDeposit(next);
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 선납금: 보증금 바로 아래 */}
          <div className={styles['contract-row']}>
            <span className={styles['contract-label']}>선납금</span>
            <div className={styles['contract-options-grid']}>
              {prepaymentOptions.map((option) => (
                <button
                  type="button"
                  key={option}
                  className={`${styles['contract-btn']} ${
                    prepayment === option ? styles['contract-btn-active'] : ''
                  }`}
                  onClick={() => {
                    const next = option;
                    const total = parsePercent(deposit) + parsePercent(next);
                    if (total > 40) {
                      setShowPercentToast(true);
                      return;
                    }
                    setPrepayment(next);
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className={styles['contract-row']}>
            <span className={styles['contract-label']}>연간 약정운행거리</span>
            <div className={styles['contract-options-grid']}>
              {mileageOptions.map((option) => (
                <button
                  type="button"
                  key={option}
                  className={`${styles['contract-btn']} ${
                    mileage === option ? styles['contract-btn-active'] : ''
                  }`}
                  onClick={() => setMileage(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 자동차세: 리스에서만 노출 / 보험 연령: 장기렌트(국산/수입) 공통 */}
          {contractMethod === '리스' && (
            <div className={styles['contract-row']}>
              <span className={styles['contract-label']}>자동차세</span>
              <div className={styles['contract-options']}>
                <button
                  type="button"
                  className={`${styles['contract-btn']} ${
                    carTax === '포함' ? styles['contract-btn-active'] : ''
                  }`}
                  onClick={() => setCarTax('포함')}
                >
                  포함
                </button>
                <button
                  type="button"
                  className={`${styles['contract-btn']} ${
                    carTax === '미포함' ? styles['contract-btn-active'] : ''
                  }`}
                  onClick={() => setCarTax('미포함')}
                >
                  미포함
                </button>
              </div>
            </div>
          )}

          {contractMethod === '장기렌탈' && (
            <div className={styles['contract-row']}>
              <span className={styles['contract-label']}>보험 연령</span>
              <div className={styles['contract-options']}>
                <button
                  type="button"
                  className={`${styles['contract-btn']} ${
                    insuranceAge === '만 26세이상' ? styles['contract-btn-active'] : ''
                  }`}
                  onClick={() => setInsuranceAge('만 26세이상')}
                >
                  만 26세이상
                </button>
                <button
                  type="button"
                  className={`${styles['contract-btn']} ${
                    insuranceAge === '만 21세이상' ? styles['contract-btn-active'] : ''
                  }`}
                  onClick={() => setInsuranceAge('만 21세이상')}
                >
                  만 21세이상
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 공통: 선납금 (신차구입 등 금융 상품에서 사용) */}
      {isFinanceMode && (
      <div className={styles['contract-row']}>
        <span className={styles['contract-label']}>선납금</span>
        <div className={styles['contract-options-grid']}>
          {prepaymentOptions.map((option) => (
            <button
              type="button"
              key={option}
              className={`${styles['contract-btn']} ${
                prepayment === option ? styles['contract-btn-active'] : ''
              }`}
              onClick={() => {
                const next = option;
                const total = parsePercent(deposit) + parsePercent(next);
                if (total > 40) {
                  setShowPercentToast(true);
                  return;
                }
                setPrepayment(next);
              }}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      )}

      {/* 신차구입 전용: 이자율 안내 */}
      {isFinanceMode && (
        <div className={styles['contract-row']}>
          <span className={styles['contract-label']}>이자율</span>
          <p className={styles['contract-note']}>
            * 기준 이자율 4.9% 적용 (실제 이자율은 신용등급에 따라 변동 가능)
          </p>
        </div>
      )}
    </>
  );

  const handleNavigateBack = () => {
    navigate(-1);
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleOption = (optionId) => {
    const normalized = normalizeId(optionId);
    if (!normalized) return;
    setSelectedOptionIds((prev) => {
      const next = new Set(prev);
      if (next.has(normalized)) {
        next.delete(normalized);
      } else {
        next.add(normalized);
      }
      return next;
    });
  };

  const breadcrumbItems = useMemo(
    () => [
      { label: '홈', link: '/' },
      { label: '차량 상세' },
      { label: data?.name ?? '트림 상세' },
    ],
    [data?.name],
  );

  const hierarchyTitle = useMemo(() => {
    if (!selectedTrim) return '';
    return [data?.name, selectedTrim.name].filter(Boolean).join(' → ');
  }, [data?.name, selectedTrim?.name]);

  useEffect(() => {
    if (!data?.brandCountry || !brandOrigin) return;
    // eslint-disable-next-line no-console
    console.log(
      '[CarTrimDetail] 브랜드 국적',
      `${brandOrigin === '국산차' ? '국산' : '수입'} | ${data.brandCountry}`,
      {
        brandName,
        origin: brandOrigin,
        country: data.brandCountry,
      },
    );
  }, [data?.brandCountry, brandName, brandOrigin]);

  // URL 동기화 (민감정보 제외)
  useShareableConsultUrl(
    () => {
      const periodLabel =
        brandOrigin === '수입차' && contractPeriod === '24개월'
          ? '일시불'
          : contractPeriod;

      const terms = [
        contractMethod,
        periodLabel,
        deposit !== '없음' ? `보증금 ${deposit}` : '',
        prepayment !== '없음' ? `선납금 ${prepayment}` : '',
        mileage,
      ].filter(Boolean);

      return {
        brand: brandName,
        model: consultModelName,
        vehicleLineId: data?.vehicleLineId || '',
        trimId: selectedTrimId || '',
        colorId: selectedColorId || '',
        optionIds: Array.from(selectedOptionIds || []),
        terms,
        consultType: '트림상세',
        source: 'car-trim-detail',
      };
    },
    (preset) => {
      if (preset?.trimId) setSelectedTrimId(preset.trimId);
      if (preset?.colorId) setSelectedColorId(preset.colorId);
      if (preset?.optionIds?.length) setSelectedOptionIds(new Set(preset.optionIds));
    },
    [
      brandName,
      consultModelName,
      data?.vehicleLineId,
      selectedTrimId,
      selectedColorId,
      selectedOptionIds,
      contractMethod,
      contractPeriod,
      deposit,
      prepayment,
      mileage,
    ]
  );

  const selectedOptionsForSubmit = useMemo(
    () =>
      Array.from(selectedOptionIds)
        .map((optionId) => {
          const option = trimOptions.find((opt) => normalizeId(opt.id) === optionId);
          return option?.name ?? '';
        })
        .filter(Boolean),
    [selectedOptionIds, trimOptions],
  );

  const buildConsultPayload = (phoneValue) => {
    const periodLabel =
      brandOrigin === '수입차' && contractPeriod === '24개월'
        ? '일시불'
        : contractPeriod;

    const terms = [];
    if (contractMethod) terms.push(contractMethod);
    if (periodLabel) terms.push(periodLabel);
    if (deposit && deposit !== '없음') terms.push(`보증금 ${deposit}`);
    if (prepayment && prepayment !== '없음') terms.push(`선납금 ${prepayment}`);
    if (mileage) terms.push(mileage);

    const options = [];
    if (selectedColor?.name) {
      options.push(`색상: ${selectedColor.name}`);
    }
    options.push(...selectedOptionsForSubmit);

    return {
      brand: data?.brandName || '',
      model: consultModelName || '',
      trim: selectedTrim?.name || '',
      color: selectedColor?.name || '',
      phone: (phoneValue || '').trim(),
      options,
      terms,
      consultType: '트림상세',
      source: 'car-trim-detail',
      entryLabel: `차량 상세 > ${data?.name || ''}`,
      extra: {
        vehicleLineId: data?.vehicleLineId ?? null,
        trimId: selectedTrim?.id ?? null,
        brandName: data?.brandName ?? '',
        contractMethod,
        contractPeriod,
        deposit,
        prepayment,
        mileage,
        carTax,
        insuranceAge,
      },
    };
  };

  const handleBrowserContactSubmit = useCallback(
    async (phoneValue, nameValue) => {
      const phone = (phoneValue || '').trim();
      if (!phone) {
        alert('연락처를 입력해 주세요.');
        return;
      }
      setIsBrowserContactSubmitting(true);
      try {
        const { submitConsult } = await import('../../services/consultHelper');
        const payload = {
          ...buildConsultPayload(phone),
          name: (nameValue || '').trim(),
        };
        const result = await submitConsult(payload, {
          kakaoOpenTarget: '_blank',
          openKakaoOnSuccess: true,
          useKakao: false,
        });

        // API 호출이 성공하면 무조건 성공 모달 표시
        if (result.success) {
          handleBrowserContactModalClose();
          setIsSuccessModalOpen(true);
        } else {
          alert(result.message || '연락처 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
        }
      } catch (error) {
        console.error('[CarTrimDetail] 브라우저 연락처 보완 실패', error);
        alert('연락처 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        setIsBrowserContactSubmitting(false);
      }
    },
    [buildConsultPayload, handleBrowserContactModalClose],
  );

  if (isLoading) {
    return (
      <div className={styles['car-detail-page']}>
        <div className={styles['car-detail-container']}>
          <div className={styles['loading-state']}>차량 정보를 불러오는 중입니다...</div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={styles['car-detail-page']}>
        <div className={styles['car-detail-container']}>
          <div className={styles['error-state']}>
            차량 정보를 불러오지 못했습니다. <button onClick={handleNavigateBack}>이전 페이지로 돌아가기</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SeoHelmet
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        image={seoImage}
      />
    <div className={styles['car-detail-page']}>
      <div className={styles['car-detail-container']}>
        <Breadcrumb items={breadcrumbItems} />
        {hierarchyTitle && (
          <div className={styles['hierarchy-banner']}>
            <span className={styles['hierarchy-text']}>{hierarchyTitle}</span>
          </div>
        )}

        <div className={styles['car-detail-layout']}>
          <div className={styles['car-detail-left']}>
            <div className={styles['car-hero-section']}>
              <img src={heroImage} alt={heroTitle} className={styles['car-hero-image']} />
              <div className={styles['car-info-badge']}>
                <div className={styles['brand-summary']}>
                  <div className={styles['brand-logo-square']}>
                    {data?.brandLogoUrl && (
                      <img src={data.brandLogoUrl} alt={data?.brandName ?? '브랜드 로고'} />
                    )}
                  </div>
                  <div>
                    <h1 className={styles['car-hero-title']}>{data.name}</h1>
                    <div className={styles['brand-meta']}>
                      <span className={styles['car-brand-name']}>{data.brandName}</span>
                      {brandOrigin && (
                        <span
                          className={`${styles['brand-origin-pill']} ${
                            brandOrigin === '국산차'
                              ? styles['brand-origin-domestic']
                              : styles['brand-origin-import']
                          }`}
                        >
                          {brandOrigin}
                        </span>
                      )}
                    </div>

                    {basePriceValue > 0 && (
                      <div className={styles['hero-price-box']}>
                        <div className={styles['hero-price-row']}>
                          <span className={styles['hero-price-label']}>기본 차량가격</span>
                          <span
                            className={
                              discountAmount > 0
                                ? styles['hero-price-original']
                                : styles['hero-price-current']
                            }
                          >
                            {basePriceValue.toLocaleString()}원
                          </span>
                        </div>

                        {discountAmount > 0 && (
                          <>
                            <div className={styles['hero-discount-row']}>
                                <span className={styles['hero-discount-label']}>
                                  즉시 할인 혜택
                                </span>
                              <span className={styles['hero-discount-amount']}>
                                -{discountAmount.toLocaleString()}원
                              </span>
                            </div>
                            <div className={styles['hero-final-row']}>
                              <span className={styles['hero-final-label']}>최종 가격</span>
                              <span className={styles['hero-final-price']}>
                                {discountedBasePrice.toLocaleString()}원
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {visibleColors.length > 0 && (
                  <div className={styles['color-info-section']}>
                    <div className={styles['color-header']}>
                      <span className={styles['color-label-text']}>외장색상 선택</span>
                        {selectedColor && (
                          <span className={styles['selected-color-text']}>
                            {selectedColor.name}
                          </span>
                        )}
                    </div>
                    <div className={styles['color-palette']}>
                        {visibleColors.map((color) => {
                        const colorKey = normalizeId(color.id);
                        const chipColor = resolveChipColor(color);
                        if (!chipColor) return null;
                        return (
                          <button
                            type="button"
                            key={colorKey ?? color.name}
                              className={`${styles['color-swatch']} ${
                                selectedColorId === colorKey ? styles['selected'] : ''
                              }`}
                            style={{ backgroundColor: chipColor }}
                            onClick={() => setSelectedColorId(colorKey)}
                            title={color.name}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles['option-card']}>
                <div
                  className={styles['option-card-header']}
                  onClick={() => toggleSection('trim')}
                >
                <h3 className={styles['option-card-title']}>세부모델 선택</h3>
                  <span className={styles['toggle-icon']}>
                    {expandedSections.trim ? '−' : '+'}
                  </span>
              </div>
              {expandedSections.trim && (
                <div className={styles['option-card-content']}>
                  <div className={styles['trim-selector']}>
                    {trimGroups.length === 0 ? (
                        <div className={styles['trim-empty']}>
                          등록된 세부모델이 없습니다.
                        </div>
                    ) : (
                      trimGroups.map((group) => (
                        <div key={group.key} className={styles['trim-group']}>
                          <div className={styles['trim-group-items']}>
                            {group.trims.map((trim) => {
                              const isSelected = selectedTrimId === trim.id;
                              return (
                                <button
                                  type="button"
                                  key={trim.id}
                                    className={`${styles['trim-option']} ${
                                      isSelected ? styles['active'] : ''
                                    }`}
                                  onClick={() => setSelectedTrimId(trim.id)}
                                  aria-pressed={isSelected}
                                >
                                  <div className={styles['trim-radio']}>
                                      {isSelected && (
                                        <span className={styles['trim-check']}>✓</span>
                                      )}
                                  </div>
                                  <div className={styles['trim-name']}>{trim.name}</div>
                                    <div className={styles['trim-price']}>
                                      {formatCurrency(trim.originalPrice ?? trim.original_price ?? trim.basePrice)}
                                    </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {trimOptions.length > 0 && (
              <div className={styles['option-card']}>
                  <div
                    className={styles['option-card-header']}
                    onClick={() => toggleSection('options')}
                  >
                  <h3 className={styles['option-card-title']}>추가 옵션 선택</h3>
                    <span className={styles['toggle-icon']}>
                      {expandedSections.options ? '−' : '+'}
                    </span>
                </div>
                {expandedSections.options && (
                  <div className={styles['option-card-content']}>
                    <div className={styles['additional-options']}>
                      {trimOptions.map((option) => {
                        const optionId = normalizeId(option.id);
                        const active = optionId ? selectedOptionIds.has(optionId) : false;
                        const price = option.discountedPrice ?? option.price ?? 0;
                        return (
                          <button
                            type="button"
                            key={optionId ?? option.name}
                              className={`${styles['additional-option']} ${
                                active ? styles['active'] : ''
                              }`}
                            onClick={() => toggleOption(option.id)}
                            aria-pressed={active}
                          >
                              <div className={styles['option-checkbox']}>
                                {active && <span>✓</span>}
                              </div>
                            <div className={styles['option-details']}>
                              <span className={styles['option-name']}>{option.name}</span>
                                <span className={styles['option-price']}>
                                  {formatOptionPrice(price)}
                                </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className={styles['option-card']}>
                <div
                  className={styles['option-card-header']}
                  onClick={() => toggleSection('contract')}
                >
                <h3 className={styles['option-card-title']}>계약 조건 선택</h3>
                  <span className={styles['toggle-icon']}>
                    {expandedSections.contract ? '−' : '+'}
                  </span>
              </div>
              {expandedSections.contract && (
                  <div className={styles['option-card-content']}>{renderContractForm()}</div>
              )}
            </div>
          </div>

          <aside className={styles['car-detail-right']}>
            <QuickConsultCard
              trimName={selectedTrim?.name}
              trimPrice={basePriceValue}
              selectedColor={selectedColor?.name ?? '선택 없음'}
              selectedColorPrice={colorPrice}
              selectedOptions={optionItemsForCard}
              priceMode="total"
              discountAmount={discountAmount}
              showDiscount={discountAmount > 0}
              onLoadingClose={handleRotateLoadingClose}
              onEstimateClick={async () => {
                try {
                  // 1) 저장된 연락처 확인
                  const storedPhone = getStoredUserPhone();
                  
                  // 2) 연락처 없으면 바로 모달 오픈 (카카오 OAuth 제거!)
                  if (!storedPhone) {
                    openContactFallback(CONTACT_PROMPT_DEFAULT);
                    return;
                  }

                  // 3) 연락처 있으면 바로 상담 신청
                  const { submitConsult } = await import('../../services/consultHelper');
                  const payload = buildConsultPayload(storedPhone);
                  
                  // eslint-disable-next-line no-console
                  console.info('[CarTrimDetail] QuickConsultCard onEstimateClick: payload', payload);

                  const result = await submitConsult(payload, {
                    openKakaoOnSuccess: false,
                    useKakao: false,  // 카카오 OAuth 사용 안 함
                  });

                  // eslint-disable-next-line no-console
                  console.info('[CarTrimDetail] QuickConsultCard onEstimateClick: result', result);

                  if (result.success) {
                    setIsSuccessModalOpen(true);
                  } else {
                    alert(result.message || '상담 신청에 실패했습니다.');
                  }
                } catch (error) {
                  console.error('[CarTrimDetail] 상담 신청 실패', error);
                  alert('상담 신청에 실패했습니다. 다시 시도해주세요.');
                }
              }}
            />
          </aside>
        </div>
      </div>

      <Toast
        message="40퍼이상을 선택할수없습니다"
        visible={showPercentToast}
        duration={1000}
        onClose={() => setShowPercentToast(false)}
      />

      {isMobileView && (
        <MobileContactModal
          open={isContactModalOpen}
          onClose={handleMobileContactClose}
          description={mobileContactMessage || undefined}
          onSubmit={async (phoneValue) => {
            try {
              const { submitConsult } = await import('../../services/consultHelper');
              const payload = buildConsultPayload(phoneValue);

              const result = await submitConsult(payload, {
                kakaoOpenTarget: '_blank',
                openKakaoOnSuccess: false,
              });

              // API 호출이 성공하면 무조건 성공 모달 표시
              if (result.success) {
                handleMobileContactClose();
                setIsSuccessModalOpen(true);
              } else {
                  alert(
                    result.message ||
                      '연락처 등록에 실패했습니다. 잠시 후 다시 시도해주세요.',
                  );
              }
            } catch (error) {
              console.error('[CarTrimDetail] 연락처 보완 실패', error);
              alert('연락처 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
            }
          }}
        />
      )}

      <BrowserContactModal
        open={isBrowserContactModalOpen}
        onClose={handleBrowserContactModalClose}
        onSubmit={handleBrowserContactSubmit}
        isSubmitting={isBrowserContactSubmitting}
        description={browserContactMessage || undefined}
      />
      <ConsultSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
      />
    </div>
    </>
  );
};

export default CarTrimDetail;
