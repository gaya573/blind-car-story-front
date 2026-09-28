/**
 * Content Management API Service
 * 본사 메인페이지에서 사용할 컨텐츠 API
 */
import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';
import { carAPI } from './carApi';
import { rebrandPromotion } from '../bcs/promotionRebrand';

export const contentHttp = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const extractItems = (data) => {
  if (Array.isArray(data)) {
    return data;
  }
  return data?.items ?? [];
};

const extractPagination = (data) => (Array.isArray(data) ? null : data?.pagination ?? null);

const fetchList = async (url, params = {}) => {
  const { data } = await contentHttp.get(url, { params });
  return extractItems(data);
};

const fetchPage = async (url, params = {}) => {
  const { data } = await contentHttp.get(url, { params });
  return {
    items: extractItems(data),
    pagination: extractPagination(data),
  };
};

const filterActiveWithinPeriod = (items) => {
  const now = new Date();
  return items.filter((item) => {
    // is_active 또는 isActive 필드 확인 (백엔드는 is_active로 직렬화)
    const isActive = item.is_active !== undefined
      ? item.is_active
      : (item.isActive !== undefined ? item.isActive : (item.active !== undefined ? item.active : true));
    if (isActive === false) {
      return false;
    }
    // start_date 또는 startDate 필드 확인 (백엔드는 startDate로 직렬화)
    const startDate = item.startDate ? new Date(item.startDate) : (item.start_date ? new Date(item.start_date) : null);
    // end_date 또는 endDate 필드 확인 (백엔드는 endDate로 직렬화)
    const endDate = item.endDate ? new Date(item.endDate) : (item.end_date ? new Date(item.end_date) : null);
    return (!startDate || startDate <= now) && (!endDate || endDate >= now);
  });
};

const getDisplayOrder = (item) => {
  const value = item?.displayOrder ?? item?.display_order;
  return Number.isFinite(Number(value)) ? Number(value) : Number.MAX_SAFE_INTEGER;
};

const sortByDisplayOrder = (items) => [...items].sort((a, b) => {
  const orderDiff = getDisplayOrder(a) - getDisplayOrder(b);
  if (orderDiff !== 0) return orderDiff;
  return new Date(b?.createdAt ?? b?.created_at ?? 0).getTime()
    - new Date(a?.createdAt ?? a?.created_at ?? 0).getTime();
});

const getReviewDateMs = (item) => {
  const dateValue = item?.createdAt ?? item?.created_at ?? item?.date ?? item?.updatedAt ?? item?.updated_at;
  const date = dateValue ? new Date(dateValue) : null;
  return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
};

const sortReviewsByNewest = (items) => [...items].sort((a, b) => getReviewDateMs(b) - getReviewDateMs(a));

const trimBrandCache = new Map();

const sanitizeUrl = (value) => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const appendUniqueUrl = (collection, value) => {
  const sanitized = sanitizeUrl(value);
  if (!sanitized) {
    return;
  }
  if (!collection.includes(sanitized)) {
    collection.push(sanitized);
  }
};

const collectReviewImages = (item = {}) => {
  const buckets = [];
  const directCandidates = [
    item.imageUrl,
    item.image_url,
    item.thumbnailImage,
    item.thumbnail_image,
    item.thumbnailImageUrl,
    item.thumbnail_image_url,
    item.thumbnail,
    item.thumbnail_url,
  ];
  directCandidates.forEach((candidate) => appendUniqueUrl(buckets, candidate));

  const arrayCandidates = [item.imageUrls, item.image_urls, item.images, item.thumbs];
  arrayCandidates.forEach((list) => {
    if (Array.isArray(list)) {
      list.forEach((url) => appendUniqueUrl(buckets, url));
    }
  });
  return buckets;
};

const normalizeReviewItem = (item) => {
  if (!item || typeof item !== 'object') {
    return item;
  }
  const collectedImages = collectReviewImages(item);
  const preferredImages =
    Array.isArray(item.images) && item.images.length
      ? item.images.filter((url) => sanitizeUrl(url))
      : collectedImages;
  const imageUrl = collectedImages[0] ?? sanitizeUrl(item.imageUrl) ?? sanitizeUrl(item.image_url) ?? null;

  return {
    ...item,
    imageUrls: collectedImages,
    imageUrl,
    images: preferredImages,
  };
};

const normalizeReviewList = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map((item) => normalizeReviewItem(item));
};

const normalizeTrimKey = (value) => {
  if (value === null || value === undefined) return null;
  return String(value);
};

const extractTrimId = (item) => {
  if (!item || typeof item !== 'object') return null;
  return (
    item.trimId ??
    item.trim_id ??
    item.trim?.id ??
    null
  );
};

const extractBrandNameFromItem = (item) => {
  if (!item || typeof item !== 'object') return null;
  const candidates = [
    item.brandName,
    item.brand_name,
    item.brand?.name,
    item.brand,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }
  return null;
};

