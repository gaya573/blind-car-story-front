/**
 * 내 차 견적(국산차·수입차 목록) 데이터 가공.
 * 기존 CarList.jsx 에 있던 규칙(모델 단위 분리·중복 제거·대표 트림·할인/월 렌탈료 선택)을 그대로 옮겼다.
 */
import { getBrandLogo } from '../../config/brandLogos';
import { normalizePriceValue, resolveOriginalPriceValue, resolveDiscountPricing } from '../../utils/priceUtils';
import { isDisplayableImportVehiclePrice, shouldKeepTrimForOrigin } from '../../utils/vehiclePriceGuards';

const DEFERRED_IMPORT_BRANDS = ['폴스타', 'polestar', 'BYD', 'byd'];

export const normalizeBrandKey = (value = '') => String(value).replace(/\s+/g, '').toLowerCase();

export const normalizeBrandAliasKey = (value = '') => {
  const key = normalizeBrandKey(value);
  if (['kgm', 'kg모빌리티', 'kgmobility', '쌍용', '쌍용자동차'].includes(key)) return 'kgm';
  if (['르노코리아', '르노삼성'].includes(key)) return '르노코리아';
  if (['쉐보레', '한국지엠', 'chevrolet'].includes(key)) return '쉐보레';
  if (['toyota', '도요타', '토요타'].includes(key)) return '토요타';
  if (['mercedesbenz', 'mercedes-benz', '메르세데스벤츠', '메르세데스-벤츠', '벤츠'].includes(key)) return '벤츠';
  if (['volkswagen', '폭스바겐'].includes(key)) return '폭스바겐';
  return key;
};

export const isSameBrandName = (left, right) => normalizeBrandAliasKey(left) === normalizeBrandAliasKey(right);

export const LEGACY_BRAND_ID_TO_NAME = {
  45: 'BYD',
  46: 'BMW',
  47: 'BYD',
  49: '기아',
  50: '도요타',
  51: '렉서스',
  53: '벤츠',
  54: '볼보',
  56: '아우디',
  58: '테슬라',
  59: '폭스바겐',
  60: '현대',
  61: 'GMC',
  62: '람보르기니',
  63: '랜드로버',
  64: '로터스',
  65: '롤스로이스',
  66: '링컨',
  67: '마세라티',
  68: '맥라렌',
  69: '미니',
  70: '벤틀리',
  71: '시트로엥',
  72: '애스턴마틴',
  73: '지프',
  74: '캐딜락',
  75: '페라리',
  76: '포드',
  77: '포르쉐',
  78: '폴스타',
  79: '푸조',
  80: '혼다',
};

const findBrandByName = (brands = [], name) => {
  if (!name) return null;
  return (
    brands.find((brand) => isSameBrandName(brand.name, name)) ||
    brands.find((brand) => normalizeBrandKey(brand.name) === normalizeBrandKey(name)) ||
    null
  );
};

export const resolveBrandInfo = (brandId, brands = []) => {
  const exactBrand = brands.find((brand) => brand.id === brandId);
  if (exactBrand) return exactBrand;

  const legacyName = LEGACY_BRAND_ID_TO_NAME[brandId];
  const legacyBrand = findBrandByName(brands, legacyName);
  if (legacyBrand) return legacyBrand;
  if (legacyName) {
    return { id: brandId, name: legacyName, logoUrl: getBrandLogo(legacyName) };
  }
  return null;
};

export const buildBrandNameMap = (brands = []) => {
  const map = new Map();
  brands.forEach((brand) => {
    if (brand?.id != null) map.set(brand.id, brand.name ?? '');
  });
  Object.entries(LEGACY_BRAND_ID_TO_NAME).forEach(([id, name]) => {
    if (!map.has(Number(id))) map.set(Number(id), name);
  });
  return map;
};

const normalizeId = (value) => (value ?? value === 0 ? String(value) : null);
const normalizeTextKey = (value = '') => String(value).replace(/\s+/g, '').toLowerCase();
const normalizePriceKey = (value) => String(normalizePriceValue(value ?? 0) || 0);

const normalizeTrimBasePrice = (trim) => resolveOriginalPriceValue(trim, trim?.representativeFinalPrice ?? 0) || 0;

const normalizeMonthlyFeeValue = (value) => normalizePriceValue(value ?? 0) || 0;

