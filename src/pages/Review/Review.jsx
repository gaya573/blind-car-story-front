import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery, useQueries } from '@tanstack/react-query';
import { contentAPI } from '../../services/contentApi';
import { carAPI } from '../../services/carApi';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import StructuredData, { getReviewSchema } from '../../components/StructuredData.jsx';
import { getPageSeo } from '../../config/seoConfig';
import { useBcsUi } from '../../bcs/BcsUiContext';
import ConsultBannerForm from '../../bcs/components/ConsultBannerForm';
import ReviewDetailDialog from './ReviewDetailDialog';
import ReviewStars from './ReviewStars';
import { toReviewModel } from './reviewModel';
import './review-bcs.css';

// 퍼블리싱 review.js PAGE_SIZE
const PAGE_SIZE = 9;
const FALLBACK_IMAGE = '/bcs/images/cars/car-suv.svg';

function ReviewCard({ review, onOpen }) {
  const open = () => onOpen(review);
  return (
    <article
      className="rv-card"
      data-review-id={review.id}
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === 'Enter') open();
      }}
    >
      <div className={`rv-card__media${review.imageUrl ? ' rv-card__media--photo' : ''}`}>
        {review.recommend ? <span className="rv-card__badge">추천해요!</span> : null}
        <img src={review.imageUrl || FALLBACK_IMAGE} alt={review.carName || review.title} loading="lazy" />
      </div>
      <div className="rv-card__body">
        {review.carName ? <span className="rv-card__car">{review.carName}</span> : null}
        <h3 className="rv-card__title">{review.title}</h3>
        <p className="rv-card__snippet">{review.snippet}</p>
        <ReviewStars rating={review.rating} />
        <div className="rv-card__meta">
          <span>{review.author}</span>
          <span>{review.date}</span>
        </div>
      </div>
    </article>
  );
}

const Review = () => {
  const { openQuote } = useBcsUi();
  const [selected, setSelected] = useState(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useInfiniteQuery({
    queryKey: ['reviews', 'pages', PAGE_SIZE],
    queryFn: ({ pageParam }) => contentAPI.getReviewsPage({ page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.pagination;
      return pagination && pagination.page < pagination.totalPages ? pagination.page + 1 : undefined;
    },
  });

  const baseReviews = useMemo(
    () => (data?.pages ?? []).flatMap((pageData) => pageData?.items ?? []).map(toReviewModel),
    [data],
  );
  const total = data?.pages?.[0]?.pagination?.totalElements ?? baseReviews.length;
  const rest = Math.max(0, total - baseReviews.length);

  // 트림이 연결된 후기는 차량 상세에서 "브랜드 + 차종" 이름을 가져와 차종 칩에 쓴다.
  const trimIds = useMemo(() => [...new Set(baseReviews.map((review) => review.trimId).filter(Boolean))], [baseReviews]);
  const carNames = useQueries({
    queries: trimIds.map((trimId) => ({
      queryKey: ['cars', 'detail', trimId],
      queryFn: () => carAPI.getCarDetail(trimId),
      staleTime: 1000 * 60 * 5,
    })),
    combine: (results) =>
      Object.fromEntries(
        results
          .map((result, index) => [trimIds[index], result.data])
          .filter(([, detail]) => detail?.name)
          .map(([trimId, detail]) => [trimId, [detail.brandName, detail.name].filter(Boolean).join(' ')]),
      ),
  });

  const reviews = useMemo(
    () => baseReviews.map((review) => (carNames[review.trimId] ? { ...review, carName: carNames[review.trimId] } : review)),
    [baseReviews, carNames],
  );

  const closeDialog = useCallback(() => setSelected(null), []);
  const quoteFromReview = useCallback(
    (review) => {
      setSelected(null);
      openQuote(review?.carName ?? '', 'review-modal');
    },
    [openQuote],
  );

  const { title: seoTitle, description: seoDescription, keywords: seoKeywords } = getPageSeo('review');
  const reviewSchema = useMemo(
    () => getReviewSchema(reviews.map((review) => ({ author: review.author, date: review.date, text: review.snippet, rating: review.rating }))),
    [reviews],
  );

  return (
    <div className="bcs-page-review">
      <SeoHelmet title={seoTitle} description={seoDescription} keywords={seoKeywords} image={reviews[0]?.imageUrl || undefined} />
      <StructuredData data={reviewSchema} />
      <section className="review-page">
        <div className="container">
          <nav className="rv-breadcrumb" aria-label="현재 위치">
            <Link to="/">홈</Link>
            <span aria-hidden="true">›</span>
            <strong>출고후기 및 리뷰</strong>
          </nav>

          <div className="rv-header">
            <h1 className="rv-header__title">
              <em>출고후기</em> 및 리뷰
            </h1>
            <p className="rv-header__sub">블라인드 카스토리를 이용한 실제 고객들의 생생한 후기와 리뷰를 만나보세요.</p>
          </div>

          <div className="rv-listhead">
            <h2 className="rv-listhead__title">전체 후기</h2>
            <p className="rv-listhead__note">최신 등록순으로 표시됩니다.</p>
          </div>

          {isLoading ? (
            <p className="rv-empty">후기를 불러오는 중입니다...</p>
          ) : isError && reviews.length === 0 ? (
            <p className="rv-empty">후기를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
          ) : reviews.length === 0 ? (
            <p className="rv-empty">등록된 후기가 아직 없습니다.</p>
          ) : (
            <div className="rv-grid">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} onOpen={setSelected} />
              ))}
            </div>
          )}

          {hasNextPage && rest > 0 && (
            <div className="rv-more">
              <button className="rv-more__btn" type="button" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
                {isFetchingNextPage ? '후기를 불러오는 중…' : `후기 더보기 (${rest})`}
              </button>
            </div>
          )}

          <ConsultBannerForm
            idPrefix="review-banner"
            title="후기의 주인공, 다음은 고객님입니다"
            source="review-banner"
            entryLabel="출고후기 상담 배너"
          />

          <p className="disclaimer">* 후기는 고객 동의 하에 게재되며, 작성자명은 일부 비공개 처리됩니다.</p>
        </div>
      </section>
      <ReviewDetailDialog review={selected} onClose={closeDialog} onQuote={quoteFromReview} />
    </div>
  );
};

export default Review;
