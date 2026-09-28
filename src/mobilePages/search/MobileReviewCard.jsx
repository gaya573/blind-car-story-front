import React from 'react';
import { useNavigate } from 'react-router-dom';

// 출고후기 API가 비어 있을 때 보여줄 퍼블리싱 자리표시 카드 (mock-data.js reviews)
export const REVIEW_PLACEHOLDERS = [1, 2].map((id) => ({
  id: `placeholder-${id}`,
  placeholder: true,
  title: '출고후기 준비중',
  description: '출고후기 콘텐츠는 준비 중입니다.',
  imageUrl: '/bcs/images/reviews/review-placeholder.svg',
  authorName: '정보 준비중',
}));

const reviewImage = (review) =>
  review.imageUrls?.[0] || review.imageUrl || review.images?.[0] || '/bcs/images/reviews/review-placeholder.svg';

/** 퍼블리싱 mobile.js 출고후기 카드(.review-card). 실제 후기는 누르면 후기 상세로 간다. */
export default function MobileReviewCard({ review, hidden = false }) {
  const navigate = useNavigate();
  const title = review.title || review.carModel || review.model || '';
  const description = review.description || review.content || review.reviewContent || '';
  const clickable = !review.placeholder && review.id != null;
  const open = () => navigate(`/m/review/${review.id}`, { state: { review } });

  return (
    <article
      className="review-card"
      data-content-type={review.contentType || 'REVIEW'}
      aria-hidden={hidden ? 'true' : undefined}
      role={clickable && !hidden ? 'link' : undefined}
      tabIndex={clickable && !hidden ? 0 : undefined}
      onClick={clickable ? open : undefined}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === 'Enter') open();
            }
          : undefined
      }
      style={clickable ? { cursor: 'pointer' } : undefined}
    >
      <img src={reviewImage(review)} alt={review.placeholder ? '출고후기 준비중' : title} loading="lazy" />
      <div className="review-card__body">
        <h3>{title}</h3>
        <p>{description}</p>
        <p>{review.authorName || ''}</p>
      </div>
    </article>
  );
}