const getTrimRentalFees = (trim) => ({
  prepayment30: normalizeMonthlyFeeValue(trim?.lowestPrepayment30MonthlyFee ?? trim?.lowest_prepayment_30_monthly_fee),
  deposit30: normalizeMonthlyFeeValue(trim?.lowestDeposit30MonthlyFee ?? trim?.lowest_deposit_30_monthly_fee),
  noDeposit: normalizeMonthlyFeeValue(trim?.lowestNoDepositMonthlyFee ?? trim?.lowest_no_deposit_monthly_fee),
  monthly: normalizeMonthlyFeeValue(trim?.monthlyRentalFee ?? trim?.monthly_rental_fee),
});

const hasCompleteRentalPlan = (trim) => {
  const fees = getTrimRentalFees(trim);
  return fees.prepayment30 > 0 && fees.deposit30 > 0 && fees.noDeposit > 0;
};

const hasAnyRentalPlan = (trim) => {
  const fees = getTrimRentalFees(trim);
  return fees.prepayment30 > 0 || fees.deposit30 > 0 || fees.noDeposit > 0 || fees.monthly > 0;
};

const getRentalPriority = (trim) => {
  if (hasCompleteRentalPlan(trim)) return 0;
  if (hasAnyRentalPlan(trim)) return 1;
  return 2;
};

const getRepresentativeRentalMonthly = (trim) => {
  const fees = getTrimRentalFees(trim);
  const completeFees = [fees.prepayment30, fees.deposit30, fees.noDeposit].filter((fee) => fee > 0);
  if (completeFees.length === 3) return Math.min(...completeFees);
  const anyFees = [...completeFees, fees.monthly].filter((fee) => fee > 0);
  return anyFees.length ? Math.min(...anyFees) : Number.MAX_SAFE_INTEGER;
};

const compareTrimsForDisplay = (left, right) => {
  const rentalPriorityDiff = getRentalPriority(left) - getRentalPriority(right);
  if (rentalPriorityDiff !== 0) return rentalPriorityDiff;

  const monthlyDiff = getRepresentativeRentalMonthly(left) - getRepresentativeRentalMonthly(right);
  if (monthlyDiff !== 0) return monthlyDiff;

  const priceDiff = normalizeTrimBasePrice(left) - normalizeTrimBasePrice(right);
  if (priceDiff !== 0) return priceDiff;

  return normalizeTextKey(left?.name ?? left?.trimName ?? '').localeCompare(normalizeTextKey(right?.name ?? right?.trimName ?? ''));
};

const getRepresentativeTrim = (trims = []) =>
  trims.reduce((best, trim) => {
    if (!trim) return best;
    if (!best) return trim;
    return compareTrimsForDisplay(trim, best) < 0 ? trim : best;
  }, null);

const resolveItemDisplayPrice = (item) =>
  resolveOriginalPriceValue(item, item?.representativeFinalPrice ?? item?.trims?.[0]?.basePrice ?? 0) || 0;

const removeSuspiciousImportPrices = (item) => {
  if (!item) return null;

  const trims = Array.isArray(item.trims) ? item.trims : [];
  const validTrims = trims.filter((trim) => shouldKeepTrimForOrigin(trim, true));
  const itemPrice = resolveItemDisplayPrice(item);

  if (!validTrims.length && !isDisplayableImportVehiclePrice(itemPrice)) return null;

  const representativeTrim = getRepresentativeTrim(validTrims) || validTrims[0] || trims[0] || null;
  const representativePrice =
    normalizeTrimBasePrice(representativeTrim) || (isDisplayableImportVehiclePrice(itemPrice) ? itemPrice : 0);

  if (!isDisplayableImportVehiclePrice(representativePrice)) return null;

  return {
    ...item,
    trims: validTrims,
    representativeTrimId:
      representativeTrim?.id ?? representativeTrim?.trimId ?? representativeTrim?.trim_id ?? item.representativeTrimId ?? null,
    representativeTrimName: representativeTrim?.name ?? representativeTrim?.trimName ?? item.representativeTrimName ?? '',
    representativeFinalPrice: representativePrice,
  };
};

