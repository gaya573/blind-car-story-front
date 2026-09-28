import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import styles from './MobileSearch.module.css';
import { SearchBarMobile } from '../../components/SearchBar.jsx';
import ReviewCardMobileV1 from '../../components/ReviewCardMobileV2.jsx';
import ReviewCardMobile from '../../components/ReviewCardMobile.jsx';
import { contentAPI } from '../../services/contentApi.js';
import { carAPI } from '../../services/carApi.js';
import { getBrandLogo } from '../../config/brandLogos';
import { API_BASE_URL } from '../../config/apiConfig';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import { getPageSeo } from '../../config/seoConfig';

const FALLBACK_IMAGE = '/placeholder/car.svg';

const STATIC_BRAND_DEFINITIONS = [
  { label: '현대', queryName: '현대' },
  { label: '기아', queryName: '기아' },
  { label: 'KGM', queryName: 'KG모빌리티', logoName: 'KG모빌리티' },
  { label: '르노', queryName: '르노코리아', logoName: '르노코리아' },
  { label: '쌍용', queryName: '쌍용', logoName: '쌍용' },
  { label: 'BMW', queryName: 'BMW' },
  { label: '벤츠', queryName: '벤츠' },
  { label: '아우디', queryName: '아우디' },
];

const STATIC_BRAND_SUGGESTIONS = STATIC_BRAND_DEFINITIONS.map((brand) => ({
  id: `static-brand-${brand.queryName}`,
  name: brand.label,
  displayName: brand.label,
  type: 'brand',
  thumb: getBrandLogo(brand.logoName || brand.queryName) || FALLBACK_IMAGE,
  queryName: brand.queryName,
}));

// 이미지 URL 정규화: 절대 URL이 아니고 "/" 로 시작하면 API_BASE_URL 기준으로 보정
const normalizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return FALLBACK_IMAGE;
  const trimmed = url.trim();
  if (!trimmed) return FALLBACK_IMAGE;

  if (/^https?:\/\//i.test(trimmed)) return trimmed; // 이미 절대 URL
  if (trimmed.startsWith('//')) {
    // 프로토콜 상대 URL
    if (typeof window !== 'undefined' && window.location?.protocol) {
      return `${window.location.protocol}${trimmed}`;
    }
    return `https:${trimmed}`;
  }
  if (trimmed.startsWith('/')) {
    const base = (API_BASE_URL || '').replace(/\/+$/, '');
    return `${base}${trimmed}`;
  }
  return trimmed;
};

