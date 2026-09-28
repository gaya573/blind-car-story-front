import React from 'react';
import styles from './VehicleCardSimple.module.css';

/**
 * 재고특가핫딜 모바일 카드 - Pixso 디자인 기반 (130px 높이)
 * 선납금 30%, 보증금 30%, 완전무보증의 월 렌탈료를 함께 표시
 */
const VehicleCardSimple = ({
  name = '현대 투싼',
  subtitle = '모던 하이브리드',
  priceValue = '34,220,000원~',
  monthlyValue = '가격 문의',
  image,
  onClick,
  trim,
}) => {
  const formatFee = (fee, fallback = '가격 문의') => {
    const value = Number(fee);
    return Number.isFinite(value) && value > 0 ? value.toLocaleString() : fallback;
  };

  // Hot-deal 응답은 세 가지 조건의 렌탈료를 모두 내려준다. 이전 구현은
  // 완전무보증 한 행만 렌더링해서 실제 비교 가격 두 개를 숨기고 있었다.
  const prepaymentFee = trim?.lowestPrepayment30MonthlyFee;
  const depositFee = trim?.lowestDeposit30MonthlyFee;
  const noDepositFee = trim?.lowestNoDepositMonthlyFee;
  const rentalPlans = [
    { label: '선납금 30%', value: formatFee(prepaymentFee) },
    { label: '보증금 30%', value: formatFee(depositFee) },
    { label: '완전무보증', value: formatFee(noDepositFee, monthlyValue) },
  ];

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

        <div className={styles.rentalPlans} aria-label="렌탈 조건별 월 납입금">
          {rentalPlans.map((plan) => (
            <div className={styles.rentalRow} key={plan.label}>
              <div className={styles.rentalBadge}>{plan.label}</div>
              <div className={styles.rentalPrice}>
                <span className={styles.rentalMonth}>월</span>
                <span className={styles.rentalAmount}>{plan.value}</span>
                {plan.value !== '가격 문의' && <span className={styles.rentalUnit}>원</span>}
              </div>
            </div>
          ))}
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

export default VehicleCardSimple;
