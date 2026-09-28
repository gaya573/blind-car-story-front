import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCarDetailQuery } from '../../hooks/queries/carQueries';
import { useShareableConsultUrl } from '../../utils/shareableUrl';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import { buildCarDetailSeo } from '../../utils/seoBuilders';
import { findBestMatchingColorImageUrl } from '../../utils/colorImageFallback';
import { formatTrimDisplayName } from '../../utils/trimDisplayName';
import { useBcsUi } from '../../bcs/BcsUiContext';
import CarDetailView, { CarDetailStatus } from './CarDetailView';
import { hasStrictColorCode, resolveStrictChipColor } from './carColors';
import {
  UPFRONT_LIMIT_MESSAGE,
  computeTrimDiscount,
  filterPricedOptions,
  normalizeId,
  optionPriceOf,
  parsePriceValue,
  resolveBrandOrigin,
  resolveColorImageUrl,
  useContractConditions,
} from './carDetailShared';
import { useCarDetailConsult } from './useCarDetailConsult';

// 빈 배열을 매 렌더 새로 만들면 색상 초기화 effect 가 끝없이 돈다.
const EMPTY_LIST = [];

const CarTrimDetail = () => {
  const { trimId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useBcsUi();
  const { data, isLoading, isError } = useCarDetailQuery(trimId);

  const [selectedTrimId, setSelectedTrimId] = useState(trimId ? String(trimId) : null);
  const [selectedColorId, setSelectedColorId] = useState(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState(new Set());

  // 트림 상세는 응답의 trims(같은 모델의 트림들)를 한 묶음으로 보여준다.
  const allTrims = useMemo(() => {
    const trims = data?.trims ?? [];
    const modelName = data?.name ?? '세부모델';
    return trims.map((trim) => ({
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
    }));
  }, [data]);

  const selectedTrim = useMemo(() => allTrims.find((trim) => trim.id === selectedTrimId) ?? null, [allTrims, selectedTrimId]);

  useEffect(() => {
    if (!selectedTrim && allTrims.length > 0) setSelectedTrimId(allTrims[0].id);
  }, [selectedTrim, allTrims]);

  const sharedDiscountInfo = useMemo(() => {
    const discounts = data?.activeTrimDiscounts ?? data?.trimDiscounts ?? [];
    if (!Array.isArray(discounts) || !selectedTrim?.id) return null;
    return discounts.find((discount) => String(discount?.trimId ?? discount?.trim_id ?? discount?.trim) === String(selectedTrim.id));
  }, [data?.activeTrimDiscounts, data?.trimDiscounts, selectedTrim?.id]);

  const trimOptions = useMemo(() => filterPricedOptions(selectedTrim?.options ?? []), [selectedTrim]);
  const trimColors = selectedTrim?.colors ?? data?.availableColors ?? EMPTY_LIST;
  const visibleColors = useMemo(
    () => (Array.isArray(trimColors) ? trimColors.filter((color) => !color?.vehicleInterior && hasStrictColorCode(color)) : []),
    [trimColors],
  );

  // 트림이 바뀔 때만 옵션/색상 초기화 (무한 루프 방지)
  useEffect(() => {
    if (!selectedTrim) return;
    setSelectedOptionIds(new Set());
    setSelectedColorId(visibleColors[0] ? normalizeId(visibleColors[0].id) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrimId, visibleColors]);

  const selectedColor = useMemo(
    () => visibleColors.find((color) => normalizeId(color.id) === selectedColorId) ?? null,
    [visibleColors, selectedColorId],
  );
  const colorPrice = parsePriceValue(selectedColor?.additionalPrice ?? selectedColor?.price ?? 0);
  const basePriceValue = parsePriceValue(selectedTrim?.basePrice ?? 0);

  const consultModelName = data?.name ?? '';
  const brandName = data?.brandName ?? '';
  const heroTitle = consultModelName || selectedTrim?.name || '차량 상세';
  const heroImage =
    resolveColorImageUrl(selectedColor) || findBestMatchingColorImageUrl(selectedColor, [selectedTrim, data, allTrims]) || data?.imageUrl || null;

  const brandOrigin = useMemo(() => resolveBrandOrigin(data?.brandCountry), [data?.brandCountry]);
  const contract = useContractConditions(brandOrigin, { onLimitExceeded: () => showToast(UPFRONT_LIMIT_MESSAGE) });
  const { contractMethod, contractPeriod, deposit, prepayment, mileage, carTax, insuranceAge, terms } = contract;

  const { discountAmount, discountedBasePrice } = useMemo(
    () => computeTrimDiscount(selectedTrim, basePriceValue, sharedDiscountInfo),
    [selectedTrim, basePriceValue, sharedDiscountInfo],
  );

  const { title: seoTitle, description: seoDescription, keywords: seoKeywords } = useMemo(
    () =>
      buildCarDetailSeo({
        brand: brandName,
        model: consultModelName || heroTitle,
        segment: data?.segment || data?.segmentName || null,
        fuelOrType: data?.fuelType || data?.fuel || data?.fuelOrType || null,
        period: contractPeriod,
        mileage,
      }),
    [brandName, consultModelName, heroTitle, data, contractPeriod, mileage],
  );

  // URL 동기화 (민감정보 제외)
  useShareableConsultUrl(
    () => ({
      brand: brandName,
      model: consultModelName,
      vehicleLineId: data?.vehicleLineId || '',
      trimId: selectedTrimId || '',
      colorId: selectedColorId || '',
      optionIds: Array.from(selectedOptionIds || []),
      terms,
      consultType: '트림상세',
      source: 'car-trim-detail',
    }),
    (preset) => {
      if (preset?.trimId) setSelectedTrimId(preset.trimId);
      if (preset?.colorId) setSelectedColorId(preset.colorId);
      if (preset?.optionIds?.length) setSelectedOptionIds(new Set(preset.optionIds));
    },
    [brandName, consultModelName, data?.vehicleLineId, selectedTrimId, selectedColorId, selectedOptionIds, contractMethod, contractPeriod, deposit, prepayment, mileage],
  );

  const selectedOptions = useMemo(
    () => trimOptions.filter((option) => selectedOptionIds.has(normalizeId(option.id))),
    [trimOptions, selectedOptionIds],
  );

  const buildConsultPayload = useCallback(
    (phoneValue) => ({
      brand: data?.brandName || '',
      model: consultModelName || '',
      trim: selectedTrim?.name || '',
      color: selectedColor?.name || '',
      phone: (phoneValue || '').trim(),
      options: [...(selectedColor?.name ? [`색상: ${selectedColor.name}`] : []), ...selectedOptions.map((option) => option.name).filter(Boolean)],
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
    }),
    [data, consultModelName, selectedTrim, selectedColor, selectedOptions, terms, contractMethod, contractPeriod, deposit, prepayment, mileage, carTax, insuranceAge],
  );
  const consult = useCarDetailConsult(buildConsultPayload);

  const toggleOption = (optionId) => {
    const normalized = normalizeId(optionId);
    if (!normalized) return;
    setSelectedOptionIds((prev) => {
      const next = new Set(prev);
      if (next.has(normalized)) next.delete(normalized);
      else next.add(normalized);
      return next;
    });
  };

  if (isLoading) {
    return <CarDetailStatus>차량 정보를 불러오는 중입니다...</CarDetailStatus>;
  }

  if (isError || !data) {
    return (
      <CarDetailStatus>
        차량 정보를 불러오지 못했습니다.
        <button type="button" onClick={() => navigate(-1)}>
          이전 페이지로 돌아가기
        </button>
      </CarDetailStatus>
    );
  }

  const optionItems = selectedOptions.map((option) => ({ name: option.name, price: optionPriceOf(option) }));
  const total = basePriceValue + colorPrice + optionItems.reduce((sum, option) => sum + option.price, 0) - (discountAmount > 0 ? discountAmount : 0);

  return (
    <>
      <SeoHelmet title={seoTitle} description={seoDescription} keywords={seoKeywords} image={heroImage || '/특가차량.png'} />
      <CarDetailView
        listPath={brandOrigin === '수입차' ? '/carlist/imported' : '/carlist/domestic'}
        title={data.name ?? heroTitle}
        brandName={brandName}
        origin={brandOrigin}
        heroImage={heroImage}
        price={{ basePrice: basePriceValue, discountAmount, discountedBasePrice }}
        colors={visibleColors.map((color) => ({ id: normalizeId(color.id), name: color.name, background: resolveStrictChipColor(color) }))}
        selectedColorId={selectedColorId}
        selectedColor={selectedColor}
        onSelectColor={setSelectedColorId}
        trims={allTrims.map((trim) => ({ id: trim.id, name: trim.name, price: trim.basePrice }))}
        selectedTrimId={selectedTrimId}
        selectedTrimName={selectedTrim?.name}
        onSelectTrim={setSelectedTrimId}
        options={trimOptions.map((option) => ({ id: normalizeId(option.id), name: option.name, price: option.discountedPrice ?? option.price ?? 0 }))}
        selectedOptionIds={selectedOptionIds}
        onToggleOption={toggleOption}
        contract={contract}
        estimate={{
          trimName: selectedTrim?.name,
          trimPrice: basePriceValue,
          colorPrice,
          options: optionItems,
          discountAmount,
          total,
        }}
        consult={consult}
      />
    </>
  );
};

export default CarTrimDetail;
