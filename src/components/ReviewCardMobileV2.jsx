import React from "react";
import { useNavigate } from 'react-router-dom';
import { navigateToDetail } from '../mobilePages/utils/navigateDetail.js';
import styles from "./ReviewCardMobileV2.module.css";

const ReviewCardMobileV2 = ({
  badgeText = "장기렌트",
  carName = "아반떼",
  rating = 4.0,
  authorName = "임*화",
  date = "2025-10-23",
  images = [],
  reviewTitle = "아반떼 구매합니다.",
  reviewContent = "블라인드 카스토리 유투브 보다가 좋은 조건에 나왔길래 바로 구매하였습니다. 덤부에 좋은 조건으로 구매할 수 있었습니다.",
  onMore,
  reviewId,
  review,
  // 상세 이동을 위한 선택적 페이로드: { carId } 또는 { trimId, optionIds: [] }
  detailPayload,
}) => {
  const navigate = useNavigate();
  const formatDate = (value) => {
    if (!value) return '';
    const parts = String(value).split('T');
    return parts[0] || value;
  };
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span
          key={i}
          className={`${styles.star} ${i < fullStars ? styles.starFilled : styles.starEmpty}`}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  const handleCardClick = () => {
    if (onMore) {
      onMore();
    } else if (reviewId) {
      navigate(`/m/review/${reviewId}`, { state: { review } });
    }
  };

  // 차량명만 추출 (제목이 길 경우 첫 단어만)
  const displayCarName = carName.split(' ')[0] || carName;

  return (
    <div
      className={`${styles.card} ${styles.clickable}`}
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
    >
      {/* 상단 라벨 */}
      <div className={styles.badge}>{badgeText}</div>
<div>
      {/* 헤더 - 이름과 별점 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.carName}>{carName}</span>
          <div className={styles.rating}>
            {renderStars(rating)}
            <span className={styles.ratingNumber}>{rating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* 작성자 정보 */}
      <div className={styles.authorInfo}>
        <span className={styles.authorName}>{authorName}</span>
        <span className={styles.date}>계약 일자 | {formatDate(date)}</span>
      </div>
      </div>
      <div className={styles.imageSectionContainer}>
        {/* 차량 이미지들 */}
        {images && images.length > 0 && (
          <div className={styles.imageSection}>
            {images.slice(0, 3).map((img, idx) => (
              <div key={idx} className={styles.imageWrapper}>
                <img src={img} alt={`car ${idx + 1}`} className={styles.carImage} />
              </div>
            ))}
          </div>
        )}
      </div>
      {/* 리뷰 텍스트 */}
      <div className={styles.reviewSection}>
        <p className={styles.reviewTitle}>{reviewTitle}</p>
        <p className={styles.reviewContent}>{reviewContent}</p>
      </div>

      {/* 더보기 링크 */}
      <div className={styles.footer}>
        <button
          className={styles.moreLink}
          onClick={(e) => {
            e.stopPropagation();
            // 리뷰 상세 페이지로 이동 우선
            if (onMore) {
              onMore();
            } else if (reviewId) {
              navigate(`/m/review/${reviewId}`, { state: { review } });
            } else if (detailPayload && (
              detailPayload.carId || detailPayload.id || detailPayload.vehicleId ||
              detailPayload.trimId || detailPayload.trim ||
              (Array.isArray(detailPayload.optionIds) && detailPayload.optionIds.length) ||
              (Array.isArray(detailPayload.options) && detailPayload.options.length)
            )) {
              navigateToDetail(navigate, detailPayload);
            } else {
              navigate('/m/advance/detail');
            }
          }}
        >
          더보기
        </button>
      </div>
    </div>
  );
};

export default ReviewCardMobileV2;



