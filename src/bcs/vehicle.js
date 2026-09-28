import { remainingDaysUntil } from './format';

const pick = (...values) => values.find((value) => value !== null && value !== undefined && value !== '');

/**
 * 콘텐츠 API(마감임박·핫딜·특가·재고) 항목을 퍼블리싱 차량 카드가 쓰는 모양으로 맞춘다.
 * 퍼블리싱 목업(mock-data.js)이 실제 API 응답을 본떠 만든 것이라 필드 이름이 대부분 같고,
 * 여기서는 camelCase·snake_case·중첩 trim 객체 차이만 흡수한다.
 */
export const toVehicleCardModel = (item = {}) => {
  const trim = item.trim ?? {};
  const deadline = pick(item.deadline, item.endDate);
  return {
    id: pick(item.id, item.trimId),
    trimId: pick(item.trimId, item.trim_id, trim.id),
    vehicleLineId: pick(item.vehicleLineId, item.vehicle_line_id, trim.vehicleLineId),
    brandId: pick(item.brandId, item.brand_id),
    brandName: pick(item.brandName, item.extraInfo, item.brand) ?? '',
    vehicleName: pick(item.vehicleName, item.title, item.name) ?? '',
    trimName: pick(item.trimName, item.subtitle, item.description, item.desc) ?? '',
    imageUrl: pick(item.imageUrl, item.img, item.image) ?? '',
    basePrice: pick(item.basePrice, item.originalPrice, item.original_price, item.price),
    prepayment30: pick(
      item.lowest_prepayment_30_monthly_fee,
      item.lowestPrepayment30MonthlyFee,
      trim.lowestPrepayment30MonthlyFee,
    ),
    deposit30: pick(
      item.lowest_deposit_30_monthly_fee,
      item.lowestDeposit30MonthlyFee,
      trim.lowestDeposit30MonthlyFee,
    ),
    noDeposit: pick(
      item.lowest_no_deposit_monthly_fee,
      item.lowestNoDepositMonthlyFee,
      trim.lowestNoDepositMonthlyFee,
    ),
    deadline: deadline ?? null,
    remainingDays: typeof item.remainingDays === 'number' ? item.remainingDays : remainingDaysUntil(deadline),
    cardType: item.cardType ?? '',
    contentType: item.contentType ?? '',
  };
};

/** 가장 이른 마감일 (카운트다운 기준). */
export const earliestDeadline = (items = []) => {
  const times = items
    .map((item) => new Date(item?.deadline ?? item?.endDate ?? NaN).getTime())
    .filter((time) => !Number.isNaN(time));
  return times.length ? new Date(Math.min(...times)) : null;
};
