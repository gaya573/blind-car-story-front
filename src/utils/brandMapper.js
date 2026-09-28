/**
 * 브랜드명을 파일명으로 매핑하는 유틸리티
 * API에서 받은 브랜드명을 실제 파일명으로 변환
 */

// 국산차 브랜드 매핑
const DOMESTIC_BRANDS = {
  '현대': '현대',
  'hyundai': '현대',
  'HYUNDAI': '현대',
  
  '기아': 'kia',
  'kia': 'kia',
  'KIA': 'kia',
  
  '제네시스': '제네시스',
  'genesis': '제네시스',
  'GENESIS': '제네시스',
  
  'KGM': 'kgm',
  'kgm': 'kgm',
  '쌍용': 'kgm',
  
  '르노': '르노삼성',
  '르노삼성': '르노삼성',
  'renault': '르노삼성',
  
  '쉐보레': '쉐보레',
  'chevrolet': '쉐보레',
};

// 수입차 브랜드 매핑
const IMPORT_BRANDS = {
  'bmw': 'bmw',
  'BMW': 'bmw',
  
  '벤츠': '벤츠',
  'benz': '벤츠',
  'BENZ': '벤츠',
  'mercedes': '벤츠',
  'mercedes-benz': '벤츠',
  
  '아우디': '아우디',
  'audi': '아우디',
  'AUDI': '아우디',
  
  '폭스바겐': '폭스바겐',
  'volkswagen': '폭스바겐',
  'VW': '폭스바겐',
  
  '포드': '포드',
  'ford': '포드',
  'FORD': '포드',
  
  '테슬라': '테슬라',
  'tesla': '테슬라',
  'TESLA': '테슬라',
  
  '도요타': '도요타',
  'toyota': '도요타',
  'TOYOTA': '도요타',
  
  '렉서스': '렉서스',
  'lexus': '렉서스',
  'LEXUS': '렉서스',
  
  'byd': 'byd',
  'BYD': 'byd',
  
  '볼보': 'volvo',
  'volvo': 'volvo',
  'VOLVO': 'volvo',
  
  '폴스타': '폴스타',
  'polestar': '폴스타',
  'POLESTAR': '폴스타',
};

/**
 * 브랜드명을 파일명으로 변환
 * @param {string} brandName - API에서 받은 브랜드명
 * @returns {{ fileName: string, type: 'domestic' | 'import' | null }}
 */
export const getBrandFileName = (brandName) => {
  if (!brandName) return { fileName: null, type: null };
  
  const normalized = String(brandName).trim();
  
  // 국산차 먼저 확인
  if (DOMESTIC_BRANDS[normalized]) {
    return {
      fileName: DOMESTIC_BRANDS[normalized],
      type: 'domestic',
    };
  }
  
  // 수입차 확인
  if (IMPORT_BRANDS[normalized]) {
    return {
      fileName: IMPORT_BRANDS[normalized],
      type: 'import',
    };
  }
  
  // 매핑되지 않은 경우 원본 반환
  return {
    fileName: normalized,
    type: null,
  };
};

/**
 * 브랜드 로고 이미지 경로 반환
 * @param {string} brandName - API에서 받은 브랜드명
 * @returns {string} - 이미지 경로
 */
export const getBrandLogoPath = (brandName) => {
  const { fileName, type } = getBrandFileName(brandName);
  
  if (!fileName) return null;
  
  // 타입이 명확한 경우
  if (type === 'domestic') {
    return `/brand/${fileName}.svg`;
  }
  if (type === 'import') {
    return `/importbrands/${fileName}.svg`;
  }
  
  // 타입이 불명확한 경우 국산차 우선
  return `/brand/${fileName}.svg`;
};

/**
 * 브랜드 로고 폴백 경로 반환
 * @param {string} brandName - API에서 받은 브랜드명
 * @returns {string | null} - 폴백 이미지 경로
 */
export const getBrandLogoFallbackPath = (brandName) => {
  const { fileName, type } = getBrandFileName(brandName);
  
  if (!fileName) return null;
  
  // 국산차로 시도했으면 수입차 경로 반환
  if (type === 'domestic' || type === null) {
    return `/importbrands/${fileName}.svg`;
  }
  
  // 수입차로 시도했으면 국산차 경로 반환
  if (type === 'import') {
    return `/brand/${fileName}.svg`;
  }
  
  return null;
};

