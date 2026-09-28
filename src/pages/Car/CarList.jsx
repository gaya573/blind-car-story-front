import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import './CarList.css';
import Breadcrumb from '../../components/Breadcrumb';
import TabNav from '../../components/navigation/TabNav';
import PromotionCard from '../../components/PromotionCard';
import ImportedPromotionCard from '../../components/ImportedPromotionCard';
import CarManufacturerFilter from '../../components/CarManufacturerFilter';
import { useCarBrandsQuery, useCarListInfiniteQueryV3 } from '../../hooks/queries/carQueries';
import { contentAPI } from '../../services/contentApi';
import { coalitionAPI, COALITION_PAGE_TYPE } from '../../services/coalitionApi';
import {
  PRIMARY_DOMESTIC_BRANDS,
  PRIMARY_DOMESTIC_BRAND_NAMES,
  FALLBACK_IMPORT_BRANDS,
  getBrandLogo,
} from '../../config/brandLogos';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import { getPageSeo } from '../../config/seoConfig';
import {
  normalizePriceValue,
  resolveOriginalPriceValue,
  resolveDiscountPricing,
} from '../../utils/priceUtils';
import {
  isDisplayableImportVehiclePrice,
  shouldKeepTrimForOrigin,
} from '../../utils/vehiclePriceGuards';

const PAGE_SIZE = 12;
const CHUNK_SIZE = 6;
const DEFERRED_IMPORT_BRANDS = ['폴스타', 'polestar', 'BYD', 'byd'];

const normalizeBrandKey = (value = '') =>
  String(value).replace(/\s+/g, '').toLowerCase();

const normalizeBrandAliasKey = (value = '') => {
  const key = normalizeBrandKey(value);
  if (['kgm', 'kg모빌리티', 'kgmobility', '쌍용', '쌍용자동차'].includes(key)) {
    return 'kgm';
  }
  if (['르노코리아', '르노삼성'].includes(key)) {
    return '르노코리아';
  }
  if (['쉐보레', '한국지엠', 'chevrolet'].includes(key)) {
    return '쉐보레';
  }
  if (['toyota', '도요타', '토요타'].includes(key)) {
    return '토요타';
  }
  if (['mercedesbenz', 'mercedes-benz', '메르세데스벤츠', '메르세데스-벤츠', '벤츠'].includes(key)) {
    return '벤츠';
  }
  if (['volkswagen', '폭스바겐'].includes(key)) {
    return '폭스바겐';
  }
  return key;
};

const isSameBrandName = (left, right) =>
  normalizeBrandAliasKey(left) === normalizeBrandAliasKey(right);