const ensureBrandNameCached = async (rawTrimId) => {
  const key = normalizeTrimKey(rawTrimId);
  if (!key) {
    return null;
  }

  if (trimBrandCache.has(key)) {
    return trimBrandCache.get(key);
  }

  try {
    const detail = await carAPI.getCarDetail(rawTrimId);
    const brandName = detail?.brandName ?? detail?.brand?.name ?? detail?.brand ?? null;
    const normalized = typeof brandName === 'string' ? brandName.trim() : null;
    trimBrandCache.set(key, normalized && normalized.length ? normalized : null);
    return trimBrandCache.get(key);
  } catch {
    trimBrandCache.set(key, null);
    return null;
  }
};

const hydrateBrandExtraInfo = async (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return items;
  }

  const prepared = items.map((item) => {
    if (!item || typeof item !== 'object') {
      return item;
    }
    if (typeof item.extraInfo === 'string' && item.extraInfo.trim()) {
      return { ...item, extraInfo: item.extraInfo.trim() };
    }
    const brandName = extractBrandNameFromItem(item);
    if (brandName) {
      return { ...item, extraInfo: brandName };
    }
    return item;
  });

  const trimIdsToHydrate = new Set();
  prepared.forEach((item) => {
    if (!item || typeof item !== 'object') return;
    if (typeof item.extraInfo === 'string' && item.extraInfo.trim()) return;
    const trimId = extractTrimId(item);
    if (trimId != null) {
      const key = normalizeTrimKey(trimId);
      if (key) {
        trimIdsToHydrate.add(key);
      }
    }
  });

  if (trimIdsToHydrate.size === 0) {
    return prepared;
  }

  const fetchTargets = Array.from(trimIdsToHydrate).filter((key) => !trimBrandCache.has(key));
  await Promise.all(fetchTargets.map((key) => ensureBrandNameCached(key)));

  return prepared.map((item) => {
    if (!item || typeof item !== 'object') {
      return item;
    }
    if (typeof item.extraInfo === 'string' && item.extraInfo.trim()) {
      return { ...item, extraInfo: item.extraInfo.trim() };
    }
    const trimId = extractTrimId(item);
    if (trimId == null) {
      return item;
    }
    const brandName = trimBrandCache.get(normalizeTrimKey(trimId));
    if (typeof brandName === 'string' && brandName.trim()) {
      return { ...item, extraInfo: brandName.trim() };
    }
    return item;
  });
};

