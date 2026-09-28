/**
 * 트림 상세(CarTrimDetail)와 차량 라인 상세(CarLineDetail)가 함께 쓰는 가격·계약조건 규칙.
 * 두 페이지에 똑같이 복사되어 있던 코드를 한 곳으로 옮겼다. 계산 방식은 바꾸지 않았다.
 */
import { useEffect, useMemo, useState } from 'react';

export const parsePriceValue = (value) => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const numeric = Number(value.replace(/[^\d.-]/g, ''));
    return Number.isNaN(numeric) ? 0 : numeric;
  }
  return 0;
};

export const formatCurrency = (value) => {
  const numeric = parsePriceValue(value);
  return numeric ? `${numeric.toLocaleString()}원` : '가격 정보 없음';
};

export const formatOptionPrice = (value) => `+${parsePriceValue(value).toLocaleString()}원`;

export const normalizeId = (value) => (value ?? value === 0 ? String(value) : null);

export const resolveColorImageUrl = (color) => {
  const raw = color?.imageUrl || color?.image_url || color?.cloudfrontUrl || color?.cloudfront_url || color?.s3Url || color?.s3_url || '';
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
};

/** 옵션 가격이 0원인 항목은 선택지에서 뺀다. */
export const filterPricedOptions = (options = []) =>
  options.filter((option) => parsePriceValue(option?.discountedPrice ?? option?.price ?? option?.amount ?? 0) > 0);

export const optionPriceOf = (option) => parsePriceValue(option?.discountedPrice ?? option?.price ?? option?.amount ?? 0);

/** 백엔드 brandCountry 로 국산차/수입차를 나눈다. */
export const resolveBrandOrigin = (brandCountry) => {
  if (!brandCountry) return null;
  const country = String(brandCountry).toUpperCase();
  if (!country) return null;
  const isDomestic = country === 'KR' || country.includes('KOREA') || country.includes('한국') || country.includes('대한민국');
  return isDomestic ? '국산차' : '수입차';
};

const NO_DISCOUNT = { discountAmount: 0, discountedBasePrice: 0, discountPercent: 0 };

/**
 * 트림 즉시 할인. 백엔드 discountInfo(신규) → activeTrimDiscount → 공용 할인(sharedDiscountInfo) → 구형 필드 순서.
 * 프론트에서 임의 할인율을 더하지 않는다.
 */
export const computeTrimDiscount = (trim, basePriceValue, sharedDiscountInfo = null) => {
  if (!trim || !basePriceValue) return NO_DISCOUNT;

  const discountInfo = trim.discountInfo ?? trim.activeTrimDiscount ?? sharedDiscountInfo ?? null;
  const discountPriceFromInfo = parsePriceValue(discountInfo?.discountedPrice ?? discountInfo?.discounted_price ?? 0);

  let rawDiscountAmountFromInfo = 0;
  if (discountInfo?.discountType && discountInfo?.discountValue != null) {
    const value = parsePriceValue(discountInfo.discountValue);
    if (discountInfo.discountType === 'PERCENTAGE') {
      if (value > 0) rawDiscountAmountFromInfo = Math.floor((basePriceValue * value) / 100);
    } else {
      // FIXED_AMOUNT 또는 그 외 타입은 정액 할인으로 본다.
      rawDiscountAmountFromInfo = value;
    }
  }

  const legacyDiscountPrice = parsePriceValue(trim.discountedPrice ?? trim.discounted_price ?? 0);
  const rawDiscountPrice = discountPriceFromInfo || legacyDiscountPrice || 0;

  let rawDiscountAmount = rawDiscountAmountFromInfo;
  if (!rawDiscountAmount) {
    rawDiscountAmount = parsePriceValue(trim.discountAmount ?? trim.discount_amount ?? trim.activeTrimDiscount?.discountAmount ?? 0);
  }
  if (!rawDiscountAmount && rawDiscountPrice > 0 && rawDiscountPrice < basePriceValue) {
    rawDiscountAmount = basePriceValue - rawDiscountPrice;
  }
  if (!rawDiscountAmount) return NO_DISCOUNT;

  return {
    discountAmount: rawDiscountAmount,
    discountedBasePrice: Math.max(basePriceValue - rawDiscountAmount, 0),
    discountPercent: basePriceValue > 0 ? Math.round((rawDiscountAmount / basePriceValue) * 100) : 0,
  };
};

