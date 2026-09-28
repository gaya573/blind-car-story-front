import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import styles from './MobleCarDetail.module.css';
import MobileContactModal from '../../components/MobileContactModal.jsx';
import OptionPopupMobile from '../../components/OptionPopupMobile';
import ConsultSuccessModal from '../../components/ConsultSuccessModal.jsx';
import { carAPI } from '../../services/carApi.js';
import { useShareableConsultUrl } from '../../utils/shareableUrl';
import Toast from '../../components/Toast.jsx';
import PrivacyConsentCheckbox from '../../components/PrivacyConsentCheckbox.jsx';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import { buildCarDetailSeo } from '../../utils/seoBuilders';
import KakaoConsultButton from '../../components/KakaoConsultButton';
import ContractSection from '../../components/ContractSection.jsx';
import pcContractStyles from '../../pages/Car/CarDetail.module.css';
import OptionSelectorMobile from '../../components/OptionSelectorMobile';
import { findBestMatchingColorImageUrl } from '../../utils/colorImageFallback';
import { formatTrimDisplayName, hasAssistTaxiTrimLabel } from '../../utils/trimDisplayName';

const PRICE_PLACEHOLDER = '가격문의';

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

// 색상 코드 유효성 체크
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
  if (/^linear-gradient\(/i.test(trimmed)) return true;
  if (/^rgba?\(/i.test(trimmed)) return true;
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed);
};

