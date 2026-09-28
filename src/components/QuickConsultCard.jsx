import React, { useState } from 'react';
import styles from './QuickConsultCard.module.css';
import { priceToMonthly, roundDownToManwon } from '../utils/priceUtils';
import PrivacyConsentCheckbox from './PrivacyConsentCheckbox.jsx';
import RotateLoading from './modals/RotateLoading';

const parsePriceValue = (value) => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const numeric = Number(value.replace(/[^\d.-]/g, ''));
    return Number.isNaN(numeric) ? 0 : numeric;
  }
  return 0;
};

const formatFullWon = (value = 0) =>
  `${Math.round(value || 0).toLocaleString()}원`;

const formatMonthlyManWonValue = (value = 0) => {
  const monthly = priceToMonthly(parsePriceValue(value));
  return `${roundDownToManwon(monthly).toLocaleString()}만원/월`;
};

const QuickConsultCard = ({
  trimName,
  trimPrice,
  selectedColor,
  selectedColorPrice = 0,
  selectedOptions = [],
  discountAmount = 0,
  showDiscount = false,
  // priceMode: 'monthly' | 'total'
  priceMode = 'monthly',
  onEstimateClick,
  onLoadingClose,
}) => {
  const [isPrivacyAgreed, setIsPrivacyAgreed] = useState(true);
  const [showRotateLoading, setShowRotateLoading] = useState(false);

  const basePrice = parsePriceValue(trimPrice);
  const colorPriceValue = parsePriceValue(selectedColorPrice);

  const optionItems = Array.isArray(selectedOptions)
    ? selectedOptions.map((option) => {
        const optionPrice =
          parsePriceValue(option?.price ?? option?.discountedPrice ?? option?.amount);
        return {
          name: option?.name ?? '옵션',
          price: optionPrice,
        };
      })
    : [];

  const optionsTotal = optionItems.reduce((sum, option) => sum + option.price, 0);

  const totalPrice = basePrice + colorPriceValue + optionsTotal;

  const finalTotal = showDiscount ? totalPrice - parsePriceValue(discountAmount) : totalPrice;

  // Design 13:18 requires full price display for Total Mode
  const formatBaseDisplay = () =>
    priceMode === 'monthly' 
      ? formatMonthlyManWonValue(basePrice) 
      : formatFullWon(basePrice);

  const formatTotalDisplay = () =>
    priceMode === 'monthly' 
      ? formatMonthlyManWonValue(finalTotal) 
      : formatFullWon(finalTotal);

  const handleEstimate = () => {
    if (!isPrivacyAgreed) {
      alert('개인정보 이용 동의에 체크해 주세요.');
      return;
    }
    setShowRotateLoading(true);
  };

  return (
    <div className={styles['quick-consult-card']}>
      <div className={styles['estimate-topbar']}>
        <span className={styles['estimate-topbar-title']}>내 차 견적서</span>
      </div>

      <div className={styles['estimate-body']}>
        {/* 기본 차량가격 */}
        <div className={styles['estimate-block']}>
          <div className={styles['estimate-block-title']}>기본 차량가격</div>
          <div className={styles['estimate-row']}>
            <span className={styles['estimate-sub']}>{trimName}</span>
            <span className={styles['estimate-value']}>{formatBaseDisplay()}</span>
          </div>
        </div>

        {/* 옵션가격 */}
        <div className={styles['estimate-block']}>
          <div className={styles['estimate-block-title']}>옵션가격</div>
          <div className={styles['estimate-options-scroll']}>
            {/* 외장색상 */}
            <div className={styles['option-row']}>
            <span>차량 외장색상 : {selectedColor || '선택 없음'}</span>
            </div>
            {colorPriceValue > 0 && (
                 <div className={styles['option-row']}>
                   <span>{selectedColor || '외장색상'}</span>
                   <span className={styles['option-price']}>+ {formatFullWon(colorPriceValue)}</span>
                 </div>
            )}
            
            {/* 선택된 옵션들 */}
          {optionItems.map((option, index) => (
              <div className={styles['option-row']} key={index}>
                <span>{option.name}</span>
                <span className={styles['option-price']}>
                + {formatFullWon(option.price)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 할인 섹션 (조건부 렌더링) */}
        {showDiscount && discountAmount > 0 && (
          <div className={styles['estimate-block']}>
            <div className={styles['estimate-block-title']}>즉시할인가</div>
            <div className={styles['estimate-row']}>
              <span className={styles['estimate-sub']}>즉시 할인 혜택</span>
              <span className={styles['estimate-value']} style={{color: '#ff4444'}}>
                -{formatFullWon(discountAmount)}
              </span>
            </div>
          </div>
        )}

        {/* 최종 합계 */}
        <div className={styles['estimate-total']}>
          <span className={styles['estimate-total-title']}>
            {priceMode === 'monthly' ? '월 납입 합계' : '총 차량가격'}
          </span>
          <div className={styles['estimate-total-value']}>
             {priceMode === 'monthly' ? (
                formatMonthlyManWonValue(finalTotal)
             ) : (
                <>
                  <span>{Math.round(finalTotal || 0).toLocaleString()}</span>
                  <span className={styles['estimate-total-value-unit']}>원</span>
                </>
             )}
          </div>
        </div>

        {/* 개인정보 이용 동의 - 금액 영역 오른쪽 정렬 */}
        <div className={styles['privacy-wrapper']}>
          <PrivacyConsentCheckbox
            checked={isPrivacyAgreed}
            onChange={setIsPrivacyAgreed}
            align="right"
          />
        </div>

        {/* 견적 확인 버튼 */}
        <button
          className={styles['estimate-cta']}
          onClick={handleEstimate}
        >
          실시간 무료견적 받기
        </button>
      </div>

      {/* 로딩 모달 */}
      <RotateLoading
        open={showRotateLoading}
        onClose={() => setShowRotateLoading(false)}
        onComplete={() => {
          // 로딩 완료 후 실제 로직 실행
          if (onEstimateClick) {
            onEstimateClick();
          }
        }}
      />
    </div>
  );
};

export default QuickConsultCard;
