import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Breadcrumb from '../../components/Breadcrumb';
import QuickConsultCard from '../../components/QuickConsultCard';
import Toast from '../../components/Toast.jsx';
import styles from './CarDetail.module.css';
import { carAPI } from '../../services/carApi';
import { useShareableConsultUrl } from '../../utils/shareableUrl';
import { findBestMatchingColorImageUrl } from '../../utils/colorImageFallback';
import MobileContactModal from '../../components/MobileContactModal.jsx';
import BrowserContactModal from '../../components/BrowserContactModal.jsx';
import ConsultSuccessModal from '../../components/ConsultSuccessModal.jsx';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import { buildCarDetailSeo } from '../../utils/seoBuilders';
import { getStoredUserPhone } from '../../utils/phoneStorage';
import {
  isImportedVehicleContext,
  shouldKeepTrimForOrigin,
} from '../../utils/vehiclePriceGuards';
import { formatTrimDisplayName, hasAssistTaxiTrimLabel } from '../../utils/trimDisplayName';


const CONTACT_PROMPT_DEFAULT =
  '휴대폰 번호를 남겨주시면 담당 매니저가 빠르게 도와드립니다.';

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

// hex / rgb / rgba 모두 안전하게 처리하는 색상 변환 유틸 (CarDetail.jsx 와 동일)
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

const getColorRawCode = (color) =>
  color?.hexCode ||
  color?.colorCode ||
  color?.rgb ||
  color?.rgbCode ||
  '';

const normalizeColorImageName = (name = '') =>
  String(name)
    .toLowerCase()
    .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
    .replace(/&/g, '/')
    .split(/[\/|]/)
    .flatMap((part) => {
      const normalized = part.replace(/\s+/g, '').trim();
      const withoutFinish = normalized.replace(/(투톤|원톤|무광|유광|매트|펄|메탈릭)$/g, '');
      return normalized === withoutFinish ? [normalized] : [normalized, withoutFinish];
    })
    .filter(Boolean);

const normalizeColorHex = (value) => {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!match) return null;
  const hex = match[1];
  if (hex.length === 3) {
    return `#${hex.split('').map((char) => char + char).join('').toUpperCase()}`;
  }
  return `#${hex.toUpperCase()}`;
};

const getColorImageMatchScore = (sourceColor, targetColor) => {
  if (!sourceColor || !targetColor) return 0;

  const sourceNames = normalizeColorImageName(sourceColor.name);
  const targetNames = normalizeColorImageName(targetColor.name);
  let score = 0;
  if (
    sourceNames.length > 0 &&
    targetNames.length > 0 &&
    sourceNames.some((sourceName) =>
      targetNames.some(
        (targetName) =>
          sourceName === targetName ||
          sourceName.includes(targetName) ||
          targetName.includes(sourceName),
      ),
    )
  ) {
    score = Math.max(
      score,
      sourceNames.some((sourceName) => targetNames.includes(sourceName)) ? 100 : 70,
    );
  }

  const sourceHex = normalizeColorHex(getColorRawCode(sourceColor));
  const targetHex = normalizeColorHex(getColorRawCode(targetColor));
  const genericHexes = new Set([
    '#777777',
    '#808080',
    '#888888',
    '#999999',
    '#C0C0C0',
  ]);
  if (sourceHex && targetHex && sourceHex === targetHex && !genericHexes.has(sourceHex)) {
    score = Math.max(score, 40);
  }

  return score;
};

const collectColorsWithImages = (sources) => {
  const colors = [];
  const visit = (item) => {
    if (!item) return;
    if (Array.isArray(item)) {
      item.forEach(visit);
      return;
    }
    if (resolveColorImageUrl(item)) {
      colors.push(item);
    }
    if (Array.isArray(item.colors)) visit(item.colors);
    if (Array.isArray(item.availableColors)) visit(item.availableColors);
    if (Array.isArray(item.trims)) visit(item.trims);
  };

  visit(sources);
  return colors;
};

