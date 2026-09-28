import React, { useMemo } from 'react';
import styles from './PromotionCard.module.css';
import { resolveMonthlyPayment } from '../utils/priceUtils';
import { normalizeDoubleAmpersand } from '../utils/displayText';

const BRAND_LOGO_MAP = {
  // 국산 브랜드
  '기아': '/brand/kia.svg',
  '현대': '/brand/현대.svg',
  '제네시스': '/brand/제네시스.svg',
  '르노삼성': '/brand/르노삼성.svg',
  '르노코리아': '/brand/르노삼성.svg',
  '쉐보레': '/brand/쉐보레.svg',
  'KGM': '/brand/kgm.svg',
  'KG모빌리티': '/brand/kgm.svg',
  '쌍용': '/brand/kgm.svg',
  
  // 수입 브랜드 - 영문
  'BMW': '/importbrands/bmw.svg',
  'BYD': '/importbrands/byd.svg',
  'Volvo': '/importbrands/volvo.svg',
  'VOLVO': '/importbrands/volvo.svg',
  
  // 수입 브랜드 - 한글
  '벤츠': '/importbrands/벤츠.svg',
  '메르세데스-벤츠': '/importbrands/벤츠.svg',
  '메르세데스벤츠': '/importbrands/벤츠.svg',
  'Mercedes-Benz': '/importbrands/벤츠.svg',
  'Mercedes Benz': '/importbrands/벤츠.svg',
  
  '아우디': '/importbrands/아우디.svg',
  'Audi': '/importbrands/아우디.svg',
  'AUDI': '/importbrands/아우디.svg',
  
  '폭스바겐': '/importbrands/폭스바겐.svg',
  'Volkswagen': '/importbrands/폭스바겐.svg',
  'VOLKSWAGEN': '/importbrands/폭스바겐.svg',
  
  '볼보': '/importbrands/volvo.svg',
  
  '렉서스': '/importbrands/렉서스.svg',
  'Lexus': '/importbrands/렉서스.svg',
  'LEXUS': '/importbrands/렉서스.svg',
  
  '도요타': '/importbrands/도요타.svg',
  'Toyota': '/importbrands/도요타.svg',
  'TOYOTA': '/importbrands/도요타.svg',
  
  '테슬라': '/importbrands/테슬라.svg',
  'Tesla': '/importbrands/테슬라.svg',
  'TESLA': '/importbrands/테슬라.svg',
  
  '포드': '/importbrands/포드.svg',
  'Ford': '/importbrands/포드.svg',
  'FORD': '/importbrands/포드.svg',
  
  '폴스타': '/importbrands/폴스타.svg',
  'Polestar': '/importbrands/폴스타.svg',
  'POLESTAR': '/importbrands/폴스타.svg',
};

