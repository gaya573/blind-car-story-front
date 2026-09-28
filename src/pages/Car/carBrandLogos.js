import { getBrandLogo } from '../../config/brandLogos';

const normalizeBrand = (value = '') => String(value).replace(/\s+/g, '').toLowerCase();

// 퍼블리싱 제조사 로고(public/bcs/images/manufacturers). 키는 공백을 뺀 소문자 브랜드명.
const PUBLISHING_LOGO_FILES = {
  현대: 'hyundai',
  hyundai: 'hyundai',
  기아: 'kia',
  kia: 'kia',
  제네시스: 'genesis',
  genesis: 'genesis',
  르노코리아: 'renault-korea',
  르노삼성: 'renault-korea',
  renault: 'renault-korea',
  kgm: 'kgm',
  kg모빌리티: 'kgm',
  kgmobility: 'kgm',
  쌍용: 'kgm',
  쌍용자동차: 'kgm',
  쉐보레: 'chevrolet',
  한국지엠: 'chevrolet',
  chevrolet: 'chevrolet',
  bmw: 'bmw',
  벤츠: 'mercedes-benz',
  메르세데스벤츠: 'mercedes-benz',
  '메르세데스-벤츠': 'mercedes-benz',
  'mercedes-benz': 'mercedes-benz',
  mercedesbenz: 'mercedes-benz',
  아우디: 'audi',
  audi: 'audi',
  폭스바겐: 'volkswagen',
  volkswagen: 'volkswagen',
  볼보: 'volvo',
  volvo: 'volvo',
  렉서스: 'lexus',
  lexus: 'lexus',
  토요타: 'toyota',
  도요타: 'toyota',
  toyota: 'toyota',
  byd: 'byd',
  폴스타: 'polestar',
  polestar: 'polestar',
  포드: 'ford',
  ford: 'ford',
};

// 퍼블리싱 표기와 다른 API 브랜드명 (KGM → KG모빌리티, 도요타 → 토요타)
const DISPLAY_LABELS = {
  도요타: '토요타',
  kgm: 'KG모빌리티',
  kgmobility: 'KG모빌리티',
  쌍용: 'KG모빌리티',
  쌍용자동차: 'KG모빌리티',
};

/** 브랜드 로고 주소. 퍼블리싱 로고 → 서버 로고 → 기존 사이트 로고 순서로 찾는다. */
export const resolveBrandLogoUrl = (brandName, fallbackUrl) => {
  const file = PUBLISHING_LOGO_FILES[normalizeBrand(brandName)];
  if (file) return `/bcs/images/manufacturers/${file}.svg`;
  return fallbackUrl || getBrandLogo(brandName) || null;
};

export const brandDisplayLabel = (brandName = '') => DISPLAY_LABELS[normalizeBrand(brandName)] ?? brandName;