const getTrimDuplicateKey = (trim) => {
  const id = normalizeId(trim?.id) || normalizeId(trim?.trimId) || normalizeId(trim?.trim_id);
  if (id) return `id:${id}`;
  const name = normalizeTextKey(trim?.name ?? trim?.trimName ?? '');
  const price = normalizePriceKey(trim?.originalPrice ?? trim?.original_price ?? trim?.basePrice ?? trim?.price);
  const image = normalizeTextKey(trim?.imageUrl ?? trim?.image ?? '');
  return `${name}|${price}|${image}`;
};

const mergeTrimLists = (currentTrims = [], nextTrims = []) => {
  const trimMap = new Map();
  [...currentTrims, ...nextTrims].forEach((trim) => {
    if (!trim) return;
    const key = getTrimDuplicateKey(trim);
    if (!trimMap.has(key)) {
      trimMap.set(key, trim);
      return;
    }
    trimMap.set(key, { ...trimMap.get(key), ...trim });
  });
  return Array.from(trimMap.values()).sort(compareTrimsForDisplay);
};

const getModelDuplicateKey = (item) => {
  if (!item) return null;
  const modelId = normalizeId(item?.modelId) || normalizeId(item?.model_id);
  if (modelId) return `model:${modelId}`;

  const representativeTrimId = normalizeId(item?.representativeTrimId);
  if (representativeTrimId) return `trim:${representativeTrimId}`;

  const brandKey = normalizeId(item?.brandId) || normalizeBrandAliasKey(item?.brandName ?? item?.brand ?? '');
  const lineKey = normalizeId(item?.vehicleLineId) || normalizeTextKey(item?.vehicleLineName ?? '');
  const modelKey = normalizeTextKey(item?.modelName ?? '');
  if (!modelKey) return null;
  return `model:${brandKey}:${lineKey}:${modelKey}`;
};

const dedupeModelItems = (items = [], brandNameMap = new Map()) => {
  const deduped = new Map();
  items.forEach((item) => {
    const duplicateKey = getModelDuplicateKey(item);
    if (!duplicateKey) {
      deduped.set(Symbol(), item);
      return;
    }
    const current = deduped.get(duplicateKey);
    if (!current) {
      deduped.set(duplicateKey, item);
      return;
    }
    const itemHasKnownBrand = brandNameMap.has(item?.brandId);
    const currentHasKnownBrand = brandNameMap.has(current?.brandId);
    if (itemHasKnownBrand && !currentHasKnownBrand) deduped.set(duplicateKey, item);
  });
  return Array.from(deduped.values());
};

const splitItemsByModel = (items = []) =>
  items.flatMap((item) => {
    const trims = Array.isArray(item?.trims) ? item.trims : [];
    if (trims.length <= 1) return [item];

    const grouped = new Map();
    trims.forEach((trim) => {
      const modelId = normalizeId(trim?.modelId) || normalizeId(trim?.model_id) || normalizeId(item?.modelId);
      const modelName = trim?.modelName ?? trim?.model_name ?? item?.modelName ?? item?.vehicleLineName ?? item?.name ?? '';
      const key = modelId ? `model:${modelId}` : `model-name:${normalizeTextKey(modelName)}`;
      if (!grouped.has(key)) {
        grouped.set(key, { modelId: modelId ? Number(modelId) : item?.modelId, modelName, trims: [] });
      }
      grouped.get(key).trims.push(trim);
    });

    if (grouped.size <= 1) {
      const only = Array.from(grouped.values())[0];
      return [
        {
          ...item,
          modelId: only?.modelId ?? item?.modelId,
          modelName: only?.modelName ?? item?.modelName,
          name: only?.modelName ?? item?.modelName ?? item?.name,
          trims,
        },
      ];
    }

    return Array.from(grouped.values()).map((group) => {
      const groupTrims = mergeTrimLists([], group.trims);
      const representativeTrim = getRepresentativeTrim(groupTrims) || groupTrims[0] || null;
      const modelName = group.modelName || item?.modelName || item?.vehicleLineName || item?.name;
      return {
        ...item,
        id: group.modelId ?? `${item?.vehicleLineId ?? 'line'}-${normalizeTextKey(modelName)}`,
        modelId: group.modelId,
        modelName,
        name: modelName,
        trims: groupTrims,
        representativeTrimId: representativeTrim?.id ?? representativeTrim?.trimId ?? item?.representativeTrimId ?? null,
        representativeTrimName: representativeTrim?.name ?? representativeTrim?.trimName ?? item?.representativeTrimName ?? '',
        representativeFinalPrice:
          normalizeTrimBasePrice(representativeTrim) ||
          normalizePriceValue(item?.representativeFinalPrice ?? item?.finalPrice ?? item?.basePrice ?? 0) ||
          0,
      };
    });
  });

