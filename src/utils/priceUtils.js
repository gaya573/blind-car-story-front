export const MONTHS_DEFAULT = 24;
export const MONTHLY_MAX_DEFAULT = 1_000_0000; // 10,000,000원

export const priceToMonthly = (price, months = MONTHS_DEFAULT) => {
  if (!price) return 0;
  return Math.floor(Number(price) / months);
};

export const monthlyToPrice = (monthly, months = MONTHS_DEFAULT) => {
  if (!monthly) return 0;
  return Math.floor(Number(monthly) * months);
};

export const roundDownToManwon = (value) => Math.floor(Number(value) / 10000);

export const formatMonthly = (monthly) => `${Number(monthly).toLocaleString()}원/월`;

export const formatMonthlyManwon = (price, months = MONTHS_DEFAULT) => {
  const monthly = priceToMonthly(price, months);
  const manwon = roundDownToManwon(monthly);
  return `${manwon.toLocaleString()}만원/월`;
};

export const normalizePriceValue = (value) => {
  if (value == null) return 0;
  if (typeof value === 'number') {
    if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
    return Math.floor(value);
  }
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  const parsed = Number(cleaned);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) return 0;
  return Math.floor(parsed);
};

export const resolveOriginalPriceValue = (item, fallback = 0) =>
  normalizePriceValue(
    item?.originalPrice ??
      item?.original_price ??
      item?.basePrice ??
      item?.base_price ??
      item?.price ??
      fallback ??
      0,
  );

export const resolveMonthlyPayment = ({
  monthlyRentalFee,
  discountedMonthlyFee,
  fallbackBasePrice = 0,
  fallbackDiscountedPrice = 0,
  months = 48,
} = {}) => {
  const normalizedMonthlyFee = Number(monthlyRentalFee);
  const hasDedicatedMonthly =
    Number.isFinite(normalizedMonthlyFee) && normalizedMonthlyFee > 0;

  if (hasDedicatedMonthly) {
    const normalizedDiscounted = Number(discountedMonthlyFee);
    const hasDiscountedMonthly =
      Number.isFinite(normalizedDiscounted) &&
      normalizedDiscounted > 0 &&
      normalizedDiscounted < normalizedMonthlyFee;

    return {
      hasDedicatedMonthly,
      monthlyValue: hasDiscountedMonthly ? normalizedDiscounted : normalizedMonthlyFee,
      monthlyOriginal: hasDiscountedMonthly ? normalizedMonthlyFee : null,
    };
  }

  const baseMonthly =
    fallbackBasePrice > 0 ? priceToMonthly(fallbackBasePrice, months) : 0;
  const discountedMonthly =
    fallbackDiscountedPrice > 0
      ? priceToMonthly(fallbackDiscountedPrice, months)
      : 0;

  return {
    hasDedicatedMonthly: false,
    monthlyValue: discountedMonthly || baseMonthly || 0,
    monthlyOriginal: discountedMonthly && baseMonthly ? baseMonthly : null,
  };
};

export const resolveDiscountPricing = ({
  basePrice = 0,
  trim,
  vehicleLine,
} = {}) => {
  const normalizedBase = normalizePriceValue(basePrice);
  if (!trim || normalizedBase <= 0) {
    return {
      finalPrice: normalizedBase,
      discountAmount: 0,
      discountPercent: 0,
    };
  }

  const discountInfo =
    trim.discountInfo ??
    trim.activeTrimDiscount ??
    vehicleLine?.activeTrimDiscount ??
    vehicleLine?.discountInfo ??
    vehicleLine?.discount_info ??
    null;

  const priceCandidates = [
    normalizePriceValue(
      discountInfo?.discountedPrice ?? discountInfo?.discounted_price ?? 0,
    ),
    normalizePriceValue(trim.discountedPrice ?? trim.discounted_price ?? 0),
    normalizePriceValue(
      vehicleLine?.discountedPrice ??
        vehicleLine?.discounted_price ??
        0,
    ),
    normalizePriceValue(
      vehicleLine?.finalPrice ?? vehicleLine?.final_price ?? 0,
    ),
  ].filter((price) => price > 0 && price < normalizedBase);

  const candidateDiscountedPrice = priceCandidates.length
    ? priceCandidates[0]
    : 0;

  let rawDiscountAmount = 0;
  if (discountInfo?.discountType && discountInfo?.discountValue != null) {
    const value = normalizePriceValue(discountInfo.discountValue);
    if (discountInfo.discountType === 'PERCENTAGE') {
      if (value > 0) {
        rawDiscountAmount = Math.floor((normalizedBase * value) / 100);
      }
    } else {
      rawDiscountAmount = value;
    }
  }

  if (!rawDiscountAmount) {
    rawDiscountAmount = normalizePriceValue(
      trim.discountAmount ??
        trim.discount_amount ??
        vehicleLine?.discountAmount ??
        vehicleLine?.discount_amount ??
        discountInfo?.discountAmount ??
        discountInfo?.discount_amount ??
        0,
    );
  }

  let finalPrice = normalizedBase;
  let discountAmount = 0;

  if (candidateDiscountedPrice) {
    finalPrice = candidateDiscountedPrice;
    discountAmount = Math.max(normalizedBase - candidateDiscountedPrice, 0);
  } else if (rawDiscountAmount > 0) {
    if (rawDiscountAmount >= normalizedBase) {
      finalPrice = rawDiscountAmount;
      discountAmount = Math.max(normalizedBase - finalPrice, 0);
    } else {
      discountAmount = rawDiscountAmount;
      finalPrice = Math.max(normalizedBase - rawDiscountAmount, 0);
    }
  }

  const discountPercent =
    normalizedBase > 0 && discountAmount > 0
      ? Math.round((discountAmount * 100) / normalizedBase)
      : 0;

  return {
    finalPrice,
    discountAmount,
    discountPercent,
  };
};

