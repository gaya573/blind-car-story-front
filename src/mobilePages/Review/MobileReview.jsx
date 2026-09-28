import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import styles from './MobileReview.module.css';
import { SaleCardMobileV1 } from '../../components/SaleCardMobile.jsx';
import CarouselMobile from '../../components/ui/CarouselMobile.jsx';
import ReviewCardMobileV2 from '../../components/ReviewCardMobileV2.jsx';
import { DropdownFilterMobile } from '../../components/filters/MobileFilters';
import OptionPopupMobile from '../../components/OptionPopupMobile';
import { contentAPI } from '../../services/contentApi.js';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import { getPageSeo } from '../../config/seoConfig';

// 리뷰 카드는 전부 ReviewCardMobileV2를 재사용

export default function MobileReview() {
  const navigate = useNavigate();
  const [activeSort, setActiveSort] = useState('recent');
  const [isSortPopupOpen, setIsSortPopupOpen] = useState(false);

  // API로 리뷰 데이터 가져오기
  const { data: reviewsData = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: ['mobile-review', 'list'],
    queryFn: () => contentAPI.getReviews(20),
    staleTime: 1000 * 60,
  });

  const getDateMs = (dateStr) => {
    try {
      // ISO 형식 또는 다양한 날짜 형식 처리
      return new Date(dateStr).getTime();
    } catch (_) { return 0; }
  };

  const sortedReviews = useMemo(() => {
    const arr = [...reviewsData];
    if (activeSort === 'ratingDesc') {
      return arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    if (activeSort === 'ratingAsc') {
      return arr.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    }
    // recent(default): 날짜 최신순
    return arr.sort((a, b) => {
      const dateA = getDateMs(a.createdAt || a.date || '');
      const dateB = getDateMs(b.createdAt || b.date || '');
      return dateB - dateA;
    });
  }, [reviewsData, activeSort]);

  // 추천 슬라이드 (리뷰 중 상위 3개)
  const recommendedSlides = useMemo(() => {
    return sortedReviews.slice(0, 3).map((r, i) => ({
      id: `rec-${r.id || i}`,
      rightLabel: r.serviceType || r.label || '장기렌트',
      thumbnailImage: r.imageUrls?.[0] || r.images?.[0] || r.thumbs?.[0] || r.imageUrl || '',
      image: r.imageUrls?.[0] || r.images?.[0] || r.thumbs?.[0] || r.imageUrl || '',
      title: r.title || r.carModel || r.model || '',
      subtitle: r.subtitle || r.carTrim || r.trim || '',
      buttonText: '실시간 무료견적 받기',
    }));
  }, [sortedReviews]);

  const {
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords,
  } = getPageSeo('review');

  // SEO용 대표 이미지: 정렬된 리뷰 중 첫 번째의 대표 이미지 사용
  const seoImage = useMemo(() => {
    const first = sortedReviews[0];
    if (!first) return undefined;
    const img =
      first.imageUrls?.[0] ||
      first.images?.[0] ||
      first.thumbs?.[0] ||
      first.imageUrl ||
      null;
    return img || undefined;
  }, [sortedReviews]);

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
        <section className={styles.heroSection}>
          <div className={styles.heroCard}>
            <img
              src="/mobileMain/후기모양.png"
              alt="리뷰 아이콘"
              className={styles.heroIconImg}
              draggable={false}
            />
            <div className={styles.heroTexts}>
              <h1 className={styles.heroTitle}>
                실제 계약 고객들의 <span className={styles.heroHighlight}>리얼후기</span>
              </h1>
              <p className={styles.heroSubtitle}>상담부터 출고까지, 생생한 경험담을 확인해보세요</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>출고 후기·리뷰</h2>
            <DropdownFilterMobile
              value={activeSort}
              placeholder="정렬"
              options={[
                { value: 'recent', label: '최신 순' },
                { value: 'ratingDesc', label: '별점 높은 순' },
                { value: 'ratingAsc', label: '별점 낮은 순' },
              ]}
              onOpen={() => setIsSortPopupOpen(true)}
            />
          </div>
          <div className={styles.reviewList}>
            {isLoadingReviews ? (
              <div className={styles.loading}>리뷰를 불러오는 중...</div>
            ) : sortedReviews.length === 0 ? (
              <div className={styles.empty}>표시할 리뷰가 없습니다.</div>
            ) : (
              <div className={styles.reviewsCard}>
                {sortedReviews.map((r) => (
                  <div
                    key={r.id}
                    className={styles.reviewRow}
                    onClick={() => navigate(`/m/review/${r.id}`, { state: { review: r } })}
                    role="button"
                    tabIndex={0}
                  >
                    <ReviewCardMobileV2
                      badgeText={r.serviceType || r.label || '장기렌트'}
                      carName={r.title || r.carModel || r.model || ''}
                      rating={r.rating || 0}
                      authorName={r.authorName || r.author || '고객님'}
                      date={r.createdAt || r.date || ''}
                      images={r.imageUrls || r.images || r.thumbs || (r.imageUrl ? [r.imageUrl] : [])}
                      reviewTitle={r.title || r.carModel || r.model || ''}
                      reviewContent={r.description || r.content || r.reviewContent || ''}
                      reviewId={r.id}
                      review={r}
                      onMore={() => navigate(`/m/review/${r.id}`, { state: { review: r } })}
                      detailPayload={{ carId: r.id }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>많은 분들이 함께 선택한 차량은?</h2>
          </div>
          <CarouselMobile slides={recommendedSlides} width={343} peek={47} gap={12} auto={false} />
        </section>
      </div>
      {isSortPopupOpen && (
        <OptionPopupMobile
          size="small"
          title="정렬"
          sortOptions={[
            { name: '최신 순', value: 'recent' },
            { name: '별점 높은 순', value: 'ratingDesc' },
            { name: '별점 낮은 순', value: 'ratingAsc' },
          ]}
          selectedSort={activeSort}
          onSortSelect={(value) => {
            setActiveSort(value);
            setIsSortPopupOpen(false);
          }}
          onClose={() => setIsSortPopupOpen(false)}
        />
      )}
    </div>
    </>
  );
}


