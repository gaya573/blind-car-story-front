import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { contentAPI } from '../../services/contentApi.js';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import { getPageSeo } from '../../config/seoConfig';
import { MobileSubHeader } from '../../bcs/layout/MobileLayout';
import { useBcsUi } from '../../bcs/BcsUiContext';
import styles from './MobileReview.module.css';
import { REVIEW_PLACEHOLDER, SORT_OPTIONS, sortReviews, starsText, toReviewModel } from './reviewModel';

const PAGE_SIZE = 6;

function ReviewCard({ review }) {
  return (
    <Link className={`review-card ${styles.card}`} to={`/m/review/${review.id}`} state={{ review: review.raw }}>
      <img src={review.images[0] || REVIEW_PLACEHOLDER.imageUrl} alt={review.title || '출고후기 사진'} loading="lazy" />
      <div className="review-card__body">
        <h3>{review.title}</h3>
        <p>{review.body}</p>
        <p>
          {review.author}
          {review.rating ? (
            <>
              {' · '}
              <span className={styles.stars} aria-label={`별점 ${review.rating}점`}>
                {starsText(review.rating)}
              </span>
            </>
          ) : null}
          {review.date ? ` · ${review.date}` : ''}
        </p>
      </div>
    </Link>
  );
}

/** 출고후기 목록 (/m/review). 전용 퍼블리싱이 없어 mobile.css 의 후기 카드·목록 구성으로 만들었다. */
export default function MobileReview() {
  const { openQuote } = useBcsUi();
  const [sort, setSort] = useState(SORT_OPTIONS[0].value);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const { data = [], isLoading } = useQuery({
    queryKey: ['mobile-review', 'list'],
    queryFn: () => contentAPI.getReviews(100),
    staleTime: 1000 * 60,
  });

  const reviews = useMemo(
    () => sortReviews((Array.isArray(data) ? data : []).map((item) => ({ ...toReviewModel(item), raw: item })), sort),
    [data, sort],
  );

  useEffect(() => setVisible(PAGE_SIZE), [sort]);

  const rest = reviews.length - Math.min(visible, reviews.length);
  const { title: seoTitle, description: seoDescription, keywords: seoKeywords } = getPageSeo('review');

  return (
    <>
      <SeoHelmet title={seoTitle} description={seoDescription} keywords={seoKeywords} image={reviews[0]?.images[0]} />
      <MobileSubHeader title="출고후기" />

      <main id="main-content">
        <div className="m-pagehead">
          <h1>
            <em>출고후기</em> 및 리뷰
          </h1>
          <p>블라인드 카스토리를 이용한 실제 고객들의 생생한 후기와 리뷰를 만나보세요.</p>
        </div>

        {reviews.length > 1 ? (
          <div className="m-chips" aria-label="후기 정렬">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`m-chip${sort === option.value ? ' is-active' : ''}`}
                aria-pressed={sort === option.value}
                onClick={() => setSort(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="m-listbar">
          <span>전체 후기</span>
          <span>
            <strong>{reviews.length.toLocaleString('ko-KR')}</strong>건
          </span>
        </div>

        {isLoading ? (
          <p className="m-empty">리뷰를 불러오는 중...</p>
        ) : (
          <div className="m-card-stack" style={{ padding: '0 16px' }}>
            {reviews.length > 0 ? (
              reviews.slice(0, visible).map((review) => <ReviewCard key={review.id} review={review} />)
            ) : (
              <article className={`review-card ${styles.card}`}>
                <img src={REVIEW_PLACEHOLDER.imageUrl} alt={REVIEW_PLACEHOLDER.title} />
                <div className="review-card__body">
                  <h3>{REVIEW_PLACEHOLDER.title}</h3>
                  <p>{REVIEW_PLACEHOLDER.description}</p>
                  <p>{REVIEW_PLACEHOLDER.author}</p>
                </div>
              </article>
            )}
          </div>
        )}

        {rest > 0 ? (
          <div className="m-more">
            <button className="m-more__btn" type="button" onClick={() => setVisible((count) => count + PAGE_SIZE)}>
              후기 더보기 ({rest})
            </button>
          </div>
        ) : null}

        <div className="m-menu-promo">
          <strong>
            후기의 주인공,
            <br />
            다음은 고객님입니다
          </strong>
          <em>쉽고 투명한 신차 견적</em>
          <button
            className="m-callbar__btn"
            type="button"
            style={{ marginTop: 14, height: 44, padding: '0 22px' }}
            onClick={() => openQuote('', 'm-review')}
          >
            실시간 무료견적 받기
          </button>
        </div>

        <p className={`m-fine ${styles.disclaimer}`}>* 후기는 고객 동의 하에 게재되며, 작성자명은 일부 비공개 처리됩니다.</p>
      </main>
    </>
  );
}