// 색상 칩용 변환
const inferColorFromName = (name = '') => {
  const text = String(name).toLowerCase();
  if (!text) return null;

  const normalizePart = (part) => part.replace(/\([^)]*\)|\[[^\]]*\]/g, ' ').trim();
  const colorParts = text.split(/[\/|+]/).map(normalizePart).filter(Boolean);
  const rules = [
    { tokens: ['abyss', '\uc5b4\ube44\uc2a4'], color: '#07080A' },
    { tokens: ['phantom', '\ud32c\ud140'], color: '#090A0D' },
    { tokens: ['space black', 'black', '\uc2a4\ud398\uc774\uc2a4 \ube14\ub799', '\ube14\ub799'], color: '#0B0B0D' },
    { tokens: ['neoteric', 'yellow', '\ub124\uc624\ud14c\ub9ad', '\uc610\ub85c\uc6b0'], color: '#C6CF22' },
    { tokens: ['mirage', '\ubbf8\ub77c\uc9c0'], color: '#5F7065' },
    { tokens: ['forest', '\ud3ec\ub808\uc2a4\ud2b8'], color: '#244235' },
    { tokens: ['robust', 'emerald', '\ub85c\ubc84\uc2a4\ud2b8', '\uc5d0\uba54\ub784\ub4dc'], color: '#0F3E35' },
    { tokens: ['intense blue', '\uc778\ud150\uc2a4'], color: '#173E6D' },
    { tokens: ['dandy blue', '\ub304\ub514'], color: '#1E4F86' },
    { tokens: ['denim blue', '\ub370\ub2d8'], color: '#2A5872' },
    { tokens: ['yacht', '\uc694\ud2b8'], color: '#2E5368' },
    { tokens: ['transmission blue', '\ud2b8\ub79c\uc2a4\ubbf8\uc158'], color: '#435E6C' },
    { tokens: ['blue dusk', '\ube14\ub8e8 \ub354\uc2a4\ud06c'], color: '#3E5262' },
    { tokens: ['meta blue', 'moonlight', 'blue', '\uba54\ud0c0\ube14\ub8e8', '\ubb38\ub77c\uc774\ud2b8', '\ube14\ub8e8', 'navy', '\ub124\uc774\ube44'], color: '#2E5674' },
    { tokens: ['ultimate', 'red', '\uc5bc\ud2f0\uba54\uc774\ud2b8', '\ub808\ub4dc', 'crimson', 'burgundy', '\ubc84\uac74\ub514'], color: '#A51D2D' },
    { tokens: ['grand white', '\uadf8\ub79c\ub4dc \ud654\uc774\ud2b8'], color: '#F4F3EE' },
    { tokens: ['glacier white', '\uae00\ub808\uc774\uc154'], color: '#F1F3F2' },
    { tokens: ['chalk white', 'chalkwhite', '\ucd08\ud06c\ud654\uc774\ud2b8'], color: '#E9E9E2' },
    { tokens: ['atlas', '\uc544\ud2c0\ub77c\uc2a4'], color: '#F5F6F1' },
    { tokens: ['creamy', 'clear white', 'white', 'snow', '\ud654\uc774\ud2b8', '\uc2a4\ub178\uc6b0', '\ud074\ub9ac\uc5b4'], color: '#F3F1EA' },
    { tokens: ['shimmering', '\uc26c\uba38\ub9c1'], color: '#C4C8C7' },
    { tokens: ['silver', '\uc2e4\ubc84'], color: '#B8B6AA' },
    { tokens: ['iron metal', '\uc544\uc774\uc5b8'], color: '#5E6466' },
    { tokens: ['cyber gray', '\uc0ac\uc774\ubc84'], color: '#687071' },
    { tokens: ['ecotronic', '\uc5d0\ucf54\ud2b8\ub85c\ub2c9'], color: '#626B6B' },
    { tokens: ['moonstone', '\ubb38\uc2a4\ud1a4'], color: '#73797A' },
    { tokens: ['nocturne', '\ub179\ud134'], color: '#4D5356' },
    { tokens: ['moonscape', '\ubb38\uc2a4\ucf00\uc774\ud504'], color: '#555B5D' },
    { tokens: ['urban gray', '\uc5b4\ubc18 \uadf8\ub808\uc774'], color: '#6E7472' },
    { tokens: ['celadon gray', '\uc140\ub77c\ub3c8'], color: '#879087' },
    { tokens: ['shadow matte gray', '\uc250\ub3c4\uc6b0'], color: '#56595A' },
    { tokens: ['graphite', 'gravity', 'gray', 'grey', 'metal', '\uadf8\ub798\ube44\ud2f0', '\uadf8\ub808\uc774', '\uba54\ud0c8'], color: '#7B8083' },
    { tokens: ['latte greige', 'greige', '\ub77c\ub5bc', '\uadf8\ub808\uc774\uc9c0'], color: '#A49D8F' },
    { tokens: ['ivory', '\uc544\uc774\ubcf4\ub9ac'], color: '#B8B6AA' },
    { tokens: ['gravity gold', 'gold', '\uadf8\ub798\ube44\ud2f0 \uace8\ub4dc', '\uace8\ub4dc'], color: '#8E7D54' },
    { tokens: ['green', '\uadf8\ub9b0', 'khaki', '\uce74\ud0a4', 'ocado', '\uc624\uce74\ub3c4'], color: '#284F3B' },
    { tokens: ['cast iron brown', '\uce90\uc2a4\ud2b8 \uc544\uc774\uc5b8 \ube0c\ub77c\uc6b4'], color: '#4A382F' },
    { tokens: ['frosted brown', '\ud504\ub85c\uc2a4\ud2f0\ub4dc'], color: '#6D574A' },
    { tokens: ['brown', 'terracotta', 'copper', '\ube0c\ub77c\uc6b4', '\ud14c\ub77c\ucf54\ud0c0', '\ucf54\ud37c'], color: '#805131' },
    { tokens: ['beige', 'sand', '\ubca0\uc774\uc9c0', '\uc0cc\ub4dc'], color: '#C5B49A' },
    { tokens: ['orange', 'sienna', 'siena', '\uc624\ub80c\uc9c0'], color: '#B86432' },
  ];

  const pick = (source) => {
    const rule = rules.find((item) => item.tokens.some((token) => source.includes(token)));
    return rule ? { color: rule.color } : null;
  };
  const isRoofBlack = (part = '') =>
    ['black', 'abyss', 'phantom', '\ube14\ub799', '\uc5b4\ube44\uc2a4', '\ud32c\ud140'].some((token) =>
      part.includes(token),
    );

  const parsedParts = colorParts.map((part) => ({ part, match: pick(part) })).filter((item) => item.match);
  if (parsedParts.length >= 2) {
    const firstPart = parsedParts[0];
    const secondPart = parsedParts[1];
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

const resolveChipColor = (color) => {
  const raw =
    color?.hexCode ||
    color?.colorCode ||
    color?.rgb ||
    color?.rgbCode ||
    '';

  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (/^linear-gradient\(/i.test(trimmed)) return trimmed;
  const inferredColor = inferColorFromName(color?.name, raw);
  if (!trimmed) return inferredColor;

  if (/^rgba?\(/i.test(trimmed)) {
    return inferredColor || trimmed;
  }

  const hexMatch = trimmed.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!hexMatch) {
    return inferredColor;
  }

  const hex = hexMatch[1];
  const normalized = `#${hex.length === 3 ? hex : hex.toUpperCase()}`;
  if (inferredColor?.startsWith('linear-gradient(')) return inferredColor;

  const genericColor = [
    '#777777', '#888888', '#999999', '#808080', '#777', '#888', '#999',
    '#000000', '#111111', '#FF0000', '#0000FF', '#008000', '#00FF00', '#A52A2A',
  ].includes(normalized.toUpperCase());
  return inferredColor && genericColor ? inferredColor : normalized;
};

const renderColorName = (name) =>
  String(name || '')
    .split('/')
    .map((part, index) => (
      <React.Fragment key={`${index}-${part}`}>
        {index > 0 && <br />}
        {part.trim()}
      </React.Fragment>
    ));

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

const canDisplayColor = (color) => Boolean(resolveColorImageUrl(color) || resolveChipColor(color));

const getDisplayColors = (colors) => {
  if (!Array.isArray(colors)) return [];
  const validColors = colors.filter(canDisplayColor);
  const exteriorColors = validColors.filter((color) => !color?.vehicleInterior);
  return exteriorColors.length > 0 ? exteriorColors : validColors;
};

// 계약 옵션 상수 (PC 웹 CarDetail와 동일하게 유지)
const CONTRACT_PERIOD_OPTIONS = ['24개월', '36개월', '48개월', '60개월'];
const DEPOSIT_OPTIONS = ['없음', '10%', '20%', '30%', '40%'];
const PREPAYMENT_OPTIONS = ['없음', '10%', '20%', '30%', '40%'];
const MILEAGE_OPTIONS = ['연 1만km', '연 2만km', '연 3만km', '연 4만km~'];

// 이용방법별 기본 계약 조건 (PC 웹과 정책을 맞춰야 할 경우 여기만 수정)
const getDefaultContractConfigForMethod = (method) => {
  switch (method) {
    case '리스':
      return {
        contractPeriod: '48개월',
        deposit: '없음',
        prepayment: '30%',
        mileage: '연 2만km',
        carTax: '포함',
        insuranceAge: '만 26세 이상',
      };
    case '신차구입(할부)':
      return {
        contractPeriod: '48개월',
        deposit: '없음',
        prepayment: '30%',
        mileage: '연 2만km',
        carTax: '포함',
        insuranceAge: '만 26세 이상',
      };
    case '장기렌탈':
    default:
      return {
        contractPeriod: '48개월',
        deposit: '없음',
        prepayment: '30%',
        mileage: '연 2만km',
        carTax: '포함',
        insuranceAge: '만 26세 이상',
      };
  }
};

const buildModelGroups = (models, selectedTrimId) => {
  if (!Array.isArray(models) || models.length === 0) return [];
  return models
    .map((model) => {
      const modelName = model.name || model.modelName || model.modelCode || '세부모델';
      const options = (model.trims ?? []).map((trim) => {
        const trimId = normalizeId(trim.id);
        const trimName = formatTrimDisplayName(trim.name || trim.trimName || '세부모델', modelName, trim);
        return {
          name: trimName,
          price: formatCurrency(trim.originalPrice ?? trim.original_price ?? trim.basePrice ?? trim.price),
          value: trimId ?? trim.name,
          raw: { ...trim, name: trimName },
          groupTitle: modelName,
          selected: trimId === selectedTrimId,
        };
      });
      return {
        title: modelName,
        multiple: false,
        options,
      };
    })
    .filter((group) => group.options.length > 0);
};

const buildOptionGroups = (options, saved = {}) => {
  if (!Array.isArray(options) || options.length === 0) return [];
  const grouped = options.reduce((acc, option) => {
    const title = option.category || option.groupName || '추가 옵션';
    if (!acc[title]) acc[title] = [];
    const value = normalizeId(option.id) ?? option.name;
    acc[title].push({
      name: option.name || '옵션',
      price: (() => {
        const discounted = parsePriceValue(option.discountedPrice);
        if (discounted) return `${discounted.toLocaleString()}원`;
        const regular = parsePriceValue(option.price ?? option.amount);
        return regular ? `${regular.toLocaleString()}원` : undefined;
      })(),
      value,
      raw: option,
      selected: false,
    });
    return acc;
  }, {});

  return Object.entries(grouped).map(([title, items]) => {
    const savedOption = saved?.[title];
    const savedArray = Array.isArray(savedOption)
      ? savedOption
      : savedOption
        ? [savedOption]
        : [];
    const savedValues = new Set(savedArray.map((entry) => entry.value ?? entry.name));
    return {
      title,
      multiple: true,
      options: items.map((item) => {
        const optionValue = item.value ?? item.name;
        return {
          ...item,
          selected: savedValues.has(optionValue),
          groupTitle: title,
        };
      }),
    };
  });
};

const buildColorGroups = (colors, saved = {}) => {
  if (!Array.isArray(colors) || colors.length === 0) return [];
  const grouped = colors.reduce((acc, color) => {
    const isInterior = Boolean(color.vehicleInterior);
    const title = isInterior ? '내장 색상' : '외장 색상';
    if (!acc[title]) acc[title] = [];
    const value = normalizeId(color.id) ?? color.name;
    acc[title].push({
      name: color.name || '색상',
      price: (() => {
        const additional = parsePriceValue(color.additionalPrice ?? color.price);
        return additional > 0 ? `${additional.toLocaleString()}원` : undefined;
      })(),
      value,
      raw: color,
      selected: false,
    });
    return acc;
  }, {});

  return Object.entries(grouped).map(([title, items]) => {
    const savedOption = saved?.[title];
    const savedValue = savedOption ? (Array.isArray(savedOption) ? savedOption[0] : savedOption) : null;
    const savedKey = savedValue ? savedValue.value ?? savedValue.name : null;
    return {
      title,
      multiple: false,
      options: items.map((item) => {
        const optionValue = item.value ?? item.name;
        return {
          ...item,
          selected: Boolean(savedKey) && savedKey === optionValue,
          groupTitle: title,
        };
      }),
    };
  });
};

const buildContractGroups = (config, saved = {}) => {
  // PC 웹(CarDetail)과 동일한 계약 조건 옵션 구성 (모바일 팝업 전용)
  const {
    availableMethods = ['장기렌탈', '리스'],
    contractMethod = '장기렌탈',
    contractPeriod = '48개월',
    deposit = '없음',
    prepayment = '30%',
    mileage = '20,000km',
    carTax = '포함',
    insuranceAge = '만 26세이상',
    brandOrigin = null,
  } = config || {};

  const isFinanceMode = brandOrigin === '수입차' && contractMethod === '신차구입(할부)';

  const groups = [
    {
      title: '이용방법',
      options: availableMethods.map((method) => ({
        name: method === '장기렌탈' ? '장기렌트' : method,
        value: method,
      })),
    },
    {
      title: isFinanceMode ? '할부기간' : '계약기간',
      options: CONTRACT_PERIOD_OPTIONS.map((label) => ({
        // 수입차인 경우에는 이용방법과 무관하게 24개월을 "일시불"로 표시
        name: brandOrigin === '수입차' && label === '24개월' ? '일시불' : label,
        value: label,
      })),
    },
  ];

  // 렌트/리스 공통 필드
  if (!isFinanceMode) {
    // 팝업에서는 선납금 → 보증금 → 연간 약정운행거리 순서
    groups.push(
      {
        title: '선납금',
        options: [
          ...PREPAYMENT_OPTIONS.map((label) => ({ name: label, value: label })),
        ],
      },
      {
        title: '보증금',
        options: [
          ...DEPOSIT_OPTIONS.map((label) => ({ name: label, value: label })),
        ],
      },
      {
        title: '연간 약정운행거리',
        options: [
          ...MILEAGE_OPTIONS.map((label) => ({ name: label, value: label })),
        ],
      },
    );
  } else {
    // 금융상품(신차구입)에서는 선납금만 노출
    groups.push({
      title: '선납금',
      options: [
        ...PREPAYMENT_OPTIONS.map((label) => ({ name: label, value: label })),
      ],
    });
  }

  // 리스일 때만 자동차세 노출
  if (!isFinanceMode && contractMethod === '리스') {
    groups.push({
      title: '자동차세',
      options: [
        { name: '포함', value: '포함' },
        { name: '미포함', value: '미포함' },
      ],
    });
  }

  // 장기렌트(국산/수입 공통)일 때 보험 연령 노출
  if (!isFinanceMode && contractMethod === '장기렌탈') {
    groups.push({
      title: '보험 연령',
      options: [
        { name: '만 26세이상', value: '만 26세이상' },
        { name: '만 21세이상', value: '만 21세이상' },
      ],
    });
  }

  return groups.map((group) => {
    const savedOption = saved?.[group.title];
    const savedValue =
      savedOption && !Array.isArray(savedOption)
        ? savedOption.value ?? savedOption.name
        : undefined;

    let defaultValue;
    switch (group.title) {
      case '이용방법':
        defaultValue = contractMethod;
        break;
      case '계약기간':
        defaultValue = contractPeriod;
        break;
      case '보증금':
        defaultValue = deposit;
        break;
      case '연간 약정운행거리':
        defaultValue = mileage;
        break;
      case '선납금':
        defaultValue = prepayment;
        break;
      case '자동차세':
        defaultValue = carTax;
        break;
      case '보험 구분':
        defaultValue = insuranceAge;
        break;
      default:
        defaultValue = undefined;
    }

    const selectedValue = savedValue || defaultValue;

    return {
      ...group,
      multiple: false,
      options: group.options.map((option, index) => {
        const optionValue = option.value ?? option.name;
        return {
          ...option,
          value: optionValue,
          groupTitle: group.title,
          selected: selectedValue ? selectedValue === optionValue : index === 0,
        };
      }),
    };
  });
};

export default function MobleCarDetail() {
  const navigate = useNavigate();
  const { carId } = useParams();
  const [searchParams] = useSearchParams();
  const initialTrimIdFromQuery = normalizeId(searchParams.get('trimId'));
  const optionSectionRef = useRef(null);

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [activePicker, setActivePicker] = useState(null);
  const [pickerVariantGroups, setPickerVariantGroups] = useState([]);
  const [selectedTrimId, setSelectedTrimId] = useState(initialTrimIdFromQuery);
  const [selectedColorId, setSelectedColorId] = useState(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState(new Set());
  const [selectedSummary, setSelectedSummary] = useState({
    model: '',
    option: '',
    color: '',
    contract: '',
  });
  const [savedSelections, setSavedSelections] = useState({
    option: {},
    color: {},
    contract: {},
  });
  const [contractMethod, setContractMethod] = useState('장기렌탈');
  const [contractPeriod, setContractPeriod] = useState('48개월');
  const [deposit, setDeposit] = useState('없음');
  const [prepayment, setPrepayment] = useState('30%');
  const [mileage, setMileage] = useState('연 2만km');
  const [carTax, setCarTax] = useState('포함');
  const [insuranceAge, setInsuranceAge] = useState('만 26세 이상');
  const [showPercentToast, setShowPercentToast] = useState(false);
  const [isBottomPrivacyAgreed, setIsBottomPrivacyAgreed] = useState(true);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [openModelGroupTitle, setOpenModelGroupTitle] = useState(null);

  const scrollToOptionSection = useCallback(() => {
    if (!optionSectionRef.current) return;
    requestAnimationFrame(() => {
      const rect = optionSectionRef.current.getBoundingClientRect();
      const scrollTop = window.scrollY || window.pageYOffset;
      const header = document.querySelector('header');
      const headerHeight = header ? header.getBoundingClientRect().height : 0;
      const offset = headerHeight + 58; // 헤더 높이 + 소량 여백만큼만 위로 당겨 상단에 맞춤
      window.scrollTo({
        top: Math.max(0, rect.top + scrollTop - offset),
        behavior: 'smooth',
      });
    });
  }, []);
  useEffect(() => {
    if (initialTrimIdFromQuery) {
      setSelectedTrimId(initialTrimIdFromQuery);
    }
  }, [initialTrimIdFromQuery]);

  const {
    data: vehicleLineModels = [],
    isLoading: isLoadingModels,
    isError: isErrorModels,
  } = useQuery({
    queryKey: ['mobile-car-line-models', carId],
    queryFn: async () => {
      const vehicleLineId = Number(carId);
      if (!vehicleLineId) {
        return [];
      }
      const models = await carAPI.getModels(vehicleLineId);
      if (!Array.isArray(models) || models.length === 0) {
        return [];
      }

      const modelsWithTrims = await Promise.all(
        models.map(async (model) => {
          const trims = await carAPI.getTrimsByModel(model.id);
          const modelName = model.name || model.modelName || model.modelCode || '세부모델';
          const normalizedTrims = (Array.isArray(trims) ? trims : []).map((trim) => {
            const trimId = normalizeId(trim.id);
            const trimName = formatTrimDisplayName(trim.name || trim.trimName || '세부모델', modelName, trim);
            return {
              ...trim,
              id: trimId,
              name: trimName,
              basePrice: parsePriceValue(trim.originalPrice ?? trim.original_price ?? trim.basePrice ?? trim.price ?? 0),
              modelId: normalizeId(model.id),
              modelName,
              vehicleLineName: model.vehicleLineName ?? model.vehicleLine ?? model.name ?? '',
            };
          });

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
    },
    enabled: Boolean(carId),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const allTrims = useMemo(
    () =>
      vehicleLineModels.flatMap((model) =>
        (model.trims ?? []).map((trim) => ({
          ...trim,
          modelName: model.name,
          vehicleLineName: model.vehicleLineName ?? trim.vehicleLineName ?? '',
        })),
      ),
    [vehicleLineModels],
  );

  useEffect(() => {
    if (!allTrims.length) return;
    setSelectedTrimId((prev) => {
      if (prev && allTrims.some((trim) => trim.id === prev)) {
        return prev;
      }
      const firstTrim = allTrims[0];
      if (firstTrim) {
        setSelectedSummary((prevSummary) => ({
          ...prevSummary,
          model: firstTrim.modelName ? `${firstTrim.modelName} · ${firstTrim.name}` : firstTrim.name,
        }));
        return normalizeId(firstTrim.id);
      }
      return prev;
    });
  }, [allTrims]);

  const selectedTrim = useMemo(
    () => allTrims.find((trim) => trim.id === selectedTrimId) ?? null,
    [allTrims, selectedTrimId],
  );

  useEffect(() => {
    if (!selectedTrim) return;
    setSelectedSummary((prevSummary) => {
      const modelLabel = selectedTrim.modelName
        ? `${selectedTrim.modelName} · ${selectedTrim.name}`
        : selectedTrim.name;
      if (prevSummary.model === modelLabel) {
        return prevSummary;
      }
      return {
        ...prevSummary,
        model: modelLabel,
      };
    });
  }, [selectedTrim]);

  const {
    data: selectedTrimDetail,
    isLoading: isLoadingTrimDetail,
    isFetching: isFetchingTrimDetail,
  } = useQuery({
    queryKey: ['mobile-car-trim-detail', selectedTrimId],
    queryFn: async () => {
      if (!selectedTrimId) {
        return null;
      }
      // Blind CarStory 전용 /api/user/cars/{trimId}/detail 이 imageUrl 을 내려주도록 변경되었으므로
      // 여기서는 해당 응답만 사용한다.
      return carAPI.getCarDetail(selectedTrimId);
    },
    enabled: Boolean(selectedTrimId),
    staleTime: 1000 * 60,
    keepPreviousData: true,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    setSavedSelections((prev) => ({
      ...prev,
      option: {},
      color: {},
    }));
    setSelectedOptionIds(new Set());
    setSelectedSummary((prev) => ({
      ...prev,
      option: '',
      color: '',
    }));
  }, [selectedTrimId]);

  const detailTrim = useMemo(() => {
    if (!selectedTrimDetail) return null;
    if (Array.isArray(selectedTrimDetail?.trims)) {
      return selectedTrimDetail.trims.find((trim) => normalizeId(trim.id) === selectedTrimId) ?? null;
    }
    return selectedTrimDetail;
  }, [selectedTrimDetail, selectedTrimId]);

  const trimOptions = detailTrim?.options ?? [];
  const trimColors = detailTrim?.colors ?? selectedTrimDetail?.availableColors ?? [];
  const hasOptions = Array.isArray(trimOptions) && trimOptions.length > 0;

  const optionGroups = useMemo(
    () => buildOptionGroups(trimOptions, savedSelections.option),
    [trimOptions, savedSelections.option],
  );

  const colorGroups = useMemo(
    () => buildColorGroups(trimColors, savedSelections.color),
    [trimColors, savedSelections.color],
  );

  const modelGroups = useMemo(
    () => buildModelGroups(vehicleLineModels, selectedTrimId),
    [vehicleLineModels, selectedTrimId],
  );

  useEffect(() => {
    if (!modelGroups.length) return;
    const selectedGroup = modelGroups.find((g) => g.options.some((o) => o.selected));
    if (selectedGroup) {
      setOpenModelGroupTitle(selectedGroup.title);
      return;
    }
    setOpenModelGroupTitle((prev) => prev || modelGroups[0]?.title || null);
  }, [modelGroups]);

  const selectedOptionEntries = useMemo(
    () =>
      Object.values(savedSelections.option || {}).flatMap((entry) => {
        if (Array.isArray(entry)) return entry;
        return entry ? [entry] : [];
      }),
    [savedSelections.option],
  );

  const selectedColorEntries = useMemo(
    () =>
      Object.values(savedSelections.color || {}).flatMap((entry) => {
        if (Array.isArray(entry)) return entry;
        return entry ? [entry] : [];
      }),
    [savedSelections.color],
  );

  const visibleColors = useMemo(
    () => getDisplayColors(trimColors),
    [trimColors],
  );

  const hasColors = Array.isArray(visibleColors) && visibleColors.length > 0;

  useEffect(() => {
    const colors = Array.isArray(trimColors) ? trimColors : [];
    const requestedColorId = normalizeId(searchParams.get('colorId'));
    if (requestedColorId) {
      const found = colors.find(
        (c) => normalizeId(c?.id) === requestedColorId && canDisplayColor(c),
      );
      if (found) {
        setSelectedColorId(requestedColorId);
        return;
      }
    }
    const first = getDisplayColors(colors)[0];
    setSelectedColorId(first ? normalizeId(first.id) : null);
  }, [trimColors, searchParams]);

  const selectedColor = useMemo(
    () =>
      visibleColors.find((c) => normalizeId(c.id) === selectedColorId) ||
      visibleColors[0] ||
      null,
    [visibleColors, selectedColorId],
  );

  useEffect(() => {
    // 선택된 색상 변경 시 이미지/hex 확인용 디버그 로그
    // eslint-disable-next-line no-console
    console.info('[MobleCarDetail] selectedColor 변경:', {
      selectedColorId,
      selectedColorName: selectedColor?.name,
      selectedColorImageUrl: selectedColor?.imageUrl,
      selectedColorHexCode: selectedColor?.hexCode || selectedColor?.colorCode || selectedColor?.rgbCode,
      selectedColorEntries,
      timestamp: new Date().toISOString(),
    });
  }, [selectedColor, selectedColorId, selectedColorEntries]);

  useEffect(() => {
    // 스와치 직접 선택 시 price/공유 로직에 반영되도록 savedSelections.color 동기화
    if (!selectedColor) {
      setSavedSelections((prev) => {
        if (!prev.color || Object.keys(prev.color).length === 0) return prev;
        return { ...prev, color: {} };
      });
      return;
    }

    const entryValue = normalizeId(selectedColor.id) ?? selectedColor.name;
    const entry = {
      name: selectedColor.name ?? '색상',
      value: entryValue,
      raw: selectedColor,
      groupTitle: selectedColor.vehicleInterior ? '내장 색상' : '외장 색상',
      selected: true,
    };

    setSavedSelections((prev) => {
      const current = prev.color?.[entry.groupTitle];
      const currentVal = Array.isArray(current) ? current[0] : current;
      if (currentVal && currentVal.value === entry.value) {
        return prev;
      }
      return {
        ...prev,
        color: { [entry.groupTitle]: entry },
      };
    });
  }, [selectedColor]);

  const selectedContractEntries = useMemo(
    () =>
      Object.values(savedSelections.contract || {}).flatMap((entry) => {
        if (Array.isArray(entry)) return entry;
        return entry ? [entry] : [];
      }),
    [savedSelections.contract],
  );

  const contractSummaryText = useMemo(() => {
    const parts = [];
    if (contractPeriod) parts.push(contractPeriod);
    if (prepayment && prepayment !== '없음') parts.push(`선납 ${prepayment}`);
    if (deposit && deposit !== '없음') parts.push(`보증금 ${deposit}`);
    if (mileage) parts.push(mileage);
    const summary = parts.length > 0 ? `${parts.join(' / ')} 기준` : '계약 조건을 선택해주세요';
    return summary;
  }, [contractPeriod, prepayment, deposit, mileage]);

  useEffect(() => {
    setSelectedSummary((prev) => {
      if (prev.contract === contractSummaryText) {
        return prev;
      }
      return {
        ...prev,
        contract: contractSummaryText,
      };
    });
  }, [contractSummaryText]);

  const optionItemsForCard = useMemo(
    () =>
      selectedOptionEntries.map((option) => ({
        name: option.name,
        price: parsePriceValue(
          option?.raw?.discountedPrice ?? option?.raw?.price ?? option?.raw?.amount ?? 0,
        ),
      })),
    [selectedOptionEntries],
  );

  const optionPriceTotal = useMemo(
    () => optionItemsForCard.reduce((sum, option) => sum + option.price, 0),
    [optionItemsForCard],
  );

  const colorPriceTotal = useMemo(() => {
    const popupTotal = selectedColorEntries.reduce(
        (sum, color) =>
          sum + parsePriceValue(color?.raw?.additionalPrice ?? color?.raw?.price ?? 0),
        0,
  );
    if (popupTotal > 0) return popupTotal;
    return parsePriceValue(selectedColor?.additionalPrice ?? selectedColor?.price ?? 0);
  }, [selectedColorEntries, selectedColor]);

  const additionsTotal = useMemo(
    () => optionPriceTotal + colorPriceTotal,
    [optionPriceTotal, colorPriceTotal],
  );

  const optionPriceLabel = useMemo(() => {
    if (additionsTotal > 0) {
      return `옵션/색상 +${additionsTotal.toLocaleString()}원 포함`;
    }
    return '옵션/색상 포함';
  }, [additionsTotal]);

  // 백엔드에서 내려주는 brandCountry 로 국산/수입 구분 (PC CarDetail와 동일 로직)
  const brandOrigin = useMemo(() => {
    if (!selectedTrimDetail?.brandCountry) return null;
    const country = (selectedTrimDetail.brandCountry || '').toUpperCase();
    if (!country) return null;
    const isDomestic =
      country === 'KR' ||
      country.includes('KOREA') ||
      country.includes('한국') ||
      country.includes('대한민국');
    return isDomestic ? '국산차' : '수입차';
  }, [selectedTrimDetail?.brandCountry]);

  const basePriceValue = useMemo(() => {
    const detailBase = parsePriceValue(
      detailTrim?.basePrice ?? detailTrim?.price ?? selectedTrimDetail?.basePrice ?? 0,
    );
    if (detailBase) return detailBase;
    return parsePriceValue(selectedTrim?.originalPrice ?? selectedTrim?.original_price ?? selectedTrim?.basePrice ?? selectedTrim?.price ?? 0);
  }, [detailTrim, selectedTrimDetail, selectedTrim]);

  // 트림별 할인 (백엔드 TrimDiscount/DiscountInfo 기반, 프론트에서 5% 하드코딩 없음)
  const {
    discountAmount,
    discountedBasePrice,
    discountPercent,
  } = useMemo(() => {
    if (!detailTrim || !basePriceValue) {
      return {
        discountAmount: 0,
        discountedBasePrice: 0,
        discountPercent: 0,
      };
    }

    // 1) 신규 DiscountInfo 기반
    const discountInfo = detailTrim?.discountInfo ?? detailTrim?.activeTrimDiscount ?? null;

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
        rawDiscountAmountFromInfo = value;
      }
    }

    // 2) 구형 필드와 병합
    const legacyDiscountPrice = parsePriceValue(
      detailTrim?.discountedPrice ?? detailTrim?.discounted_price ?? 0,
    );

    const rawDiscountPrice = discountPriceFromInfo || legacyDiscountPrice || 0;

    let rawDiscountAmount = rawDiscountAmountFromInfo;
    if (!rawDiscountAmount) {
      rawDiscountAmount = parsePriceValue(
      detailTrim?.discountAmount ??
        detailTrim?.discount_amount ??
        detailTrim?.activeTrimDiscount?.discountAmount ??
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
  }, [detailTrim, basePriceValue, brandOrigin]);

  // 합계 가격 계산: 할인 적용된 기본 차량가격(있으면) + 옵션/색상 금액
  const totalPriceValue =
    (discountedBasePrice && discountedBasePrice > 0 ? discountedBasePrice : basePriceValue) +
    optionPriceTotal +
    colorPriceTotal;

  const selectedColorName =
    selectedColorEntries.length > 0
      ? selectedColorEntries.map((entry) => entry.name).join(', ')
      : selectedColor?.name ?? '';

  const selectedColorImage =
    resolveColorImageUrl(selectedColor) ||
    resolveColorImageUrl(selectedColorEntries[0]?.raw) ||
    findBestMatchingColorImageUrl(selectedColor, [
      selectedTrimDetail,
      detailTrim,
      vehicleLineModels,
    ]);

  const handleSelectTrim = (trim) => {
    const nextId = normalizeId(trim?.id);
    if (!nextId) return;
    setSelectedTrimId(nextId);
    setSelectedSummary((prev) => ({
      ...prev,
      model: trim.modelName ? `${trim.modelName} · ${trim.name}` : trim.name,
    }));
    scrollToOptionSection();
  };

  const handleSelectOption = (option) => {
    const optionId = normalizeId(option.id);
    if (!optionId) return;

    // 토글: 선택 상태 관리 (카드 활성화)
    setSelectedOptionIds((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) {
        next.delete(optionId);
      } else {
        next.add(optionId);
      }
      return next;
    });

    // savedSelections 동기화 (옵션 요약/공유/견적용)
    const groupKey = option.category || option.groupName || '추가 옵션';
    setSavedSelections((prev) => {
      const current = prev.option?.[groupKey];
      const currentArr = Array.isArray(current) ? [...current] : current ? [current] : [];
      const existsIndex = currentArr.findIndex(
        (item) => normalizeId(item?.value ?? item?.raw?.id) === optionId,
      );

      let nextArr;
      if (existsIndex >= 0) {
        currentArr.splice(existsIndex, 1);
        nextArr = currentArr;
      } else {
        currentArr.push({
          name: option.name || '옵션',
          value: optionId,
          raw: option,
          groupTitle: groupKey,
          price: option.discountedPrice ?? option.price ?? option.amount ?? 0,
          selected: true,
        });
        nextArr = currentArr;
      }

      const nextOption = { ...(prev.option || {}) };
      if (nextArr.length === 0) {
        delete nextOption[groupKey];
      } else {
        nextOption[groupKey] = nextArr.length === 1 ? nextArr[0] : nextArr;
      }

      // 옵션 요약 텍스트 업데이트
      const summaryParts = Object.values(nextOption || {}).flatMap((entry) => {
        const arr = Array.isArray(entry) ? entry : [entry];
        return arr
          .filter(Boolean)
          .map((item) =>
            item.price
              ? `${item.name} (+${parsePriceValue(item.price).toLocaleString()}원)`
              : item.name,
          );
      });

      setSelectedSummary((prevSummary) => ({
        ...prevSummary,
        option: summaryParts.join(' · '),
      }));

      return {
        ...prev,
        option: nextOption,
      };
    });
  };

  const handleSelectSegment = (type, value) => {
    switch (type) {
      case 'method':
        setContractMethod(value);
        {
          const defaults = getDefaultContractConfigForMethod(value);
          setContractPeriod(defaults.contractPeriod);
          setDeposit(defaults.deposit);
          setPrepayment(defaults.prepayment);
          setMileage(defaults.mileage);
          if (defaults.carTax) setCarTax(defaults.carTax);
          if (defaults.insuranceAge) setInsuranceAge(defaults.insuranceAge);
        }
        break;
      case 'period':
        setContractPeriod(value);
        break;
      case 'deposit': {
        const total = parsePercent(value) + parsePercent(prepayment);
        if (total > 40) {
          setShowPercentToast(true);
          return;
        }
        setDeposit(value);
        break;
      }
      case 'prepayment': {
        const total = parsePercent(deposit) + parsePercent(value);
        if (total > 40) {
          setShowPercentToast(true);
          return;
        }
        setPrepayment(value);
        break;
      }
      case 'mileage':
        setMileage(value);
        break;
      case 'carTax':
        setCarTax(value);
        break;
      case 'insurance':
        setInsuranceAge(value);
        break;
      default:
        break;
    }
  };

  const representativeHeroImage =
    selectedTrimDetail?.imageUrl ||
    selectedTrimDetail?.images?.[0] ||
    selectedTrim?.imageUrl ||
    '';

  const heroImage =
    selectedColorImage ||
    representativeHeroImage ||
    '/placeholder/car.svg';

  // heroImage 변경 추적 (색상 클릭 시 이미지 변경 확인용)
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[MobleCarDetail] heroImage 변경:', {
      heroImage,
      selectedColorId,
      selectedColorName: selectedColor?.name,
      selectedColorImageUrl: selectedColor?.imageUrl,
      selectedColorImage,
      selectedTrimDetailImageUrl: selectedTrimDetail?.imageUrl,
      selectedTrimImageUrl: selectedTrim?.imageUrl,
      timestamp: new Date().toISOString(),
    });
  }, [heroImage, selectedColorId, selectedColor?.name, selectedColor?.imageUrl, selectedColorImage, selectedTrimDetail?.imageUrl, selectedTrim?.imageUrl]);

  // 차종(차량 라인) 이름 - 그랜저 GN7 같은 값
  const vehicleLineName =
    selectedTrim?.modelName
      ? `${selectedTrim.modelName}`
      : selectedTrim?.vehicleLineName ??
        selectedTrimDetail?.vehicleLineName ??
        selectedTrimDetail?.name ??
        selectedTrim?.name ??
        '';

  // 히어로에는 "차량 라인명 + 트림명"이 아닌 "차량 라인명"만 표시하도록 수정하거나,
  // 유저 요청대로 "더 뉴 투싼 NX4 하이브리드" 처럼 모델 그룹명을 표시
  // selectedTrim.modelName이 "더 뉴 투싼 NX4 하이브리드" 같은 값을 가지고 있다면 그것을 우선 사용
  const carName = vehicleLineName || '차량';
  const brandName = selectedTrimDetail?.brandName ?? '';

  const {
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords,
  } = useMemo(
    () =>
      buildCarDetailSeo({
        brand: brandName,
        model: carName,
        segment: null,
        fuelOrType: null,
        period: contractPeriod,
        mileage,
      }),
    [brandName, carName, contractPeriod, mileage],
  );

  const availableMethods = useMemo(() => {
    // 수입차일 때만 신차구입(할부) 노출 (PC와 동일)
    if (brandOrigin === '수입차') {
      return ['장기렌탈', '리스', '신차구입(할부)'];
    }
    return ['장기렌탈', '리스'];
  }, [brandOrigin]);

  const openPicker = (type) => {
    let groups = [];
    if (type === 'model') {
      groups = buildModelGroups(vehicleLineModels, selectedTrimId);
    } else if (type === 'option') {
      groups = optionGroups;
    } else if (type === 'color') {
      groups = colorGroups;
    } else if (type === 'contract') {
      groups = buildContractGroups(
        {
          availableMethods,
          contractMethod,
          contractPeriod,
          deposit,
          prepayment,
          mileage,
          carTax,
          insuranceAge,
          brandOrigin,
        },
        savedSelections.contract,
      );
    }

    if (!groups || groups.length === 0) {
      console.warn(`[MobleCarDetail] ${type} 항목이 없습니다.`, { type, vehicleLineModels, detailTrim });
    }

    setActivePicker(type);
    setPickerVariantGroups(groups);
    setIsPickerOpen(true);
    console.log(`[MobleCarDetail] ${type} 선택 팝업 오픈`, groups);
  };

  const handleVariantSelect = (groupTitle, option, groupMeta) => {
    const targetValue = option.value ?? option.name;
    // onVariantSelect 에서 유효성 결과를 OptionPopupMobile 로 전달하기 위한 플래그
    // (보증금+선납금 40% 초과 시 false 로 설정)
    let isValidSelection = true;

    setPickerVariantGroups((prev) => {
      const nextGroups = prev.map((group) => {
        const isTargetGroup = group.title === groupTitle;
        const isMultiple = Boolean(group.multiple ?? groupMeta?.multiple);

        if (!isTargetGroup) {
          if (activePicker === 'model' && !isMultiple) {
            return {
              ...group,
              options: group.options.map((opt) => ({ ...opt, selected: false })),
            };
          }
          return { ...group };
        }

        const updatedOptions = group.options.map((opt) => {
          const candidateValue = opt.value ?? opt.name;
          if (candidateValue !== targetValue) {
            if (isMultiple) {
              return { ...opt };
            }
            return { ...opt, selected: false };
          }

          if (isMultiple) {
            return { ...opt, selected: !opt.selected };
          }

          return { ...opt, selected: true };
        });

        return {
          ...group,
          options: updatedOptions,
        };
      });

      // 세부모델 선택: 한 번 탭하면 바로 적용 + 모달 닫기
      if (activePicker === 'model') {
        const nextTrimId = normalizeId(option.value ?? option.name);
        if (nextTrimId) {
          setSelectedTrimId(nextTrimId);
          setSelectedSummary((prev) => ({
            ...prev,
            model: groupTitle ? `${groupTitle} · ${option.name}` : option.name,
          }));
        }
        setIsPickerOpen(false);
        setActivePicker(null);
        return nextGroups;
      }

      // 옵션 선택: 즉시 반영(여러 개 토글 가능), 모달은 유지
      if (activePicker === 'option') {
        const selectionRecord = {};
        const summaryParts = [];

        nextGroups.forEach((group) => {
          const selectedOptions = (group.options || []).filter((opt) => opt.selected);
          if (selectedOptions.length === 0) return;

          selectionRecord[group.title] = selectedOptions.map((opt) => ({
            ...opt,
            groupTitle: group.title,
          }));

          selectedOptions.forEach((selectedOption) => {
            const optionName = selectedOption.name ?? selectedOption.value;
            summaryParts.push(
              selectedOption.price ? `${optionName} (${selectedOption.price})` : optionName,
            );
          });
        });

        setSavedSelections((prev) => ({
          ...prev,
          option: selectionRecord,
        }));

        const summaryText =
          summaryParts.join(' · ') || (nextGroups.length === 0 ? '선택 항목 없음' : '선택 없음');

        setSelectedSummary((prev) => ({
          ...prev,
          option: summaryText,
        }));

        return nextGroups;
      }

      // 색상 선택: 한 번 탭하면 바로 적용 + 모달 닫기
      if (activePicker === 'color') {
        const selectionRecord = {};
        const summaryParts = [];

        nextGroups.forEach((group) => {
          const selectedOptions = (group.options || []).filter((opt) => opt.selected);
          if (selectedOptions.length === 0) return;

          const selectedOption = selectedOptions[0];
          selectionRecord[group.title] = {
            ...selectedOption,
            groupTitle: group.title,
          };

          const optionName = selectedOption.name ?? selectedOption.value;
          summaryParts.push(
            selectedOption.price ? `${optionName} (+${selectedOption.price})` : optionName,
          );
        });

        setSavedSelections((prev) => ({
          ...prev,
          color: selectionRecord,
        }));

        const summaryText =
          summaryParts.join(' · ') || (nextGroups.length === 0 ? '선택 항목 없음' : '선택 없음');

        setSelectedSummary((prev) => ({
          ...prev,
          color: summaryText,
        }));

        setIsPickerOpen(false);
        setActivePicker(null);
        return nextGroups;
      }

      // 계약조건(이용방법/기간/보증금/거리/선납금/자동차세/보험연령)은 한 번 탭하면 바로 적용
      if (activePicker === 'contract') {
        const selectionRecord = {};
        const summaryParts = [];

        let nextContractMethod = contractMethod;
        let nextContractPeriod = contractPeriod;
        let nextDeposit = deposit;
        let nextPrepayment = prepayment;
        let nextMileage = mileage;
        let nextCarTax = carTax;
        let nextInsuranceAge = insuranceAge;

        nextGroups.forEach((group) => {
          const selectedOptions = (group.options || []).filter((opt) => opt.selected);
          if (selectedOptions.length === 0) return;

          // contract 팝업은 단일 선택 그룹만 사용하므로 첫 번째만 기록
          const selectedOption = selectedOptions[0];
          selectionRecord[group.title] = {
            ...selectedOption,
            groupTitle: group.title,
          };

          const rawValue = selectedOption.value ?? selectedOption.name;
          switch (group.title) {
            case '이용방법':
              nextContractMethod = rawValue;
              // 이용방법을 바꾸면 해당 방법의 기본 계약 조건으로 리셋
              {
                const defaults = getDefaultContractConfigForMethod(rawValue);
                nextContractPeriod = defaults.contractPeriod;
                nextDeposit = defaults.deposit;
                nextPrepayment = defaults.prepayment;
                nextMileage = defaults.mileage;
                nextCarTax = defaults.carTax ?? nextCarTax;
                nextInsuranceAge = defaults.insuranceAge ?? nextInsuranceAge;
              }
              break;
            case '계약기간':
              nextContractPeriod = rawValue;
              break;
            case '보증금':
              nextDeposit = rawValue;
              break;
            case '연간 약정운행거리':
              nextMileage = rawValue;
              break;
            case '선납금':
              nextPrepayment = rawValue;
              break;
            case '자동차세':
              nextCarTax = rawValue;
              break;
            case '보험 구분':
              nextInsuranceAge = rawValue;
              break;
            default:
              break;
          }

          const optionName = selectedOption.name ?? selectedOption.value;
          summaryParts.push(`${group.title} ${optionName}`);
        });

        // 보증금 + 선납금 합계 40% 제한
        const totalPercent = parsePercent(nextDeposit) + parsePercent(nextPrepayment);
        if (totalPercent > 40) {
          setShowPercentToast(true);
          // 유효하지 않은 선택임을 상위(OptionPopupMobile)에 알려서
          // 다음 계약조건으로 자동 스킵되지 않도록 함
          isValidSelection = false;
          return prev;
        }

        setSavedSelections((prev) => ({
          ...prev,
          contract: selectionRecord,
        }));

        setContractMethod(nextContractMethod);
        setContractPeriod(nextContractPeriod);
        setDeposit(nextDeposit);
        setPrepayment(nextPrepayment);
        setMileage(nextMileage);
        setCarTax(nextCarTax);
        setInsuranceAge(nextInsuranceAge);

        const summaryText =
          summaryParts.join(' · ') || (nextGroups.length === 0 ? '선택 항목 없음' : '선택 없음');

        setSelectedSummary((prev) => ({
          ...prev,
          contract: summaryText,
        }));
      }

      return nextGroups;
    });

    return isValidSelection;
  };

  const handleConfirmSelection = () => {
    if (!activePicker) {
      setIsPickerOpen(false);
      return;
    }

    if (activePicker === 'model') {
      const selectedEntry = pickerVariantGroups
        .flatMap((group) =>
          group.options
            .filter((opt) => opt.selected)
            .map((opt) => ({
              option: opt,
              groupTitle: group.title,
            })),
        )
        .shift();

      if (selectedEntry) {
        const nextTrimId = normalizeId(selectedEntry.option.value ?? selectedEntry.option.name);
        setSelectedTrimId(nextTrimId);
        setSelectedSummary((prev) => ({
          ...prev,
          model: selectedEntry.groupTitle
            ? `${selectedEntry.groupTitle} · ${selectedEntry.option.name}`
            : selectedEntry.option.name,
        }));
      }

      console.log('[MobleCarDetail] 세부모델 선택', selectedEntry);
      setIsPickerOpen(false);
      setActivePicker(null);
      return;
    }

    const selectionRecord = {};
    const summaryParts = [];

    pickerVariantGroups.forEach((group) => {
      const selectedOptions = group.options.filter((opt) => opt.selected);
      if (selectedOptions.length === 0) {
        return;
      }

      if (group.multiple) {
        selectionRecord[group.title] = selectedOptions.map((opt) => ({
          ...opt,
          groupTitle: group.title,
        }));
      } else {
        selectionRecord[group.title] = {
          ...selectedOptions[0],
          groupTitle: group.title,
        };
      }

      selectedOptions.forEach((selectedOption) => {
        const optionName = selectedOption.name ?? selectedOption.value;
        if (activePicker === 'option') {
          summaryParts.push(
            selectedOption.price ? `${optionName} (${selectedOption.price})` : optionName,
          );
        } else if (activePicker === 'color') {
          summaryParts.push(
            selectedOption.price ? `${optionName} (+${selectedOption.price})` : optionName,
          );
        } else if (activePicker === 'contract') {
          summaryParts.push(`${group.title} ${optionName}`);
        } else {
          summaryParts.push(optionName);
        }
      });
    });

    setSavedSelections((prev) => ({
      ...prev,
      [activePicker]: selectionRecord,
    }));

    const summaryText = summaryParts.join(' · ');

    setSelectedSummary((prev) => ({
      ...prev,
      [activePicker]:
        summaryText || (pickerVariantGroups.length === 0 ? '선택 항목 없음' : '선택 없음'),
    }));

    console.log(`[MobleCarDetail] ${activePicker} 선택`, selectionRecord);
    setIsPickerOpen(false);
    setActivePicker(null);
  };

  const handleRequestQuote = () => {
    const trimValue = selectedTrimId;
    if (!trimValue) {
      openPicker('model');
      return;
    }

    const params = new URLSearchParams();
    params.set('trimId', trimValue);

    selectedOptionEntries.forEach((option) => {
      const optionId = option?.raw?.id ?? option?.value;
      if (optionId) {
        params.append('optionId', optionId);
      }
    });

    selectedColorEntries.forEach((color) => {
      const colorId = color?.raw?.id ?? color?.value;
      if (colorId) {
        params.append('colorId', colorId);
      }
    });

    // 계약조건을 URL 파라미터로 전달
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

    if (terms.length > 0) {
      params.set('terms', terms.join(','));
    }

    const vehicleLineId =
      Number(carId) ||
      selectedTrim?.vehicleLineId ||
      selectedTrimDetail?.vehicleLineId ||
      null;

    if (vehicleLineId) {
      const search = params.toString();
      navigate(
        `/m/car-detail/${encodeURIComponent(String(vehicleLineId))}${
          search ? `?${search}` : ''
        }`,
      );
    } else {
      navigate('/m/search');
    }
  };

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

    const optionNames = selectedOptionEntries.map((option) => option.name ?? option.value ?? '');

    const colorOptions = (selectedColorEntries.length ? selectedColorEntries : selectedColor ? [{
      name: selectedColor.name,
      value: normalizeId(selectedColor.id) ?? selectedColor.name,
      groupTitle: selectedColor.vehicleInterior ? '내장 색상' : '외장 색상',
    }] : [])
      .map((color) => {
        const value = color.name ?? color.value ?? '';
        if (!value) return '';
        if (color.groupTitle && color.groupTitle !== '외장 색상') {
          return `${color.groupTitle}: ${value}`;
        }
        return `색상: ${value}`;
      })
      .filter(Boolean);

    const modelLabel = selectedSummary?.model
      ? selectedSummary.model
      : vehicleLineName || selectedTrim?.name || '';

    return {
      brand: brandName || '',
      // 차종: 세부모델 요약(예: "아반떼 CN7 하이브리드 · 모던")
      model: modelLabel,
      // 트림: 세부모델 이름만(예: "모던")
      trim: selectedTrim?.name || '',
      color: selectedColorName || '',
      phone: (phoneValue || '').trim(),
      options: [...colorOptions, ...optionNames].filter(Boolean),
      terms,
      consultType: '차량라인상세',
      source: 'mobile-car-detail',
      entryLabel: `모바일 차량 상세 > ${vehicleLineName || ''}`,
      extra: {
        vehicleLineId: Number(carId) || null,
        trimId: selectedTrimId ?? null,
      },
    };
  };

  // URL 동기화 (민감정보 제외)
  useShareableConsultUrl(
    () => {
      const optionIds = selectedOptionEntries
        .map((opt) => opt?.raw?.id ?? opt?.value)
        .filter(Boolean);
      const firstColorId =
        selectedColorEntries[0]?.raw?.id ??
        selectedColorEntries[0]?.value ??
        normalizeId(selectedColor?.id) ??
        '';

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

      return {
        brand: brandName,
        // 공유 URL에도 차종(차량 라인)만 넣기
        model: vehicleLineName || '',
        vehicleLineId: Number(carId) || '',
        trimId: selectedTrimId || '',
        colorId: firstColorId || '',
        optionIds,
        terms,
        consultType: '차량라인상세',
        source: 'mobile-car-detail',
      };
    },
    (preset) => {
      if (preset?.trimId) setSelectedTrimId(preset.trimId);
      // 색상 및 옵션은 모바일 선택 팝업 구조라, 필요 시 확장 가능
    },
    [
      brandName,
      vehicleLineName,
      carId,
      selectedTrimId,
      selectedOptionEntries,
      selectedColorEntries,
      contractMethod,
      contractPeriod,
      deposit,
      prepayment,
      mileage,
    ]
  );

  const carPriceText = totalPriceValue
    ? `${totalPriceValue.toLocaleString()}원`
    : PRICE_PLACEHOLDER;
  const showHeroPrice = false;

  const formatWon = (value) => {
    const numeric = parsePriceValue(value);
    return numeric ? `${numeric.toLocaleString()}원` : PRICE_PLACEHOLDER;
  };

  const effectiveBasePrice =
    discountedBasePrice && discountedBasePrice > 0 ? discountedBasePrice : basePriceValue;
  const optionPriceValue = additionsTotal;
  const totalPriceWithOptions = totalPriceValue || effectiveBasePrice + optionPriceValue;

  const specLine = useMemo(() => {
    const parts = [];
    const seg = selectedTrimDetail?.segment;
    if (seg) parts.push(seg);

    const fuelsRaw =
      selectedTrimDetail?.fuelTypes ||
      selectedTrimDetail?.fuelType ||
      selectedTrim?.fuelTypes ||
      selectedTrim?.fuelType;
    if (fuelsRaw) {
      const fuels = Array.isArray(fuelsRaw) ? fuelsRaw : [fuelsRaw];
      const fuelText = fuels.filter(Boolean).join(', ');
      if (fuelText) parts.push(fuelText);
    }

    const dispMin = selectedTrimDetail?.displacementMin;
    const dispMax = selectedTrimDetail?.displacementMax;
    if (dispMin || dispMax) {
      const formattedMin = dispMin ? Number(dispMin).toLocaleString() : '';
      const formattedMax = dispMax ? Number(dispMax).toLocaleString() : '';
      const disp =
        formattedMin && formattedMax
          ? `${formattedMin}~${formattedMax}cc`
          : formattedMin
            ? `${formattedMin}cc`
            : formattedMax
              ? `${formattedMax}cc`
              : '';
      if (disp) parts.push(disp);
    }

    const eff = selectedTrimDetail?.fuelEfficiency;
    if (eff) {
      parts.push(`복합연비 ${eff}`);
    }

    return parts.join(' | ');
  }, [selectedTrimDetail, selectedTrim]);

  const optionSummaryItems = useMemo(() => {
    const colors =
      (selectedColorEntries.length
        ? selectedColorEntries
        : selectedColor
          ? [
              {
                name: selectedColor.name,
                raw: selectedColor,
              },
            ]
          : []
      ).map((c) => ({
        label: `색상: ${c.name}`,
        price: parsePriceValue(c?.raw?.additionalPrice ?? c?.raw?.price ?? 0),
      }));

    const options = selectedOptionEntries.map((opt) => ({
      label: opt.name ?? '옵션',
      price: parsePriceValue(
        opt?.raw?.discountedPrice ?? opt?.raw?.price ?? opt?.raw?.amount ?? 0,
      ),
    }));

    return [...colors, ...options];
  }, [selectedColorEntries, selectedColor, selectedOptionEntries]);

  // 브랜드 매핑 (brandName -> logo path)
  // public/brand, public/importbrands 에 있는 svg 파일명과 매핑
  const brandLogoPath = useMemo(() => {
    if (!brandName) return null;
    const name = brandName.replace(/\s+/g, '').toLowerCase();

    // 매핑 테이블
    const brandMap = {
      '기아': '/brand/kia.svg',
      '현대': '/brand/현대.svg',
      '제네시스': '/brand/제네시스.svg',
      '르노삼성': '/brand/르노삼성.svg', // or 르노코리아?
      'kg모빌리티': '/brand/kgm.svg',
      '쉐보레': '/brand/쉐보레.svg',
      
      'bmw': '/importbrands/bmw.svg',
      '벤츠': '/importbrands/벤츠.svg',
      '아우디': '/importbrands/아우디.svg',
      '폭스바겐': '/importbrands/폭스바겐.svg',
      '렉서스': '/importbrands/렉서스.svg',
      '토요타': '/importbrands/도요타.svg', // 파일명이 도요타.svg
      '도요타': '/importbrands/도요타.svg',
      '테슬라': '/importbrands/테슬라.svg',
      '포드': '/importbrands/포드.svg',
      '볼보': '/importbrands/volvo.svg',
      '폴스타': '/importbrands/폴스타.svg',
      'byd': '/importbrands/byd.svg',
    };

    // 1차: 정확한 한글명 매칭
    if (brandMap[brandName]) return brandMap[brandName];
    
    // 2차: 소문자 영문 매칭 (backend brandName이 영문일 경우)
    const lowerName = brandName.toLowerCase();
    if (brandMap[lowerName]) return brandMap[lowerName];

    // 매칭 안되면 null (로고 미표시)
    return null;
  }, [brandName]);

  const hasDetail = Boolean(selectedTrimDetail);

  if (isLoadingModels || ((isLoadingTrimDetail || isFetchingTrimDetail) && !hasDetail)) {
    return (
      <div className={styles.page}>
        <SeoHelmet
          title={seoTitle}
          description={seoDescription}
          keywords={seoKeywords}
          image={heroImage}
        />
        <div className={styles.container}>
          <div className={styles.loading}>차량 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (isErrorModels || vehicleLineModels.length === 0) {
    return (
      <div className={styles.page}>
        <SeoHelmet
          title={seoTitle}
          description={seoDescription}
          keywords={seoKeywords}
          image={heroImage}
        />
        <div className={styles.container}>
          <div className={styles.loading}>차량 정보를 불러오지 못했습니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <SeoHelmet
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        image={heroImage}
      />
      
      {/* 히어로 섹션: 컨테이너 밖으로 빼서 전체 너비(375px) 사용 */}
      <div className={styles.heroSection}>
        <div className={styles.heroCompact}>
          <div className={styles.heroMeta}>
            <div className={styles.heroMetaTitleRow}>
              {brandLogoPath && (
                <img
                  src={brandLogoPath}
                  alt={brandName}
                  className={styles.brandLogo}
                />
              )}
              <div className={styles.heroMetaTitle}>{carName}</div>
            </div>
            {specLine && <div className={styles.heroMetaSpec}>{specLine}</div>}
          </div>
          <img
            key={heroImage || 'car-hero-image'}
            src={heroImage}
            alt={carName}
            className={styles.heroImageCompact}
          />
        
        </div>
        </div>

      <div className={styles.container}>
        {hasColors && (
          <div className={styles.colorSection}>
            <div className={styles.colorHeader}>
              <span className={styles.colorTitle}>외장색상 선택</span>
              {selectedColorName && <span className={styles.colorName}>{renderColorName(selectedColorName)}</span>}
            </div>
            <div className={styles.colorPalette}>
              {visibleColors.map((color) => {
                const colorId = normalizeId(color.id);
                const chipColor = resolveChipColor(color) || '#d1d5db';
                if (!chipColor) return null;
                return (
                  <button
                    type="button"
                    key={colorId}
                    className={`${styles.colorSwatch} ${
                      selectedColorId === colorId ? styles.colorSwatchSelected : ''
                    }`}
                    style={{ background: chipColor }}
                    onClick={() => {
                      // eslint-disable-next-line no-console
                      console.log('[MobleCarDetail] 색상 클릭:', {
                        colorId,
                        colorName: color.name,
                        imageUrl: color?.imageUrl,
                        hexCode: color?.hexCode || color?.colorCode || color?.rgbCode,
                        timestamp: new Date().toISOString(),
                      });
                      setSelectedColorId(colorId);
                    }}
                    title={color.name}
                    aria-pressed={selectedColorId === colorId}
                  />
                );
              })}
            </div>
            <div className={styles.colorNote}>* 일부 외장색상의 경우 추가요금이 발생될 수 있습니다.</div>
          </div>
        )}

        <div className={styles.sectionDivider} />
        <div className={styles.listHeader}>모델 선택</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {modelGroups.map((group) => {
            const isOpen = openModelGroupTitle === group.title;
            return (
              <div key={group.title} className={styles.cardList} style={{ padding: 0 }}>
                <button
                  type="button"
                  className={styles.cardItem}
                  onClick={() => setOpenModelGroupTitle(isOpen ? null : group.title)}
                  style={{
                    justifyContent: 'space-between',
                    fontWeight: 600,
                    color: '#111',
                  }}
                >
                  <span style={{ color: '#111' }}>{group.title}</span>
                  <span style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                </button>
                {isOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {group.options.map((option) => {
                      const isActive = option.selected;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`${styles.cardItem} ${isActive ? styles.cardActive : ''}`}
                          onClick={() =>
                            option.raw
                              ? handleSelectTrim(option.raw)
                              : handleSelectTrim({
                                  id: option.value,
                                  name: option.name,
                                  modelName: group.title,
                                })
                          }
                        >
                          <div
                            className={`${styles.cardTitle} ${styles.trimCardTitle} ${
                              hasAssistTaxiTrimLabel(option.name) ? styles.assistTaxiTrimTitle : ''
                            }`}
                            style={{ color: '#111' }}
                          >
                            {option.name}
                          </div>
                          <div className={styles.cardPrice} style={{ color: '#111' }}>
                            {option.price}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {hasOptions ? (
          <>
            <div className={styles.sectionDivider} ref={optionSectionRef} />
            <div className={styles.listHeader}>옵션 선택</div>
            <div className={styles.cardList}>
              {trimOptions.map((option) => {
                const optionId = normalizeId(option.id);
                const active = selectedOptionIds.has(optionId);
                const price = option.discountedPrice ?? option.price ?? option.amount ?? 0;
                return (
                  <button
                    key={optionId}
                    type="button"
                    className={`${styles.cardItem} ${active ? styles.cardActive : ''}`}
                    onClick={() => handleSelectOption(option)}
                    aria-pressed={active}
                  >
                    <div className={styles.cardTitle}>{option.name}</div>
                    <div className={styles.cardPrice}>
                      {price ? `+${formatCurrency(price)}` : '0원'}
                        </div>
                  </button>
                );
              })}
                        </div>

            <div className={styles.sectionDivider} />
          </>
        ) : (
          <div className={styles.sectionDivider} ref={optionSectionRef} />
        )}
        <div className={styles.listHeader}>이용조건 선택</div>

        <div className={styles.listHeader} style={{ fontSize: 13, fontWeight: 600, marginTop: 0 }}>
          이용방법
                  </div>
        <div className={styles.segmentGroup}>
          {availableMethods.map((method) => (
            <button
              key={method}
              type="button"
              className={`${styles.segmentButton} ${
                contractMethod === method ? styles.segmentActive : ''
              }`}
              onClick={() => handleSelectSegment('method', method)}
            >
              {method === '장기렌탈' ? '장기렌트' : method}
            </button>
          ))}
              </div>

        <div className={styles.listHeader} style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>
          계약기간
            </div>
        <div className={styles.segmentGroup}>
          {CONTRACT_PERIOD_OPTIONS.map((label) => (
            <button
              key={label}
              type="button"
              className={`${styles.segmentButton} ${
                contractPeriod === label ? styles.segmentActive : ''
              }`}
              onClick={() => handleSelectSegment('period', label)}
            >
              {label === '24개월' && brandOrigin === '수입차' ? '일시불' : label}
            </button>
          ))}
        </div>

        <div className={styles.listHeader} style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>
          보증금
        </div>
        <div className={styles.segmentGroup}>
          {DEPOSIT_OPTIONS.map((label) => (
            <button
              key={label}
              type="button"
              className={`${styles.segmentButton} ${
                deposit === label ? styles.segmentActive : ''
              }`}
              onClick={() => handleSelectSegment('deposit', label)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.listHeader} style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>
          선납금
        </div>
        <div className={styles.segmentGroup}>
          {PREPAYMENT_OPTIONS.map((label) => (
            <button
              key={label}
              type="button"
              className={`${styles.segmentButton} ${
                prepayment === label ? styles.segmentActive : ''
              }`}
              onClick={() => handleSelectSegment('prepayment', label)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.listHeader} style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>
          연간 약정운행거리
          </div>
        <div className={`${styles.segmentGroup} ${styles.mileageGroup}`}>
          {MILEAGE_OPTIONS.map((label) => (
            <button
              key={label}
              type="button"
              className={`${styles.segmentButton} ${
                mileage === label ? styles.segmentActive : ''
              }`}
              onClick={() => handleSelectSegment('mileage', label)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.listHeader} style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>
          보험 연령
        </div>
        <div className={styles.segmentGroup}>
          {['만 26세 이상', '만 21세 이상'].map((label) => (
            <button
              key={label}
              type="button"
              className={`${styles.segmentButton} ${
                insuranceAge === label ? styles.segmentActive : ''
              }`}
              onClick={() => handleSelectSegment('insurance', label)}
            >
              {label}
            </button>
          ))}
          </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryRow}>
            <div className={styles.summaryRowLeft}>
              <span className={styles.summaryRowLabel}>기본 차량 가격</span>
              {selectedTrim?.name && (
                <div className={styles.summaryLabelSub}>{selectedTrim.name}</div>
              )}
            </div>
            <span className={styles.summaryPrice}>{formatWon(effectiveBasePrice)}</span>
          </div>

          <div className={styles.summaryRow} style={{ alignItems: 'flex-start' }}>
            <div className={styles.summaryRowLeft}>
              <span className={styles.summaryRowLabel}>옵션 가격</span>
              <div className={styles.summaryOptionList}>
                {optionSummaryItems.length === 0 ? (
                  <div className={styles.summaryOptionEmpty}>색상/옵션을 선택해주세요</div>
                ) : (
                  optionSummaryItems.map((item, idx) => (
                    <div key={`${item.label}-${idx}`} className={styles.summaryOptionName}>{item.label}</div>
                  ))
                )}
              </div>
            </div>
            <div className={styles.summaryPriceCol}>
              <span className={styles.summaryPrice}>
              {optionPriceValue > 0 ? `+${formatWon(optionPriceValue)}` : '+0원'}
            </span>
              <div className={styles.summaryOptionList}>
                {optionSummaryItems.length > 0 &&
                  optionSummaryItems.map((item, idx) => (
                    <div key={`${item.label}-${idx}-price`} className={styles.summaryOptionPrice}>
                      {item.price > 0 ? `+${formatWon(item.price)}` : '+0원'}
          </div>
                  ))}
            </div>
          </div>
        </div>

          <div className={styles.summaryRow}>
            <span className={styles.summaryRowLabel}>총 차량가격</span>
            <span className={styles.summaryTotal}>
              {formatWon(basePriceValue + optionPriceValue)}
            </span>
          </div>
          {brandOrigin === '수입차' && discountAmount > 0 && (
            <>
              <div className={styles.summaryRow}>
                <span className={styles.summaryRowLabel}>할인가격</span>
                <span className={styles.summaryDiscountAmount}>
                  -{formatWon(discountAmount)}
                </span>
              </div>
              {discountPercent > 0 && (
                <div className={styles.summaryRow}>
                  <span className={styles.summaryRowLabel}>할인율</span>
                  <span className={styles.summaryDiscountPercent}>
                    {discountPercent}%
                  </span>
                </div>
              )}
            </>
          )}
          <div className={styles.summaryRow}>
            <span className={styles.summaryRowLabel}>합계</span>
            <span className={styles.summaryTotal}>{formatWon(totalPriceWithOptions)}</span>
          </div>
      </div>

      <div className={styles.bottomArea}>
        <div className={styles.bottomSummary}>
          <div className={styles.bottomSummaryLeft}>
            <span className={styles.bottomSummaryLabel}>합계</span>
          </div>
          <div className={styles.bottomSummaryPrice}>{carPriceText}</div>
        </div>
        <KakaoConsultButton
          isPrivacyAgreed={isBottomPrivacyAgreed}
          buildPayload={buildConsultPayload}
          onNeedContactModal={() => setIsContactModalOpen(true)}
          className={styles.bottomButtonImage}
          imageClass={styles.bottomButtonImageFull}
        />
        <PrivacyConsentCheckbox
          checked={isBottomPrivacyAgreed}
          onChange={setIsBottomPrivacyAgreed}
          align="right"
        />
        </div>
      </div>

      {isPickerOpen && (
        <OptionPopupMobile
          size="large"
          title={
            activePicker === 'option'
              ? '옵션을 선택해주세요'
              : activePicker === 'color'
                ? '색상을 선택해주세요'
                : activePicker === 'contract'
                  ? '계약 조건을 선택해주세요'
                  : '세부모델을 선택해주세요'
          }
          variantGroups={pickerVariantGroups}
          onVariantSelect={handleVariantSelect}
          onConfirm={handleConfirmSelection}
          autoFocusSequential={activePicker === 'contract'}
          onClose={() => {
            setIsPickerOpen(false);
            setActivePicker(null);
          }}
          disableOverlayClose={true}
        />
      )}

      <Toast
        message="보증금과 선납금의 합계는 40%를 넘을 수 없습니다."
        visible={showPercentToast}
        duration={1000}
        onClose={() => setShowPercentToast(false)}
      />

      <MobileContactModal
        open={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        onSubmit={async (phoneValue) => {
          try {
            const { submitConsult } = await import('../../services/consultHelper');
            const payload = buildConsultPayload(phoneValue);

            // eslint-disable-next-line no-console
            console.info('[MobleCarDetail] MobileContactModal onSubmit: payload', payload);

            const result = await submitConsult(payload, {
              kakaoOpenTarget: '_blank',
              openKakaoOnSuccess: false,
              useKakao: false,
            });

            // eslint-disable-next-line no-console
            console.info('[MobleCarDetail] MobileContactModal onSubmit: submitConsult result', {
              result,
            });

            // API 호출이 성공하면 연락처 모달 닫고 성공 모달(펭귄) 표시
            if (result.success) {
              setIsContactModalOpen(false);
              setIsSuccessModalOpen(true);
            } else {
              alert(result.message || '연락처 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
            }
          } catch (error) {
            console.error('[MobleCarDetail] 연락처 보완 실패', error);
            alert('연락처 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
          }
        }}
      />
      
      <ConsultSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
      />
    </div>
  );
}

function Section({ title, summary, onOpen }) {
  const hasSelection = Boolean(summary);
  return (
    <div className={styles.section} onClick={onOpen} role="button">
      <button type="button" className={styles.sectionHead} onClick={onOpen}>
        <span className={styles.sectionTitle}>{title}</span>
        <span className={styles.chevron}>▾</span>
      </button>
      <div className={`${styles.sectionSummary} ${hasSelection ? styles.sectionSummaryFilled : ''}`}>
        {hasSelection ? summary : '선택해주세요'}
      </div>
    </div>
  );
}


