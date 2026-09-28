import { toVehicleCardModel } from '../../bcs/vehicle';
import { brandLogoUrl, isSameBrand } from './brandMarks';

// 상단 "오늘 놓치면 마감 차량"은 프로모션(PROMOTION_EVENT) 카드만 쓴다.
export const URGENT_CARD_TYPE = 'PROMOTION_EVENT';
export const EXPRESS_PAGE_SIZE = 12;
export const EXPRESS_FALLBACK_IMAGE = '/bcs/images/cars/car-suv.svg';

// 퍼블리싱 express-data.js brands. name 은 기존 URL(?maker=)·브랜드 API 이름과 같다.
export const EXPRESS_BRANDS = [
  { name: '전체', label: '전체' },
  ...[
    ['현대', '현대'],
    ['기아', '기아'],
    ['제네시스', '제네시스'],
    ['르노코리아', '르노코리아'],
    ['KGM', 'KG모빌리티'],
    ['쉐보레', '쉐보레'],
  ].map(([name, label]) => ({ name, label, logoUrl: brandLogoUrl(name) })),
];

/** URL 의 ?maker= 값을 필터 목록의 이름으로 맞춘다. 모르는 값이면 전체. */
export const resolveMaker = (value) => {
  if (!value) return '전체';
  return EXPRESS_BRANDS.find((brand) => isSameBrand(brand.name, value) || isSameBrand(brand.label, value))?.name ?? '전체';
};

/** 브랜드 API 목록에서 제조사 이름에 맞는 id 를 찾는다. */
export const findBrandId = (brands = [], name) => {
  if (!name || name === '전체') return null;
  return brands.find((brand) => isSameBrand(brand?.name, name))?.id ?? null;
};

const pick = (...values) => values.find((value) => value !== null && value !== undefined && value !== '');

/** 재고 특가 API 항목 → 퍼블리싱 .ex-card 모델. 재고 수량은 API 가 줄 때만 쓴다. */
export const toExpressCard = (item = {}) => {
  const stock = Number(pick(item.remainingQuantity, item.remaining_quantity));
  return {
    ...toVehicleCardModel(item),
    stock: Number.isFinite(stock) ? stock : null,
  };
};

const timeOf = (value) => {
  const time = new Date(value ?? NaN).getTime();
  return Number.isNaN(time) ? null : time;
};

export const isExpired = (item, now = Date.now()) => {
  const end = timeOf(item?.endDate ?? item?.end_date);
  return end !== null && end < now;
};

/** 마감이 빠른 순. 마감일이 없는 항목은 뒤로 보낸다. */
export const compareByDeadline = (a, b) => {
  const left = timeOf(a?.deadline ?? a?.endDate) ?? Number.MAX_SAFE_INTEGER;
  const right = timeOf(b?.deadline ?? b?.endDate) ?? Number.MAX_SAFE_INTEGER;
  return left - right;
};

export const matchesMaker = (item, maker) =>
  !maker || maker === '전체' || isSameBrand(item?.extraInfo ?? item?.brandName ?? item?.brand, maker);
