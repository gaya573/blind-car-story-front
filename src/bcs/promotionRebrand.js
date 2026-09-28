import { SITE_NAME } from './site';

/**
 * 브랜드 혜택(/api/content/promotions/brand)은 원더굿라이프 본사 사이트와 같은 데이터다.
 * 원본을 고치면 원더 사이트도 바뀌므로, 블라인드 사이트에서 보여줄 때만 원더굿라이프 표기를 바꾼다.
 */
const WONDER_NAME = /원더\s?굿\s?라이프/g;

export const rebrandText = (value) => (typeof value === 'string' ? value.replace(WONDER_NAME, SITE_NAME) : value);

// 원본 이미지 주소 → 원더 로고·문구를 블라인드 카스토리로 바꾼 사본 (scripts/rebrand-promotion-images.py).
// 주소로 묶어 두어서, 원더 쪽에서 이미지를 바꾸면 사본 대신 새 원본이 그대로 나온다.
const CDN = 'https://dnuf17r04cafo.cloudfront.net/banner/main/';
export const REBRANDED_IMAGES = {
  [`${CDN}9f2703e5eade46f98131ca31ae745686.png`]: '/bcs/promotions/83-thumb.jpg',
  [`${CDN}6ce5e712edef4d738e89f394cbf9f20c.jpg`]: '/bcs/promotions/83-top.jpg',
  [`${CDN}1bc112e4f61c4525bceca20c72327aea.png`]: '/bcs/promotions/81-thumb.jpg',
  [`${CDN}79063f8b6a2546e89906b6197e688d2c.jpg`]: '/bcs/promotions/81-top.jpg',
  [`${CDN}1c8946111864444fbc57713b8928ebfb.png`]: '/bcs/promotions/84-thumb.jpg',
  [`${CDN}7d8bd8389f9b43d9af0f93ae05747822.jpg`]: '/bcs/promotions/84-top.jpg',
  [`${CDN}161236c5c9194caeb93b7ef90fd6c19c.png`]: '/bcs/promotions/80-thumb.jpg',
  [`${CDN}d4322297d99d4fabb5663ee41540e7aa.jpg`]: '/bcs/promotions/80-top.jpg',
  [`${CDN}3de52ec980de4e76862170f1899478ff.png`]: '/bcs/promotions/86-thumb.jpg',
  [`${CDN}2dc80cb0bdd9419389dcfd791a6dc89e.png`]: '/bcs/promotions/86-top.jpg',
  [`${CDN}5b5bce89db814cbeb5bb373c9c2ffd5e.png`]: '/bcs/promotions/85-thumb.jpg',
  [`${CDN}9cdd2648b8dd48d2aba3f35bd8c347fe.png`]: '/bcs/promotions/85-top.jpg',
};

// 원더굿라이프 회사 소개 광고(모든 기획전 하단 공통 이미지). 블라인드 사이트에는 보여주지 않는다.
export const WONDER_ONLY_IMAGES = new Set([`${CDN}8d3a40d9119b47e0ad7718613a935ced.jpg`]);

const IMAGE_FIELDS = [
  'imageUrl',
  'image_url',
  'topPromotionImage',
  'top_promotion_image',
  'bottomPromotionImage',
  'bottom_promotion_image',
];

const rebrandImage = (url) => {
  if (typeof url !== 'string' || !url) return url;
  if (WONDER_ONLY_IMAGES.has(url)) return null;
  return REBRANDED_IMAGES[url] ?? url;
};

/** 기획전 한 건의 문구(모든 문자열 필드)와 이미지를 블라인드 사이트용으로 바꾼다. */
export const rebrandPromotion = (item) => {
  if (!item || typeof item !== 'object') return item;
  const next = { ...item };
  Object.keys(next).forEach((key) => {
    if (IMAGE_FIELDS.includes(key)) next[key] = rebrandImage(next[key]);
    else if (typeof next[key] === 'string') next[key] = rebrandText(next[key]);
  });
  return next;
};
