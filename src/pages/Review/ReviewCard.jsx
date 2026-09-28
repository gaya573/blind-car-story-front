import React from 'react';
import styles from './ReviewCard.module.css';

/**
 * ReviewCard 컴포넌트
 * 개별 리뷰를 카드 형태로 표시하는 컴포넌트
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {Object} props.review - 리뷰 데이터 객체
 * @param {Function} props.onClick - 카드 클릭 시 실행될 함수
 */
const ReviewCard = ({ review, onClick }) => {
  /**
   * 별점 렌더링 함수
   * @param {number} rating - 별점 (1-5)
   * @returns {Array} 별점 요소 배열
   */
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span 
          key={i} 
          className={`${styles.star} ${i < rating ? styles.filledStar : styles.emptyStar}`}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className={styles.reviewCard} onClick={onClick}>
      {/* 이미지 영역 */}
      <div className={styles.imageContainer}>
        {review.imageUrl === 'placeholder' ? (
          <div className={styles.imagePlaceholder}>
            <span className={styles.placeholderText}>이미지</span>
          </div>
        ) : (
          <img 
            src={review.imageUrl} 
            alt={review.productName}
            className={styles.reviewImage}
          />
        )}
        {/* 추천 배지 */}
        <div className={styles.recommendBadge}>추천 해요!</div>
      </div>

      {/* 카드 내용 */}
      <div className={styles.cardContent}>
        {/* 제품명 */}
        <h3 className={styles.productName}>
          {review.productName}
        </h3>

        {/* 리뷰 미리보기 */}
        <p className={styles.reviewSnippet}>
          {review.reviewTextSnippet}
        </p>

        {/* 별점 */}
        <div className={styles.rating}>
          {renderStars(review.rating)}
        </div>

        {/* 작성자 및 날짜 */}
        <div className={styles.metaInfo}>
          <span className={styles.author}>{review.author}</span>
          <span className={styles.date}>{review.date}</span>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