export default function MobileSearch() {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // 검색어가 있을 때 차량 검색 API
  const { data: carSearchResults, isLoading: isLoadingCars } = useQuery({
    queryKey: ['mobile-search', 'cars', value],
    queryFn: async () => {
      if (!value.trim()) return { brands: [], vehicleLines: [], trims: [] };
      const result = await carAPI.searchTrims({ keyword: value, limit: 5 });
      // API 응답 형식에 맞게 변환 (각 카테고리별 최대 5개)
      return {
        brands: (result.brands || []).slice(0, 5),
        vehicleLines: (result.vehicleLines || []).slice(0, 5),
        trims: (result.trims || []).slice(0, 5),
      };
    },
    enabled: value.trim().length > 0,
    staleTime: 1000 * 30,
  });

  // 검색어가 있을 때 리뷰 검색 (모든 필드 포함)
  const { data: searchReviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: ['mobile-search', 'reviews', value],
    queryFn: async () => {
      if (!value.trim()) return [];
      const reviews = await contentAPI.getReviews(100); // 충분한 수량 가져오기
      const keyword = value.toLowerCase();
      const filtered = reviews.filter(r => {
        // 모든 필드에서 검색
        const searchFields = [
          r.title || '',
          r.subtitle || '',
          r.description || '',
          r.content || '',
          r.carModel || r.model || '',
          r.authorName || r.author || '',
          r.extraInfo || '',
        ];
        return searchFields.some(field => 
          field.toLowerCase().includes(keyword)
        );
      });
      return filtered.slice(0, 5); // 최대 5개만 반환
    },
    enabled: value.trim().length > 0,
    staleTime: 1000 * 30,
  });

  // 검색어가 없을 때 리뷰 상위 5개 가져오기
  const { data: defaultReviews = [], isLoading: isLoadingDefaultReviews } = useQuery({
    queryKey: ['mobile-search', 'default-reviews'],
    queryFn: async () => {
      const reviews = await contentAPI.getReviews(100);
      return reviews.slice(0, 5); // 상위 5개만
    },
    enabled: !value.trim(),
    staleTime: 1000 * 60 * 5, // 5분 캐시
  });

  // 현재 표시할 데이터 (검색어가 있으면 검색 결과, 없으면 기본 데이터)
  const currentCarData = value.trim() ? carSearchResults : null;
  const currentReviews = value.trim() ? searchReviews : defaultReviews;
  const isLoadingCurrentCars = value.trim() ? isLoadingCars : false;
  const isLoadingCurrentReviews = value.trim() ? isLoadingReviews : isLoadingDefaultReviews;

  // 검색 결과에서 사용된 모든 brandId 수집
  const allBrandIds = useMemo(() => {
    const ids = new Set();
    const data = currentCarData;
    if (data?.brands) {
      data.brands.forEach(brand => ids.add(brand.id));
    }
    if (data?.vehicleLines) {
      data.vehicleLines.forEach(vl => {
        if (vl.brandId) ids.add(vl.brandId);
      });
    }
    if (data?.trims) {
      data.trims.forEach(trim => {
        if (trim.brandId) ids.add(trim.brandId);
      });
    }
    return Array.from(ids);
  }, [currentCarData]);

  // 브랜드 정보 가져오기 (검색 결과에 포함되지 않은 브랜드도 포함)
  const { data: allBrandsData = [] } = useQuery({
    queryKey: ['brands-for-search', allBrandIds],
    queryFn: async () => {
      if (allBrandIds.length === 0) return [];
      const brands = await carAPI.getBrands();
      // 검색 결과에 사용된 brandId만 필터링
      return brands.filter(brand => allBrandIds.includes(brand.id));
    },
    enabled: allBrandIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5분 캐시
  });

  // 브랜드 ID로 브랜드 이름 매핑 생성
  const brandMap = useMemo(() => {
    const map = {};
    // 현재 데이터의 브랜드 먼저 추가
    if (currentCarData?.brands) {
      currentCarData.brands.forEach((brand) => {
        map[brand.id] = brand.name;
      });
    }
    // 추가로 가져온 브랜드 정보 추가
    allBrandsData.forEach((brand) => {
      if (!map[brand.id]) {
        map[brand.id] = brand.name;
      }
    });
    return map;
  }, [currentCarData?.brands, allBrandsData]);

  // 차량 검색 결과 변환 (브랜드, 자동차 라인, 트림만)
  const carSuggestions = useMemo(() => {
    if (!value.trim()) {
      return STATIC_BRAND_SUGGESTIONS;
    }

    if (!currentCarData) return [];
    
    const suggestions = [];
    
    // 브랜드 (형식: 브랜드) - 최대 5개
    if (currentCarData.brands && currentCarData.brands.length > 0) {
      currentCarData.brands.slice(0, 5).forEach((brand) => {
        // 1순위: 백엔드(carplatform)에서 내려준 logoUrl
        // 2순위: 정적 자산 매핑(brand/importbrands)
        const brandLogo = brand.logoUrl || getBrandLogo(brand.name) || FALLBACK_IMAGE;
        suggestions.push({
          id: `brand-${brand.id}`,
          name: brand.name, // 브랜드만 표시
          displayName: brand.name,
          type: 'brand',
          thumb: brandLogo,
          queryName: brand.name,
        });
      });
    }
    
    // 자동차 라인 (형식: 브랜드 - 차량) - 최대 5개
    if (currentCarData.vehicleLines && currentCarData.vehicleLines.length > 0) {
      currentCarData.vehicleLines.slice(0, 5).forEach((vehicleLine) => {
        const brandName = brandMap[vehicleLine.brandId] || '';
        const displayName = brandName ? `${brandName} - ${vehicleLine.name}` : vehicleLine.name;
        const thumb = normalizeImageUrl(
          vehicleLine.imageUrl ||
            vehicleLine.thumbnailUrl ||
            vehicleLine.mainImageUrl ||
            vehicleLine.trimImageUrl ||
            null,
        );
        suggestions.push({
          id: `vehicleLine-${vehicleLine.id}`,
          name: vehicleLine.name,
          displayName: displayName,
          type: 'vehicleLine',
          thumb,
          brandId: vehicleLine.brandId,
        });
      });
    }
    
    // 트림 (형식: 브랜드 - 차량 옵션) - 최대 5개
    if (currentCarData.trims && currentCarData.trims.length > 0) {
      currentCarData.trims.slice(0, 5).forEach((trim) => {
        const brandName = brandMap[trim.brandId] || '';
        const displayName = brandName ? `${brandName} - ${trim.name}` : trim.name;
        const thumb = normalizeImageUrl(
          trim.imageUrl ||
            trim.thumbnailUrl ||
            trim.mainImageUrl ||
            (trim.images && trim.images[0]) ||
            (trim.thumbs && trim.thumbs[0]) ||
            null,
        );
        suggestions.push({
          id: `trim-${trim.id}`,
          name: trim.name,
          displayName: displayName,
          type: 'trim',
          thumb,
          brandId: trim.brandId,
          trimId: trim.id,
          vehicleLineId: trim.vehicleLineId || trim.vehicleLine_id || trim.vehicleLine?.id || null,
        });
      });
    }
    
    // 전체 합쳐서 최대 7개만 노출
    return suggestions.slice(0, 7);
  }, [currentCarData, brandMap, value]);

  const navigateToCarDetail = (vehicleLineId, trimId) => {
    const resolvedVehicleLineId =
      vehicleLineId === null || vehicleLineId === undefined || vehicleLineId === ''
        ? null
        : String(vehicleLineId);
    const resolvedTrimId =
      trimId === null || trimId === undefined || trimId === ''
        ? null
        : String(trimId);

    if (resolvedVehicleLineId) {
      const params = new URLSearchParams();
      if (resolvedTrimId) {
        params.set('trimId', resolvedTrimId);
      }
      const search = params.toString();
      navigate(
        `/m/car-detail/${encodeURIComponent(resolvedVehicleLineId)}${search ? `?${search}` : ''}`,
      );
    } else if (resolvedTrimId) {
      navigate(`/m/car-detail/${encodeURIComponent(resolvedTrimId)}`);
    }
  };

  const {
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords,
  } = getPageSeo('home');

  // SEO용 대표 이미지: 차량 검색 결과 썸네일 > 리뷰 카드 이미지 순
  const seoImage = useMemo(() => {
    const firstCar = (carSuggestions ?? [])[0];
    if (firstCar?.thumb) return firstCar.thumb;

    const firstReview = (currentReviews ?? [])[0];
    if (firstReview) {
      const img =
        (firstReview.imageUrls && firstReview.imageUrls[0]) ||
        firstReview.imageUrl ||
        (firstReview.images && firstReview.images[0]) ||
        (firstReview.thumbs && firstReview.thumbs[0]) ||
        null;
      if (img) return img;
    }

    return undefined;
  }, [carSuggestions, currentReviews]);

  return (
    <>
      <SeoHelmet
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        image={seoImage}
      />
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.searchTop}>
          <SearchBarMobile
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="찾으실 차량을 검색해주세요"
            onBack={() => navigate(-1)}
          />
        </div>

        <nav className={styles.tabs} aria-label="검색 카테고리">
          {[
            { key: 'all', label: '전체' },
            { key: 'car', label: '차량' },
            { key: 'review', label: '리뷰' },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              className={`${styles.tab} ${activeTab === t.key ? styles.active : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {(activeTab === 'all' || activeTab === 'car') && (
          <section className={styles.section}>
            {isLoadingCurrentCars ? (
              <div className={styles.loading}>로딩 중...</div>
            ) : carSuggestions.length === 0 ? (
              <div className={styles.empty}>
                {value.trim() ? '검색 결과가 없습니다.' : '데이터를 불러오는 중입니다.'}
              </div>
            ) : (
              <ul className={styles.suggestList}>
                {carSuggestions.map((m) => (
                  <li
                    key={m.id}
                    className={styles.suggestItem}
                    onClick={() => {
                      if (m.type === 'trim') {
                        navigateToCarDetail(m.vehicleLineId, m.trimId || m.id.replace('trim-', ''));
                      } else if (m.type === 'vehicleLine') {
                        // 차량 라인은 검색 결과 페이지로 이동 (브랜드와 키워드로 검색)
                        const params = new URLSearchParams();
                        if (m.brandId) {
                          // 브랜드가 있으면 브랜드 이름으로 검색
                          const brandName = brandMap[m.brandId] || '';
                          if (brandName) {
                            params.set('brand', brandName);
                          }
                        }
                        // 차량 라인 이름을 키워드로 추가
                        params.set('keyword', m.name);
                        navigate(`/m/search/results?${params.toString()}`);
                      } else if (m.type === 'brand') {
                        const brandName = m.queryName || m.name;
                        navigate(`/m/search/results?brand=${encodeURIComponent(brandName)}`);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (m.type === 'trim') {
                          navigateToCarDetail(m.vehicleLineId, m.trimId || m.id.replace('trim-', ''));
                        } else if (m.type === 'vehicleLine') {
                          const params = new URLSearchParams();
                          if (m.brandId) {
                            const brandName = brandMap[m.brandId] || '';
                            if (brandName) {
                              params.set('brand', brandName);
                            }
                          }
                          params.set('keyword', m.name);
                          navigate(`/m/search/results?${params.toString()}`);
                        } else if (m.type === 'brand') {
                          const brandName = m.queryName || m.name;
                          navigate(`/m/search/results?brand=${encodeURIComponent(brandName)}`);
                        }
                      }
                    }}
                  >
                    <div className={styles.suggestLeft}>
                      <img src={m.thumb} alt={m.displayName || m.name} draggable={false} />
                      <span className={styles.suggestName}>{m.displayName || m.name}</span>
                    </div>
                    <span className={styles.chevron}>›</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {(activeTab === 'all' || activeTab === 'review') && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>리뷰</h2>
            </div>
            {isLoadingCurrentReviews ? (
              <div className={styles.loading}>로딩 중...</div>
            ) : currentReviews.length === 0 ? (
              <div className={styles.empty}>
                {value.trim() ? '검색 결과가 없습니다.' : '리뷰 데이터를 불러오는 중입니다.'}
              </div>
            ) : (
              <>
                <div className={styles.reviewCard}>
                  {currentReviews.map((r) => {
                    const fullTitle =
                      r.title || r.subtitle || r.carModel || r.model || '';
                    const displayTitle =
                      fullTitle.length > 15 ? `${fullTitle.slice(0, 15)}...` : fullTitle;

                    return (
                      <ReviewCardMobile
                        key={r.id}
                        carImage={
                          (r.imageUrls && r.imageUrls[0]) ||
                          r.imageUrl ||
                          (r.images && r.images[0]) ||
                          (r.thumbs && r.thumbs[0])
                        }
                        carName={r.carModel || r.model || ''}
                        rating={r.rating || 0}
                        reviewText={displayTitle}
                        reviewDetail={r.description || r.content || r.reviewContent || ''}
                        variant="card"
                        onClick={() =>
                          navigate(`/m/review/${r.id}`, { state: { review: r } })
                        }
                      />
                    );
                  })}
                </div>
                {currentReviews.length > 0 && (
                  <div className={styles.moreWrap}>
                    <button type="button" className={styles.moreBtn} onClick={() => navigate('/m/review')}>
                      더 많은 후기 보러가기
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>
      <div className={styles.bottomSpacer} />
    </div>
    </>
  );
}


