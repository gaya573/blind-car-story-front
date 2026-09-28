import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import styles from './MobleCarDetail.module.css';
import { carAPI } from '../../services/carApi.js';
import { useShareableConsultUrl } from '../../utils/shareableUrl';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import { buildCarDetailSeo } from '../../utils/seoBuilders';
import { findBestMatchingColorImageUrl } from '../../utils/colorImageFallback';
import { formatTrimDisplayName } from '../../utils/trimDisplayName';
import { MobileSubHeader } from '../../bcs/layout/MobileLayout';
import { useBcsUi } from '../../bcs/BcsUiContext';

const PRICE_PLACEHOLDER = '가격문의';
const FALLBACK_IMAGE = '/bcs/images/cars/car-sedan.svg';
const PERCENT_LIMIT_MESSAGE = '보증금과 선납금의 합계는 40%를 넘을 수 없습니다.';

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
  return numeric ? `${numeric.toLocaleString()}원` : PRICE_PLACEHOLDER;
};

const normalizeId = (value) => (value ?? value === 0 ? String(value) : null);

// "10%", "없음" 등에서 숫자 퍼센트만 추출
const parsePercent = (value) => {
  if (!value || value === '없음') return 0;
  const match = String(value).match(/(\d+)/);
  return match ? Number(match[1]) : 0;
};

// 색상 이름으로 칩 색을 추정한다 (hexCode 가 없거나 너무 일반적인 값일 때).
const inferColorFromName = (name = '') => {
  const text = String(name).toLowerCase();
  if (!text) return null;

  const normalizePart = (part) => part.replace(/\([^)]*\)|\[[^\]]*\]/g, ' ').trim();
  const colorParts = text.split(/[/|+]/).map(normalizePart).filter(Boolean);
  const rules = [
    { tokens: ['abyss', '어비스'], color: '#07080A' },
    { tokens: ['phantom', '팬텀'], color: '#090A0D' },
    { tokens: ['space black', 'black', '스페이스 블랙', '블랙'], color: '#0B0B0D' },
    { tokens: ['neoteric', 'yellow', '네오테릭', '옐로우'], color: '#C6CF22' },
    { tokens: ['mirage', '미라지'], color: '#5F7065' },
    { tokens: ['forest', '포레스트'], color: '#244235' },
    { tokens: ['robust', 'emerald', '로버스트', '에메랄드'], color: '#0F3E35' },
    { tokens: ['intense blue', '인텐스'], color: '#173E6D' },
    { tokens: ['dandy blue', '댄디'], color: '#1E4F86' },
    { tokens: ['denim blue', '데님'], color: '#2A5872' },
    { tokens: ['yacht', '요트'], color: '#2E5368' },
    { tokens: ['transmission blue', '트랜스미션'], color: '#435E6C' },
    { tokens: ['blue dusk', '블루 더스크'], color: '#3E5262' },
    { tokens: ['meta blue', 'moonlight', 'blue', '메타블루', '문라이트', '블루', 'navy', '네이비'], color: '#2E5674' },
    { tokens: ['ultimate', 'red', '얼티메이트', '레드', 'crimson', 'burgundy', '버건디'], color: '#A51D2D' },
    { tokens: ['grand white', '그랜드 화이트'], color: '#F4F3EE' },
    { tokens: ['glacier white', '글레이셔'], color: '#F1F3F2' },
    { tokens: ['chalk white', 'chalkwhite', '초크화이트'], color: '#E9E9E2' },
    { tokens: ['atlas', '아틀라스'], color: '#F5F6F1' },
    { tokens: ['creamy', 'clear white', 'white', 'snow', '화이트', '스노우', '클리어'], color: '#F3F1EA' },
    { tokens: ['shimmering', '쉬머링'], color: '#C4C8C7' },
    { tokens: ['silver', '실버'], color: '#B8B6AA' },
    { tokens: ['iron metal', '아이언'], color: '#5E6466' },
    { tokens: ['cyber gray', '사이버'], color: '#687071' },
    { tokens: ['ecotronic', '에코트로닉'], color: '#626B6B' },
    { tokens: ['moonstone', '문스톤'], color: '#73797A' },
    { tokens: ['nocturne', '녹턴'], color: '#4D5356' },
    { tokens: ['moonscape', '문스케이프'], color: '#555B5D' },
    { tokens: ['urban gray', '어반 그레이'], color: '#6E7472' },
    { tokens: ['celadon gray', '셀라돈'], color: '#879087' },
    { tokens: ['shadow matte gray', '쉐도우'], color: '#56595A' },
    { tokens: ['graphite', 'gravity', 'gray', 'grey', 'metal', '그래비티', '그레이', '메탈'], color: '#7B8083' },
    { tokens: ['latte greige', 'greige', '라떼', '그레이지'], color: '#A49D8F' },
    { tokens: ['ivory', '아이보리'], color: '#B8B6AA' },
    { tokens: ['gravity gold', 'gold', '그래비티 골드', '골드'], color: '#8E7D54' },
    { tokens: ['green', '그린', 'khaki', '카키', 'ocado', '오카도'], color: '#284F3B' },
    { tokens: ['cast iron brown', '캐스트 아이언 브라운'], color: '#4A382F' },
    { tokens: ['frosted brown', '프로스티드'], color: '#6D574A' },
    { tokens: ['brown', 'terracotta', 'copper', '브라운', '테라코타', '코퍼'], color: '#805131' },
    { tokens: ['beige', 'sand', '베이지', '샌드'], color: '#C5B49A' },
    { tokens: ['orange', 'sienna', 'siena', '오렌지'], color: '#B86432' },
  ];

  const pick = (source) => {
    const rule = rules.find((item) => item.tokens.some((token) => source.includes(token)));
    return rule ? { color: rule.color } : null;
  };
  const isRoofBlack = (part = '') =>
    ['black', 'abyss', 'phantom', '블랙', '어비스', '팬텀'].some((token) => part.includes(token));

  // 투톤(루프/바디) 이름이면 위아래로 나눈 칩을 만든다.
  const parsedParts = colorParts.map((part) => ({ part, match: pick(part) })).filter((item) => item.match);
  if (parsedParts.length >= 2) {
    const [firstPart, secondPart] = parsedParts;
    const firstIsBlack = isRoofBlack(firstPart.part);
    const secondIsBlack = isRoofBlack(secondPart.part);
    const roofPart = firstIsBlack && !secondIsBlack ? firstPart : secondPart;
    const bodyPart = secondIsBlack && !firstIsBlack ? firstPart : secondPart;
    const roofColor = roofPart?.match.color;
    const bodyColor = bodyPart?.match.color;
    if (roofColor && bodyColor && roofColor !== bodyColor) {
      return `linear-gradient(to bottom, ${roofColor} 0 46%, ${bodyColor} 46% 100%)`;
    }
  }

  return parsedParts[0]?.match.color ?? pick(text)?.color ?? null;
};

