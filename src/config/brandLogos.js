// 브랜드 로고 경로 매핑 (정적 자산 기반)

// 국산 브랜드 기본 로고
export const PRIMARY_DOMESTIC_BRANDS = [
  { name: '현대', image: '/brand/현대.svg' },
  { name: '기아', image: '/brand/kia.svg' },
  { name: '제네시스', image: '/brand/제네시스.svg' },
  // 르노코리아 브랜드명은 그대로 두고, 실제 로고 파일은 르노삼성.svg 사용
  { name: '르노코리아', image: '/brand/르노삼성.svg' },
  { name: 'KGM', image: '/brand/kgm.svg' },
  { name: '쉐보레', image: '/brand/쉐보레.svg' },
];

export const PRIMARY_DOMESTIC_BRAND_NAMES = PRIMARY_DOMESTIC_BRANDS.map((brand) => brand.name);

// 수입 브랜드 기본 로고
export const FALLBACK_IMPORT_BRANDS = [
  { name: 'BMW', image: '/importbrands/bmw.svg' },
  { name: '벤츠', image: '/importbrands/벤츠.svg' },
  { name: '아우디', image: '/importbrands/아우디.svg' },
  { name: '폭스바겐', image: '/importbrands/폭스바겐.svg' },
  { name: '테슬라', image: '/importbrands/테슬라.svg' },
  { name: '볼보', image: '/importbrands/volvo.svg' },
  { name: '렉서스', image: '/importbrands/렉서스.svg' },
  { name: '토요타', image: '/importbrands/도요타.svg' },
  { name: 'BYD', image: '/importbrands/byd.svg' },
  { name: '폴스타', image: '/importbrands/폴스타.svg' },
  { name: '포드', image: '/importbrands/포드.svg' },
  { name: 'GMC', image: '/importbrands/gmc-black.svg' },
  { name: '람보르기니', image: '/importbrands/lamborghini-black.svg' },
  { name: '랜드로버', image: '/importbrands/land-rover-black.svg' },
  { name: '로터스', image: '/importbrands/lotus-black.svg' },
  { name: '롤스로이스', image: '/importbrands/rolls-royce-black.svg' },
  { name: '링컨', image: '/importbrands/lincoln-black.svg' },
  { name: '마세라티', image: '/importbrands/maserati-black.svg' },
  { name: '맥라렌', image: '/importbrands/mclaren-black.svg' },
  { name: '미니', image: '/importbrands/mini-black.svg' },
  { name: '벤틀리', image: '/importbrands/bentley-black.svg' },
  { name: '시트로엥', image: '/importbrands/citroen-black.svg' },
  { name: '애스턴마틴', image: '/importbrands/aston-martin-black.svg' },
  { name: '지프', image: '/importbrands/jeep-black.svg' },
  { name: '캐딜락', image: '/importbrands/cadillac-black.svg' },
  { name: '페라리', image: '/importbrands/ferrari-black.svg' },
  { name: '포르쉐', image: '/importbrands/porsche-black.svg' },
  { name: '푸조', image: '/importbrands/peugeot-black.svg' },
  { name: '혼다', image: '/importbrands/honda-black.svg' },
];

const IMPORT_BRAND_ALIASES = {
  GMC: '/importbrands/gmc-black.svg',
  LAMBORGHINI: '/importbrands/lamborghini-black.svg',
  LANDROVER: '/importbrands/land-rover-black.svg',
  LOTUS: '/importbrands/lotus-black.svg',
  ROLLSROYCE: '/importbrands/rolls-royce-black.svg',
  LINCOLN: '/importbrands/lincoln-black.svg',
  MASERATI: '/importbrands/maserati-black.svg',
  MCLAREN: '/importbrands/mclaren-black.svg',
  MINI: '/importbrands/mini-black.svg',
  BENTLEY: '/importbrands/bentley-black.svg',
  CITROEN: '/importbrands/citroen-black.svg',
  ASTONMARTIN: '/importbrands/aston-martin-black.svg',
  JEEP: '/importbrands/jeep-black.svg',
  CADILLAC: '/importbrands/cadillac-black.svg',
  FERRARI: '/importbrands/ferrari-black.svg',
  PORSCHE: '/importbrands/porsche-black.svg',
  PEUGEOT: '/importbrands/peugeot-black.svg',
  HONDA: '/importbrands/honda-black.svg',
  도요타: '/importbrands/도요타.svg',
  토요타: '/importbrands/도요타.svg',
};

// 브랜드 이름으로 로고 경로 찾기
export const getBrandLogo = (brandName) => {
  if (!brandName) return null;
  const name = String(brandName).trim();

  // KGM(=KG모빌리티, 구 쌍용) 등 일부 브랜드는 표기가 다양하므로 별도 보정
  const normalized = name.replace(/\s+/g, '').toUpperCase();
  const kgmAliases = ['KGM', 'KG모빌리티', 'KGMOBILITY', '쌍용', '쌍용자동차'];
  if (kgmAliases.includes(normalized)) {
    return '/brand/kgm.svg';
  }

  if (IMPORT_BRAND_ALIASES[normalized]) {
    return IMPORT_BRAND_ALIASES[normalized];
  }

  // 국산 브랜드 매칭
  const domestic = PRIMARY_DOMESTIC_BRANDS.find((b) => b.name === name);
  if (domestic?.image) return domestic.image;

  // 수입 브랜드 매칭 (대소문자/공백 무시 일부 보정)
  const importMatch =
    FALLBACK_IMPORT_BRANDS.find((b) => b.name === name) ||
    FALLBACK_IMPORT_BRANDS.find((b) => b.name.toLowerCase() === name.toLowerCase());

  if (importMatch?.image) return importMatch.image;

  return null;
};


