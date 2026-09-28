import React, { useMemo } from 'react';
import styles from './PromotionCardMobile.module.css';
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

const PromotionCardMobile = ({ 
  id, 
  name, 
  desc, 
  img, 
  brand,
  brandLogo: brandLogoProp,
  onClick,
  onButtonClick,
  buttonText = "실시간 무료견적 받기",
  ended = false,
  badgeText,
  badgeVariant = "red",
  remainingQuantity, // 남은 대수
  // 가격 정보
  basePrice,
  // 트림 데이터 (3가지 렌탈 플랜)
  trim,
}) => {
  const displayName = useMemo(() => normalizeDoubleAmpersand(name), [name]);

  const brandLogo = useMemo(() => {
    if (brandLogoProp) return brandLogoProp;
    if (!brand) return null;
    
    const trimmedBrand = brand.trim();
    return (
      BRAND_LOGO_MAP[trimmedBrand] ||
      BRAND_LOGO_MAP[trimmedBrand.toUpperCase()] ||
      BRAND_LOGO_MAP[trimmedBrand.toLowerCase()] ||
      null
    );
  }, [brand, brandLogoProp]);

  const hasPriceInfo = typeof basePrice === 'number' && basePrice > 0;
  
  const hasAnyRentalPlan = trim && (
    trim.lowestPrepayment30MonthlyFee > 0 ||
    trim.lowestDeposit30MonthlyFee > 0 ||
    trim.lowestNoDepositMonthlyFee > 0
  );

  const cardClassName = [
    styles['promo-card-mobile'],
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

      {(remainingQuantity || badgeText) && (
        <div
          className={`${styles['badge']} ${
            badgeVariant === 'red' ? styles['badge-red'] : styles['badge-yellow']
          }`}
        >
          {remainingQuantity ? `${remainingQuantity}대 남았습니다` : badgeText}
        </div>
      )}

      <div className={styles['hero-wrapper']}>
        <img src={img} alt={displayName} loading="lazy" />
      </div>

      <div className={styles['card-content']}>
        <div className={styles['title-block']}>
          <h3>{displayName}</h3>
        </div>

        {hasPriceInfo && (
          <div className={styles['price-row']}>
            <span className={styles['label']}>차량가격</span>
            <span className={styles['price-current']}>
              {basePrice.toLocaleString()}원~
            </span>
          </div>
        )}

        {hasAnyRentalPlan && (
          <div className={styles['monthly-section']}>
            {/* 선납금 30% */}
            <div className={styles['monthly-row']}>
              <span className={styles['label-highlighted']}>선납금 30%</span>
              <div className={styles['monthly-current']}>
                <span className={styles['monthly-prefix']}>월 </span>
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

            {/* 보증금 30% */}
            <div className={styles['monthly-row']}>
              <span className={styles['label-highlighted']}>보증금 30%</span>
              <div className={styles['monthly-current']}>
                <span className={styles['monthly-prefix']}>월 </span>
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

            {/* 완전무보증 */}
            <div className={styles['monthly-row']}>
              <span className={styles['label-highlighted']}>완전무보증</span>
              <div className={styles['monthly-current']}>
                <span className={styles['monthly-prefix']}>월 </span>
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
        )}
      </div>

      <div className={styles['button-wrapper']}>
        <p className={styles['monthly-note']}>48개월/선납 30%/2만km 기준</p>
        <button
          className={styles['promo-card-btn']}
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
      </div>
    </article>
  );
};

export default PromotionCardMobile;