const findBestMatchingColorImage = (selectedColor, sources) => {
  if (!selectedColor) return null;
  return collectColorsWithImages(sources).reduce(
    (best, color) => {
      const score = getColorImageMatchScore(color, selectedColor);
      return score > best.score ? { color, score } : best;
    },
    { color: null, score: 0 },
  ).color;
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

const CarLineDetail = () => {
  const { carId } = useParams();
  const navigate = useNavigate();

  const [selectedTrimId, setSelectedTrimId] = useState(null);
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
  const [mobileContactMessage, setMobileContactMessage] = useState('');
  const [isBrowserContactModalOpen, setIsBrowserContactModalOpen] = useState(false);
  const [browserContactMessage, setBrowserContactMessage] = useState('');
  const [isBrowserContactSubmitting, setIsBrowserContactSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
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

  const { data: vehicleLineModels = [], isLoading, isError } = useQuery({
    queryKey: ['car-line-models', carId],
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
          return {
            ...model,
            trims: Array.isArray(trims) ? trims : [],
          };
        }),
      );
      return modelsWithTrims.filter((model) => model.trims.length > 0);
    },
    staleTime: 1000 * 60,
  });

  const displayVehicleLineModels = useMemo(
    () =>
      vehicleLineModels
        .map((model) => {
          const isImportedModel =
            Boolean(model?.foreignModel) ||
            isImportedVehicleContext(model?.brandCountry, model?.country, model?.carType);
          const trims = (model.trims ?? []).filter((trim) =>
            shouldKeepTrimForOrigin(trim, isImportedModel),
          );
          return {
            ...model,
            trims,
          };
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
    setSelectedTrimId((prev) => {
      if (prev && allTrims.some((trim) => trim.id === prev)) {
        return prev;
      }
      return allTrims[0].id;
    });
  }, [allTrims]);

  const {
    data: selectedTrimDetail,
  } = useQuery({
    queryKey: ['car-line-trim-detail', selectedTrimId],
    queryFn: async () => {
      if (!selectedTrimId) {
        return null;
      }
      return carAPI.getCarDetail(selectedTrimId);
    },
    enabled: Boolean(selectedTrimId),
  });

  const selectedTrim = useMemo(
    () => allTrims.find((trim) => trim.id === selectedTrimId) ?? null,
    [allTrims, selectedTrimId],
  );

  const detailTrim = useMemo(() => {
    if (!selectedTrimDetail?.trims) return null;
    return selectedTrimDetail.trims.find((trim) => normalizeId(trim.id) === selectedTrimId) ?? null;
  }, [selectedTrimDetail, selectedTrimId]);

  const rawTrimOptions = detailTrim?.options ?? [];
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
  const trimColors = detailTrim?.colors ?? (selectedTrimDetail?.availableColors || []);
  const visibleColors = useMemo(
    () => getDisplayColors(trimColors),
    [trimColors],
  );
  const vehicleLineName = selectedTrim?.vehicleLineName ?? selectedTrimDetail?.name ?? '';
  const brandName = selectedTrimDetail?.brandName ?? '';

  const detailSegment =
    selectedTrimDetail?.segment || selectedTrimDetail?.segmentName || null;
  const detailFuel =
    selectedTrimDetail?.fuelType ||
    selectedTrimDetail?.fuel ||
    selectedTrimDetail?.fuelOrType ||
    null;

  const {
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords,
  } = useMemo(
    () =>
      buildCarDetailSeo({
        brand: brandName,
        model: vehicleLineName,
        segment: detailSegment,
        fuelOrType: detailFuel,
        period: contractPeriod,
        mileage,
      }),
    [brandName, vehicleLineName, detailSegment, detailFuel, contractPeriod, mileage],
  );


  // 백엔드에서 내려주는 brandCountry 로 국산/수입 구분
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

  const availableMethods = useMemo(() => {
    // 수입차일 때만 신차구입(할부) 노출
    if (brandOrigin === '수입차') {
      return ['장기렌탈', '리스', '신차구입(할부)'];
    }
    return ['장기렌탈', '리스'];
  }, [brandOrigin]);

  // 브랜드/국적이 바뀌어 현재 이용방법이 유효하지 않으면 기본값으로 리셋
  useEffect(() => {
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
              className={`${styles['contract-btn']} ${contractPeriod === option ? styles['contract-btn-active'] : ''}`}
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

  // 트림이 바뀔 때만 옵션/색상 초기화 (무한 루프 방지)
  useEffect(() => {
    if (!selectedTrim) return;

    setSelectedOptionIds(new Set());

    const firstColorId = visibleColors[0] ? normalizeId(visibleColors[0].id) : null;
    setSelectedColorId((prev) => {
      const currentIsValid = visibleColors.some((color) => normalizeId(color.id) === prev);
      return currentIsValid ? prev : firstColorId;
    });
  }, [selectedTrimId, selectedTrim, visibleColors]);

  useEffect(() => {
    if (!selectedTrim) return;
    setExpandedModelId(selectedTrim.modelId ?? 'default');
  }, [selectedTrim?.modelId]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleModelGroup = useCallback((modelKey) => {
    setExpandedModelId((prev) => (prev === modelKey ? null : modelKey));
  }, []);

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

  const selectedColor = useMemo(
    () => visibleColors.find((color) => normalizeId(color.id) === selectedColorId) ?? null,
    [visibleColors, selectedColorId],
  );
  const selectedColorCss = selectedColor ? resolveChipColor(selectedColor) || '#d1d5db' : null;
  const selectedColorSquareStyle = selectedColorCss
    ? { background: selectedColorCss }
    : undefined;  // 색상 선택 시 해당 색상의 이미지를 우선 사용
  const heroImage = useMemo(() => {
    const selectedColorImageUrl = resolveColorImageUrl(selectedColor);
    // 1순위: 선택된 색상의 imageUrl (색상이 선택되어 있고 imageUrl이 있는 경우)
    if (selectedColorImageUrl) {
      return selectedColorImageUrl;
    }
    const matchingColorImageUrl = findBestMatchingColorImageUrl(selectedColor, [
      selectedTrimDetail,
      displayVehicleLineModels,
    ]);
    if (matchingColorImageUrl) {
      return matchingColorImageUrl;
    }
    // 2순위: 트림 상세 이미지
    if (selectedTrimDetail?.imageUrl) {
      return selectedTrimDetail.imageUrl;
    }
    // 기본값: null
    return null;
  }, [displayVehicleLineModels, selectedColor, selectedTrimDetail]);

  const seoImage = heroImage || '/특가차량.png';

  const colorPrice = useMemo(
    () => parsePriceValue(selectedColor?.additionalPrice ?? selectedColor?.price ?? 0),
    [selectedColor],
  );

  // 오른쪽 견적 카드에는 "선택한 옵션"만 들어가야 하므로, 체크된 옵션만 따로 필터링
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

  const contractPeriodOptions = ['24개월', '36개월', '48개월', '60개월'];
  const depositOptions = ['없음', '10%', '20%', '30%', '40%'];
  const prepaymentOptions = ['없음', '10%', '20%', '30%', '40%'];
  const mileageOptions = ['10,000km', '20,000km', '30,000km', '40,000km', '50,000km'];

  const parsePercent = (value) => {
    if (!value || value === '없음') return 0;
    const match = String(value).match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  };

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

    // 1) 백엔드 DiscountInfo(신규 구조) 우선 사용
    const discountInfo = selectedTrim?.discountInfo ?? selectedTrim?.activeTrimDiscount ?? null;

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

  const breadcrumbItems = useMemo(
    () => [
      { label: '홈', link: '/' },
      { label: '차량 상세' },
      { label: vehicleLineName || '차량 라인' },
    ],
    [vehicleLineName],
  );

  const hierarchyTitle = useMemo(() => {
    const parts = [];
    if (vehicleLineName) parts.push(vehicleLineName);
    if (selectedTrim?.name) parts.push(selectedTrim.name);
    return parts.join(' → ');
  }, [vehicleLineName, selectedTrim?.name]);

  const handleNavigateBack = () => {
    navigate(-1);
  };

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
        model: vehicleLineName,
        vehicleLineId: Number(carId) || '',
        trimId: selectedTrimId || '',
        colorId: selectedColorId || '',
        optionIds: Array.from(selectedOptionIds || []),
        terms,
        consultType: '차량라인상세',
        source: 'car-line-detail',
      };
    },
    (preset) => {
      if (preset?.trimId) setSelectedTrimId(preset.trimId);
      if (preset?.colorId) setSelectedColorId(preset.colorId);
      if (preset?.optionIds?.length) setSelectedOptionIds(new Set(preset.optionIds));
      // terms는 화면 상태에 선택적으로 매핑
    },
    [
      brandName,
      vehicleLineName,
      carId,
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

  const buildConsultPayload = useCallback(
    (phoneValue) => {
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
      brand: brandName || '',
      model: vehicleLineName || '',
      trim: selectedTrim?.name || '',
      color: selectedColor?.name || '',
      phone: (phoneValue || '').trim(),
      options,
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
    };
    },
    [
      brandOrigin,
      contractPeriod,
      contractMethod,
      deposit,
      mileage,
      prepayment,
      selectedColor?.name,
      selectedOptionsForSubmit,
      brandName,
      vehicleLineName,
      selectedTrim?.name,
      carId,
      selectedTrim?.id,
      carTax,
      insuranceAge,
      selectedColor,
    ],
  );

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
        console.error('[CarLineDetail] 브라우저 연락처 보완 실패', error);
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

  if (isError || vehicleLineModels.length === 0) {
    return (
      <div className={styles['car-detail-page']}>
        <div className={styles['car-detail-container']}>
          <div className={styles['error-state']}>
            차량 정보를 불러오지 못했습니다.{' '}
            <button type="button" onClick={handleNavigateBack}>
              이전 페이지로 돌아가기
            </button>
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
              <img
                key={heroImage || 'car-hero-image'}
                src={heroImage || ''}
                alt={vehicleLineName}
                className={styles['car-hero-image']}
                onError={(e) => {
                  const currentSrc = e.target.src;
                  // 이미지 로드 실패 시 fallback 순서: 트림 상세 이미지
                  const fallbackImage = selectedTrimDetail?.imageUrl || null;
                  
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
              <div className={styles['car-info-badge']}>
                <div className={styles['brand-summary']}>
                  <div
                    className={styles['brand-logo-square']}
                    style={selectedColorSquareStyle}
                    title={selectedColor?.name || brandName || undefined}
                  >
                    {!selectedColorCss && selectedTrimDetail?.brandLogoUrl && (
                        <img
                          src={selectedTrimDetail.brandLogoUrl}
                          alt={brandName || '브랜드 로고'}
                        />
                    )}
                  </div>
                  <div>
                      <h1 className={styles['car-hero-title']}>
                        {vehicleLineName || '차량 상세'}
                      </h1>
                    <div className={styles['brand-meta']}>
                      <span className={styles['car-brand-name']}>{brandName}</span>
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
                        const colorId = normalizeId(color.id);
                        const chipColor = resolveChipColor(color) || '#d1d5db';
                        const isSelected = selectedColorId === colorId;
                        // 색상 칩은 hexCode를 배경색으로 사용 (이미지 사용 안 함)
                        const chipStyle = { background: chipColor };
                        return (
                          <button
                            type="button"
                            key={colorId ?? color.name}
                              className={`${styles['color-swatch']} ${
                                isSelected ? styles['selected'] : ''
                              }`}
                            style={chipStyle}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedColorId(colorId);
                            }}
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
                <h3 className={styles['option-card-title']}>차량 라인 & 세부모델 선택</h3>
                  <span
                    className={`${styles['toggle-icon']} ${
                      expandedSections.trim ? styles.expanded : ''
                    }`}
                  >
                    ▼
                  </span>
              </div>
              {expandedSections.trim && (
                <div className={styles['option-card-content']}>
                  <div className={styles['trim-selector']}>
                    {displayVehicleLineModels.length === 0 ? (
                      <div className={styles['trim-empty']}>등록된 세부모델이 없습니다.</div>
                    ) : (
                      displayVehicleLineModels.map((model) => {
                        const modelKey = normalizeId(model.id) ?? model.name;
                        const isExpanded = expandedModelId === modelKey;
                        return (
                          <div key={modelKey} className={styles['trim-group']}>
                            <button
                              type="button"
                              className={styles['trim-group-header']}
                              onClick={() => toggleModelGroup(modelKey)}
                              aria-expanded={isExpanded}
                            >
                              <span className={styles['trim-group-title']}>{model.name}</span>
                                <span
                                  className={`${styles['group-toggle-icon']} ${
                                    isExpanded ? styles.expanded : ''
                                  }`}
                                >
                                  ▼
                                </span>
                            </button>
                            {isExpanded && (
                              <div className={styles['trim-group-items']}>
                                {(model.trims ?? []).map((trim) => {
                                  const trimId = normalizeId(trim.id);
                                  const isSelected = selectedTrimId === trimId;
                                  return (
                                    <button
                                      type="button"
                                      key={trimId}
                                        className={`${styles['trim-option']} ${
                                          isSelected ? styles['active'] : ''
                                        }`}
                                      onClick={() => setSelectedTrimId(trimId)}
                                      aria-pressed={isSelected}
                                    >
                                      <div className={styles['trim-radio']}>
                                          {isSelected && (
                                            <span className={styles['trim-check']}>✓</span>
                                          )}
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
                                        <div className={styles['trim-price']}>
                                          {formatCurrency(trim.originalPrice ?? trim.original_price ?? trim.basePrice ?? trim.price)}
                                        </div>
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
                  <div
                    className={styles['option-card-header']}
                    onClick={() => toggleSection('options')}
                  >
                  <h3 className={styles['option-card-title']}>추가 옵션 선택</h3>
                    <span
                      className={`${styles['toggle-icon']} ${
                        expandedSections.options ? styles.expanded : ''
                      }`}
                    >
                      ▼
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
                  <span
                    className={`${styles['toggle-icon']} ${
                      expandedSections.contract ? styles.expanded : ''
                    }`}
                  >
                    ▼
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
                  console.info('[CarLineDetail] QuickConsultCard onEstimateClick: payload', payload);

                  const result = await submitConsult(payload, {
                    openKakaoOnSuccess: false,
                    useKakao: false,  // 카카오 OAuth 사용 안 함
                  });

                  // eslint-disable-next-line no-console
                  console.info('[CarLineDetail] QuickConsultCard onEstimateClick: result', result);

                  if (result.success) {
                    setIsSuccessModalOpen(true);
                  } else {
                    alert(result.message || '상담 신청에 실패했습니다.');
                  }
                } catch (error) {
                  console.error('[CarLineDetail] 상담 신청 실패', error);
                  alert('상담 신청에 실패했습니다. 다시 시도해주세요.');
                }
              }}
            />
      </aside>

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
              console.error('[CarLineDetail] 연락처 보완 실패', error);
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
      </div>
    </div>
    </>
  );
};

export default CarLineDetail;

