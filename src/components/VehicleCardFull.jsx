import React from 'react';
import styles from './VehicleCardFull.module.css';

/**
 * 차량검색 카드 - Pixso 디자인 기반 (169px 높이)
 * 3가지 렌탈플랜 모두 표시: 선납금30%, 보증금30%, 완전무보증
 */
const VehicleCardFull = ({
  name = '현대 투싼',
  subtitle = '모던 하이브리드',
  priceValue = '34,220,000원~',
  image,
  onClick,
  trim,
}) => {
  // trim에서 3가지 렌탈플랜 추출
  const prepaymentFee = trim?.lowestPrepayment30MonthlyFee;
  const depositFee = trim?.lowestDeposit30MonthlyFee;
  const noDepositFee = trim?.lowestNoDepositMonthlyFee;

  const formatFee = (fee) => {
    return fee && fee > 0 ? fee.toLocaleString() : '000,000';
  };

  return (
    <div 
      className={styles.card} 
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* 왼쪽 콘텐츠 영역 */}
      <div className={styles.leftContent}>
        {/* 제목 영역 */}
        <div className={styles.titleSection}>
          <h3 className={styles.title}>{name}</h3>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        {/* 차량가격 */}
        <div className={styles.priceRow}>
          <span className={styles.priceLabel}>차량가격</span>
          <span className={styles.priceValue}>{priceValue}</span>
        </div>

        {/* 3가지 렌탈플랜 */}
        <div className={styles.rentalPlans}>
          {/* 선납금 30% */}
          <div className={styles.rentalRow}>
            <div className={styles.rentalBadge}>선납금30%</div>
            <div className={styles.rentalPrice}>
              <span className={styles.rentalMonth}>월</span>
              <span className={styles.rentalAmount}>{formatFee(prepaymentFee)}</span>
              <span className={styles.rentalUnit}>원</span>
            </div>
          </div>

          {/* 보증금30% */}
          <div className={styles.rentalRow}>
            <div className={styles.rentalBadge}>보증금30%</div>
            <div className={styles.rentalPrice}>
              <span className={styles.rentalMonth}>월</span>
              <span className={styles.rentalAmount}>{formatFee(depositFee)}</span>
              <span className={styles.rentalUnit}>원</span>
            </div>
          </div>

          {/* 완전무보증 */}
          <div className={styles.rentalRow}>
            <div className={styles.rentalBadge}>완전무보증</div>
            <div className={styles.rentalPrice}>
              <span className={styles.rentalMonth}>월</span>
              <span className={styles.rentalAmount}>{formatFee(noDepositFee)}</span>
              <span className={styles.rentalUnit}>원</span>
            </div>
          </div>
        </div>
      </div>

      {/* 더보기 버튼 */}
      <button 
        className={styles.moreButton}
        onClick={(e) => {
          e.stopPropagation();
          onClick && onClick(e);
        }}
      >
        더보기 <span>›</span>
      </button>

      {/* 차량 이미지 */}
      <div className={styles.imageWrapper}>
        {image && <img src={image} alt={name} />}
      </div>
    </div>
  );
};

export default VehicleCardFull;
