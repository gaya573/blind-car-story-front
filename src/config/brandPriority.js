// 브랜드 우선순위 및 국산/수입 플래그 하드코딩
// key: 브랜드 이름 (API에서 내려오는 name 기준)
// value: { origin: 'domestic' | 'import', order: number }
//
// order가 낮을수록 먼저 노출됩니다.

export const BRAND_PRIORITY_MAP = {
  // 국산 브랜드 (order 1xx 대)
  현대: { origin: 'domestic', order: 101 },
  기아: { origin: 'domestic', order: 102 },
  제네시스: { origin: 'domestic', order: 103 },
  르노코리아: { origin: 'domestic', order: 104 },
  르노삼성: { origin: 'domestic', order: 104 }, // 구 명칭도 함께 처리
  KGM: { origin: 'domestic', order: 105 },
  'KG모빌리티': { origin: 'domestic', order: 105 },
  'KG 모빌리티': { origin: 'domestic', order: 105 },
  쌍용: { origin: 'domestic', order: 105 },
  쉐보레: { origin: 'domestic', order: 106 },

  // 수입 브랜드 (order 2xx 대)
  BMW: { origin: 'import', order: 201 },
  bmw: { origin: 'import', order: 201 },
  벤츠: { origin: 'import', order: 202 },
  '메르세데스-벤츠': { origin: 'import', order: 202 },
  메르세데스벤츠: { origin: 'import', order: 202 },
  아우디: { origin: 'import', order: 203 },
  AUDI: { origin: 'import', order: 203 },
  폭스바겐: { origin: 'import', order: 204 },
  테슬라: { origin: 'import', order: 205 },
  TESLA: { origin: 'import', order: 205 },
  볼보: { origin: 'import', order: 206 },
  VOLVO: { origin: 'import', order: 206 },
  렉서스: { origin: 'import', order: 207 },
  도요타: { origin: 'import', order: 208 },
  토요타: { origin: 'import', order: 208 },
  Toyota: { origin: 'import', order: 208 },
  TOYOTA: { origin: 'import', order: 208 },
  포르쉐: { origin: 'import', order: 209 },
  폴스타: { origin: 'import', order: 210 },
  포드: { origin: 'import', order: 211 },
  BYD: { origin: 'import', order: 212 },
  byd: { origin: 'import', order: 212 },
};

export function getPreferredBrandLabel(brand) {
  if (!brand) return '';
  const name = typeof brand === 'string' ? brand : brand.name;
  const compactName = getCanonicalBrandKey(name);

  if (['kgm', 'kg모빌리티', 'kgmobility', '쌍용', '쌍용자동차'].includes(compactName)) {
    return 'KGM';
  }
  if (['도요타', '토요타', 'toyota'].includes(compactName)) {
    return '토요타';
  }
  return name || '';
}

export function getCanonicalBrandKey(brand) {
  const name = typeof brand === 'string' ? brand : brand?.name;
  return String(name || '').replace(/\s+/g, '').toLowerCase();
}

export function isSameBrandName(left, right) {
  return getCanonicalBrandKey(getPreferredBrandLabel(left)) === getCanonicalBrandKey(getPreferredBrandLabel(right));
}

// 브랜드 1개에 대한 정규화된 우선순위/국산·수입 정보 반환
export function getBrandPriorityInfo(brand) {
  if (!brand) return null;
  const name = typeof brand === 'string' ? brand : brand.name;
  const country = typeof brand === 'string' ? undefined : brand.country;

  const info = BRAND_PRIORITY_MAP[name] || BRAND_PRIORITY_MAP[getPreferredBrandLabel(brand)];
  if (info) {
    return info;
  }

  // 맵에 없으면 country로 국산/수입만 추론하고 기본 order 부여
  const isDomestic =
    country &&
    (country === 'KR' ||
      country.toUpperCase().includes('KOREA') ||
      country.includes('한국') ||
      country.includes('대한민국'));

  return {
    origin: isDomestic ? 'domestic' : 'import',
    order: isDomestic ? 500 : 900,
  };
}

// 브랜드 배열을 우선순위 + 이름 기준으로 정렬
export function sortBrandsByPriority(brands) {
  if (!Array.isArray(brands)) return [];

  return [...brands].sort((a, b) => {
    const aInfo = getBrandPriorityInfo(a);
    const bInfo = getBrandPriorityInfo(b);

    if (aInfo.order !== bInfo.order) {
      return aInfo.order - bInfo.order;
    }

    return (a.name || '').localeCompare(b.name || '', 'ko', { sensitivity: 'base' });
  });
}