export const contentAPI = {
  getPhotoGallery: async (limit = 100) => {
    const items = await fetchList('/api/content/main-page/photo-gallery', { limit });
    return filterActiveWithinPeriod(items);
  },

  getClosingSoon: async (limit = 10) => {
    const items = await fetchList('/api/content/main-page/closing-soon', { limit, exclude_ended: true });
    // display_order 기준으로 이미 정렬되어 있으므로 필터 후 그대로 반환
    return filterActiveWithinPeriod(items);
  },

  getPopularVehicles: async (limit = 10) => {
    const items = await fetchList('/api/content/main-page/popular-vehicle', { limit });
    return filterActiveWithinPeriod(items).slice(0, 3);
  },

  getTopCars: async (limit = 5) => {
    const items = await fetchList('/api/content/main-page/top-cars', { limit });
    return filterActiveWithinPeriod(items)
      .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
      .slice(0, limit);
  },

  getBanners: async (bannerType, { position, limit = 10 } = {}) => {
    // 공개 화면은 관리자 전용 /api/content/admin/list를 호출하면 안 된다.
    // 서버의 공개 배너 API가 banner_type을 PageType/position으로 안전하게 매핑한다.
    const params = {
      banner_type: bannerType,
      limit,
    };
    if (position) {
      params.position = position;
    }

    const items = await fetchList('/api/content/banners', params);

    // API가 이미 위치별로 반환하지만, 오래된 데이터의 position 값도 안전하게 처리한다.
    const filtered = items.filter(item => {
      const itemPosition = item.position || item.positionType;
      if (!position || !itemPosition) return true;
      return itemPosition === position;
    });
    
    // 활성화 + 노출 기간 내인 배너만 사용
    const activeItems = sortByDisplayOrder(filterActiveWithinPeriod(filtered));
    return activeItems.slice(0, limit);
  },

  getUrgentInventory: async (limit = 100, brandId = null, carType = null, cardType = null) => {
    const params = { page: 1, limit };
    if (brandId != null) params.brandId = brandId;
    if (carType != null && carType !== '전체') params.carType = carType;
    if (cardType != null) params.cardType = cardType;
    const { items } = await fetchPage('/api/content/inventory', params);
    return filterActiveWithinPeriod(items);
  },

  getUrgentInventoryPage: async ({ page = 1, limit = 12, cardType = null, brandId = null, carType = null } = {}) => {
    const params = { page, limit };
    if (cardType != null) params.cardType = cardType;
    if (brandId != null) params.brandId = brandId;
    if (carType != null && carType !== '전체') params.carType = carType;
    const { items, pagination } = await fetchPage('/api/content/inventory', params);
    return {
      items: filterActiveWithinPeriod(items),
      pagination,
    };
  },

  getExpressDealsPage: async ({ page = 1, limit = 12, cardType = null, brandId = null, carType = null } = {}) => {
    const params = { page, limit };
    if (cardType != null) params.cardType = cardType;
    if (brandId != null) params.brandId = brandId;
    if (carType != null && carType !== '전체') params.carType = carType;
    const { items, pagination } = await fetchPage('/api/content/express-deals', params);
    return {
      items: filterActiveWithinPeriod(items),
      pagination,
    };
  },

  getHotDeals: async (limit = 100, brandId = null, carType = null, cardType = null) => {
    const params = { limit };
    if (brandId != null) params.brandId = brandId;
    if (carType != null && carType !== '전체') params.carType = carType;
    if (cardType != null) params.cardType = cardType;
    const items = await fetchList('/api/content/pre-purchase', params);
    const filtered = filterActiveWithinPeriod(items);
    return filtered;
  },

  /**
   * 선구매 핫딜 검색 (메인 컨텐츠 기반)
   * - keyword 로 제목/설명/트림명을 검색해서 일치하는 핫딜만 반환
   */
  searchHotDeals: async (keyword, limit = 20) => {
    const trimmed = (keyword || '').trim();
    if (!trimmed) {
      return [];
    }
    const { data } = await contentHttp.get('/api/content/pre-purchase/search', {
      params: {
        keyword: trimmed,
        limit,
      },
    });
    const items = extractItems(data);
    return filterActiveWithinPeriod(items);
  },

  getPrePurchasePage: async ({ page = 1, limit = 12 } = {}) => {
    const { items, pagination } = await fetchPage('/api/content/pre-purchase', { page, limit });
    return {
      items: filterActiveWithinPeriod(items),
      pagination,
    };
  },

  getPrePurchaseBrandIds: async () => {
    const { data } = await contentHttp.get('/api/content/pre-purchase/brands');
    return data?.brandIds || [];
  },

  getBrandPromotions: async (position = null, limit = 100, cardType) => {
    // position이 null이면 백엔드에서 날짜 기반으로 자동 계산
    const params = { limit };
    if (position) params.position = position; // position이 있을 때만 파라미터 추가
    if (cardType) params.card_type = cardType;
    
    const items = await fetchList('/api/content/promotions/brand', params);
    // 원더 사이트와 같은 데이터라 블라인드 사이트에서는 원더굿라이프 표기·이미지를 바꿔 보여준다.
    return hydrateBrandExtraInfo(items.map(rebrandPromotion));
  },

  getCardPromotions: async (position = null, limit = 100, cardType) => {
    // position이 null이면 백엔드에서 날짜 기반으로 자동 계산
    const params = { limit };
    if (position) params.position = position; // position이 있을 때만 파라미터 추가
    if (cardType) params.card_type = cardType;
    
    const items = await fetchList('/api/content/promotions/card', params);
    return items;
  },

  getPromoPricing: async (trimIds = []) => {
    if (!Array.isArray(trimIds) || trimIds.length === 0) {
      return [];
    }
    const params = { trimIds: Array.from(new Set(trimIds)).join(',') };
    const { data } = await contentHttp.get('/api/content/promo-pricing', { params });
    return Array.isArray(data) ? data : data?.items ?? [];
  },

  getReviews: async (limit = 10) => {
    const items = await fetchList('/api/content/main-page/reviews', { limit });
    return normalizeReviewList(sortReviewsByNewest(filterActiveWithinPeriod(items))).slice(0, limit);
  },

  getReviewsPage: async ({ page = 1, limit = 12 } = {}) => {
    // The public API intentionally returns only visible/active review records.
    // Page slicing stays client-side until the review feed grows beyond this
    // lightweight landing-page payload.
    const items = await fetchList('/api/content/main-page/reviews', { limit: 100 });
    // 페이지네이션은 클라이언트 측에서 처리
    const sortedItems = sortReviewsByNewest(filterActiveWithinPeriod(items));
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = sortedItems.slice(startIndex, endIndex);
    
    return {
      items: normalizeReviewList(paginatedItems),
      pagination: {
        page,
        size: limit,
        totalElements: sortedItems.length,
        totalPages: Math.ceil(sortedItems.length / limit),
      },
    };
  },
};

export const __contentApiTestUtils = {
  clearBrandCache: () => {
    trimBrandCache.clear();
  },
};

export default contentAPI;