const PromotionCard = ({ 
  id, 
  name, 
  desc, 
  img, 
  brand,
  brandLogo: brandLogoProp,
  onClick,
  onButtonClick,
  buttonText = "혜택 상담 받기",
  ended = false,
  badgeText,
  badgeVariant = "yellow",
  ribbonText,
  // 가격/할인 정보 (선택적)
  basePrice,
  finalPrice,
  discountPercent,
  discountAmount,
  discountDisplay = 'monthly',
  showMonthly = true,
  monthlyRentalFee,
  discountedMonthlyFee,
  monthlyDiscountPercent,
  // 트림 데이터 (3가지 렌탈 플랜)
  trim,
}) => {
  const displayName = useMemo(() => normalizeDoubleAmpersand(name), [name]);
  const displayDesc = useMemo(() => normalizeDoubleAmpersand(desc), [desc]);

  const brandLogo = useMemo(() => {
    // API에서 받은 brandLogo URL이 있으면 우선 사용
    if (brandLogoProp) return brandLogoProp;
    // 없으면 기존 로컬 맵에서 찾기
    if (!brand) return null;
    
    // 다양한 케이스로 매칭 시도
    const trimmedBrand = brand.trim();
    return (
      BRAND_LOGO_MAP[trimmedBrand] ||
      BRAND_LOGO_MAP[trimmedBrand.toUpperCase()] ||
      BRAND_LOGO_MAP[trimmedBrand.toLowerCase()] ||
      null
    );
  }, [brand, brandLogoProp]);

  const hasPriceInfo = typeof basePrice === 'number' && basePrice > 0;
  const hasDiscount =
    hasPriceInfo &&
    ((typeof discountPercent === 'number' && discountPercent > 0) ||
      (typeof discountAmount === 'number' && discountAmount > 0));

  const MONTHS = 48;
  const effectiveBasePrice = hasPriceInfo ? basePrice : 0;
  const effectiveFinalPrice =
    hasPriceInfo && hasDiscount && typeof finalPrice === 'number' && finalPrice > 0
      ? finalPrice
      : effectiveBasePrice;

  const monthlyPayment = resolveMonthlyPayment({
    monthlyRentalFee,
    discountedMonthlyFee,
    fallbackBasePrice: effectiveBasePrice,
    fallbackDiscountedPrice: effectiveFinalPrice,
    months: MONTHS,
  });
  const monthlyValueNumber = monthlyPayment.monthlyValue ?? 0;
  const monthlyOriginalNumber = monthlyPayment.monthlyOriginal ?? 0;
  const hasMonthlyValue = monthlyValueNumber > 0;
  const hasMonthlyPricing = monthlyPayment.hasDedicatedMonthly;
  const monthlyValueLabel = hasMonthlyValue
    ? `${monthlyValueNumber.toLocaleString()}원`
    : '가격 문의';
  const showMonthlyOriginal =
    monthlyOriginalNumber > 0 &&
    monthlyOriginalNumber > monthlyValueNumber &&
    monthlyValueNumber > 0;
  const monthlyDiscountAmount =
    showMonthlyOriginal && monthlyOriginalNumber > monthlyValueNumber
      ? monthlyOriginalNumber - monthlyValueNumber
      : null;
  let displayMonthlyDiscountPercent = null;
  if (monthlyPayment.hasDedicatedMonthly && typeof monthlyDiscountPercent === 'number' && monthlyDiscountPercent > 0) {
    displayMonthlyDiscountPercent = Math.round(monthlyDiscountPercent);
  } else if (
    !monthlyPayment.hasDedicatedMonthly &&
    discountDisplay === 'monthly' &&
    hasDiscount &&
    discountPercent > 0
  ) {
    displayMonthlyDiscountPercent = Math.round(discountPercent);
  }
  const monthlyDiscountLabel = displayMonthlyDiscountPercent
    ? `${displayMonthlyDiscountPercent}% 할인`
    : null;

  const discountLabel =
    discountDisplay === 'price' && typeof discountAmount === 'number' && discountAmount > 0
      ? `${discountAmount.toLocaleString()}원 할인`
      : hasDiscount
        ? `${discountPercent}% 할인`
        : null;

  const showPriceDiscount = Boolean(discountLabel) && discountDisplay === 'price';
  const showMonthlyDiscount = Boolean(monthlyDiscountLabel);
  const shouldShowPriceRow = hasPriceInfo;
  
  // 3가지 렌탈 플랜 중 하나라도 있으면 표시
  const hasAnyRentalPlan = trim && (
    trim.lowestPrepayment30MonthlyFee > 0 ||
    trim.lowestDeposit30MonthlyFee > 0 ||
    trim.lowestNoDepositMonthlyFee > 0
  );
  
  const shouldShowMonthlyRow = showMonthly && (
    hasAnyRentalPlan || // 3가지 렌탈 플랜이 있으면 표시
    hasMonthlyPricing || // 기존 월렌탈료 로직
    (hasPriceInfo && hasMonthlyValue) // 가격 기반 월렌탈료
  );
  const showPricingSection = shouldShowPriceRow || shouldShowMonthlyRow;
  const shouldCompactSpacing =
    !hasDiscount && discountDisplay === 'price' && !shouldShowMonthlyRow;
  const buttonClassName = `${styles['promo-card-btn']} ${
    shouldCompactSpacing ? styles['promo-card-btn-compact'] : ''
  }`.trim();
  const cardClassName = [
    styles['promo-card'],
    ended ? styles['ended'] : ''
  ].filter(Boolean).join(' ');

  return (
    <article 
      className={cardClassName}
      onClick={() => onClick && onClick(id)}
    >
      {brand && (
        <div className={styles['brand-row']}>
          {brandLogo ? (
            <img src={brandLogo} alt={brand} className={styles['brand-logo']} />
          ) : (
            <span className={styles['brand-text']}>{brand}</span>
          )}
        </div>
      )}
      <div className={styles['hero-wrapper']}>
        {badgeText && (
          <div
            className={`${styles['badge']} ${
              badgeVariant === 'red' ? styles['badge-red'] : styles['badge-yellow']
            }`}
          >
            {badgeText}
          </div>
        )}
        {ribbonText && <div className={styles['ribbon']}>{ribbonText}</div>}
        <img src={img} alt={displayName} loading="lazy" />
      </div>

      <div className={styles['card-content']}>
        <div className={styles['title-block']}>
        <h3>{displayName}</h3>
        <p>{displayDesc}</p>
      </div>

        {showPricingSection && (
          <div className={styles['price-section']}>
            {shouldShowPriceRow && (
            <div className={styles['price-row']}>
              <span className={styles['label']}>차량가격</span>
              <div className={styles['price-values']}>
                  {/* 
                    - 할인 금액(정가 vs 프로모션가)을 노출하는 화면(홈 특가 등)은 discountDisplay='price'
                    - 차량 목록(국산차/수입차)처럼 월 렌탈료 중심 화면은 discountDisplay='monthly'
                      → 이 경우에는 항상 basePrice(정가)를 차량 가격으로 보여준다.
                  */}
                {showPriceDiscount && effectiveBasePrice > 0 && (
                  <span className={styles['price-prev-inline']}>
                    {effectiveBasePrice.toLocaleString()}원
                  </span>
                )}
              <span className={styles['price-current']}>
                    {(discountDisplay === 'price'
                      ? effectiveFinalPrice
                      : effectiveBasePrice
                    ).toLocaleString()}
                    원~
              </span>
                {showPriceDiscount && discountLabel && (
                  <span className={styles['discount-pill']}>
                    {discountLabel}
                  </span>
                )}
              </div>
            </div>
            )}

            {shouldShowMonthlyRow && (
              <div className={styles['monthly-wrapper']}>
                {/* 월 렌탈료 행 */}
                <div className={styles['monthly-row']}>
                  <span className={styles['label']}>월 렌탈료</span>
                </div>

                {/* 월 렌탈료 - 3가지 결제 타입 */}
                <div className={styles['monthly-section']}>
                  <div className={styles['monthly-row']}>
                    <span className={styles['label-highlighted']}>선납금 30%</span>
                    <div className={styles['monthly-current']}>
                      {trim?.lowestPrepayment30MonthlyFee ? (
                        <>
                          <span className={styles['monthly-amount']}>{trim.lowestPrepayment30MonthlyFee.toLocaleString()}</span>
                          <span className={styles['monthly-suffix']}>원</span>
                        </>
                      ) : (
                        '가격 문의'
                      )}
                    </div>
                  </div>
                  <div className={styles['monthly-row']}>
                    <span className={styles['label-highlighted']}>보증금 30%</span>
                    <div className={styles['monthly-current']}>
                      {trim?.lowestDeposit30MonthlyFee ? (
                        <>
                          <span className={styles['monthly-amount']}>{trim.lowestDeposit30MonthlyFee.toLocaleString()}</span>
                          <span className={styles['monthly-suffix']}>원</span>
                        </>
                      ) : (
                        '가격 문의'
                      )}
                    </div>
                  </div>
                  <div className={styles['monthly-row']}>
                    <span className={styles['label-highlighted']}>완전무보증</span>
                    <div className={styles['monthly-current']}>
                      {trim?.lowestNoDepositMonthlyFee ? (
                        <>
                          <span className={styles['monthly-amount']}>{trim.lowestNoDepositMonthlyFee.toLocaleString()}</span>
                          <span className={styles['monthly-suffix']}>원</span>
                        </>
                      ) : (
                        '가격 문의'
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        className={buttonClassName}
        onClick={(e) => {
          e.stopPropagation();
          if (onButtonClick) {
            onButtonClick(id);
            return;
          }
          onClick && onClick(id);
        }}
      >
        {buttonText}
      </button>
    </article>
  );
};

export default PromotionCard;
