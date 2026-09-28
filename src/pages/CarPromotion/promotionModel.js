import { contentAPI } from '../../services/contentApi';
import { deadlineBadgeText, remainingDaysUntil } from '../../bcs/format';

// 퍼블리싱 promotion-data.js tabs. 진행중은 TOP, 종료된 기획전은 BOTTOM 위치로 등록된다.
export const PROMOTION_TABS = [
  { value: 'active', label: '진행중 기획전', position: 'TOP' },
  { value: 'ended', label: '종료된 기획전', position: 'BOTTOM' },
];

export const promotionDetailPath = (id) => `/promotion/brands/detail/${id}`;

export const resolveTab = (value) => (value === 'ended' ? 'ended' : 'active');

/** 목록·상세·브랜드 화면이 같은 캐시를 쓰도록 조회 옵션을 한 곳에 둔다. */
export const promotionListQuery = (tab) => ({
  queryKey: ['brand-promotions', resolveTab(tab)],
  queryFn: () => contentAPI.getBrandPromotions(resolveTab(tab) === 'ended' ? 'BOTTOM' : 'TOP', 100),
  staleTime: 1000 * 60,
});

// 퍼블리싱 promotion-data.js notes (혜택 적용 안내)
export const PROMOTION_NOTES = [
  '표기된 혜택은 계약 조건(기간·선납금·보증금·주행거리)에 따라 달라질 수 있습니다.',
  '제휴 카드·캐피탈 심사 결과에 따라 적용 여부가 결정됩니다.',
  '재고 소진 시 사전 고지 없이 조기 종료될 수 있습니다.',
  '표기 월 렌탈료는 장기렌트 48개월 · 선납금 30% · 연 20,000km 기준입니다.',
];

const THEMES = ['dark', 'gold', 'night'];
// "원더굿라이프 x IM캐피탈" 처럼 제휴 표기인 부제목만 제휴사 줄로 쓴다.
const PARTNER_PATTERN = /\s[x×]\s/i;

const pick = (...values) => values.find((value) => value !== null && value !== undefined && value !== '');

const pad = (value) => String(value).padStart(2, '0');
export const formatDotDate = (value) => {
  const date = new Date(value ?? NaN);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
};

/**
 * 브랜드 프로모션 API 항목 → 퍼블리싱 기획전 카드·상세 모델.
 * API 에는 퍼블리싱의 헤드라인·혜택 문구가 따로 없어서 제목·부제목·설명에서 채운다.
 */
export const toPromotionModel = (item = {}, { ended: endedHint = false, index = 0 } = {}) => {
  const title = String(pick(item.title, item.extraInfo) ?? '브랜드 혜택');
  const subtitle = String(item.subtitle ?? '').trim();
  const description = String(item.description ?? '').trim();
  const partner = PARTNER_PATTERN.test(subtitle) ? subtitle : '';
  const startDate = pick(item.startDate, item.start_date) ?? null;
  const endDate = pick(item.endDate, item.end_date) ?? null;
  const endTime = new Date(endDate ?? NaN).getTime();
  const ended = Boolean(endedHint) || item.position === 'BOTTOM' || (!Number.isNaN(endTime) && endTime < Date.now());

  return {
    id: item.id,
    title,
    brand: String(pick(item.extraInfo, item.brandName) ?? ''),
    partner,
    // "현대 투싼 (원더굿라이프 x IM캐피탈)" → "현대 투싼"
    headline: title.replace(/\s*\([^)]*\)\s*$/, '').trim() || title,
    benefit: description || (partner ? '' : subtitle),
    period: [formatDotDate(startDate), formatDotDate(endDate)].filter(Boolean).join(' ~ '),
    startDate,
    endDate,
    remainingDays: ended ? null : remainingDaysUntil(endDate),
    ended,
    imageUrl: String(pick(item.imageUrl, item.image_url) ?? ''),
    topImage: String(pick(item.topPromotionImage, item.top_promotion_image, item.topImageUrl, item.top_image_url) ?? ''),
    trimId: pick(item.trimId, item.trim_id) ?? null,
    basePrice: pick(item.basePrice, item.base_price) ?? null,
    monthly: pick(item.lowest_prepayment_30_monthly_fee, item.trim_monthly_rental_fee, item.monthlyRentalFee) ?? null,
    theme: THEMES[index % THEMES.length],
  };
};

/** 퍼블리싱 badgeText: 종료 / D-n / 진행중 */
export const promotionBadgeText = (promo) => {
  if (promo.ended) return '종료';
  if (typeof promo.remainingDays === 'number') return deadlineBadgeText(promo.remainingDays);
  return '진행중';
};
