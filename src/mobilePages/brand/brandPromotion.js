import { contentAPI } from '../../services/contentApi.js';
import { remainingDaysUntil } from '../../bcs/format';

/** 브랜드별 혜택 탭. 제휴 어드민의 브랜드 기획전은 진행중=TOP, 종료=BOTTOM 위치로 나뉜다 (PC /promotion 과 같다). */
export const PROMOTION_TABS = [
  { value: 'ongoing', label: '진행중 기획전', position: 'TOP' },
  { value: 'ended', label: '종료된 기획전', position: 'BOTTOM' },
];

export const brandPromotionsQuery = (position) => ({
  queryKey: ['mobile-brand-benefits', position],
  queryFn: () => contentAPI.getBrandPromotions(position, 100),
  staleTime: 1000 * 60 * 5,
});

const formatDate = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};

const positiveNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const firstText = (...values) => values.find((value) => typeof value === 'string' && value.trim())?.trim() ?? '';

/** 브랜드 기획전 API 항목 → 퍼블리싱 m-promo / m-bd-* 가 쓰는 모양 */
export const toPromotionModel = (item = {}, position = null) => {
  const start = formatDate(item.startDate ?? item.start_date);
  const end = formatDate(item.endDate ?? item.end_date);
  const remainingDays = remainingDaysUntil(item.endDate ?? item.end_date);
  const detailImages = [
    item.topPromotionImage ?? item.top_promotion_image,
    item.bottomPromotionImage ?? item.bottom_promotion_image,
  ].filter((url, index, list) => typeof url === 'string' && url.trim() && list.indexOf(url) === index);
  const title = firstText(item.title, item.extraInfo) || '브랜드 기획전';
  const partner = firstText(item.subtitle);
  // 제목 끝의 "(제휴사)" 는 상세 히어로에서 제휴사 줄로 따로 보여 주므로 헤드라인에서는 뺀다.
  const headline = partner ? title.replace(`(${partner})`, '').trim() || title : title;

  return {
    id: item.id != null ? String(item.id) : '',
    brand: firstText(item.extraInfo, item.brandName, item.brand?.name),
    title,
    headline,
    partner,
    description: firstText(item.description),
    imageUrl: firstText(item.imageUrl, item.image_url),
    detailImages,
    period: start && end ? `${start} ~ ${end}` : start || end,
    remainingDays,
    ended: position === 'BOTTOM' || (typeof remainingDays === 'number' && remainingDays < 0),
    trimId: item.trimId ?? item.trim_id ?? null,
    basePrice: positiveNumber(item.basePrice ?? item.base_price),
    monthly: positiveNumber(item.trim_monthly_rental_fee ?? item.trimMonthlyRentalFee),
  };
};

/** 진행 상태 배지: 진행중 · D-n / 종료 (퍼블리싱 brand-detail 상태 표기) */
export const promotionStatusText = (promotion) => {
  if (promotion.ended) return '종료';
  const days = promotion.remainingDays;
  if (typeof days !== 'number') return '진행중';
  return days <= 0 ? '진행중 · 오늘 마감' : `진행중 · D-${days}`;
};