const moveDeferredBrandsToEnd = (items = [], brandNameMap = new Map()) => {
  if (!Array.isArray(items) || !items.length) return items;
  const deferredKeys = DEFERRED_IMPORT_BRANDS.map((brand) => normalizeBrandKey(brand));
  const normal = [];
  const deferred = [];

  items.forEach((item) => {
    const brandNameCandidate = item?.brandName || brandNameMap.get(item?.brandId) || item?.brand || '';
    const lineNameCandidate = item?.vehicleLineName ?? item?.name ?? '';
    const isDeferred = [brandNameCandidate, lineNameCandidate].some((candidate) => {
      const key = normalizeBrandKey(candidate);
      return key && deferredKeys.some((deferredKey) => key.includes(deferredKey) || deferredKey.includes(key));
    });
    if (isDeferred) deferred.push(item);
    else normal.push(item);
  });

  return normal.concat(deferred);
};

/**
 * 목록 API 항목을 화면에 쓸 모델 단위 목록으로 바꾼다.
 * brandIdSet 은 현재 탭(국산/수입) 브랜드 id. 브랜드를 고르지 않았을 때 다른 탭 브랜드가 섞이지 않게 거른다.
 */
export const processListItems = (items = [], { carType, brandIdSet = new Set(), brandNameMap = new Map(), selectedBrandId } = {}) => {
  const combined = items
    .filter((item) => {
      if (selectedBrandId || brandIdSet.size === 0) return true;
      return brandIdSet.has(Number(item?.brandId));
    })
    .map((item) => (carType === 'imported' ? removeSuspiciousImportPrices(item) : item))
    .filter(Boolean);
  const deduped = dedupeModelItems(splitItemsByModel(combined), brandNameMap);
  return carType === 'imported' ? moveDeferredBrandsToEnd(deduped, brandNameMap) : deduped;
};

/** 검색어 비교용: 대소문자·공백 무시 */
export const normalizeKeyword = (value = '') => String(value ?? '').replace(/\s+/g, '').toLowerCase();

/** 모델명·차량 라인명·브랜드명 중 하나라도 검색어를 포함하면 true */
export const matchesKeyword = (item, keyword, brandNameMap = new Map()) => {
  const term = normalizeKeyword(keyword);
  if (!term) return true;
  return [item?.modelName, item?.vehicleLineName, item?.name, item?.brandName, brandNameMap.get(item?.brandId)]
    .filter(Boolean)
    .some((value) => normalizeKeyword(value).includes(term));
};

const deriveMonthlyMeta = (trim) => {
  if (!trim) return null;

  const completeRentalMonthlyFee = hasCompleteRentalPlan(trim) ? getRepresentativeRentalMonthly(trim) : 0;
  const monthlyRentalFee = completeRentalMonthlyFee || normalizePriceValue(trim.monthlyRentalFee ?? 0);
  if (!(monthlyRentalFee > 0)) return null;

  const providedDiscounted = normalizePriceValue(trim.discountedMonthlyFee ?? 0);
  const percentField =
    typeof trim.monthlyDiscountPercent === 'number' && Number.isFinite(trim.monthlyDiscountPercent)
      ? Math.round(trim.monthlyDiscountPercent)
      : null;

  let discountedMonthlyFee = providedDiscounted > 0 && providedDiscounted < monthlyRentalFee ? providedDiscounted : null;
  let percentValue = percentField ?? null;

  if (!discountedMonthlyFee && percentValue && percentValue > 0) {
    const estimatedDiscount = Math.round((monthlyRentalFee * percentValue) / 100);
    discountedMonthlyFee = Math.max(monthlyRentalFee - estimatedDiscount, 0);
  }

  let monthlyDiscountAmount = 0;
  if (discountedMonthlyFee && discountedMonthlyFee < monthlyRentalFee) {
    monthlyDiscountAmount = monthlyRentalFee - discountedMonthlyFee;
    if (!percentValue || percentValue <= 0) {
      percentValue = Math.round((monthlyDiscountAmount * 100) / monthlyRentalFee);
    }
  } else {
    discountedMonthlyFee = null;
  }

  return {
    monthlyRentalFee,
    discountedMonthlyFee,
    monthlyDiscountPercentValue: percentValue && percentValue > 0 ? percentValue : 0,
    monthlyDiscountAmount,
  };
};

