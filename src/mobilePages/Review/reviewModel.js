// 출고후기 API(/api/content/main-page/reviews) 항목을 모바일 후기 화면이 쓰는 모양으로 맞춘다.

const text = (...values) => values.find((value) => typeof value === 'string' && value.trim())?.trim() ?? '';

const formatDate = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};

export const toReviewModel = (item = {}) => {
  const images = [
    ...(Array.isArray(item.images) ? item.images : []),
    ...(Array.isArray(item.imageUrls) ? item.imageUrls : []),
    item.imageUrl,
  ].filter((url, index, list) => typeof url === 'string' && url.trim() && list.indexOf(url) === index);
  const rating = Math.max(0, Math.min(5, Math.round(Number(item.rating) || 0)));
  return {
    id: item.id != null ? String(item.id) : '',
    title: text(item.title, item.carModel, item.model),
    body: text(item.description, item.content, item.reviewContent),
    images,
    author: text(item.authorName, item.author) || '고객님',
    rating,
    date: formatDate(item.createdAt ?? item.created_at ?? item.date),
    dateMs: new Date(item.createdAt ?? item.created_at ?? item.date ?? 0).getTime() || 0,
    brand: text(item.extraInfo, item.brandName, item.brand),
    trimId: item.trimId ?? item.trim_id ?? item.trim?.id ?? null,
    vehicleLineId: item.vehicleLineId ?? item.vehicleLine?.id ?? null,
  };
};

export const starsText = (rating) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

export const SORT_OPTIONS = [
  { value: 'recent', label: '최신 순' },
  { value: 'ratingDesc', label: '별점 높은 순' },
  { value: 'ratingAsc', label: '별점 낮은 순' },
];

export const sortReviews = (reviews, sort) => {
  const list = [...reviews];
  if (sort === 'ratingDesc') return list.sort((a, b) => b.rating - a.rating || b.dateMs - a.dateMs);
  if (sort === 'ratingAsc') return list.sort((a, b) => a.rating - b.rating || b.dateMs - a.dateMs);
  return list.sort((a, b) => b.dateMs - a.dateMs);
};

// 퍼블리싱 mock-data.js reviews: 후기가 아직 없을 때 보여 주는 준비중 카드
export const REVIEW_PLACEHOLDER = {
  imageUrl: '/bcs/images/reviews/review-placeholder.svg',
  title: '출고후기 준비중',
  description: '출고후기 콘텐츠는 준비 중입니다.',
  author: '정보 준비중',
};
