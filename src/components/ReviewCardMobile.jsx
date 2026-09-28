import React from "react";
import { useNavigate } from 'react-router-dom';
import styles from "./ReviewCardMobile.module.css";

const ReviewCardMobile = ({
  carImage,
  carName = "",
  rating = 0,
  reviewText = "",
  reviewDetail = "",
  variant = "card",
  withDivider = false,
  onClick,
}) => {
  const navigate = useNavigate();
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

  if (variant === "list") {
    return (
      <div className={styles.listRow} style={{ borderTop: withDivider ? '1px solid #eef0f3' : 'none' }}>
        <div className={styles.listThumb}>
          {carImage ? <img src={carImage} alt="car" /> : null}
        </div>
        <div>
          <div className={styles.listMeta}>
            <span className={styles.listBadge}>{carName}</span>
            <span className={styles.listStars}>★★★★★</span>
            <span className={styles.listScore}>{rating.toFixed(1)}</span>
          </div>
          <div className={styles.listTitle}>{reviewText}</div>
          <p className={styles.listText}>{reviewDetail}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.card} ${styles.clickable}`}
      role="button"
      tabIndex={0}
      onClick={onClick || (() => navigate('/m/advance/detail'))}
      
    >
      {/* 왼쪽 - 차량 이미지 */}
      <div className={styles.leftSection}>
        {carImage ? (
          <img src={carImage} alt="car" className={styles.carImage} />
        ) : (
          <div className={styles.carImage} style={{ background: '#f8fafc' }} />
        )}
      </div>

      {/* 오른쪽 - 리뷰 내용 */}
      <div className={styles.rightSection}>
        {/* 상단 - 이름과 별점 */}
        <div className={styles.header}>
          <span className={styles.carName}>{carName}</span>
          <div className={styles.rating}>
            {renderStars(rating)}
            <span className={styles.ratingNumber}>{rating.toFixed(1)}</span>
          </div>
        </div>

        {/* 리뷰 텍스트 */}
        <div className={styles.reviewText}>{reviewText}</div>

        <div className={styles.reviewDetail}>{reviewDetail}</div>
      </div>
    </div>
  );
};

export default ReviewCardMobile;