export const CONTRACT_PERIOD_OPTIONS = ['24개월', '36개월', '48개월', '60개월'];
export const DEPOSIT_OPTIONS = ['없음', '10%', '20%', '30%', '40%'];
export const PREPAYMENT_OPTIONS = ['없음', '10%', '20%', '30%', '40%'];
export const MILEAGE_OPTIONS = ['10,000km', '20,000km', '30,000km', '40,000km', '50,000km'];
export const CAR_TAX_OPTIONS = ['포함', '미포함'];
export const INSURANCE_AGE_OPTIONS = ['만 26세이상', '만 21세이상'];
export const MAX_UPFRONT_PERCENT = 40;
export const UPFRONT_LIMIT_MESSAGE = '보증금과 선납금은 합계 40%까지 선택할 수 있습니다.';

export const parsePercent = (value) => {
  if (!value || value === '없음') return 0;
  const match = String(value).match(/(\d+)/);
  return match ? Number(match[1]) : 0;
};

export const contractMethodLabel = (method) => (method === '장기렌탈' ? '장기렌트' : method);

/**
 * 계약 조건 상태. 수입차만 신차구입(할부)을 고를 수 있고, 수입차 24개월은 '일시불'로 표기한다.
 * 보증금+선납금이 40%를 넘으면 바꾸지 않고 onLimitExceeded 를 부른다.
 */
export function useContractConditions(brandOrigin, { onLimitExceeded } = {}) {
  const [contractMethod, setContractMethod] = useState('장기렌탈');
  const [contractPeriod, setContractPeriod] = useState('48개월');
  const [deposit, setDepositState] = useState('없음');
  const [prepayment, setPrepaymentState] = useState('30%');
  const [mileage, setMileage] = useState('20,000km');
  const [carTax, setCarTax] = useState('포함');
  const [insuranceAge, setInsuranceAge] = useState('만 26세이상');

  const isImported = brandOrigin === '수입차';
  const availableMethods = useMemo(() => (isImported ? ['장기렌탈', '리스', '신차구입(할부)'] : ['장기렌탈', '리스']), [isImported]);

  // 국적이 바뀌어 현재 이용방법이 없어지면 기본값으로 되돌린다.
  useEffect(() => {
    if (!availableMethods.includes(contractMethod)) setContractMethod(availableMethods[0] || '장기렌탈');
  }, [availableMethods, contractMethod]);

  const isFinanceMode = isImported && contractMethod === '신차구입(할부)';
  const periodLabel = isImported && contractPeriod === '24개월' ? '일시불' : contractPeriod;

  const setDeposit = (next) => {
    if (parsePercent(next) + parsePercent(prepayment) > MAX_UPFRONT_PERCENT) {
      onLimitExceeded?.();
      return;
    }
    setDepositState(next);
  };
  const setPrepayment = (next) => {
    if (parsePercent(deposit) + parsePercent(next) > MAX_UPFRONT_PERCENT) {
      onLimitExceeded?.();
      return;
    }
    setPrepaymentState(next);
  };

  // 상담 접수·공유 URL 에 쓰는 계약 조건 문구 (기존 형식 그대로)
  const terms = [
    contractMethod,
    periodLabel,
    deposit && deposit !== '없음' ? `보증금 ${deposit}` : '',
    prepayment && prepayment !== '없음' ? `선납금 ${prepayment}` : '',
    mileage,
  ].filter(Boolean);

  // 화면 상단 선택 경로 배너용 (장기렌탈 → 장기렌트)
  const displayTerms = [contractMethodLabel(contractMethod), ...terms.slice(1)];

  return {
    contractMethod,
    setContractMethod,
    contractPeriod,
    setContractPeriod,
    deposit,
    setDeposit,
    prepayment,
    setPrepayment,
    mileage,
    setMileage,
    carTax,
    setCarTax,
    insuranceAge,
    setInsuranceAge,
    availableMethods,
    isImported,
    isFinanceMode,
    periodLabel,
    terms,
    displayTerms,
  };
}