const selectBestEntry = (entries = [], { isEligible, getValue, getAmount }) =>
  entries.reduce((best, entry) => {
    if (typeof isEligible === 'function' && !isEligible(entry)) return best;
    if (!best) return entry;
    const currentValue = getValue(entry);
    const bestValue = getValue(best);
    if (currentValue > bestValue) return entry;
    if (currentValue === bestValue && getAmount(entry) > getAmount(best)) return entry;
    return best;
  }, null);

const computeTrimBasePrice = (trim, vehicleLine) =>
  normalizePriceValue(
    trim?.originalPrice ?? trim?.original_price ?? trim?.basePrice ?? vehicleLine?.basePrice ?? trim?.price ?? vehicleLine?.price ?? 0,
  ) || 0;

// 수입차: 백엔드가 모델 단위로 계산해 준 대표 트림·할인 정보를 그대로 쓴다.
const buildImportedCar = (vehicleLine, trims) => {
  const firstTrim = trims[0] || {};
  const basePrice =
    normalizePriceValue(
      firstTrim.originalPrice ?? firstTrim.original_price ?? firstTrim.basePrice ?? vehicleLine.basePrice ?? vehicleLine.price ?? 0,
    ) || 0;
  const representativeFinalPrice = normalizePriceValue(vehicleLine.representativeFinalPrice ?? vehicleLine.finalPrice ?? 0) || null;
  const discountAmount = normalizePriceValue(vehicleLine.representativeDiscountAmount ?? 0);
  // removeSuspiciousImportPrices 가 representativeFinalPrice 를 정상가로 덮어쓰므로, 할인이 있으면 정상가 - 할인액으로 계산한다.
  const finalPrice = discountAmount > 0 && basePrice > discountAmount ? basePrice - discountAmount : representativeFinalPrice ?? basePrice;
  return {
    representativeTrimId: vehicleLine.representativeTrimId ?? firstTrim.id ?? firstTrim.trimId ?? firstTrim.trim_id ?? null,
    representativeTrimName: vehicleLine.representativeTrimName || firstTrim.name || '',
    id: vehicleLine.modelId ?? vehicleLine.vehicleLineId,
    basePrice,
    finalPrice,
    discountAmount,
    discountPercent: normalizePriceValue(vehicleLine.representativeDiscountPercent ?? 0),
  };
};