const GENERIC_HEX = ['#777777', '#888888', '#999999', '#808080', '#777', '#888', '#999', '#000000', '#111111', '#FF0000', '#0000FF', '#008000', '#00FF00', '#A52A2A'];

const resolveChipColor = (color) => {
  const raw = color?.hexCode || color?.colorCode || color?.rgb || color?.rgbCode || '';
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (/^linear-gradient\(/i.test(trimmed)) return trimmed;
  const inferredColor = inferColorFromName(color?.name);
  if (!trimmed) return inferredColor;
  if (/^rgba?\(/i.test(trimmed)) return inferredColor || trimmed;

  const hexMatch = trimmed.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!hexMatch) return inferredColor;

  const hex = hexMatch[1];
  const normalized = `#${hex.length === 3 ? hex : hex.toUpperCase()}`;
  if (inferredColor?.startsWith('linear-gradient(')) return inferredColor;
  return inferredColor && GENERIC_HEX.includes(normalized.toUpperCase()) ? inferredColor : normalized;
};

const resolveColorImageUrl = (color) => {
  const raw =
    color?.imageUrl || color?.image_url || color?.cloudfrontUrl || color?.cloudfront_url || color?.s3Url || color?.s3_url || '';
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
};

const canDisplayColor = (color) => Boolean(resolveColorImageUrl(color) || resolveChipColor(color));

// 외장 색상만 보여 준다. 외장 색상이 하나도 없으면 표시 가능한 색상 전체를 쓴다.
const getDisplayColors = (colors) => {
  if (!Array.isArray(colors)) return [];
  const validColors = colors.filter(canDisplayColor);
  const exteriorColors = validColors.filter((color) => !color?.vehicleInterior);
  return exteriorColors.length > 0 ? exteriorColors : validColors;
};

// 계약 옵션 (PC 웹 CarDetail 과 같은 값)
const CONTRACT_PERIOD_OPTIONS = ['24개월', '36개월', '48개월', '60개월'];
const DEPOSIT_OPTIONS = ['없음', '10%', '20%', '30%', '40%'];
const PREPAYMENT_OPTIONS = ['없음', '10%', '20%', '30%', '40%'];
const MILEAGE_OPTIONS = ['연 1만km', '연 2만km', '연 3만km', '연 4만km~'];
const INSURANCE_AGE_OPTIONS = ['만 26세 이상', '만 21세 이상'];

// 이용방법을 바꾸면 이 기본 조건으로 되돌린다. (현재는 세 방법 모두 같다)
const DEFAULT_CONTRACT = {
  contractPeriod: '48개월',
  deposit: '없음',
  prepayment: '30%',
  mileage: '연 2만km',
  insuranceAge: '만 26세 이상',
};

const methodLabel = (method) => (method === '장기렌탈' ? '장기렌트' : method);

// 트림 할인 (백엔드 DiscountInfo·구형 할인 필드 기반. 프론트에서 임의 할인율을 두지 않는다)
const resolveDiscount = (detailTrim, basePrice) => {
  const none = { discountAmount: 0, discountedBasePrice: 0 };
  if (!detailTrim || !basePrice) return none;

  const discountInfo = detailTrim.discountInfo ?? detailTrim.activeTrimDiscount ?? null;
  const discountPriceFromInfo = parsePriceValue(discountInfo?.discountedPrice ?? discountInfo?.discounted_price ?? 0);

  let amount = 0;
  if (discountInfo?.discountType && discountInfo?.discountValue != null) {
    const value = parsePriceValue(discountInfo.discountValue);
    if (discountInfo.discountType === 'PERCENTAGE') {
      amount = value > 0 ? Math.floor((basePrice * value) / 100) : 0;
    } else {
      amount = value;
    }
  }

  const legacyDiscountPrice = parsePriceValue(detailTrim.discountedPrice ?? detailTrim.discounted_price ?? 0);
  const discountPrice = discountPriceFromInfo || legacyDiscountPrice || 0;

  if (!amount) {
    amount = parsePriceValue(
      detailTrim.discountAmount ?? detailTrim.discount_amount ?? detailTrim.activeTrimDiscount?.discountAmount ?? 0,
    );
  }
  if (!amount && discountPrice > 0 && discountPrice < basePrice) {
    amount = basePrice - discountPrice;
  }
  if (!amount) return none;

  return { discountAmount: amount, discountedBasePrice: Math.max(basePrice - amount, 0) };
};

// 트림 가격은 세제혜택 반영가(basePrice)를 쓴다. 목록 카드의 차량가격·기존 견적 합계와 같은 기준이다.
const trimPrice = (trim) =>
  parsePriceValue(trim?.basePrice ?? trim?.price ?? trim?.originalPrice ?? trim?.original_price ?? 0);

async function fetchVehicleLineModels(carId) {
  const vehicleLineId = Number(carId);
  if (!vehicleLineId) return [];
  const models = await carAPI.getModels(vehicleLineId);
  if (!Array.isArray(models) || models.length === 0) return [];

  const modelsWithTrims = await Promise.all(
    models.map(async (model) => {
      const trims = await carAPI.getTrimsByModel(model.id);
      const modelName = model.name || model.modelName || model.modelCode || '세부모델';
      const normalizedTrims = (Array.isArray(trims) ? trims : []).map((trim) => ({
        ...trim,
        id: normalizeId(trim.id),
        name: formatTrimDisplayName(trim.name || trim.trimName || '세부모델', modelName, trim),
        modelId: normalizeId(model.id),
        modelName,
        vehicleLineName: model.vehicleLineName ?? model.vehicleLine ?? model.name ?? '',
      }));
      return {
        ...model,
        id: normalizeId(model.id),
        name: modelName,
        vehicleLineName: model.vehicleLineName ?? model.vehicleLine ?? '',
        trims: normalizedTrims,
      };
    }),
  );
  return modelsWithTrims.filter((model) => model.trims.length > 0);
}

function DetailShell({ title = '차량 상세', message }) {
  return (
    <>
      <MobileSubHeader title={title} />
      <main id="main-content">
        <p className="m-empty">{message}</p>
      </main>
    </>
  );
}

/** 모바일 차량 상세 (퍼블리싱 pages/m-car-detail.html). carId = 차량 라인 ID, ?trimId= 로 트림을 고른다. */
export default function MobleCarDetail() {
  const { carId } = useParams();
  const [searchParams] = useSearchParams();
  const { showToast, openQuote } = useBcsUi();
  const initialTrimIdFromQuery = normalizeId(searchParams.get('trimId'));
  const nextSectionRef = useRef(null);

  const [selectedTrimId, setSelectedTrimId] = useState(initialTrimIdFromQuery);
  const [selectedColorId, setSelectedColorId] = useState(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState(() => new Set());
  const [openModelGroup, setOpenModelGroup] = useState(null);
  const [contractMethod, setContractMethod] = useState('장기렌탈');
  const [contractPeriod, setContractPeriod] = useState(DEFAULT_CONTRACT.contractPeriod);
  const [deposit, setDeposit] = useState(DEFAULT_CONTRACT.deposit);
  const [prepayment, setPrepayment] = useState(DEFAULT_CONTRACT.prepayment);
  const [mileage, setMileage] = useState(DEFAULT_CONTRACT.mileage);
  const [insuranceAge, setInsuranceAge] = useState(DEFAULT_CONTRACT.insuranceAge);

  // 하단 고정 견적 바 만큼 본문 아래 여백을 둔다 (퍼블리싱 body.has-cd-bar).
  useEffect(() => {
    document.body.classList.add('has-cd-bar');
    return () => document.body.classList.remove('has-cd-bar');
  }, []);

  useEffect(() => {
    if (initialTrimIdFromQuery) setSelectedTrimId(initialTrimIdFromQuery);
  }, [initialTrimIdFromQuery]);

  const {
    data: vehicleLineModels = [],
    isLoading: isLoadingModels,
    isError: isErrorModels,
  } = useQuery({
    queryKey: ['mobile-car-line-models', carId],
    queryFn: () => fetchVehicleLineModels(carId),
    enabled: Boolean(carId),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const allTrims = useMemo(() => vehicleLineModels.flatMap((model) => model.trims ?? []), [vehicleLineModels]);

  // 요청한 트림이 이 차량 라인에 없으면 첫 트림을 고른다.
  useEffect(() => {
    if (!allTrims.length) return;
    setSelectedTrimId((prev) => (prev && allTrims.some((trim) => trim.id === prev) ? prev : allTrims[0].id));
  }, [allTrims]);

  const selectedTrim = useMemo(
    () => allTrims.find((trim) => trim.id === selectedTrimId) ?? null,
    [allTrims, selectedTrimId],
  );

  useEffect(() => {
    if (selectedTrim?.modelName) setOpenModelGroup(selectedTrim.modelName);
  }, [selectedTrim?.modelName]);

  const {
    data: selectedTrimDetail,
    isLoading: isLoadingTrimDetail,
    isFetching: isFetchingTrimDetail,
  } = useQuery({
    queryKey: ['mobile-car-trim-detail', selectedTrimId],
    queryFn: () => carAPI.getCarDetail(selectedTrimId),
    enabled: Boolean(selectedTrimId),
    staleTime: 1000 * 60,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  // 트림을 바꾸면 옵션 선택은 초기화한다.
  useEffect(() => {
    setSelectedOptionIds(new Set());
  }, [selectedTrimId]);

  const detailTrim = useMemo(() => {
    if (!selectedTrimDetail) return null;
    if (Array.isArray(selectedTrimDetail.trims)) {
      return selectedTrimDetail.trims.find((trim) => normalizeId(trim.id) === selectedTrimId) ?? null;
    }
    return selectedTrimDetail;
  }, [selectedTrimDetail, selectedTrimId]);

  const trimOptions = useMemo(() => (Array.isArray(detailTrim?.options) ? detailTrim.options : []), [detailTrim]);
  const trimColors = useMemo(
    () => detailTrim?.colors ?? selectedTrimDetail?.availableColors ?? [],
    [detailTrim, selectedTrimDetail],
  );
  const visibleColors = useMemo(() => getDisplayColors(trimColors), [trimColors]);

  // 색상: ?colorId= 가 있으면 그 색상, 없으면 첫 외장 색상
  useEffect(() => {
    const colors = Array.isArray(trimColors) ? trimColors : [];
    const requestedColorId = normalizeId(searchParams.get('colorId'));
    if (requestedColorId && colors.some((c) => normalizeId(c?.id) === requestedColorId && canDisplayColor(c))) {
      setSelectedColorId(requestedColorId);
      return;
    }
    const first = getDisplayColors(colors)[0];
    setSelectedColorId(first ? normalizeId(first.id) : null);
    // 공유 URL 동기화가 colorId 를 바꿔도 다시 고르지 않도록 트림 색상 목록이 바뀔 때만 실행한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimColors]);

  const selectedColor = useMemo(
    () => visibleColors.find((c) => normalizeId(c.id) === selectedColorId) || visibleColors[0] || null,
    [visibleColors, selectedColorId],
  );

  const selectedOptions = useMemo(
    () => trimOptions.filter((option) => selectedOptionIds.has(normalizeId(option.id))),
    [trimOptions, selectedOptionIds],
  );

  const optionPrice = (option) => parsePriceValue(option?.discountedPrice ?? option?.price ?? option?.amount ?? 0);
  const optionPriceTotal = selectedOptions.reduce((sum, option) => sum + optionPrice(option), 0);
  const colorPriceTotal = parsePriceValue(selectedColor?.additionalPrice ?? selectedColor?.price ?? 0);

  // 백엔드 brandCountry 로 국산/수입 구분 (PC CarDetail 과 같은 규칙)
  const brandOrigin = useMemo(() => {
    const country = String(selectedTrimDetail?.brandCountry || '').toUpperCase();
    if (!country) return null;
    const isDomestic = country === 'KR' || country.includes('KOREA') || country.includes('한국') || country.includes('대한민국');
    return isDomestic ? '국산차' : '수입차';
  }, [selectedTrimDetail?.brandCountry]);

  const basePriceValue = useMemo(
    () => trimPrice(detailTrim) || trimPrice(selectedTrim) || parsePriceValue(selectedTrimDetail?.basePrice ?? 0),
    [detailTrim, selectedTrimDetail, selectedTrim],
  );

  const { discountAmount, discountedBasePrice } = useMemo(
    () => resolveDiscount(detailTrim, basePriceValue),
    [detailTrim, basePriceValue],
  );

  const totalPriceValue =
    (discountedBasePrice > 0 ? discountedBasePrice : basePriceValue) + optionPriceTotal + colorPriceTotal;

  const heroImage =
    resolveColorImageUrl(selectedColor) ||
    findBestMatchingColorImageUrl(selectedColor, [selectedTrimDetail, detailTrim, vehicleLineModels]) ||
    selectedTrimDetail?.imageUrl ||
    selectedTrimDetail?.images?.[0] ||
    selectedTrim?.imageUrl ||
    FALLBACK_IMAGE;

  // 차명은 모델 그룹명(예: "투싼 하이브리드")을 우선한다.
  const vehicleLineName =
    selectedTrim?.modelName ||
    selectedTrim?.vehicleLineName ||
    selectedTrimDetail?.vehicleLineName ||
    selectedTrimDetail?.name ||
    selectedTrim?.name ||
    '';
  const carName = vehicleLineName || '차량';
  const brandName = selectedTrimDetail?.brandName ?? '';

  const { title: seoTitle, description: seoDescription, keywords: seoKeywords } = useMemo(
    () =>
      buildCarDetailSeo({ brand: brandName, model: carName, segment: null, fuelOrType: null, period: contractPeriod, mileage }),
    [brandName, carName, contractPeriod, mileage],
  );

  const availableMethods = brandOrigin === '수입차' ? ['장기렌탈', '리스', '신차구입(할부)'] : ['장기렌탈', '리스'];
  const periodLabel = (label) => (brandOrigin === '수입차' && label === '24개월' ? '일시불' : label);

  const contractTerms = useMemo(() => {
    const terms = [];
    if (contractMethod) terms.push(contractMethod);
    if (contractPeriod) terms.push(periodLabel(contractPeriod));
    if (deposit && deposit !== '없음') terms.push(`보증금 ${deposit}`);
    if (prepayment && prepayment !== '없음') terms.push(`선납금 ${prepayment}`);
    if (mileage) terms.push(mileage);
    return terms;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractMethod, contractPeriod, deposit, prepayment, mileage, brandOrigin]);

  const scrollToNextSection = useCallback(() => {
    requestAnimationFrame(() => {
      const target = nextSectionRef.current;
      if (!target || typeof window.scrollTo !== 'function') return;
      const header = document.querySelector('.m-sub');
      const headerHeight = header ? header.getBoundingClientRect().height : 0;
      window.scrollTo({ top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerHeight), behavior: 'smooth' });
    });
  }, []);

  const handleSelectTrim = (trim) => {
    const nextId = normalizeId(trim?.id);
    if (!nextId) return;
    setSelectedTrimId(nextId);
    scrollToNextSection();
  };

  const toggleOption = (option) => {
    const optionId = normalizeId(option.id);
    if (!optionId) return;
    setSelectedOptionIds((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) next.delete(optionId);
      else next.add(optionId);
      return next;
    });
  };

  const handleSelectContract = (type, value) => {
    switch (type) {
      case 'method':
        setContractMethod(value);
        setContractPeriod(DEFAULT_CONTRACT.contractPeriod);
        setDeposit(DEFAULT_CONTRACT.deposit);
        setPrepayment(DEFAULT_CONTRACT.prepayment);
        setMileage(DEFAULT_CONTRACT.mileage);
        setInsuranceAge(DEFAULT_CONTRACT.insuranceAge);
        break;
      case 'period':
        setContractPeriod(value);
        break;
      case 'deposit':
        if (parsePercent(value) + parsePercent(prepayment) > 40) {
          showToast(PERCENT_LIMIT_MESSAGE);
          return;
        }
        setDeposit(value);
        break;
      case 'prepayment':
        if (parsePercent(deposit) + parsePercent(value) > 40) {
          showToast(PERCENT_LIMIT_MESSAGE);
          return;
        }
        setPrepayment(value);
        break;
      case 'mileage':
        setMileage(value);
        break;
      case 'insurance':
        setInsuranceAge(value);
        break;
      default:
        break;
    }
  };

  const contractRows = [
    { key: 'method', label: '이용방법', value: contractMethod, options: availableMethods.map((m) => [m, methodLabel(m)]) },
    { key: 'period', label: '계약기간', value: contractPeriod, options: CONTRACT_PERIOD_OPTIONS.map((p) => [p, periodLabel(p)]) },
    { key: 'deposit', label: '보증금', value: deposit, options: DEPOSIT_OPTIONS.map((d) => [d, d]) },
    { key: 'prepayment', label: '선납금', value: prepayment, options: PREPAYMENT_OPTIONS.map((p) => [p, p]) },
    { key: 'mileage', label: '연간 약정운행거리', value: mileage, options: MILEAGE_OPTIONS.map((m) => [m, m]) },
    { key: 'insurance', label: '보험 연령', value: insuranceAge, options: INSURANCE_AGE_OPTIONS.map((a) => [a, a]) },
  ];

  // 상담 접수 시 넘길 선택 내용 (기존 모바일 상세 상담 payload 와 같은 구성).
  // 브랜드·모델은 견적 모달의 차종 칸(carName)에 이미 들어가므로 여기에는 넣지 않는다.
  const modelLabel = selectedTrim ? [selectedTrim.modelName, selectedTrim.name].filter(Boolean).join(' · ') : vehicleLineName;
  const colorLabel = selectedColor?.name ?? '';
  const buildConsultDetails = () => ({
    brand: brandName || '',
    trim: selectedTrim?.name || '',
    color: colorLabel,
    options: [colorLabel ? `색상: ${colorLabel}` : '', ...selectedOptions.map((option) => option.name ?? '')].filter(Boolean),
    terms: contractTerms,
    consultType: '차량라인상세',
    entryLabel: `모바일 차량 상세 > ${vehicleLineName}`,
    extra: { vehicleLineId: Number(carId) || null, trimId: selectedTrimId ?? null },
  });

  const handleQuote = () => {
    // 세 번째 인자로 넘긴 트림·색상·옵션·계약조건을 견적 모달이 상담 내용에 함께 싣는다.
    openQuote([brandName, modelLabel].filter(Boolean).join(' '), 'm-car-detail-bar', buildConsultDetails());
  };

  // 선택 내용을 URL 에 남겨 공유·새로고침 시 복원한다 (연락처 등 민감정보 제외).
  useShareableConsultUrl(
    () => ({
      brand: brandName,
      model: vehicleLineName || '',
      vehicleLineId: Number(carId) || '',
      trimId: selectedTrimId || '',
      colorId: normalizeId(selectedColor?.id) ?? '',
      optionIds: selectedOptions.map((option) => option.id).filter((id) => id != null),
      terms: contractTerms,
      consultType: '차량라인상세',
      source: 'mobile-car-detail',
    }),
    (preset) => {
      if (preset?.trimId) setSelectedTrimId(normalizeId(preset.trimId));
    },
    [brandName, vehicleLineName, carId, selectedTrimId, selectedColor, selectedOptions, contractTerms],
  );

  const seo = <SeoHelmet title={seoTitle} description={seoDescription} keywords={seoKeywords} image={heroImage} />;

  const waitingTrimDetail = !selectedTrim || ((isLoadingTrimDetail || isFetchingTrimDetail) && !selectedTrimDetail);
  if (isLoadingModels || (allTrims.length > 0 && waitingTrimDetail)) {
    return (
      <>
        {seo}
        <DetailShell message="차량 정보를 불러오는 중..." />
      </>
    );
  }

  if (isErrorModels || vehicleLineModels.length === 0) {
    return (
      <>
        {seo}
        <DetailShell message="차량 정보를 불러오지 못했습니다." />
      </>
    );
  }

  const isImported = brandOrigin === '수입차';
  const hasManyGroups = vehicleLineModels.length > 1;

  return (
    <>
      {seo}
      <MobileSubHeader title={carName} />

      <main id="main-content">
        <div className="m-cd-media">
          <img key={heroImage} src={heroImage} alt={carName} />
        </div>

        <div className="m-cd-title">
          <h1>{carName}</h1>
          <div className="m-cd-title__meta">
            {brandName ? <span>{brandName}</span> : null}
            {brandOrigin ? <span className={`m-cd-origin${isImported ? ' is-imported' : ''}`}>{brandOrigin}</span> : null}
          </div>
        </div>

        {visibleColors.length > 0 ? (
          <section className="m-cd-block">
            <h2 className="m-cd-block__title">외장색상 선택</h2>
            <p className="m-cd-colorname">
              선택한 색상 <strong>{colorLabel || '-'}</strong>
            </p>
            <div className="m-cd-palette">
              {visibleColors.map((color) => {
                const colorId = normalizeId(color.id);
                const selected = normalizeId(selectedColor?.id) === colorId;
                return (
                  <button
                    key={colorId}
                    className={`m-cd-swatch${selected ? ' is-selected' : ''}`}
                    type="button"
                    style={{ background: resolveChipColor(color) || '#d1d5db' }}
                    aria-label={color.name}
                    aria-pressed={selected}
                    title={color.name}
                    onClick={() => setSelectedColorId(colorId)}
                  />
                );
              })}
            </div>
            <p className="m-cd-note">* 일부 외장색상은 추가 요금이 발생할 수 있습니다.</p>
          </section>
        ) : null}

        <section className="m-cd-block">
          <h2 className="m-cd-block__title">모델 선택</h2>
          {vehicleLineModels.map((model) => {
            const open = !hasManyGroups || openModelGroup === model.name;
            return (
              <div key={model.id ?? model.name} className={hasManyGroups ? styles.group : undefined}>
                {hasManyGroups ? (
                  <button
                    type="button"
                    className={styles.groupHead}
                    aria-expanded={open}
                    onClick={() => setOpenModelGroup(open ? null : model.name)}
                  >
                    <span>{model.name}</span>
                    <span className={styles.groupIcon} aria-hidden="true">
                      {open ? '−' : '+'}
                    </span>
                  </button>
                ) : null}
                {open
                  ? model.trims.map((trim) => {
                      const active = trim.id === selectedTrimId;
                      return (
                        <button
                          key={trim.id}
                          className={`m-cd-trim${active ? ' is-active' : ''}`}
                          type="button"
                          aria-pressed={active}
                          onClick={() => handleSelectTrim(trim)}
                        >
                          <span className="m-cd-radio">{active ? '✓' : ''}</span>
                          <span className="m-cd-trim__name">{trim.name}</span>
                          <span className="m-cd-trim__price">{formatCurrency(trimPrice(trim))}</span>
                        </button>
                      );
                    })
                  : null}
              </div>
            );
          })}
        </section>

        {trimOptions.length > 0 ? (
          <section className="m-cd-block" ref={nextSectionRef}>
            <h2 className="m-cd-block__title">옵션 선택</h2>
            {trimOptions.map((option) => {
              const optionId = normalizeId(option.id);
              const active = selectedOptionIds.has(optionId);
              const price = optionPrice(option);
              return (
                <button
                  key={optionId ?? option.name}
                  className={`m-cd-trim${active ? ' is-active' : ''}`}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleOption(option)}
                >
                  <span className={`m-cd-radio ${styles.check}`}>{active ? '✓' : ''}</span>
                  <span className="m-cd-trim__name">{option.name}</span>
                  <span className="m-cd-trim__price">{price ? `+${formatCurrency(price)}` : '0원'}</span>
                </button>
              );
            })}
          </section>
        ) : null}

        <section className="m-cd-block" ref={trimOptions.length > 0 ? undefined : nextSectionRef}>
          <h2 className="m-cd-block__title">이용조건 선택</h2>
          {contractRows.map((row) => (
            <div className="m-cd-row" key={row.key}>
              <span className="m-cd-row__label">{row.label}</span>
              <div className="m-cd-row__opts">
                {row.options.map(([value, label]) => (
                  <button
                    key={value}
                    className={`m-cd-opt${row.value === value ? ' is-active' : ''}`}
                    type="button"
                    aria-pressed={row.value === value}
                    onClick={() => handleSelectContract(row.key, value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="m-cd-block">
          <h2 className="m-cd-block__title">내 차 견적서</h2>
          <div className="m-cd-sum">
            <span>{selectedTrim?.name || '기본 차량 가격'}</span>
            <strong>{formatCurrency(basePriceValue)}</strong>
          </div>
          <div className="m-cd-sum">
            <span>차량 외장색상</span>
            <strong>
              {colorLabel || '선택 없음'}
              {colorPriceTotal > 0 ? ` (+${colorPriceTotal.toLocaleString()}원)` : ''}
            </strong>
          </div>
          {selectedOptions.map((option) => (
            <div className="m-cd-sum" key={normalizeId(option.id) ?? option.name}>
              <span>{option.name}</span>
              <strong>+{optionPrice(option).toLocaleString()}원</strong>
            </div>
          ))}
          {discountAmount > 0 ? (
            <div className="m-cd-sum m-cd-sum--off">
              <span>즉시 할인 혜택</span>
              <strong>-{discountAmount.toLocaleString()}원</strong>
            </div>
          ) : null}
          <div className="m-cd-sum m-cd-sum--total">
            <span>총 차량가격</span>
            <strong>{formatCurrency(totalPriceValue)}</strong>
          </div>
          <p className="m-cd-note">* 트림·옵션·가격은 제조사 정책에 따라 변경될 수 있습니다.</p>
        </section>
      </main>

      <div className="m-cd-bar">
        <div className="m-cd-bar__price">
          <small>총 차량가격</small>
          <strong>{formatCurrency(totalPriceValue)}</strong>
        </div>
        <button className="m-cd-bar__btn" type="button" onClick={handleQuote}>
          실시간 견적받기
        </button>
      </div>
    </>
  );
}
