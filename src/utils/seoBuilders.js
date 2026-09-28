import { DEFAULT_SEO } from '../config/seoConfig';

const normalize = (value) => (value ? String(value).trim() : '');

const joinParts = (parts, separator = ' ') =>
  parts
    .map((p) => normalize(p))
    .filter(Boolean)
    .join(separator);

// 계약 기간(예: "24개월")에서 숫자만 추출해 "24개월" / "24개월 계약" 등에 재활용
const extractPeriodToken = (period) => {
  const v = normalize(period);
  if (!v) return '';
  return v;
};

// 연간 주행거리(예: "10,000km")를 사람이 읽기 좋게 유지
const extractMileageToken = (mileage) => {
  const v = normalize(mileage);
  if (!v) return '';
  return v;
};

export function buildCarDetailSeo({
  brand,
  model,
  segment,
  fuelOrType,
  period,
  mileage,
} = {}) {
  const brandName = normalize(brand);
  const modelName = normalize(model);
  const segmentLabel = normalize(segment);
  const fuelLabel = normalize(fuelOrType);
  const periodLabel = extractPeriodToken(period);
  const mileageLabel = extractMileageToken(mileage);

  if (!brandName && !modelName) {
    return { ...DEFAULT_SEO };
  }

  // ----- TITLE -----
  const mainName = joinParts([brandName, modelName]);
  const fuelInTitle = fuelLabel && !modelName.includes(fuelLabel) ? ` ${fuelLabel}` : '';

  let titleCore = `${mainName}${fuelInTitle} 장기렌트·리스 최저가`;

  if (periodLabel && mileageLabel) {
    titleCore += ` | ${periodLabel} ${mileageLabel}`;
  } else if (periodLabel || mileageLabel) {
    titleCore += ` | ${joinParts([periodLabel, mileageLabel])}`;
  }
  
  // 중간 수수료 0원 강조
  titleCore += ' | 수수료 0원 최대 할인';

  const title = `${titleCore} | 블라인드 카스토리`;

  // ----- DESCRIPTION -----
  const segmentPart = segmentLabel ? ` ${segmentLabel}` : '';
  const fuelPart = fuelLabel ? ` ${fuelLabel}` : '';

  const firstSentenceParts = [
    `${brandName} ${modelName}${segmentPart}${fuelPart}`.trim(),
    '장기렌트·리스 최저가 비교!',
  ];

  let conditionPart = '';
  if (periodLabel && mileageLabel) {
    conditionPart = ` ${periodLabel} / ${mileageLabel} 조건의 월 렌트료를 중간 수수료 0원으로 최대 할인.`;
  } else if (periodLabel || mileageLabel) {
    conditionPart = ` ${joinParts([periodLabel, mileageLabel])} 조건의 월 렌트료를 중간 수수료 0원으로 최대 할인.`;
  } else {
    conditionPart = ' 중간 수수료 0원으로 최대 할인.';
  }

  const firstSentence = `${joinParts(firstSentenceParts)}${conditionPart}`;

  const baseSecondSentence =
    `${brandName} ${modelName} 싸게 구매하는 방법! 초기비용, 보증금, 잔존가치, 인수 조건까지 여러 렌트·캐피탈사 상품을 비교해 최저가 견적을 제공합니다.`;

  const thirdSentence =
    '경기·서울 전역 당일 상담, 전국 배송 가능. 개인·법인·개인사업자·저신용 고객 모두 상담 가능합니다.';

  const description = `${firstSentence} ${baseSecondSentence} ${thirdSentence}`;

  // ----- KEYWORDS (롱테일 키워드 대폭 확장) -----
  const baseKeywords = [
    // 기본 키워드
    `${modelName} 장기렌트`,
    `${brandName} ${modelName} 장기렌트`,
    `${modelName} 리스`,
    `${brandName} ${modelName} 리스`,
    `${brandName} 장기렌트`,
    `${brandName} 리스`,
    
    // 가격/할인 관련 (핵심 롱테일)
    `${modelName} 장기렌트 가격`,
    `${modelName} 리스 가격`,
    `${modelName} 장기렌트 최저가`,
    `${modelName} 리스 최저가`,
    `${brandName} ${modelName} 싸게`,
    `${modelName} 싸게 구매`,
    `${modelName} 저렴하게`,
    `${brandName} ${modelName} 할인`,
    `${modelName} 특가`,
    
    // 구매 팁/방법 (정보성 검색어)
    `${modelName} 구매 팁`,
    `${modelName} 구매 방법`,
    `${modelName} 장기렌트 후기`,
    `${modelName} 리스 후기`,
    `${brandName} ${modelName} 견적`,
    `${modelName} 장기렌트 견적`,
    `${modelName} 리스 견적`,
    
    // 연료/세그먼트 관련
    fuelLabel ? `${modelName} ${fuelLabel} 장기렌트` : '',
    fuelLabel ? `${modelName} ${fuelLabel} 리스` : '',
    segmentLabel ? `${segmentLabel} 장기렌트` : '',
    segmentLabel ? `${segmentLabel} 리스` : '',
    fuelLabel && segmentLabel ? `${fuelLabel} ${segmentLabel} 장기렌트` : '',
    
    // 브랜드 조합
    `${brandName} 최저가`,
    `${brandName} 할인`,
  ];

  const periodMileageKeywords = [];
  if (periodLabel) {
    periodMileageKeywords.push(`${modelName} ${periodLabel}`);
    periodMileageKeywords.push(`장기렌트 ${periodLabel}`);
  }
  if (mileageLabel) {
    periodMileageKeywords.push(`${modelName} ${mileageLabel}`);
  }

  const keywords = [...baseKeywords, ...periodMileageKeywords, '블라인드 카스토리']
    .map((k) => normalize(k))
    .filter(Boolean)
    .join(', ');

  return {
    title,
    description,
    keywords,
  };
}