// 국산차: 할인율(월 렌탈료 → 차량가 순)이 가장 높은 트림을 대표로, 차량가는 라인 내 정상 최저가로 보여준다.
const buildDomesticCar = (vehicleLine, trims) => {
  const candidateTrims = trims.map((trim) => {
    const basePrice = computeTrimBasePrice(trim, vehicleLine);
    const monthlyMeta = deriveMonthlyMeta(trim);
    const priceMeta = resolveDiscountPricing({ basePrice, trim, vehicleLine });
    return {
      trim,
      basePrice,
      monthlyMeta,
      priceMeta,
      hasMonthly: Boolean(monthlyMeta && basePrice > 0),
      hasDiscount:
        (monthlyMeta?.monthlyDiscountPercentValue ?? 0) > 0 ||
        (priceMeta?.discountPercent ?? 0) > 0 ||
        (priceMeta?.discountAmount ?? 0) > 0,
    };
  });

  const bestMonthlyEntry = selectBestEntry(candidateTrims, {
    isEligible: (entry) => Boolean(entry?.monthlyMeta && entry.basePrice > 0),
    getValue: (entry) => entry?.monthlyMeta?.monthlyDiscountPercentValue ?? 0,
    getAmount: (entry) => entry?.monthlyMeta?.monthlyDiscountAmount ?? 0,
  });
  const bestPriceEntry = selectBestEntry(candidateTrims, {
    isEligible: (entry) => Boolean(entry?.priceMeta && entry.basePrice > 0),
    getValue: (entry) => entry?.priceMeta?.discountPercent ?? 0,
    getAmount: (entry) => entry?.priceMeta?.discountAmount ?? 0,
  });
  const fallbackMonthlyEntry = candidateTrims.find((entry) => entry.hasMonthly && entry.basePrice > 0);
  const fallbackDiscountEntry = candidateTrims.find((entry) => entry.hasDiscount && entry.basePrice > 0);
  const lowestBaseEntry = (minimum) =>
    candidateTrims.reduce((best, entry) => {
      if (!entry || entry.basePrice <= 0 || entry.basePrice < minimum) return best;
      return !best || entry.basePrice < best.basePrice ? entry : best;
    }, null);
  const fallbackLowestBaseEntry = lowestBaseEntry(0);
  // 100만 원 미만은 차량가가 아니라 월 렌탈료가 잘못 들어온 값으로 본다.
  const lowestReasonableBaseEntry = lowestBaseEntry(1_000_000);

  const displayEntry =
    bestMonthlyEntry || bestPriceEntry || fallbackMonthlyEntry || fallbackDiscountEntry || fallbackLowestBaseEntry || candidateTrims[0] || null;
  if (!displayEntry) return null;

  const representativeTrim = displayEntry.trim || trims[0] || null;
  let basePrice = lowestReasonableBaseEntry?.basePrice || displayEntry.basePrice || 0;
  if ((!basePrice || basePrice <= 0) && representativeTrim) {
    basePrice = computeTrimBasePrice(representativeTrim, vehicleLine);
  }
  const priceMeta = displayEntry.priceMeta || { finalPrice: basePrice, discountAmount: 0, discountPercent: 0 };
  const representativeTrimId =
    representativeTrim?.id ?? representativeTrim?.trimId ?? representativeTrim?.trim_id ?? vehicleLine.representativeTrimId ?? null;

  return {
    representativeTrimId,
    representativeTrimName: representativeTrim?.name ?? representativeTrim?.trimName ?? '',
    id:
      representativeTrimId ??
      `${vehicleLine.vehicleLineId ?? 'line'}-${normalizeTextKey(vehicleLine.modelName ?? vehicleLine.vehicleLineName ?? '')}`,
    basePrice,
    finalPrice: priceMeta.finalPrice ?? basePrice,
    discountAmount: priceMeta.discountAmount ?? 0,
    discountPercent: priceMeta.discountPercent ?? 0,
  };
};

/** 모델 단위 항목 → 카드 한 장에 필요한 값 */
export const buildCarCard = (vehicleLine, carType) => {
  const trims = Array.isArray(vehicleLine?.trims) ? vehicleLine.trims : [];
  if (!trims.length) return null;
  const priced = carType === 'imported' ? buildImportedCar(vehicleLine, trims) : buildDomesticCar(vehicleLine, trims);
  if (!priced) return null;
  // 월 렌탈료 3종은 기존 카드처럼 정렬된 첫 번째 트림 기준
  const fees = getTrimRentalFees(trims[0]);
  return {
    ...priced,
    modelId: vehicleLine.modelId,
    vehicleLineId: vehicleLine.vehicleLineId,
    vehicleLineName: vehicleLine.vehicleLineName,
    vehicleLineDescription: vehicleLine.vehicleLineDescription,
    modelName: vehicleLine.modelName,
    brandId: vehicleLine.brandId,
    imageUrl: vehicleLine.imageUrl || '',
    name: vehicleLine.modelName || vehicleLine.vehicleLineName,
    trims,
    monthlyFees: { prepayment30: fees.prepayment30, deposit30: fees.deposit30, noDeposit: fees.noDeposit },
  };
};

/** 카드 클릭 시 이동할 상세 주소. 트림이 있으면 트림 상세, 없으면 차량 라인 상세. */
export const resolveDetailPath = (car) => {
  if (!car) return null;
  const trims = Array.isArray(car.trims) ? car.trims : [];
  const trimId =
    normalizeId(car.representativeTrimId) ||
    normalizeId(car.trimId) ||
    normalizeId(car.trim_id) ||
    normalizeId(trims[0]?.id) ||
    normalizeId(trims[0]?.trimId) ||
    normalizeId(trims[0]?.trim_id);
  if (trimId) return `/car-detail/trim/${trimId}`;
  const vehicleLineId = normalizeId(car.vehicleLineId) || normalizeId(car.vehicle_line_id) || normalizeId(car.id);
  return vehicleLineId ? `/car-detail/car/${vehicleLineId}` : null;
};