const LEGACY_BRAND_ID_TO_NAME = {
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

const resolveBrandInfo = (brandId, brands = []) => {
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

const normalizeVehicleLineGroupName = (value = '') =>
  normalizeTextKey(value)
    .replace(/기본형$/g, '')
    .replace(/기본$/g, '');

const normalizeId = (value) => (value ?? value === 0 ? String(value) : null);
const normalizeTextKey = (value = '') => String(value).replace(/\s+/g, '').toLowerCase();
const normalizePriceKey = (value) => String(normalizePriceValue(value ?? 0) || 0);

const getVehicleLineDuplicateKey = (item) => {
  if (!item) return null;
  const name = normalizeVehicleLineGroupName(item.vehicleLineName ?? item.name ?? '');
  const trimName = normalizeTextKey(item.representativeTrimName ?? item.trimName ?? '');
  const price = normalizePriceKey(
    item.representativeOriginalPrice ??
      item.originalPrice ??
      item.original_price ??
      item.representativeFinalPrice ??
      item.finalPrice ??
      item.basePrice ??
      item.price ??
      item.trims?.[0]?.originalPrice ??
      item.trims?.[0]?.original_price ??
      item.trims?.[0]?.basePrice,
  );
  const image = normalizeTextKey(item.imageUrl ?? item.image ?? item.trims?.[0]?.imageUrl ?? '');
  if (!name || !trimName) return null;
  return `${name}|${trimName}|${price}|${image}`;
};

const normalizeTrimBasePrice = (trim) =>
  resolveOriginalPriceValue(trim, trim?.representativeFinalPrice ?? 0) || 0;

const normalizeMonthlyFeeValue = (value) => normalizePriceValue(value ?? 0) || 0;

const getTrimRentalFees = (trim) => ({
  prepayment30: normalizeMonthlyFeeValue(
    trim?.lowestPrepayment30MonthlyFee ?? trim?.lowest_prepayment_30_monthly_fee,
  ),
  deposit30: normalizeMonthlyFeeValue(
    trim?.lowestDeposit30MonthlyFee ?? trim?.lowest_deposit_30_monthly_fee,
  ),
  noDeposit: normalizeMonthlyFeeValue(
    trim?.lowestNoDepositMonthlyFee ?? trim?.lowest_no_deposit_monthly_fee,
  ),
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

  return normalizeTextKey(left?.name ?? left?.trimName ?? '').localeCompare(
    normalizeTextKey(right?.name ?? right?.trimName ?? ''),
  );
};

const resolveItemDisplayPrice = (item) =>
  resolveOriginalPriceValue(item, item?.representativeFinalPrice ?? item?.trims?.[0]?.basePrice ?? 0) || 0;

const removeSuspiciousImportPrices = (item) => {
  if (!item) return null;

  const trims = Array.isArray(item.trims) ? item.trims : [];
  const validTrims = trims.filter((trim) => shouldKeepTrimForOrigin(trim, true));
  const itemPrice = resolveItemDisplayPrice(item);

  if (!validTrims.length && !isDisplayableImportVehiclePrice(itemPrice)) {
    return null;
  }

  const representativeTrim = getRepresentativeTrim(validTrims) || validTrims[0] || trims[0] || null;
  const representativePrice =
    normalizeTrimBasePrice(representativeTrim) ||
    (isDisplayableImportVehiclePrice(itemPrice) ? itemPrice : 0);

  if (!isDisplayableImportVehiclePrice(representativePrice)) {
    return null;
  }

  return {
    ...item,
    trims: validTrims,
    representativeTrimId:
      representativeTrim?.id ??
      representativeTrim?.trimId ??
      representativeTrim?.trim_id ??
      item.representativeTrimId ??
      null,
    representativeTrimName:
      representativeTrim?.name ??
      representativeTrim?.trimName ??
      item.representativeTrimName ??
      '',
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
    trimMap.set(key, {
      ...trimMap.get(key),
      ...trim,
    });
  });

  return Array.from(trimMap.values()).sort(compareTrimsForDisplay);
};

const isVehicleLineRepresentative = (item) =>
  normalizeTextKey(item?.modelName ?? '') === normalizeTextKey(item?.vehicleLineName ?? item?.name ?? '');

// 서버 데이터에 남아 있는 옛 via.placeholder URL과 로컬 대체 이미지를 모두 "실제 사진 아님"으로 본다.
const isPlaceholderImage = (url = '') => url.includes('via.placeholder') || url.startsWith('/placeholder/');

const pickVehicleLineImage = (current, next) => {
  const currentImage = current?.imageUrl || current?.image || '';
  const nextImage = next?.imageUrl || next?.image || '';
  const currentIsPlaceholder = isPlaceholderImage(currentImage);
  const nextIsPlaceholder = isPlaceholderImage(nextImage);

  if (!currentImage || currentIsPlaceholder) {
    return nextImage || currentImage;
  }
  if (nextImage && !nextIsPlaceholder && isVehicleLineRepresentative(next) && !isVehicleLineRepresentative(current)) {
    return nextImage;
  }
  return currentImage;
};

const buildVehicleLineGroupKey = (item) => {
  const vehicleLineId = normalizeId(item?.vehicleLineId) || normalizeId(item?.vehicle_line_id) || normalizeId(item?.id);
  if (vehicleLineId) return `line:${vehicleLineId}`;

  const brandKey = normalizeId(item?.brandId) || normalizeBrandAliasKey(item?.brandName ?? item?.brand ?? '');
  const lineKey = normalizeVehicleLineGroupName(item?.vehicleLineName ?? item?.name ?? item?.modelName ?? '');
  if (!lineKey) return null;
  return `line-name:${brandKey}:${lineKey}`;
};

const getRepresentativeTrim = (trims = []) =>
  trims.reduce((best, trim) => {
    if (!trim) return best;
    if (!best) return trim;
    return compareTrimsForDisplay(trim, best) < 0 ? trim : best;
  }, null);

const mergeVehicleLineGroups = (items = [], brandNameMap = new Map()) => {
  const grouped = new Map();

  items.forEach((item) => {
    const groupKey = buildVehicleLineGroupKey(item);
    if (!groupKey) {
      grouped.set(Symbol(), item);
      return;
    }

    const current = grouped.get(groupKey);
    if (!current) {
      const trims = mergeTrimLists([], Array.isArray(item.trims) ? item.trims : []);
      const representativeTrim = getRepresentativeTrim(trims) || item.trims?.[0] || null;
      grouped.set(groupKey, {
        ...item,
        modelName: item.vehicleLineName || item.modelName,
        trims,
        representativeTrimId: representativeTrim?.id ?? representativeTrim?.trimId ?? item.representativeTrimId ?? null,
        representativeTrimName: representativeTrim?.name ?? representativeTrim?.trimName ?? item.representativeTrimName ?? '',
        representativeFinalPrice:
          normalizeTrimBasePrice(representativeTrim) ||
          normalizePriceValue(item.representativeFinalPrice ?? item.finalPrice ?? item.basePrice ?? 0) ||
          0,
      });
      return;
    }

    const trims = mergeTrimLists(current.trims, Array.isArray(item.trims) ? item.trims : []);
    const representativeTrim = getRepresentativeTrim(trims) || trims[0] || null;
    const itemHasKnownBrand = brandNameMap.has(item?.brandId);
    const currentHasKnownBrand = brandNameMap.has(current?.brandId);
    const preferredBrandFields = itemHasKnownBrand && !currentHasKnownBrand ? item : current;

    grouped.set(groupKey, {
      ...current,
      brandId: preferredBrandFields.brandId,
      vehicleLineId: current.vehicleLineId ?? item.vehicleLineId,
      vehicleLineName: current.vehicleLineName || item.vehicleLineName || item.name,
      vehicleLineDescription: current.vehicleLineDescription || item.vehicleLineDescription,
      modelName: current.vehicleLineName || item.vehicleLineName || current.modelName || item.modelName,
      priority: current.priority ?? item.priority,
      imageUrl: pickVehicleLineImage(current, item),
      trims,
      representativeTrimId: representativeTrim?.id ?? representativeTrim?.trimId ?? current.representativeTrimId ?? null,
      representativeTrimName: representativeTrim?.name ?? representativeTrim?.trimName ?? current.representativeTrimName ?? '',
      representativeFinalPrice:
        normalizeTrimBasePrice(representativeTrim) ||
        normalizePriceValue(current.representativeFinalPrice ?? item.representativeFinalPrice ?? 0) ||
        0,
      representativeDiscountPercent: Math.max(
        normalizePriceValue(current.representativeDiscountPercent ?? 0) || 0,
        normalizePriceValue(item.representativeDiscountPercent ?? 0) || 0,
      ),
      representativeDiscountAmount: Math.max(
        normalizePriceValue(current.representativeDiscountAmount ?? 0) || 0,
        normalizePriceValue(item.representativeDiscountAmount ?? 0) || 0,
      ),
    });
  });

  return Array.from(grouped.values());
};

const dedupeVehicleLineItems = (items = [], brandNameMap = new Map()) => {
  const deduped = new Map();

  items.forEach((item) => {
    const duplicateKey = getVehicleLineDuplicateKey(item);
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
    if (itemHasKnownBrand && !currentHasKnownBrand) {
      deduped.set(duplicateKey, item);
      return;
    }

    if (itemHasKnownBrand === currentHasKnownBrand) {
      const itemId = Number(item?.vehicleLineId ?? item?.id ?? 0);
      const currentId = Number(current?.vehicleLineId ?? current?.id ?? 0);
      if (itemId > currentId) {
        deduped.set(duplicateKey, item);
      }
    }
  });

  return Array.from(deduped.values());
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
    if (itemHasKnownBrand && !currentHasKnownBrand) {
      deduped.set(duplicateKey, item);
    }
  });

  return Array.from(deduped.values());
};

