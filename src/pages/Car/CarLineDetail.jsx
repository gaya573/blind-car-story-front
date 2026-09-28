import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { carAPI } from '../../services/carApi';
import { useShareableConsultUrl } from '../../utils/shareableUrl';
import { findBestMatchingColorImageUrl } from '../../utils/colorImageFallback';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import { buildCarDetailSeo } from '../../utils/seoBuilders';
import { isImportedVehicleContext, shouldKeepTrimForOrigin } from '../../utils/vehiclePriceGuards';
import { formatTrimDisplayName } from '../../utils/trimDisplayName';
import { useBcsUi } from '../../bcs/BcsUiContext';
import CarDetailView, { CarDetailStatus } from './CarDetailView';
import { getDisplayColors, resolveChipColor } from './carColors';
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

const trimPriceOf = (trim) => parsePriceValue(trim?.originalPrice ?? trim?.original_price ?? trim?.basePrice ?? trim?.price ?? 0);

const CarLineDetail = () => {
  const { carId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useBcsUi();

  const [selectedTrimId, setSelectedTrimId] = useState(null);
  const [selectedColorId, setSelectedColorId] = useState(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState(new Set());
  const [expandedModelId, setExpandedModelId] = useState(null);

  // 차량 라인의 모델 목록 → 모델별 트림 목록
  const { data: vehicleLineModels = [], isLoading, isError } = useQuery({
    queryKey: ['car-line-models', carId],
    queryFn: async () => {
      const vehicleLineId = Number(carId);
      if (!vehicleLineId) return [];
      const models = await carAPI.getModels(vehicleLineId);
      if (!Array.isArray(models) || models.length === 0) return [];
      const modelsWithTrims = await Promise.all(
        models.map(async (model) => {
          const trims = await carAPI.getTrimsByModel(model.id);
          return { ...model, trims: Array.isArray(trims) ? trims : [] };
        }),
      );
      return modelsWithTrims.filter((model) => model.trims.length > 0);
    },
    staleTime: 1000 * 60,
  });

  // 수입차는 비정상적으로 낮은 가격의 트림을 뺀다.
  const displayVehicleLineModels = useMemo(
    () =>
      vehicleLineModels
        .map((model) => {
          const isImportedModel = Boolean(model?.foreignModel) || isImportedVehicleContext(model?.brandCountry, model?.country, model?.carType);
          return { ...model, trims: (model.trims ?? []).filter((trim) => shouldKeepTrimForOrigin(trim, isImportedModel)) };
        })
        .filter((model) => model.trims.length > 0),
    [vehicleLineModels],
  );

  const allTrims = useMemo(
    () =>
      displayVehicleLineModels.flatMap((model) =>
        (model.trims ?? []).map((trim) => {
          const rawName = trim.name ?? trim.trimName ?? '';
          return {
            ...trim,
            id: normalizeId(trim.id),
            name: formatTrimDisplayName(rawName, model.name, trim),
            rawName,
            modelId: normalizeId(model.id),
            modelName: model.name,
            vehicleLineName: model.vehicleLineName ?? model.vehicleLine,
          };
        }),
      ),
    [displayVehicleLineModels],
  );

  useEffect(() => {
    if (allTrims.length === 0) return;
    setSelectedTrimId((prev) => (prev && allTrims.some((trim) => trim.id === prev) ? prev : allTrims[0].id));
  }, [allTrims]);

  // 옵션·색상·브랜드 정보는 선택한 트림의 상세 API 에서 가져온다.
  const { data: selectedTrimDetail } = useQuery({
    queryKey: ['car-line-trim-detail', selectedTrimId],
    queryFn: async () => (selectedTrimId ? carAPI.getCarDetail(selectedTrimId) : null),
    enabled: Boolean(selectedTrimId),
  });

  const selectedTrim = useMemo(() => allTrims.find((trim) => trim.id === selectedTrimId) ?? null, [allTrims, selectedTrimId]);
  const detailTrim = useMemo(
    () => selectedTrimDetail?.trims?.find((trim) => normalizeId(trim.id) === selectedTrimId) ?? null,
    [selectedTrimDetail, selectedTrimId],
  );

  const trimOptions = useMemo(() => filterPricedOptions(detailTrim?.options ?? EMPTY_LIST), [detailTrim]);
  const trimColors = detailTrim?.colors ?? selectedTrimDetail?.availableColors ?? EMPTY_LIST;
  const visibleColors = useMemo(() => getDisplayColors(trimColors), [trimColors]);
  const vehicleLineName = selectedTrim?.vehicleLineName ?? selectedTrimDetail?.name ?? '';
  const brandName = selectedTrimDetail?.brandName ?? '';

  const brandOrigin = useMemo(() => resolveBrandOrigin(selectedTrimDetail?.brandCountry), [selectedTrimDetail?.brandCountry]);
  const contract = useContractConditions(brandOrigin, { onLimitExceeded: () => showToast(UPFRONT_LIMIT_MESSAGE) });
  const { contractMethod, contractPeriod, deposit, prepayment, mileage, carTax, insuranceAge, terms } = contract;

  const { title: seoTitle, description: seoDescription, keywords: seoKeywords } = useMemo(
    () =>
      buildCarDetailSeo({
        brand: brandName,
        model: vehicleLineName,
        segment: selectedTrimDetail?.segment || selectedTrimDetail?.segmentName || null,
        fuelOrType: selectedTrimDetail?.fuelType || selectedTrimDetail?.fuel || selectedTrimDetail?.fuelOrType || null,
        period: contractPeriod,
        mileage,
      }),
    [brandName, vehicleLineName, selectedTrimDetail, contractPeriod, mileage],
  );

  // 트림이 바뀔 때만 옵션/색상 초기화 (이전 색상이 새 트림에도 있으면 유지)
  useEffect(() => {
    if (!selectedTrim) return;
    setSelectedOptionIds(new Set());
    const firstColorId = visibleColors[0] ? normalizeId(visibleColors[0].id) : null;
    setSelectedColorId((prev) => (visibleColors.some((color) => normalizeId(color.id) === prev) ? prev : firstColorId));
  }, [selectedTrimId, selectedTrim, visibleColors]);

  // 선택한 트림이 속한 모델을 펼친다.
  useEffect(() => {
    if (!selectedTrim) return;
    setExpandedModelId(selectedTrim.modelId ?? 'default');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrim?.modelId]);

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

  const selectedColor = useMemo(
    () => visibleColors.find((color) => normalizeId(color.id) === selectedColorId) ?? null,
    [visibleColors, selectedColorId],
  );

  // 색상 이미지 → 이름·코드가 비슷한 색상 이미지 → 트림 대표 이미지
  const heroImage = useMemo(
    () =>
      resolveColorImageUrl(selectedColor) ||
      findBestMatchingColorImageUrl(selectedColor, [selectedTrimDetail, displayVehicleLineModels]) ||
      selectedTrimDetail?.imageUrl ||
      null,
    [displayVehicleLineModels, selectedColor, selectedTrimDetail],
  );

  const colorPrice = parsePriceValue(selectedColor?.additionalPrice ?? selectedColor?.price ?? 0);
  const selectedOptions = useMemo(
    () => trimOptions.filter((option) => selectedOptionIds.has(normalizeId(option.id))),
    [trimOptions, selectedOptionIds],
  );
  const basePriceValue = trimPriceOf(selectedTrim);
  const { discountAmount, discountedBasePrice } = useMemo(() => computeTrimDiscount(selectedTrim, basePriceValue), [selectedTrim, basePriceValue]);

  // URL 동기화 (민감정보 제외)
  useShareableConsultUrl(
    () => ({
      brand: brandName,
      model: vehicleLineName,
      vehicleLineId: Number(carId) || '',
      trimId: selectedTrimId || '',
      colorId: selectedColorId || '',
      optionIds: Array.from(selectedOptionIds || []),
      terms,
      consultType: '차량라인상세',
      source: 'car-line-detail',
    }),
    (preset) => {
      if (preset?.trimId) setSelectedTrimId(preset.trimId);
      if (preset?.colorId) setSelectedColorId(preset.colorId);
      if (preset?.optionIds?.length) setSelectedOptionIds(new Set(preset.optionIds));
    },
    [brandName, vehicleLineName, carId, selectedTrimId, selectedColorId, selectedOptionIds, contractMethod, contractPeriod, deposit, prepayment, mileage],
  );

  const buildConsultPayload = useCallback(
    (phoneValue) => ({
      brand: brandName || '',
      model: vehicleLineName || '',
      trim: selectedTrim?.name || '',
      color: selectedColor?.name || '',
      phone: (phoneValue || '').trim(),
      options: [...(selectedColor?.name ? [`색상: ${selectedColor.name}`] : []), ...selectedOptions.map((option) => option.name).filter(Boolean)],
      terms,
      consultType: '차량라인상세',
      source: 'car-line-detail',
      entryLabel: `차량 라인 상세 > ${vehicleLineName || ''}`,
      extra: {
        vehicleLineId: Number(carId) || null,
        trimId: selectedTrim?.id ?? null,
        brandName,
        contractMethod,
        contractPeriod,
        deposit,
        prepayment,
        mileage,
        carTax,
        insuranceAge,
      },
    }),
    [brandName, vehicleLineName, selectedTrim, selectedColor, selectedOptions, terms, carId, contractMethod, contractPeriod, deposit, prepayment, mileage, carTax, insuranceAge],
  );
  const consult = useCarDetailConsult(buildConsultPayload);

  if (isLoading) {
    return <CarDetailStatus>차량 정보를 불러오는 중입니다...</CarDetailStatus>;
  }

  if (isError || vehicleLineModels.length === 0) {
    return (
      <CarDetailStatus>
        차량 정보를 불러오지 못했습니다.
        <button type="button" onClick={() => navigate(-1)}>
          이전 페이지로 돌아가기
        </button>
      </CarDetailStatus>
    );
  }

  const modelTabs = displayVehicleLineModels.map((model) => ({ key: normalizeId(model.id) ?? model.name, name: model.name, trims: model.trims ?? [] }));
  const activeModel = modelTabs.find((model) => model.key === expandedModelId) ?? modelTabs[0];
  const optionItems = selectedOptions.map((option) => ({ name: option.name, price: optionPriceOf(option) }));
  const total = basePriceValue + colorPrice + optionItems.reduce((sum, option) => sum + option.price, 0) - (discountAmount > 0 ? discountAmount : 0);

  return (
    <>
      <SeoHelmet title={seoTitle} description={seoDescription} keywords={seoKeywords} image={heroImage || '/특가차량.png'} />
      <CarDetailView
        listPath={brandOrigin === '수입차' ? '/carlist/imported' : '/carlist/domestic'}
        title={vehicleLineName || '차량 상세'}
        brandName={brandName}
        origin={brandOrigin}
        heroImage={heroImage}
        heroFallbackImage={selectedTrimDetail?.imageUrl || null}
        price={{ basePrice: basePriceValue, discountAmount, discountedBasePrice }}
        colors={visibleColors.map((color) => ({ id: normalizeId(color.id), name: color.name, background: resolveChipColor(color) || '#d1d5db' }))}
        selectedColorId={selectedColorId}
        selectedColor={selectedColor}
        onSelectColor={setSelectedColorId}
        modelTabs={modelTabs}
        activeModelKey={activeModel?.key}
        onSelectModel={setExpandedModelId}
        trims={(activeModel?.trims ?? []).map((trim) => {
          const id = normalizeId(trim.id);
          return { id, name: allTrims.find((item) => item.id === id)?.name ?? trim.name, price: trimPriceOf(trim) };
        })}
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

export default CarLineDetail;
