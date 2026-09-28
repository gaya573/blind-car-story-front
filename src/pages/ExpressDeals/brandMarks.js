// 퍼블리싱 제조사 로고(public/bcs/images/manufacturers)를 브랜드 이름으로 찾는다.
// 재고 특가 핫딜 제조사 필터와 브랜드별 혜택 브랜드 필터가 함께 쓴다.

const LOGO_BASE = '/bcs/images/manufacturers';

const LOGO_FILES = {
  현대: 'hyundai',
  기아: 'kia',
  제네시스: 'genesis',
  르노코리아: 'renault-korea',
  르노: 'renault-korea',
  KGM: 'kgm',
  쉐보레: 'chevrolet',
  아우디: 'audi',
  BMW: 'bmw',
  BYD: 'byd',
  벤츠: 'mercedes-benz',
  메르세데스벤츠: 'mercedes-benz',
  포드: 'ford',
  렉서스: 'lexus',
  폴스타: 'polestar',
  도요타: 'toyota',
  토요타: 'toyota',
  폭스바겐: 'volkswagen',
  볼보: 'volvo',
};

const KGM_ALIASES = ['KGM', 'KG모빌리티', 'KGMOBILITY', '쌍용', '쌍용자동차'];

/** 공백·대소문자·하이픈 차이를 없애고 KGM 별칭을 하나로 모은다. */
export const normalizeBrandName = (value = '') => {
  const compact = String(value ?? '')
    .replace(/[\s-]+/g, '')
    .toUpperCase();
  return KGM_ALIASES.includes(compact) ? 'KGM' : compact;
};

export const isSameBrand = (a, b) => {
  const left = normalizeBrandName(a);
  const right = normalizeBrandName(b);
  return Boolean(left && right) && left === right;
};

export const brandLogoUrl = (name) => {
  const key = normalizeBrandName(name);
  const entry = Object.entries(LOGO_FILES).find(([brand]) => normalizeBrandName(brand) === key);
  return entry ? `${LOGO_BASE}/${entry[1]}.svg` : '';
};
