import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { contentAPI } from '../../services/contentApi.js';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import { navigateToDetail } from '../utils/navigateDetail';
import { MobileSubHeader } from '../../bcs/layout/MobileLayout';
import { useBcsUi } from '../../bcs/BcsUiContext';
import { SITE_NAME } from '../../bcs/site';
import styles from './MobileReview.module.css';
import { REVIEW_PLACEHOLDER, starsText, toReviewModel } from './reviewModel';

function Shell({ message }) {
  return (
    <>
      <MobileSubHeader title="출고후기" />
      <main id="main-content">
        <p className="m-empty">{message}</p>
      </main>
    </>
  );
}

/** 출고후기 상세 (/m/review/:id). 목록에서 넘어오면 state 로, 직접 들어오면 후기 API 에서 찾는다. */
export default function MobileReviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { openQuote } = useBcsUi();
  const stateReview = location.state?.review ?? null;
  const [imageIndex, setImageIndex] = useState(0);
  const [navigating, setNavigating] = useState(false);

  const { data: fetched, isLoading } = useQuery({
    queryKey: ['mobile-review-detail', id],
    queryFn: async () => {
      const reviews = await contentAPI.getReviews(100);
      return reviews.find((review) => String(review.id) === String(id)) ?? null;
    },
    enabled: Boolean(id) && !stateReview,
    staleTime: 1000 * 60,
  });

  const raw = stateReview ?? fetched;
  const review = useMemo(() => (raw ? toReviewModel(raw) : null), [raw]);

  if (!review) {
    return <Shell message={isLoading ? '리뷰를 불러오는 중...' : '리뷰를 찾을 수 없습니다.'} />;
  }

  const images = review.images.length ? review.images : [REVIEW_PLACEHOLDER.imageUrl];
  const current = Math.min(imageIndex, images.length - 1);
  const carName = [review.brand, review.title].filter(Boolean).join(' ');
  const paragraphs = review.body.split(/\n+/).map((line) => line.trim()).filter(Boolean);

  // 같은 차량 견적내기: 후기에 연결된 트림이 있으면 차량 상세로, 없으면 차량 검색으로 보낸다.
  const goSameCar = async () => {
    if (navigating) return;
    if (!review.trimId) {
      navigate('/m/search');
      return;
    }
    setNavigating(true);
    try {
      await navigateToDetail(navigate, { vehicleLineId: review.vehicleLineId, trimId: review.trimId });
    } finally {
      setNavigating(false);
    }
  };

  return (
    <>
      <SeoHelmet title={`${review.title} | ${SITE_NAME}`} description={paragraphs[0]} image={review.images[0]} />
      <MobileSubHeader title="출고후기" />

      <main id="main-content">
        <div className={styles.gallery}>
          <img className={styles.mainImage} src={images[current]} alt={`${review.title} 사진 ${current + 1}`} />
          {images.length > 1 ? (
            <div className={styles.thumbs} role="group" aria-label="후기 사진">
              {images.map((url, index) => (
                <button
                  key={url}
                  type="button"
                  className={`${styles.thumb}${index === current ? ` ${styles.thumbActive}` : ''}`}
                  aria-label={`사진 ${index + 1} 보기`}
                  aria-pressed={index === current}
                  onClick={() => setImageIndex(index)}
                >
                  <img src={url} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="m-cd-title" style={{ padding: '20px 16px' }}>
          <h1>{review.title}</h1>
          <div className={`m-cd-title__meta ${styles.meta}`}>
            {review.brand ? <span className="m-cd-origin">{review.brand}</span> : null}
            <span>{review.author}</span>
            {review.rating ? (
              <span className={styles.stars} aria-label={`별점 ${review.rating}점`}>
                {starsText(review.rating)}
              </span>
            ) : null}
            {review.date ? <span>{review.date}</span> : null}
          </div>
        </div>

        <section className={`m-cd-block ${styles.body}`}>
          {paragraphs.length ? paragraphs.map((line, index) => <p key={index}>{line}</p>) : <p>{REVIEW_PLACEHOLDER.description}</p>}
        </section>

        <section className={`m-cd-block ${styles.actions}`}>
          <button className="m-deal__cta" type="button" onClick={goSameCar} disabled={navigating}>
            {navigating ? '이동 준비 중...' : '같은 차량 견적내기'}
          </button>
          <button className="m-more__btn" type="button" onClick={() => openQuote(carName, 'm-review-detail')}>
            실시간 무료견적 받기
          </button>
        </section>
      </main>
    </>
  );
}
