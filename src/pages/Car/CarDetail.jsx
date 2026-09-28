import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Breadcrumb from '../../components/Breadcrumb';
import QuickConsultCard from '../../components/QuickConsultCard';
import Toast from '../../components/Toast.jsx';
import MobileContactModal from '../../components/MobileContactModal.jsx';
import ConsultSuccessModal from '../../components/ConsultSuccessModal.jsx';
import ContractSection from '../../components/ContractSection.jsx';
import styles from './CarDetail.module.css';
import { carAPI } from '../../services/carApi';
import { useCarDetailQuery } from '../../hooks/queries/carQueries';
import { handleKakaoPopupBlocked } from '../../utils/kakaoPopup';
import { findBestMatchingColorImageUrl } from '../../utils/colorImageFallback';
import {
  isImportedVehicleContext,
  shouldKeepTrimForOrigin,
} from '../../utils/vehiclePriceGuards';
import { formatTrimDisplayName, hasAssistTaxiTrimLabel } from '../../utils/trimDisplayName';

// [변경] 카카오 로그인 프로세스 제거: 카카오 OAuth 없이 빈 문자열 반환 (모달로 연락처 받도록)
async function ensurePhone(given = '') {
  const v = (given || '').trim();
  if (v) return v.length > 30 ? v.slice(0, 30) : v;
  // [주석 처리] 카카오 로그인 제거: 이제 연락처는 모달을 통해서만 받습니다.
  // try {
  //   // 공통 상담 헬퍼를 사용해,
  //   // 1) 이미 카카오에 로그인되어 있으면 팝업 없이 바로 번호 조회
  //   // 2) 로그인/동의가 필요할 때만 카카오 로그인 팝업을 띄워서 번호를 확보한다.
  //   const { ensureConsultContact } = await import('../../services/consultHelper');
  //   const result = await ensureConsultContact({}, { useKakao: true, requirePhone: false });
  //   const phone = (result?.data?.phone || '').trim();
  //   return phone.length > 30 ? phone.slice(0, 30) : phone;
  // } catch {
  //   return '';
  // }
  return ''; // 카카오 로그인 없이 빈 문자열 반환하여 모달이 뜨도록 함
}

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

// hex / rgb / rgba 모두 안전하게 처리하는 색상 변환 유틸
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
  if (/^linear-gradient\(/i.test(trimmed)) return true;
  if (/^rgba?\(/i.test(trimmed)) return true;
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed);
};

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

const isMobileDevice = () =>
  typeof window !== 'undefined' &&
  typeof navigator !== 'undefined' &&
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );

