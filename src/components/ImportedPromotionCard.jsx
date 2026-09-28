import React, { useMemo } from 'react';
import styles from './ImportedPromotionCard.module.css';
import { getBrandLogo } from '../config/brandLogos';

const BRAND_LOGO_MAP = {
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

  '링컨': '/importbrands/lincoln-black.svg',
  'Lincoln': '/importbrands/lincoln-black.svg',
  'LINCOLN': '/importbrands/lincoln-black.svg',
  
  '폴스타': '/importbrands/폴스타.svg',
  'Polestar': '/importbrands/폴스타.svg',
  'POLESTAR': '/importbrands/폴스타.svg',
};

const formatPrice = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return value.toLocaleString();
};

const formatDiscountLabel = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) return null;
  if (value >= 10000) {
    const manWon = Math.floor(value / 10000);
    const remainder = value % 10000;
    // 만원 단위로 딱 떨어지면 '2,420만원' 형태로, 아니면 전체 표시 등 정책에 따라 조정
    // 시안에는 '2,420만원' 처럼 만원 단위로 표기되어 있음.
    // 정확한 포맷팅을 위해 toLocaleString 사용
    return `-${manWon.toLocaleString()}만원`;
  }
  return `-${value.toLocaleString()}원`;
};

const normalizeBrandKey = (value) => String(value || '').trim().replace(/\s+/g, '').toLowerCase();

const ImportedPromotionCard = ({
  id,
  name,
  desc,
  img,
  brandName,
  brandLogo: brandLogoProp,
  basePrice,
  finalPrice,
  discountAmount,
  onClick,
  onButtonClick,
  buttonText = '실시간 무료견적 받기',
  // 트림 데이터 (3가지 렌탈 플랜) - 향후 수입차에도 적용 가능
  trim,
}) => {
  // 브랜드 로고 결정: API에서 받은 로고 우선, 없으면 로컬 맵에서 찾기
  const brandLogo = useMemo(() => {
    // API에서 받은 brandLogo URL이 있으면 우선 사용
    if (brandLogoProp) return brandLogoProp;
    // 없으면 기존 로컬 맵에서 찾기
    if (!brandName) return null;
    
    // 다양한 케이스로 매칭 시도
    const trimmedBrand = brandName.trim();
    return (
      BRAND_LOGO_MAP[trimmedBrand] ||
      BRAND_LOGO_MAP[trimmedBrand.toUpperCase()] ||
      BRAND_LOGO_MAP[trimmedBrand.toLowerCase()] ||
      getBrandLogo(trimmedBrand) ||
      null
    );
  }, [brandName, brandLogoProp]);

  const brandKey = normalizeBrandKey(brandName);
  const logoClassName = [
    styles.brandLogo,
    brandKey === '링컨' || brandKey === 'lincoln' ? styles.brandLogoLincoln : '',
  ].filter(Boolean).join(' ');

  // basePrice: 차량 원가격, finalPrice: 프로모션(할인 후) 가격
  const formattedBase = formatPrice(basePrice);
  const formattedFinal = formatPrice(finalPrice);
  
  // 시안의 "2,420만원" 형식에 맞추기 위해 formatDiscountLabel 로직 약간 수정 필요할 수 있음
  // 현재 로직: 10000 이상이면 만원 단위 표기
  const formattedDiscount = formatDiscountLabel(discountAmount);
  const hasDiscount = typeof discountAmount === 'number' && discountAmount > 0;

  const handleCardClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  const handleButtonClick = (event) => {
    event.stopPropagation();
    if (onButtonClick) {
      onButtonClick(id);
      return;
    }
    handleCardClick();
  };

  return (
    <article className={styles.card} onClick={handleCardClick}>
      <div className={styles.brandRow}>
        {brandLogo ? (
          <img src={brandLogo} alt={brandName || '브랜드'} className={logoClassName} loading="lazy" />
        ) : (
          <span className={styles.brandText}>{brandName}</span>
        )}
      </div>

      <div className={styles.imageWrapper}>
        <img src={img} alt={name} loading="lazy" />
      </div>

      <div className={styles.content}>
        <div className={styles.titleBlock}>
          <h3>{name}</h3>
          {desc && <p>{desc}</p>}
        </div>

        <div className={styles.priceContainer}>
          {/* 차량 원가격 행 */}
          {formattedBase && (
            <div className={styles.priceRow}>
              <span className={styles.label}>차량 가격</span>
              <span className={styles.basePriceValue}>{formattedBase}원</span>
            </div>
          )}

          {/* 할인 뱃지 행 */}
          {hasDiscount && formattedDiscount ? (
            <div className={styles.discountRow}>
              <span className={styles.discountLabel}>최대할인가</span>
              <span className={styles.discountBadge}>
                {formattedDiscount} 할인
              </span>
            </div>
          ) : (
            <div className={styles.discountRow}>
            <span className={styles.discountLabel}>할인율변동 </span>
            <span className={styles.discountBadge}>
            상담후 최저가 안내
            </span>
            </div>
          )}

          {/* 최종 가격 행 */}
          <div className={styles.finalRow}>
            <span className={styles.label}>이달의 프로모션가</span>
            <span className={styles.finalPriceValue}>
              {formattedFinal
                ? `${formattedFinal}원`
                : formattedBase
                  ? `${formattedBase}원`
                  : '가격 문의'}
            </span>
          </div>
        </div>
      </div>

      <button type="button" className={styles.cta} onClick={handleButtonClick}>
        {buttonText}
      </button>
    </article>
  );
};

export default ImportedPromotionCard;