/**
 * 수입차 차량 리스트용: 한 트림의 할인/가격 메타데이터 계산
 * - discountInfo 기준으로 최종가/할인액/할인율을 단순하게 산출한다.
 * - 기존 resolveDiscountPricing 로직은 건드리지 않고, 수입차 전용으로 사용한다.
 */
export const computeImportedTrimDiscountMeta = (trim) => {
  if (!trim) return null;

  const basePrice = resolveOriginalPriceValue(trim);
  if (basePrice <= 0) {
    return null;
  }

  const discountInfo = trim.discountInfo ?? trim.discount_info ?? null;

  let finalPrice = basePrice;
  let discountAmount = 0;
  let discountPercent = 0;

  if (discountInfo) {
    const rawType = discountInfo.discountType ?? discountInfo.discount_type;
    const discountType = typeof rawType === 'string' ? rawType.toUpperCase() : null;
    const rawValue = discountInfo.discountValue ?? discountInfo.discount_value ?? null;
    const discountedPriceCandidate = normalizePriceValue(
      discountInfo.discountedPrice ?? discountInfo.discounted_price ?? 0,
    );

    // PERCENTAGE: discountValue 는 "할인율", discountedPrice 는 (있다면) 최종가
    if (discountType === 'PERCENTAGE') {
      const numericValue = Number(rawValue);
      if (Number.isFinite(numericValue) && numericValue > 0) {
        const ratio = Math.min(Math.max(numericValue, 0), 100);
        discountAmount = Math.floor((basePrice * ratio) / 100);
        finalPrice = Math.max(basePrice - discountAmount, 0);
      } else if (discountedPriceCandidate > 0 && discountedPriceCandidate < basePrice) {
        finalPrice = discountedPriceCandidate;
        discountAmount = basePrice - finalPrice;
      }
    } else if (discountType) {
      // FIXED_AMOUNT 등: discountValue / discountedPrice 모두 "할인액"으로 취급
      let fixedAmount = 0;
      if (rawValue != null) {
        fixedAmount = Math.max(fixedAmount, normalizePriceValue(rawValue));
      }
      if (discountedPriceCandidate > 0) {
        fixedAmount = Math.max(fixedAmount, discountedPriceCandidate);
      }
      if (fixedAmount > 0) {
        discountAmount = Math.min(fixedAmount, basePrice);
        finalPrice = Math.max(basePrice - discountAmount, 0);
      }
    } else if (discountedPriceCandidate > 0 && discountedPriceCandidate < basePrice) {
      // 타입 정보가 없고 discountedPrice 만 있으면 최종가로 간주
      finalPrice = discountedPriceCandidate;
      discountAmount = basePrice - finalPrice;
    }
  }

  if (basePrice > 0 && discountAmount > 0) {
    discountPercent = Math.round((discountAmount * 100) / basePrice);
  }

  return {
    basePrice,
    finalPrice,
    discountAmount,
    discountPercent,
    trimName: trim.name ?? trim.trimName ?? '',
  };
};

/**
 * 수입차 차량 리스트용:
 * - 여러 트림 중 "할인율이 가장 높은 트림"을 고르고,
 * - 동률일 경우 할인액이 더 큰 트림을, 그 다음으로 최종가가 더 낮은 트림을 선택한다.
 */
export const selectBestImportedTrimForLine = (trims = []) => {
  if (!Array.isArray(trims) || trims.length === 0) return null;

  const entries = trims
    .map((trim) => computeImportedTrimDiscountMeta(trim))
    .filter(Boolean);

  if (!entries.length) {
    return null;
  }

  const discountedEntries = entries.filter(
    (entry) => (entry.discountPercent ?? 0) > 0 || (entry.discountAmount ?? 0) > 0,
  );

  const candidateList = discountedEntries.length ? discountedEntries : entries;

  const best = candidateList.reduce((bestEntry, entry) => {
    if (!bestEntry) return entry;

    const value = entry.discountPercent ?? 0;
    const bestValue = bestEntry.discountPercent ?? 0;
    if (value > bestValue) return entry;

    if (value === bestValue) {
      const amount = entry.discountAmount ?? 0;
      const bestAmount = bestEntry.discountAmount ?? 0;
      if (amount > bestAmount) return entry;

      if (amount === bestAmount) {
        const finalPrice = entry.finalPrice ?? entry.basePrice ?? 0;
        const bestFinalPrice = bestEntry.finalPrice ?? bestEntry.basePrice ?? 0;
        if (finalPrice < bestFinalPrice) return entry;
      }
    }

    return bestEntry;
  }, null);

  return best;
};

