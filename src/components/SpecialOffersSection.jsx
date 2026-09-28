import React from 'react';
import PropTypes from 'prop-types';
import PromotionCard from './PromotionCard';
import styles from './SpecialOffersSection.module.css';

if (import.meta.env?.MODE !== 'production') {
  // eslint-disable-next-line no-console
  console.debug('[SpecialOffersSection] 컴포넌트가 로드되었습니다.');
}

const SpecialOffersSection = ({
  offers,
  isLoading,
  onCardClick,
  onButtonClick,
  icon,
  pricingMap,
}) => {
  const renderContent = () => {
    if (isLoading) {
      return <p className={styles['special-offers-placeholder']}>특가 차량을 불러오는 중입니다...</p>;
    }

    if (!offers?.length) {
      return <p className={styles['special-offers-placeholder']}>현재 노출 가능한 특가 차량이 없습니다.</p>;
    }

    return (
      <div className={styles['special-offers-grid']}>
        {offers.map((car) => {
          const remainingDays = car.remainingDays;
          let badgeText;
          let badgeVariant = 'yellow';

          if (typeof remainingDays === 'number') {
            if (remainingDays <= 0) {
              badgeText = '오늘 마감';
              badgeVariant = 'red';
            } else if (remainingDays === 1) {
              badgeText = 'D-1';
              badgeVariant = 'red';
            } else {
              badgeText = `D-${remainingDays}`;
            }
          }

          const trimId = car.trimId ?? car.trim_id ?? car.id;
          const pricing = pricingMap?.[String(trimId)];

          return (
            <PromotionCard
              key={car.id ?? car.trimId}
              id={car.id ?? car.trimId}
              name={car.title ?? car.name}
              desc={car.description ?? car.subtitle}
              img={car.imageUrl ?? car.image_url ?? car.image}
              brand={car.brand ?? car.extraInfo}
              onClick={(id) => onCardClick?.(id, car)}
              onButtonClick={() => onButtonClick?.(car)}
              buttonText="실시간 무료견적 받기"
              badgeText={badgeText}
              badgeVariant={badgeVariant}
              basePrice={pricing?.basePrice}
              finalPrice={pricing?.finalPrice}
              discountPercent={pricing?.discountPercent}
              // 특가 섹션은 PRE_PURCHASE 월 렌탈 기준 할인 정보를 강조
              discountDisplay="monthly"
              monthlyRentalFee={pricing?.monthlyRentalFee}
              discountedMonthlyFee={pricing?.discountedMonthlyFee}
              monthlyDiscountPercent={pricing?.monthlyDiscountPercent}
              trim={car.trim}
            />
          );
        })}
      </div>
    );
  };

  return (
    <section className={styles['special-offers-section']}>
      <div className={styles['special-offers-header']}>
        <div className={styles['special-offers-title-wrapper']}>
          {icon && <span className={styles['special-offers-icon']}>{icon}</span>}
          <h2 className={styles['special-offers-title']}>특가 차량, 지금 아니면 놓칩니다!</h2>
        </div>
        <a href="/express-deals" className={styles['special-offers-link']}>더 많은 차량 보기 →</a>
      </div>

      {renderContent()}

      <div className={styles['special-offers-disclaimer']}>
        * 계약 순서에 따라 혜택은 조기 종료될 수 있습니다.
      </div>
    </section>
  );
};

SpecialOffersSection.propTypes = {
  offers: PropTypes.arrayOf(PropTypes.object),
  isLoading: PropTypes.bool,
  onCardClick: PropTypes.func,
  onButtonClick: PropTypes.func,
  icon: PropTypes.node,
  pricingMap: PropTypes.object,
};

SpecialOffersSection.defaultProps = {
  offers: [],
  isLoading: false,
  onCardClick: undefined,
  onButtonClick: undefined,
  icon: null,
  pricingMap: {},
};

export default SpecialOffersSection;