const splitItemsByModel = (items = []) =>
  items.flatMap((item) => {
    const trims = Array.isArray(item?.trims) ? item.trims : [];
    if (trims.length <= 1) {
      return [item];
    }

    const grouped = new Map();
    trims.forEach((trim) => {
      const modelId = normalizeId(trim?.modelId) || normalizeId(trim?.model_id) || normalizeId(item?.modelId);
      const modelName = trim?.modelName ?? trim?.model_name ?? item?.modelName ?? item?.vehicleLineName ?? item?.name ?? '';
      const key = modelId ? `model:${modelId}` : `model-name:${normalizeTextKey(modelName)}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          modelId: modelId ? Number(modelId) : item?.modelId,
          modelName,
          trims: [],
        });
      }
      grouped.get(key).trims.push(trim);
    });

    if (grouped.size <= 1) {
      const only = Array.from(grouped.values())[0];
      return [{
        ...item,
        modelId: only?.modelId ?? item?.modelId,
        modelName: only?.modelName ?? item?.modelName,
        name: only?.modelName ?? item?.modelName ?? item?.name,
        trims,
      }];
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

const resolveTrimIdFromItem = (item) => {
  if (!item) return null;
  const directTrimId =
    normalizeId(item.representativeTrimId) ||
    normalizeId(item.trimId) ||
    normalizeId(item.trim_id) ||
    normalizeId(item.representativeTrim?.id) ||
    normalizeId(item.trim?.id);
  if (directTrimId) return directTrimId;

  const trims = Array.isArray(item.trims) ? item.trims : [];
  const firstTrim = trims[0] || null;
  return (
    normalizeId(firstTrim?.id) ||
    normalizeId(firstTrim?.trimId) ||
    normalizeId(firstTrim?.trim_id)
  );
};

const resolveVehicleLineIdFromItem = (item) =>
  normalizeId(item?.vehicleLineId) ||
  normalizeId(item?.vehicle_line_id) ||
  normalizeId(item?.id);

const moveDeferredBrandsToEnd = (items = [], brandNameMap = new Map()) => {
  if (!Array.isArray(items) || !items.length) return items;
  const deferredKeys = DEFERRED_IMPORT_BRANDS.map((brand) => normalizeBrandKey(brand));
  const normal = [];
  const deferred = [];

  items.forEach((item) => {
    const brandNameCandidate =
      item?.brandName ||
      brandNameMap.get(item?.brandId) ||
      item?.brand ||
      '';
    const lineNameCandidate = item?.vehicleLineName ?? item?.name ?? '';
    const candidates = [brandNameCandidate, lineNameCandidate];
    const isDeferred = candidates.some((candidate) => {
      const key = normalizeBrandKey(candidate);
      return key && deferredKeys.some((deferredKey) => key.includes(deferredKey) || deferredKey.includes(key));
    });
    if (isDeferred) {
      deferred.push(item);
    } else {
      normal.push(item);
    }
  });

  return normal.concat(deferred);
};

const getDisplayTrimFromVehicleLine = (item) =>
  getRepresentativeTrim(Array.isArray(item?.trims) ? item.trims : []) ||
  item?.trim ||
  null;

const sortVehicleLinesByRentalPriority = (items = []) =>
  items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const leftTrim = getDisplayTrimFromVehicleLine(left.item);
      const rightTrim = getDisplayTrimFromVehicleLine(right.item);

      const rentalPriorityDiff = getRentalPriority(leftTrim) - getRentalPriority(rightTrim);
      if (rentalPriorityDiff !== 0) return rentalPriorityDiff;

      const monthlyDiff = getRepresentativeRentalMonthly(leftTrim) - getRepresentativeRentalMonthly(rightTrim);
      if (monthlyDiff !== 0) return monthlyDiff;

      return left.index - right.index;
    })
    .map(({ item }) => item);

const deriveMonthlyMeta = (trim) => {
  if (!trim) return null;

  const completeRentalMonthlyFee = hasCompleteRentalPlan(trim)
    ? getRepresentativeRentalMonthly(trim)
    : 0;
  const monthlyRentalFee = completeRentalMonthlyFee || normalizePriceValue(trim.monthlyRentalFee ?? 0);
  if (!(monthlyRentalFee > 0)) {
    return null;
  }

  const providedDiscounted = normalizePriceValue(trim.discountedMonthlyFee ?? 0);
  const percentField =
    typeof trim.monthlyDiscountPercent === 'number' && Number.isFinite(trim.monthlyDiscountPercent)
      ? Math.round(trim.monthlyDiscountPercent)
      : null;

  let discountedMonthlyFee =
    providedDiscounted > 0 && providedDiscounted < monthlyRentalFee ? providedDiscounted : null;
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

  const normalizedPercentValue = percentValue && percentValue > 0 ? percentValue : 0;

  return {
    monthlyRentalFee,
    discountedMonthlyFee,
    monthlyDiscountPercent: normalizedPercentValue > 0 ? normalizedPercentValue : null,
    monthlyDiscountPercentValue: normalizedPercentValue,
    monthlyDiscountAmount,
    hasDedicatedMonthly: true,
  };
};

const selectBestEntry = (entries = [], { isEligible, getValue, getAmount }) => {
  return entries.reduce((best, entry) => {
    if (typeof isEligible === 'function' && !isEligible(entry)) {
      return best;
    }

    if (!best) {
      return entry;
    }

    const currentValue = typeof getValue === 'function' ? getValue(entry) : 0;
    const bestValue = typeof getValue === 'function' ? getValue(best) : 0;

    if (currentValue > bestValue) {
      return entry;
    }

    if (currentValue === bestValue) {
      const currentAmount = typeof getAmount === 'function' ? getAmount(entry) : 0;
      const bestAmount = typeof getAmount === 'function' ? getAmount(best) : 0;
      if (currentAmount > bestAmount) {
        return entry;
      }
    }

    return best;
  }, null);
};

const CarList = () => {
  const { carType } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialBrandId = searchParams.get('brand');

  const [selectedBrandId, setSelectedBrandId] = useState(initialBrandId ? Number(initialBrandId) : undefined);
  const [selectedBrandName, setSelectedBrandName] = useState('전체');
  
  const loadMoreRef = useRef(null);
  const prefetchingRef = useRef(false);
  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE);
  const previousCarTypeRef = useRef(carType);

  useEffect(() => {
    // URL 쿼리(brand 등)는 첫 진입/새로고침 때 유지하고,
    // 실제로 국산/수입 탭을 전환할 때만 필터를 초기화한다.
    if (previousCarTypeRef.current === carType) {
      return;
    }

    previousCarTypeRef.current = carType;
    setSelectedBrandId(undefined);
    setSelectedBrandName('전체');
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [carType]);

  // carType에 따라 브랜드 필터링 (국산차: "KR", 수입차: "수입")
  const brandCountryFilter = useMemo(() => {
    if (carType === 'domestic') return 'KR';
    if (carType === 'imported') return '수입';
    return null;
  }, [carType]);

  const { data: brandsData } = useCarBrandsQuery(brandCountryFilter);

  const manufacturers = useMemo(() => {
    if (carType !== 'domestic') {
      // API에서 온 브랜드 데이터를 맵으로 변환
      const brandMap = new Map();
      (brandsData || []).forEach((brand) => {
        brandMap.set(normalizeBrandAliasKey(brand.name), brand);
      });

      // FALLBACK_IMPORT_BRANDS 순서대로 정렬하여 보장
      const orderedBrands = FALLBACK_IMPORT_BRANDS.map((fallback) => {
        const apiBrand = brandMap.get(normalizeBrandAliasKey(fallback.name));
        if (apiBrand) {
          return {
            name: fallback.name,
            image: apiBrand.logoUrl || fallback.image || getBrandLogo(apiBrand.name) || null,
            id: apiBrand.id,
          };
        }
        return {
          name: fallback.name,
          image: fallback.image || null,
          id: undefined,
        };
      });

      // API에 있지만 FALLBACK에 없는 브랜드 추가
      (brandsData || []).forEach((brand) => {
        if (!FALLBACK_IMPORT_BRANDS.some((fb) => isSameBrandName(fb.name, brand.name))) {
          orderedBrands.push({
            name: brand.name,
            image: brand.logoUrl || getBrandLogo(brand.name) || null,
            id: brand.id,
          });
        }
      });

      return [
        { name: '전체', image: null, id: undefined },
        ...orderedBrands,
      ];
    }

    const brandMap = new Map();
    (brandsData || []).forEach((brand) => {
      brandMap.set(normalizeBrandAliasKey(brand.name), brand);
    });

    const domesticWithFallback = PRIMARY_DOMESTIC_BRANDS.map((item) => {
      const matched = brandMap.get(normalizeBrandAliasKey(item.name));
      return {
        name: item.name,
        image: item.image,
        id: matched?.id,
      };
    });

    const remaining = (brandsData || [])
      .filter((brand) => !PRIMARY_DOMESTIC_BRAND_NAMES.some((name) => isSameBrandName(name, brand.name)))
      .map((brand) => ({
        name: brand.name,
        image: brand.logoUrl || getBrandLogo(brand.name),
        id: brand.id,
      }));

    const slots = [...domesticWithFallback, ...remaining];

    return [
      { name: '전체', image: null, id: undefined },
      ...slots.slice(0, 6),
    ];
  }, [brandsData, carType]);

  // 브랜드 목록이 변경되면 선택된 브랜드가 새 목록에 있는지 확인
  useEffect(() => {
    if (selectedBrandId && brandsData?.length) {
      const brandExists = brandsData.some((brand) => brand.id === selectedBrandId);
      if (!brandExists) {
        // 선택된 브랜드가 새 목록에 없으면 초기화
        setSelectedBrandId(undefined);
        setSelectedBrandName('전체');
      }
    }
  }, [brandsData, selectedBrandId]);

  // URL 파라미터에서 브랜드 ID 초기화 (carType 변경 시)
  useEffect(() => {
    if (initialBrandId && brandsData?.length) {
      const brand = brandsData.find((item) => item.id === Number(initialBrandId));
      if (brand) {
        const displayBrand =
          carType === 'domestic'
            ? PRIMARY_DOMESTIC_BRANDS.find((item) => isSameBrandName(item.name, brand.name))
            : null;
        setSelectedBrandId(Number(initialBrandId));
        setSelectedBrandName(displayBrand?.name ?? brand.name);
      } else {
        setSelectedBrandId(undefined);
        setSelectedBrandName('전체');
      }
    } else if (!initialBrandId) {
      setSelectedBrandId(undefined);
      setSelectedBrandName('전체');
    }
  }, [brandsData, initialBrandId]);

  const effectiveCarType = carType === 'domestic' ? '국산' : carType === 'imported' ? '수입' : undefined;

  // 배너 데이터 가져오기 - 제휴사 어드민의 국산차/수입차 목록 배너
  const bannerType = carType === 'domestic'
    ? COALITION_PAGE_TYPE.DOMESTIC
    : COALITION_PAGE_TYPE.IMPORTED;
  const { data: bannerData } = useQuery({
    queryKey: ['coalition', 'banners', bannerType, 'carlist'],
    queryFn: () => coalitionAPI.getBanners(bannerType),
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

  const listQueryParams = useMemo(
    () => ({
      brandId: selectedBrandId,
      carType: effectiveCarType,  // 항상 수입/국산 구분 유지
      limit: PAGE_SIZE,
      sort: 'percent_desc',
    }),
    [selectedBrandId, effectiveCarType],
  );

  useEffect(() => {
    setVisibleCount(CHUNK_SIZE);
    prefetchingRef.current = false;
  }, [listQueryParams]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    isError,
  } = useCarListInfiniteQueryV3(listQueryParams);

  // 모든 페이지 데이터를 하나의 배열로 합치기 (차량 라인 기준)
  const brandNameMap = useMemo(() => {
    const map = new Map();
    (brandsData || []).forEach((brand) => {
      if (brand?.id != null) {
        map.set(brand.id, brand.name ?? '');
      }
    });
    Object.entries(LEGACY_BRAND_ID_TO_NAME).forEach(([id, name]) => {
      if (!map.has(Number(id))) {
        map.set(Number(id), name);
      }
    });
    return map;
  }, [brandsData]);

  const currentBrandIdSet = useMemo(() => {
    const ids = new Set();
    (brandsData || []).forEach((brand) => {
      if (brand?.id != null) {
        ids.add(Number(brand.id));
      }
    });
    return ids;
  }, [brandsData]);

  const vehicleLineItems = useMemo(() => {
    if (!data?.pages) return [];
    const combined = data.pages
      .flatMap((page) => page.items || [])
      .filter((item) => {
        if (selectedBrandId || currentBrandIdSet.size === 0) return true;
        return currentBrandIdSet.has(Number(item?.brandId));
      })
      .map((item) => (carType === 'imported' ? removeSuspiciousImportPrices(item) : item))
      .filter(Boolean);
    const modelSplitItems = splitItemsByModel(combined);
    const dedupedModelItems = dedupeModelItems(modelSplitItems, brandNameMap);
    if (carType === 'imported') {
      return moveDeferredBrandsToEnd(dedupedModelItems, brandNameMap);
    }
    return dedupedModelItems;
  }, [data, carType, brandNameMap, currentBrandIdSet, selectedBrandId]);

  const visibleVehicleLineItems = useMemo(() => {
    if (!vehicleLineItems?.length) {
      return [];
    }
    const nextCount = Math.min(visibleCount, vehicleLineItems.length);
    return vehicleLineItems.slice(0, nextCount);
  }, [vehicleLineItems, visibleCount]);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || prefetchingRef.current) {
      return;
    }
    if (!vehicleLineItems.length) {
      prefetchingRef.current = true;
      fetchNextPage()
        .catch(() => {})
        .finally(() => {
          prefetchingRef.current = false;
        });
      return;
    }
    if (visibleCount + CHUNK_SIZE >= vehicleLineItems.length) {
      prefetchingRef.current = true;
      fetchNextPage()
        .catch(() => {})
        .finally(() => {
          prefetchingRef.current = false;
        });
    }
  }, [visibleCount, vehicleLineItems.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const breadcrumbItems = useMemo(
    () => [
      { label: '홈', link: '/' },
      { label: `${carType === 'domestic' ? '국산차' : '수입차'} 견적내기` },
    ],
    [carType],
  );

  const tabs = useMemo(
    () => [
      { label: '국산차', path: '/carlist/domestic' },
      { label: '수입차', path: '/carlist/imported' },
    ],
    [],
  );


  const syncParams = (next) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || value === '전체') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    params.delete('page'); // 무한 스크롤이므로 페이지 파라미터 제거
    setSearchParams(params, { replace: true });
  };

  const handleSelectManufacturer = (manufacturer) => {
    const value = manufacturer?.name ?? '전체';
    if (value === '전체') {
      setSelectedBrandId(undefined);
      setSelectedBrandName('전체');
      syncParams({ brand: undefined }, true);
      return;
    }
    const fallbackBrand =
      brandsData?.find((brand) => isSameBrandName(brand.name, value)) ||
      brandsData?.find((brand) => {
        if (value === 'KG모빌리티') return brand.name.toLowerCase().includes('kg');
        if (value === '쉐보레') return brand.name.includes('쉐보레') || brand.name.includes('한국지엠');
        if (value === '르노코리아') return brand.name.replace(/\s+/g, '') === '르노코리아';
        return false;
      });

    const brandId = manufacturer?.id ?? fallbackBrand?.id;
    setSelectedBrandId(brandId);
    setSelectedBrandName(value); // 선택된 브랜드 이름 업데이트
    syncParams({ brand: brandId }, true);
  };


  // Intersection Observer로 무한 스크롤 구현
  const handleObserver = useCallback(
    (entries) => {
      const [target] = entries;
      if (!target?.isIntersecting) {
        return;
      }

      const totalLoaded = vehicleLineItems.length;
      if (visibleCount < totalLoaded) {
        setVisibleCount((prev) => Math.min(prev + CHUNK_SIZE, totalLoaded));
        return;
      }

      if (hasNextPage && !isFetchingNextPage && !prefetchingRef.current) {
        prefetchingRef.current = true;
        fetchNextPage()
          .catch(() => {})
          .finally(() => {
            prefetchingRef.current = false;
          });
      }
    },
    [vehicleLineItems.length, visibleCount, hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    const option = {
      threshold: 0,
      rootMargin: '100px',
    };

    const observer = new IntersectionObserver(handleObserver, option);
    if (element) observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [handleObserver]);

  const isEmpty = !isLoading && vehicleLineItems.length === 0;

  // 차량 라인 기준으로 카드 표시
  const carItems = useMemo(() => {
    if (!visibleVehicleLineItems || visibleVehicleLineItems.length === 0) return [];

    const isImportedListLocal = carType === 'imported';

    const getPriorityFromLine = (vehicleLine) =>
      vehicleLine?.priority ??
      vehicleLine?.displayOrder ??
      vehicleLine?.order ??
      vehicleLine?.sortOrder ??
      0;

    const computeTrimBasePrice = (trim, vehicleLine) =>
      normalizePriceValue(
        trim?.originalPrice ??
          trim?.original_price ??
          trim?.basePrice ??
          vehicleLine?.basePrice ??
          trim?.price ??
          vehicleLine?.price ??
          0,
      ) || 0;

    return visibleVehicleLineItems
      .map((vehicleLine) => {
      const trims = Array.isArray(vehicleLine.trims) ? vehicleLine.trims : [];
        if (!trims.length) {
          return null;
        }

        // 수입차 목록은 "할인율이 가장 높은 트림"을 기준으로 단순 계산된 가격/할인 정보를 사용
        if (isImportedListLocal) {
          // 백엔드에서 이미 모델 단위로 대표 트림/할인 정보를 계산해 내려주므로
          // 프론트에서 재정렬/재계산하지 않고 그대로 사용한다.
          const representativeFinalPrice =
            normalizePriceValue(
              vehicleLine.representativeFinalPrice ??
                vehicleLine.finalPrice ??
                0,
            ) || null;
          const representativeDiscountAmount = normalizePriceValue(
            vehicleLine.representativeDiscountAmount ?? 0,
          );
          const representativeDiscountPercent = normalizePriceValue(
            vehicleLine.representativeDiscountPercent ?? 0,
          );

          const firstTrim = trims[0] || {};
          const representativeTrimId =
            vehicleLine.representativeTrimId ??
            firstTrim.id ??
            firstTrim.trimId ??
            firstTrim.trim_id ??
            null;
          const basePrice =
            normalizePriceValue(
              firstTrim.originalPrice ??
                firstTrim.original_price ??
                firstTrim.basePrice ??
                vehicleLine.basePrice ??
                vehicleLine.price ??
                0,
            ) || 0;

          return {
            modelId: vehicleLine.modelId,
            vehicleLineId: vehicleLine.vehicleLineId,
            vehicleLineName: vehicleLine.vehicleLineName,
            vehicleLineDescription: vehicleLine.vehicleLineDescription,
            modelName: vehicleLine.modelName,
            brandId: vehicleLine.brandId,
            priority: getPriorityFromLine(vehicleLine),
            imageUrl:
              vehicleLine.imageUrl || '/placeholder/car.svg',
            id: vehicleLine.modelId ?? vehicleLine.vehicleLineId,
            name: vehicleLine.modelName || vehicleLine.vehicleLineName,
            trims,
            representativeTrimId,
            basePrice,
            finalPrice: representativeFinalPrice ?? basePrice,
            discountAmount: representativeDiscountAmount,
            discountPercent: representativeDiscountPercent,
            // 수입차 카드에서는 월 렌탈 정보를 사용하지 않는다.
            monthlyRentalFee: null,
            discountedMonthlyFee: null,
            monthlyDiscountPercent: null,
            hasMonthlyRentalFee: false,
            representativeTrimName: vehicleLine.representativeTrimName || firstTrim.name || '',
          };
        }

      const candidateTrims = trims.map((trim) => {
        const basePriceForTrim = computeTrimBasePrice(trim, vehicleLine);
          const monthlyMeta = deriveMonthlyMeta(trim);
          const priceMeta = resolveDiscountPricing({
            basePrice: basePriceForTrim,
            trim,
            vehicleLine,
          });

          const hasMonthly = Boolean(monthlyMeta && basePriceForTrim > 0);
          const hasDiscount =
            (monthlyMeta?.monthlyDiscountPercentValue ?? 0) > 0 ||
            (priceMeta?.discountPercent ?? 0) > 0 ||
            (priceMeta?.discountAmount ?? 0) > 0;

        return {
          trim,
          basePrice: basePriceForTrim,
            monthlyMeta,
            priceMeta,
            hasMonthly,
            hasDiscount,
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

        const fallbackMonthlyEntry = candidateTrims.find(
          (entry) => entry.hasMonthly && entry.basePrice > 0,
        );
        const fallbackDiscountEntry = candidateTrims.find(
          (entry) => entry.hasDiscount && entry.basePrice > 0,
        );
        const fallbackLowestBaseEntry = candidateTrims.reduce((best, entry) => {
          if (!entry || entry.basePrice <= 0) {
            return best;
          }
          if (!best || entry.basePrice < best.basePrice) {
            return entry;
          }
          return best;
        }, null);

        // 차량가격으로 쓸 "정상적인" 베이스 가격(너무 작은 값은 월 렌탈료로 잘못 들어온 것으로 간주)
        const lowestReasonableBaseEntry = candidateTrims.reduce((best, entry) => {
          if (!entry || entry.basePrice <= 0) return best;
          // 100만 원 미만이면 차량 가격이 아니라 월 렌탈료일 가능성이 높다고 판단해서 제외
          if (entry.basePrice < 1_000_000) return best;
          if (!best || entry.basePrice < best.basePrice) {
            return entry;
          }
          return best;
        }, null);

        const displayEntry =
          bestMonthlyEntry ||
          bestPriceEntry ||
          fallbackMonthlyEntry ||
          fallbackDiscountEntry ||
          fallbackLowestBaseEntry ||
          candidateTrims[0] ||
          null;

        if (!displayEntry) {
          return null;
        }

        const representativeTrim = displayEntry.trim || trims[0] || null;

        // 차량 리스트 상단 "차량가격"에 사용할 값:
        // 1) 라인 내 트림들 중 정상적인 최소 베이스 가격
        // 2) 없으면 displayEntry 기준 베이스 가격
        let basePrice = lowestReasonableBaseEntry?.basePrice || displayEntry.basePrice || 0;
        if ((!basePrice || basePrice <= 0) && representativeTrim) {
          basePrice = computeTrimBasePrice(representativeTrim, vehicleLine);
        }

        const priceMeta = displayEntry.priceMeta || {
          finalPrice: basePrice,
          discountAmount: 0,
          discountPercent: 0,
        };
        const monthlyMeta =
          displayEntry.monthlyMeta || (representativeTrim ? deriveMonthlyMeta(representativeTrim) : null);

        const discountAmount = priceMeta.discountAmount ?? 0;
        const discountPercent = priceMeta.discountPercent ?? 0;
        const finalPrice = priceMeta.finalPrice ?? basePrice;
        const monthlyRentalFee = monthlyMeta?.monthlyRentalFee ?? null;
        const discountedMonthlyFee = monthlyMeta?.discountedMonthlyFee ?? null;
        const monthlyDiscountPercent = monthlyMeta?.monthlyDiscountPercent ?? null;
        const hasMonthlyRentalFee = Boolean(monthlyMeta?.hasDedicatedMonthly && monthlyRentalFee > 0);

        const representativeTrimName =
          representativeTrim?.name ?? representativeTrim?.trimName ?? '';
        const representativeTrimId =
          representativeTrim?.id ??
          representativeTrim?.trimId ??
          representativeTrim?.trim_id ??
          vehicleLine.representativeTrimId ??
          null;

      return {
        modelId: vehicleLine.modelId,
        vehicleLineId: vehicleLine.vehicleLineId,
        vehicleLineName: vehicleLine.vehicleLineName,
        vehicleLineDescription: vehicleLine.vehicleLineDescription,
        modelName: vehicleLine.modelName,
        brandId: vehicleLine.brandId,
        priority: getPriorityFromLine(vehicleLine),
          imageUrl:
            vehicleLine.imageUrl || '/placeholder/car.svg',
          id: representativeTrimId ?? `${vehicleLine.vehicleLineId ?? 'line'}-${normalizeTextKey(vehicleLine.modelName ?? vehicleLine.vehicleLineName ?? '')}`,
        name: vehicleLine.modelName || vehicleLine.vehicleLineName,
          trims,
        representativeTrimId,
        basePrice,
        finalPrice,
        discountAmount,
        discountPercent,
        monthlyRentalFee,
        discountedMonthlyFee,
        monthlyDiscountPercent,
        hasMonthlyRentalFee,
        representativeTrimName,
      };
      })
      .filter(Boolean)
      ;
  }, [visibleVehicleLineItems, carType]);

  const handleCarClick = (carItem) => {
    if (!carItem) return;
    const trimId = resolveTrimIdFromItem(carItem);
    const vehicleLineId = resolveVehicleLineIdFromItem(carItem);

    if (trimId) {
      navigate(`/car-detail/trim/${trimId}`);
      return;
    }

    if (vehicleLineId) {
      navigate(`/car-detail/car/${vehicleLineId}`);
      return;
    }

    // '상담후 최저가 안내'처럼 트림 정보가 비어있을 때는 리스트 첫번째 항목을 기본값으로 사용
    const fallbackItem = carItems[0] || null;
    const fallbackTrimId = resolveTrimIdFromItem(fallbackItem);
    if (fallbackTrimId) {
      navigate(`/car-detail/trim/${fallbackTrimId}`);
      return;
    }

    const fallbackVehicleLineId = resolveVehicleLineIdFromItem(fallbackItem);
    if (fallbackVehicleLineId) {
      navigate(`/car-detail/car/${fallbackVehicleLineId}`);
    }
  };

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

  const isDomesticList = carType === 'domestic';
  const isImportedList = carType === 'imported';

  const pageKey = isDomesticList ? 'carlist-domestic' : isImportedList ? 'carlist-imported' : 'home';
  const { title: seoTitle, description: seoDescription, keywords: seoKeywords } = getPageSeo(pageKey);

  // SEO용 대표 이미지: carlist 배너 > 첫 차량 카드 이미지 순
  const seoImage = useMemo(() => {
    const firstBanner = banners[0];
    const bannerUrl = firstBanner?.imageUrl || firstBanner?.image_url;
    if (bannerUrl) return bannerUrl;

    const firstCar = carItems[0];
    if (firstCar?.imageUrl) return firstCar.imageUrl;

    return undefined;
  }, [banners, carItems]);

  // 하단 광고 배너(1280 x 500)에서는 국산/수입 배너 중 첫 번째 이미지를 사용
  const primaryAdBanner = useMemo(() => {
    if (!banners || banners.length === 0) return null;
    return banners[0];
  }, [banners]);

  return (
    <>
      <SeoHelmet
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        image={seoImage}
      />
    <div className="carlist-page">
      <div className="carlist-container">
        <div className="carlist-top-section">
          <Breadcrumb items={breadcrumbItems} />
          <TabNav tabs={tabs} />
        </div>

        {/* 국산차/수입차 전용 광고 배너 */}
        {primaryAdBanner && (primaryAdBanner.imageUrl || primaryAdBanner.image_url) && (
          <div className="carlist-ad-banner">
            <div
              className="carlist-ad-banner-inner"
              onClick={() => handleBannerClick(primaryAdBanner)}
              style={{
                cursor:
                  primaryAdBanner.linkUrl || primaryAdBanner.link_url ? 'pointer' : 'default',
                backgroundImage: `url("${primaryAdBanner.imageUrl || primaryAdBanner.image_url}")`,
              }}
            />
          </div>
        )}

        {/* 제조사 필터 섹션 */}
        <div className="carlist-manufacturer-section">
          <div className="carlist-manufacturer-tabs">
            <button 
              className={`carlist-manufacturer-tab ${carType === 'domestic' ? 'active' : ''}`}
              onClick={() => navigate('/carlist/domestic')}
            >
              국산차
            </button>
            <button 
              className={`carlist-manufacturer-tab ${carType === 'imported' ? 'active' : ''}`}
              onClick={() => navigate('/carlist/imported')}
            >
              수입차
            </button>
          </div>
          
          <CarManufacturerFilter
            manufacturers={manufacturers}
            selectedManufacturer={selectedBrandName}
            onSelectManufacturer={handleSelectManufacturer}
            isImportCar={carType === 'imported'}
          />
        </div>

        <div className="carlist-main-layout">
          <main className="carlist-main">

            {isLoading ? (
              <div className="carlist-empty">차량 정보를 불러오는 중입니다...</div>
            ) : isError ? (
              <div className="carlist-empty">차량 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</div>
            ) : isEmpty ? (
              <div className="carlist-empty">
                선택하신 제조사/조건에 맞는 차량이 없습니다.
                <br />
                다른 제조사나 조건으로 다시 선택해 주세요.
              </div>
            ) : (
              <>
                <p className="carlist-max-discount-note">
                  동일 차량 라인에 여러 할인율이 있을 경우 가장 높은 할인율 기준으로 표시됩니다.
                </p>
                <div className="carlist-grid">
                  {carItems.map((car) => {
                    const title = car.modelName || car.name || car.vehicleLineName || '차량';
                    const subtitle =
                      car.representativeTrimName ||
                      car.vehicleLineDescription ||
                      title;
                    const brandInfo = resolveBrandInfo(car.brandId, brandsData || []);
                    const brandName = brandInfo?.name ?? '블라인드 카스토리';
                    const brandLogo = brandInfo?.logoUrl || brandInfo?.image || getBrandLogo(brandName) || null;
                    
                    // 트림 데이터 추출 - 여러 가능성 확인
                    const trim = (Array.isArray(car.trims) && car.trims.length > 0) 
                      ? car.trims[0] 
                      : (car.trim || {});

                    if (isImportedList) {
                      return (
                        <ImportedPromotionCard
                          key={car.id}
                          id={car.id}
                          name={title}
                          desc={subtitle}
                          img={car.imageUrl}
                          brandName={brandName}
                          brandLogo={brandLogo}
                          basePrice={car.basePrice}
                          finalPrice={car.finalPrice}
                          discountAmount={car.discountAmount}
                          onClick={() => handleCarClick(car)}
                          onButtonClick={() => handleCarClick(car)}
                          buttonText="실시간 무료견적 받기"
                          trim={trim}
                        />
                      );
                    }

                    return (
                      <PromotionCard
                        key={car.id}
                        id={car.id}
                        name={title}
                        desc={subtitle}
                        img={car.imageUrl}
                        brandLogo={brandLogo}
                        brand={brandName}
                        basePrice={car.basePrice}
                        finalPrice={car.finalPrice}
                        discountPercent={car.discountPercent}
                        discountAmount={car.discountAmount}
                        monthlyRentalFee={car.monthlyRentalFee}
                        discountedMonthlyFee={car.discountedMonthlyFee}
                        monthlyDiscountPercent={car.monthlyDiscountPercent}
                        discountDisplay="monthly"
                        showMonthly
                        onClick={() => handleCarClick(car)}
                        buttonText="실시간 무료견적 받기"
                        trim={trim}
                      />
                    );
                  })}
                </div>

                {/* 무한 스크롤 트리거 */}
                <div ref={loadMoreRef} style={{ height: '20px', marginTop: '20px' }}>
                  {isFetchingNextPage && (
                    <div className="carlist-empty" style={{ textAlign: 'center', padding: '20px' }}>
                      더 많은 차량을 불러오는 중...
                    </div>
                  )}
                  {!hasNextPage && vehicleLineItems.length > 0 && (
                    <div className="carlist-empty" style={{ textAlign: 'center', padding: '20px', color: '#767676' }}>
                      모든 차량을 불러왔습니다.
                    </div>
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
    </>
  );
};

export default CarList;

