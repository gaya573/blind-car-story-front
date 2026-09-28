// 후기 API(main-page/reviews) 항목을 퍼블리싱 후기 카드·모달 모양으로 바꾼다.
import { formatDotDate } from '../CarPromotion/promotionModel';

/** 퍼블리싱 표기(박*영)처럼 작성자 이름 가운데를 가린다. 두 글자면 뒷글자를 가린다. */
export const maskAuthorName = (value) => {
  const chars = Array.from(String(value ?? '').trim());
  if (chars.length === 0) return '익명 고객';
  if (chars.length <= 2) return `${chars[0]}*`;
  return `${chars[0]}${'*'.repeat(chars.length - 2)}${chars[chars.length - 1]}`;
};

const clampRating = (value) => {
  const rating = Math.round(Number(value));
  if (!Number.isFinite(rating)) return 5;
  return Math.min(5, Math.max(0, rating));
};

export const toReviewModel = (item = {}) => {
  const text = String(item.description ?? item.content ?? '').trim();
  const images = (Array.isArray(item.images) && item.images.length ? item.images : [item.imageUrl]).filter(Boolean);
  const rating = clampRating(item.rating ?? 5);
  return {
    id: item.id,
    trimId: item.trimId ?? item.trim_id ?? null,
    title: item.title || '블라인드 카스토리 고객 후기',
    carName: item.carName || item.vehicleName || item.extraInfo || '',
    snippet: text.replace(/\s+/g, ' '),
    body: text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean),
    rating,
    recommend: rating >= 4,
    author: maskAuthorName(item.authorName ?? item.author),
    date: formatDotDate(item.createdAt ?? item.created_at),
    imageUrl: images[0] ?? '',
    images,
  };
};