const CarDetail = ({ mode = 'trim' }) => {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const carIdParam = params.carId ?? null;
  const trimIdParam = params.trimId ?? null;
  const queryTrimParam = searchParams.get('trim');

  const resolvedMode = useMemo(() => {
    if (mode === 'car' || (carIdParam && !trimIdParam)) return 'car';
    if (mode === 'trim' || (trimIdParam && !carIdParam)) return 'trim';
    return trimIdParam ? 'trim' : 'car';
  }, [mode, carIdParam, trimIdParam]);

  const { data: vehicleLineModels = [] } = useQuery({
    queryKey: ['vehicle-line-models', carIdParam],
    queryFn: async () => {
      const vehicleLineId = Number(carIdParam);
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
          return {
            ...model,
            trims: Array.isArray(trims) ? trims : [],
          };
        }),
      );

      return modelsWithTrims.filter((model) => model.trims.length > 0);
    },
    enabled: resolvedMode === 'car' && Boolean(carIdParam),
    staleTime: 1000 * 60,
  });

  const initialTrimId = useMemo(() => {
    if (resolvedMode === 'trim') {
      return normalizeId(trimIdParam ?? queryTrimParam);
    }
    if (resolvedMode === 'car') {
      return normalizeId(queryTrimParam ?? trimIdParam);
    }
    return normalizeId(trimIdParam ?? queryTrimParam);
  }, [resolvedMode, trimIdParam, queryTrimParam]);

  const [selectedTrimId, setSelectedTrimId] = useState(initialTrimId);
  const [selectedColorId, setSelectedColorId] = useState(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState(new Set());
  const [expandedSections, setExpandedSections] = useState({
    trim: true,
    options: true,
    contract: true,
  });
  const [expandedModelId, setExpandedModelId] = useState(null);
  const [contractMethod, setContractMethod] = useState('장기렌탈');
  const [contractPeriod, setContractPeriod] = useState('48개월');
  const [deposit, setDeposit] = useState('없음');
  const [prepayment, setPrepayment] = useState('30%');
  const [mileage, setMileage] = useState('20,000km');
  const [carTax, setCarTax] = useState('포함');
  const [insuranceAge, setInsuranceAge] = useState('만 26세이상');

  const [showPercentToast, setShowPercentToast] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  useEffect(() => {
    if (!initialTrimId) return;
    setSelectedTrimId((prev) => {
      if (prev === initialTrimId) {
        return prev;
      }
      return initialTrimId;
    });
  }, [initialTrimId]);

  const fetchTrimId = selectedTrimId ?? initialTrimId;

  const {
    data,
    isLoading,
    isError,
  } = useCarDetailQuery(fetchTrimId);

  const vehicleLineName = useMemo(() => {
    if (data?.vehicleLineName) return data.vehicleLineName;
    if (data?.name) return data.name;
    if (Array.isArray(vehicleLineModels) && vehicleLineModels.length > 0) {
      const firstModel = vehicleLineModels[0];
      return firstModel?.vehicleLineName ?? firstModel?.vehicleLine ?? firstModel?.name ?? '';
    }
    return '';
  }, [data?.vehicleLineName, data?.name, vehicleLineModels]);

  const brandName = data?.brandName ?? '';

  // 백엔드에서 내려주는 brandCountry 로 국산/수입 구분
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

  const isImportedDetail = useMemo(
    () => isImportedVehicleContext(data?.brandCountry, data?.carType, brandOrigin),
    [data?.brandCountry, data?.carType, brandOrigin],
  );

  useEffect(() => {
    if (!data?.brandCountry || !brandOrigin) return;
    // eslint-disable-next-line no-console
    console.log(
      '[CarDetail] 브랜드 국적',
      `${brandOrigin === '국산차' ? '국산' : '수입'} | ${data.brandCountry}`,
      {
        brandName,
        origin: brandOrigin,
        country: data.brandCountry,
      },
    );
  }, [data?.brandCountry, brandName, brandOrigin]);

  const modelGroups = useMemo(() => data?.modelGroups ?? [], [data]);

  const detailTrimMap = useMemo(() => {
    const map = new Map();
    const register = (trims = []) => {
      trims.forEach((trim) => {
        const trimId = normalizeId(trim?.id);
        if (!trimId) return;
        map.set(trimId, {
          ...trim,
          id: trimId,
          basePrice: parsePriceValue(trim?.originalPrice ?? trim?.original_price ?? trim?.basePrice ?? trim?.price ?? 0),
          options: Array.isArray(trim?.options) ? trim.options : [],
          colors: Array.isArray(trim?.colors) ? trim.colors : [],
        });
      });
    };

    modelGroups.forEach((group) => register(group?.trims));
    if (Array.isArray(vehicleLineModels) && vehicleLineModels.length > 0) {
      vehicleLineModels.forEach((model) => register(model?.trims));
    }
    if (data?.trims?.length) {
      register(data.trims);
    }
    return map;
  }, [data, modelGroups, vehicleLineModels]);

  const convertModelGroup = useCallback(
    (group) => {
      if (!group) return null;
      const rawTrims = group.trims ?? [];
      const modelId = normalizeId(group.modelId ?? group.id ?? group.modelCode ?? group.name ?? group.modelName);
      const modelName = group.modelName ?? group.name ?? group.modelCode ?? '세부모델';
      const isImportedGroup =
        isImportedDetail ||
        Boolean(group.foreignModel) ||
        isImportedVehicleContext(group.brandCountry, group.country, group.carType);

      const normalizedTrims = rawTrims
        .map((trim) => {
          const trimId = normalizeId(trim?.id);
          if (!trimId) return null;
          const detail = detailTrimMap.get(trimId);
          const basePrice = detail?.originalPrice ?? detail?.original_price ?? detail?.basePrice ?? parsePriceValue(trim?.originalPrice ?? trim?.original_price ?? trim?.basePrice ?? trim?.price ?? 0);
          const rawName = detail?.name ?? trim?.name ?? '';

          return {
            id: trimId,
            name: formatTrimDisplayName(rawName, modelName, detail ?? trim),
            rawName,
            basePrice,
            description: detail?.description ?? trim?.description ?? '',
            options: detail?.options ?? (Array.isArray(trim?.options) ? trim.options : []),
            colors: detail?.colors ?? (Array.isArray(trim?.colors) ? trim.colors : []),
            imageUrl: detail?.imageUrl ?? trim?.imageUrl ?? '',
            // Specs mapping
            carType: detail?.carType ?? trim?.carType ?? '',
            fuelName: detail?.fuelName ?? trim?.fuelName ?? '',
            displacement: detail?.displacement ?? trim?.displacement ?? '',
            fuelEfficiency: detail?.fuelEfficiency ?? trim?.fuelEfficiency ?? '',
          };
        })
        .filter(Boolean)
        .filter((trim) => shouldKeepTrimForOrigin(trim, isImportedGroup));

      if (!normalizedTrims.length) {
        return null;
      }

      return {
        key: modelId ?? `model-${modelName}`,
        modelId: modelId ?? `model-${modelName}`,
        modelName,
        trims: normalizedTrims,
      };
    },
    [detailTrimMap, isImportedDetail],
  );

  const trimGroups = useMemo(() => {
    const groups = [];

    if (resolvedMode === 'car' && vehicleLineModels.length > 0) {
      vehicleLineModels.forEach((model) => {
        const converted = convertModelGroup(model);
        if (converted) {
          groups.push(converted);
        }
      });
    } else if (modelGroups.length > 0) {
      modelGroups.forEach((group) => {
        const converted = convertModelGroup(group);
        if (converted) {
          groups.push(converted);
        }
      });
    }

    if (!groups.length && data?.trims?.length) {
      const fallback = convertModelGroup({
        modelId: 'default',
        modelName: data?.vehicleLineName ?? data?.name ?? '세부모델',
        trims: data.trims,
      });
      if (fallback) {
        groups.push(fallback);
      }
    }

    return groups;
  }, [resolvedMode, vehicleLineModels, modelGroups, data?.trims, data?.vehicleLineName, data?.name, convertModelGroup]);

  const displayedTrimGroups = useMemo(() => {
    if (resolvedMode === 'car' && queryTrimParam) {
      const targetTrimId = normalizeId(queryTrimParam);
      if (!targetTrimId) {
        return trimGroups;
      }

      const filtered = trimGroups
        .map((group) => {
          const trims = group.trims.filter((trim) => trim.id === targetTrimId);
          if (trims.length === 0) {
            return null;
          }
          return {
            ...group,
            trims,
          };
        })
        .filter(Boolean);

      if (filtered.length > 0) {
        return filtered;
      }
    }

    return trimGroups;
  }, [trimGroups, resolvedMode, queryTrimParam]);

  const allTrims = useMemo(
    () => displayedTrimGroups.flatMap((group) => group.trims),
    [displayedTrimGroups],
  );

  const selectedTrim = useMemo(
    () => allTrims.find((trim) => trim.id === selectedTrimId) ?? null,
    [allTrims, selectedTrimId],
  );

  const selectedGroup = useMemo(
    () => displayedTrimGroups.find((group) => group.trims.some((trim) => trim.id === selectedTrim?.id)) ?? null,
    [displayedTrimGroups, selectedTrim?.id],
  );

  useEffect(() => {
    if (selectedTrim || allTrims.length === 0) {
      return;
    }
    const fallback = initialTrimId && allTrims.some((trim) => trim.id === initialTrimId)
      ? initialTrimId
      : allTrims[0].id;
    setSelectedTrimId(fallback);
  }, [selectedTrim, allTrims, initialTrimId]);

  useEffect(() => {
    if (!selectedGroup?.key) return;
    setExpandedModelId(selectedGroup.key);
  }, [selectedGroup?.key]);

  useEffect(() => {
    if (resolvedMode !== 'car' || !selectedTrimId) return;
    const current = searchParams.get('trim');
    if (current === selectedTrimId) {
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.set('trim', selectedTrimId);
    setSearchParams(next, { replace: true });
  }, [resolvedMode, selectedTrimId, searchParams, setSearchParams]);

  // 색상 선택 시 URL 파라미터 업데이트
  useEffect(() => {
    if (!selectedColorId) {
      // 색상이 선택되지 않았으면 URL에서 colorId 제거
      const current = searchParams.get('colorId');
      if (current) {
        const next = new URLSearchParams(searchParams);
        next.delete('colorId');
        setSearchParams(next, { replace: true });
      }
      return;
    }
    const current = searchParams.get('colorId');
    if (current === selectedColorId) {
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.set('colorId', selectedColorId);
    setSearchParams(next, { replace: true });
  }, [selectedColorId, searchParams, setSearchParams]);

  useEffect(() => {
    setSelectedOptionIds(new Set());

    const colors = Array.isArray(selectedTrim?.colors) ? selectedTrim.colors : [];
    const requestedColorId = normalizeId(searchParams.get('colorId'));

    // 1) URL로 전달된 colorId가 있으면 최우선
    if (requestedColorId) {
      const requested = colors.find(
        (c) => normalizeId(c?.id) === requestedColorId && canDisplayColor(c),
      );
      if (requested) {
        setSelectedColorId(requestedColorId);
        return;
      }
    }

    // 2) 없으면 첫 번째 유효한 색상 자동 선택
    // (이미지가 있거나 색상 코드가 있는 색상 중 첫 번째)
    // (이미 선택된 색상이 현재 트림에도 유효하다면 유지, 아니면 첫 번째로 변경)
    const currentIsValid = colors.some(
      (c) => normalizeId(c.id) === selectedColorId && canDisplayColor(c),
    );
    if (!currentIsValid) {
      const firstValidColor = getDisplayColors(colors)[0] || null;
      setSelectedColorId(firstValidColor ? normalizeId(firstValidColor.id) : null);
    }
  }, [selectedTrim?.id, searchParams, selectedColorId]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleModelGroup = (modelKey) => {
    setExpandedModelId((prev) => (prev === modelKey ? null : modelKey));
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
  const trimColors = selectedTrim?.colors ?? [];
  // 이미지가 있거나 색상 코드가 있는 색상만 표시
  const visibleColors = useMemo(
    () => getDisplayColors(trimColors),
    [trimColors],
  );

  const selectedOptions = useMemo(
    () => trimOptions.filter((option) => selectedOptionIds.has(normalizeId(option.id))),
    [trimOptions, selectedOptionIds],
  );

  const selectedColor = useMemo(
    () => visibleColors.find((color) => normalizeId(color.id) === selectedColorId) ?? null,
    [visibleColors, selectedColorId],
  );

  useEffect(() => {
    // 선택된 색상 변경 시 이미지/hex 확인용 디버그 로그
    // eslint-disable-next-line no-console
    console.log('[CarDetail] selectedColor 변경:', {
      selectedColorId,
      selectedColorName: selectedColor?.name,
      selectedColorImageUrl: selectedColor?.imageUrl,
      selectedColorHexCode: selectedColor?.hexCode || selectedColor?.colorCode || selectedColor?.rgbCode,
      selectedColorId: selectedColor?.id,
      timestamp: new Date().toISOString(),
    });
  }, [selectedColor, selectedColorId]);

  const optionItemsForCard = useMemo(
    () =>
      selectedOptions.map((option) => ({
        name: option.name,
        price: parsePriceValue(option.discountedPrice ?? option.price ?? option.amount ?? 0),
      })),
    [selectedOptions],
  );

  const optionPriceTotal = useMemo(
    () => optionItemsForCard.reduce((sum, option) => sum + option.price, 0),
    [optionItemsForCard],
  );

  const colorPrice = useMemo(
    () => parsePriceValue(selectedColor?.additionalPrice ?? selectedColor?.price ?? 0),
    [selectedColor],
  );

  // 트림 기본가 / 할인가 계산
  const basePriceValue = parsePriceValue(selectedTrim?.originalPrice ?? selectedTrim?.original_price ?? selectedTrim?.basePrice ?? selectedTrim?.price ?? 0);

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

    // 백엔드에서 내려주는 트림별 할인 정보 (있으면 우선 사용)
    const rawDiscountPrice = parsePriceValue(
      selectedTrim?.discountedPrice ??
        selectedTrim?.discounted_price ??
        selectedTrim?.activeTrimDiscount?.discountedPrice ??
        0,
    );

    let rawDiscountAmount = parsePriceValue(
      selectedTrim?.discountAmount ??
        selectedTrim?.discount_amount ??
        selectedTrim?.activeTrimDiscount?.discountAmount ??
        0,
    );

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

  const totalPrice = useMemo(
    () => basePriceValue + optionPriceTotal + colorPrice,
    [basePriceValue, optionPriceTotal, colorPrice],
  );

  const hierarchyTitle = useMemo(() => {
    const parts = [];
    if (data?.vehicleLineName) parts.push(data.vehicleLineName);
    if (selectedGroup?.modelName) parts.push(selectedGroup.modelName);
    if (selectedTrim?.name) parts.push(selectedTrim.name);
    return parts.join(' → ');
  }, [data?.vehicleLineName, selectedGroup?.modelName, selectedTrim?.name]);

  const heroTitle = selectedGroup?.modelName ?? data?.vehicleLineName ?? data?.name ?? '차량 상세';
  
  // 색상 선택 시 해당 색상의 이미지를 우선 사용
  // selectedColorId를 의존성에 추가하여 색상 변경 시 즉시 반영되도록 함
  const heroImage = useMemo(() => {
    const selectedColorImageUrl =
      resolveColorImageUrl(selectedColor) ||
      findBestMatchingColorImageUrl(selectedColor, [
        data,
        displayedTrimGroups,
        vehicleLineModels,
      ]);
    // 1순위: 선택된 색상의 imageUrl (색상이 선택되어 있고 imageUrl이 있는 경우)
    if (selectedColorImageUrl) {
      return selectedColorImageUrl;
    }
    // 2순위: 트림 대표 이미지
    if (selectedTrim?.imageUrl) {
      return selectedTrim.imageUrl;
    }
    // 3순위: 차량 라인 대표 이미지
    if (data?.imageUrl) {
      return data.imageUrl;
    }
    // 기본값: 빈 문자열
    return '';
  }, [
    data,
    displayedTrimGroups,
    selectedColor,
    selectedColorId,
    selectedTrim?.imageUrl,
    vehicleLineModels,
  ]);

  const breadcrumbItems = useMemo(() => {
    const items = [{ label: '홈', link: '/' }];
    if (resolvedMode === 'car') {
      items.push({ label: '국산차 견적내기', link: '/carlist/domestic' });
    } else {
      items.push({ label: '차량 상세' });
    }
    items.push({ label: heroTitle });
    return items;
  }, [resolvedMode, heroTitle]);

  const consultModelName = data?.vehicleLineName || heroTitle || '';
  const consultSource = resolvedMode === 'car' ? 'car-detail-car' : 'car-detail-trim';
  const consultType = resolvedMode === 'car' ? '차량라인상세' : '비대면견적';

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
    options.push(...optionItemsForCard.map((opt) => opt.name));

    return {
      brand: data?.brandName || '',
      model: consultModelName || '',
      trim: selectedTrim?.name || '',
      color: selectedColor?.name || '',
      phone: (phoneValue || '').trim(),
      options,
      terms,
      consultType,
      source: consultSource,
      entryLabel: `차량 상세 > ${data?.name || ''}`,
      extra: {
        vehicleLineId: data?.vehicleLineId ?? null,
        trimId: selectedTrim?.id ?? null,
        mode: resolvedMode,
      },
    };
  };

  return (
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
              <div className={styles['hero-image-wrapper']}>
                <img
                  key={heroImage || 'car-hero-image'}
                  src={heroImage}
                  alt={heroTitle}
                  className={styles['car-hero-image']}
                  onError={(e) => {
                    const currentSrc = e.target.src;
                    // 이미지 로드 실패 시 fallback 순서: 트림 이미지 -> 차량 라인 이미지
                    const fallbackImage = selectedTrim?.imageUrl || data?.imageUrl || '';
                    
                    // 무한루프 방지: 현재 이미지가 이미 fallback 이미지와 같으면 더 이상 시도하지 않음
                    if (fallbackImage && currentSrc !== fallbackImage) {
                      e.target.src = fallbackImage;
                    } else if (!fallbackImage) {
                      // 모든 fallback이 실패한 경우 빈 이미지로 처리
                      e.target.style.display = 'none';
                    }
                  }}
                  onLoad={(e) => {
                    // 이미지 로드 성공 시 display 보장
                    e.target.style.display = 'block';
                  }}
                />
              </div>
              <div className={styles['hero-info-wrapper']}>
                <div className={styles['hero-brand-title-wrapper']}>
                  {data?.brandLogoUrl && (
                    <img
                      src={data.brandLogoUrl}
                      alt={data?.brandName ?? '브랜드 로고'}
                      className={styles['hero-brand-logo']}
                    />
                  )}
                  <h1 className={styles['car-hero-title']}>{heroTitle}</h1>
                </div>
                
                <div className={styles['hero-specs']}>
                  <span>{selectedTrim?.carType || data?.carType || '차량'}</span>
                  <span className={styles['spec-divider']}></span>
                  <span>{selectedTrim?.fuelName || data?.fuelType || '연료'}</span>
                  {(selectedTrim?.displacement || data?.displacement) && (
                    <>
                      <span className={styles['spec-divider']}></span>
                      <span>{selectedTrim?.displacement || data?.displacement}cc</span>
                    </>
                  )}
                  {(selectedTrim?.fuelEfficiency || data?.fuelEfficiency) && (
                    <>
                      <span className={styles['spec-divider']}></span>
                      <span>복합연비 {selectedTrim?.fuelEfficiency || data?.fuelEfficiency}</span>
                    </>
                  )}
                </div>

                <div className={styles['hero-colors']}>
                  <div className={styles['color-label-row']}>
                    <span className={styles['color-label-text']}>외장색상 선택</span>
                    {selectedColor && (
                      <span className={styles['selected-color-name']}>{renderColorName(selectedColor.name)}</span>
                    )}
                  </div>
                  <div className={styles['color-chips']}>
                    {visibleColors.map((color, index) => {
                      const colorId = normalizeId(color.id);
                      const chipColor = resolveChipColor(color) || '#d1d5db';
                      // 색상 칩은 hexCode를 배경색으로 사용 (이미지 사용 안 함)
                      if (!chipColor) {
                        // eslint-disable-next-line no-console
                        console.warn('[CarDetail] 색상 필터링됨 (색상코드 없음):', {
                          colorId,
                          colorName: color.name,
                          index,
                        });
                        return null;
                      }
                      const isSelected = selectedColorId === colorId;
                      // 색상 칩은 hexCode를 배경색으로 사용
                      const chipStyle = { background: chipColor };
                      return (
                        <button
                          type="button"
                          key={colorId}
                          className={`${styles['color-swatch']} ${isSelected ? styles['selected'] : ''}`}
                          style={chipStyle}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // eslint-disable-next-line no-console
                            console.log('[CarDetail] 색상 클릭:', {
                              colorId,
                              colorName: color.name,
                              imageUrl: color?.imageUrl,
                              hexCode: color?.hexCode,
                              index,
                              buttonIndex: index + 1,
                              timestamp: new Date().toISOString(),
                            });
                            setSelectedColorId(colorId);
                          }}
                          onMouseDown={(e) => {
                            // eslint-disable-next-line no-console
                            console.log('[CarDetail] 색상 버튼 마우스다운:', {
                              colorId,
                              colorName: color.name,
                              index,
                            });
                          }}
                          title={color.name}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles['option-card']}>
            <div className={styles['option-card-header']} onClick={() => toggleSection('trim')}>
                <h3 className={styles['option-card-title']}>차량 라인 & 세부모델 선택</h3>
              <span className={styles['toggle-icon']}>{expandedSections.trim ? '−' : '+'}</span>
              </div>
              {expandedSections.trim && (
                <div className={styles['option-card-content']}>
                  <div className={styles['trim-selector']}>
                    {displayedTrimGroups.length === 0 ? (
                      <div className={styles['trim-empty']}>등록된 세부모델이 없습니다.</div>
                    ) : (
                      displayedTrimGroups.map((group) => {
                        const isExpanded = expandedModelId === group.key;
                        return (
                          <div key={group.key} className={styles['trim-group']}>
                            <button
                              type="button"
                              className={styles['trim-group-header']}
                              onClick={() => toggleModelGroup(group.key)}
                              aria-expanded={isExpanded}
                            >
                              <span className={styles['trim-group-title']}>{group.modelName}</span>
                              <span className={styles['group-toggle-icon']}>{isExpanded ? '−' : '+'}</span>
                            </button>
                            {isExpanded && (
                              <div className={styles['trim-group-items']}>
                                {group.trims.map((trim) => {
                        const isSelected = selectedTrimId === trim.id;
                        return (
                          <button
                            type="button"
                            key={trim.id}
                            className={`${styles['trim-option']} ${isSelected ? styles['active'] : ''}`}
                            onClick={() => setSelectedTrimId(trim.id)}
                            aria-pressed={isSelected}
                          >
                            <div className={styles['trim-radio']}>
                              {isSelected && <span className={styles['trim-check']}>✓</span>}
                            </div>
                            <div
                              className={`${styles['trim-name']} ${
                                hasAssistTaxiTrimLabel(trim.rawName ?? trim.name)
                                  ? styles['assist-taxi-trim-name']
                                  : ''
                              }`}
                            >
                              {trim.name}
                            </div>
                                      <div className={styles['trim-price']}>{formatCurrency(trim.originalPrice ?? trim.original_price ?? trim.basePrice)}</div>
                          </button>
                        );
                      })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {trimOptions.length > 0 && (
              <div className={styles['option-card']}>
                <div className={styles['option-card-header']} onClick={() => toggleSection('options')}>
                  <h3 className={styles['option-card-title']}>추가 옵션 선택</h3>
                  <span className={styles['toggle-icon']}>{expandedSections.options ? '−' : '+'}</span>
                </div>
                {expandedSections.options && (
                  <div className={styles['option-card-content']}>
                    <div className={styles['additional-options']}>
                      {trimOptions.map((option) => {
                        const optionId = normalizeId(option.id);
                        const active = selectedOptionIds.has(optionId);
                        const price = option.discountedPrice ?? option.price ?? 0;
                        return (
                          <button
                            type="button"
                            key={optionId}
                            className={`${styles['additional-option']} ${active ? styles['active'] : ''}`}
                            onClick={() => toggleOption(option.id)}
                            aria-pressed={active}
                          >
                            <div className={styles['option-checkbox']}>{active && <span>✓</span>}</div>
                            <div className={styles['option-details']}>
                              <span className={styles['option-name']}>{option.name}</span>
                              <span className={styles['option-price']}>{formatOptionPrice(price)}</span>
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
              <div className={styles['option-card-header']} onClick={() => toggleSection('contract')}>
                <h3 className={styles['option-card-title']}>계약 조건 선택</h3>
                <span className={styles['toggle-icon']}>{expandedSections.contract ? '−' : '+'}</span>
              </div>
              {expandedSections.contract && (
                <div className={styles['option-card-content']}>
                  <ContractSection
                    styles={styles}
                    brandOrigin={brandOrigin}
                    availableMethods={availableMethods}
                    contractMethod={contractMethod}
                    contractPeriod={contractPeriod}
                    deposit={deposit}
                    prepayment={prepayment}
                    mileage={mileage}
                    carTax={carTax}
                    insuranceAge={insuranceAge}
                    contractPeriodOptions={contractPeriodOptions}
                    depositOptions={depositOptions}
                    prepaymentOptions={prepaymentOptions}
                    mileageOptions={mileageOptions}
                    onChangeMethod={setContractMethod}
                    onChangePeriod={setContractPeriod}
                    onChangeDeposit={(next) => {
                      const total = parsePercent(next) + parsePercent(prepayment);
                      if (total > 40) {
                        setShowPercentToast(true);
                        return;
                      }
                      setDeposit(next);
                    }}
                    onChangePrepayment={(next) => {
                      const total = parsePercent(deposit) + parsePercent(next);
                      if (total > 40) {
                        setShowPercentToast(true);
                        return;
                      }
                      setPrepayment(next);
                    }}
                    onChangeMileage={setMileage}
                    onChangeCarTax={setCarTax}
                    onChangeInsuranceAge={setInsuranceAge}
                  />
                </div>
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
              showDiscount={brandOrigin === '수입차'}
              onEstimateClick={async () => {
                try {
                  const { submitConsult } = await import('../../services/consultHelper');

                  const phone = await ensurePhone('');
                  const payload = buildConsultPayload(phone);

                  // eslint-disable-next-line no-console
                  console.info('[CarDetail] QuickConsultCard onEstimateClick: payload', payload);

                  const result = await submitConsult(payload, {
                    kakaoOpenTarget: '_blank',
                    openKakaoOnSuccess: true,
                    useKakao: false,
                  });

                  if (
                    handleKakaoPopupBlocked(result, {
                      onNeedContact: () => setIsContactModalOpen(true),
                    })
                  ) {
                    // eslint-disable-next-line no-console
                    console.warn('[CarDetail] QuickConsultCard onEstimateClick: popup blocked & phoneMissing', result);
                    return;
                  }

                  // 연락처가 없으면 연락처 모달 띄우기 (PC/모바일 모두)
                  if (result?.meta?.phoneMissing) {
                    // eslint-disable-next-line no-console
                    console.warn('[CarDetail] QuickConsultCard onEstimateClick: phoneMissing, opening MobileContactModal');
                    setIsContactModalOpen(true);
                    return;
                  }

                  // 연락처가 있고 API 호출이 성공하면 성공 모달 표시 (펭귄 모달)
                  if (result.success && result.method === 'db') {
                    // eslint-disable-next-line no-console
                    console.info('[CarDetail] QuickConsultCard onEstimateClick: submitConsult success with contact', {
                      meta: result.meta,
                    });
                    setIsSuccessModalOpen(true);
                    return;
                  }

                  if (!result.success && result.method === 'db') {
                    // PC 환경 등에서는 기존 에러 동작 유지
                    alert(result.message || '상담 신청에 실패했습니다.');
                  }
                } catch (error) {
                  console.error('[CarDetail] 상담 신청 실패', error);
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

      <MobileContactModal
        open={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        onSubmit={async (phoneValue) => {
          try {
            const { submitConsult } = await import('../../services/consultHelper');
            const payload = buildConsultPayload(phoneValue);

            const result = await submitConsult(payload, {
              kakaoOpenTarget: '_blank',
              openKakaoOnSuccess: false,
            });

            // API 호출이 성공하면 연락처 모달 닫고 성공 모달(펭귄) 표시
            if (result.success) {
              setIsContactModalOpen(false);
              setIsSuccessModalOpen(true);
            } else {
              alert(result.message || '연락처 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
            }
          } catch (error) {
            console.error('[CarDetail] 연락처 보완 실패', error);
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
};

export default CarDetail;

