import React from 'react';
import PropTypes from 'prop-types';
import PromotionCardMobile from './PromotionCardMobile';
import styles from './ExpressDealsSectionMobile.module.css';

const ExpressDealsSectionMobile = ({ deals, isLoading, onCardClick, icon }) => {
  const renderContent = () => {
    if (isLoading) {
      return <p className={styles.placeholder}>즉시 출고 차량을 불러오는 중입니다...</p>;
    }

    if (!deals?.length) {
      return <p className={styles.placeholder}>현재 즉시 출고 가능한 차량이 없습니다.</p>;
    }

    return (
      <div className={styles.grid}>
        {deals.map((car) => (
          <PromotionCardMobile
            key={car.id ?? car.trimId}
            id={car.id ?? car.trimId}
            name={car.title ?? car.name}
            desc={car.description ?? car.subtitle}
            img={car.imageUrl ?? car.image_url ?? car.image}
            brand={car.brand ?? car.extraInfo}
            badgeText={car.badgeText}
            badgeVariant={car.badgeVariant}
            ribbonText={car.ribbonText}
            basePrice={car.basePrice ?? car.price}
            finalPrice={car.finalPrice ?? car.salePrice}
            discountPercent={car.discountPercent}
            discountAmount={car.discountAmount}
            monthlyRentalFee={car.monthlyRentalFee}
            discountedMonthlyFee={car.discountedMonthlyFee}
            monthlyDiscountPercent={car.monthlyDiscountPercent}
            onClick={(id) => onCardClick?.(id, car)}
            buttonText="실시간 무료견적 받기"
          />
        ))}
      </div>
    );
  };

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <h2 className={styles.title}>즉시 출고, 지금 아니면 놓칩니다!</h2>
        </div>
        <a href="/express-deals" className={styles.link}>더 많은 차량 보기 →</a>
      </div>

      {renderContent()}

      <div className={styles.disclaimer}>* 계약 순서에 따라 혜택은 조기 종료될 수 있습니다.</div>
    </section>
  );
};

ExpressDealsSectionMobile.propTypes = {
  deals: PropTypes.arrayOf(PropTypes.object),
  isLoading: PropTypes.bool,
  onCardClick: PropTypes.func,
  icon: PropTypes.node,
};

ExpressDealsSectionMobile.defaultProps = {
  deals: [],
  isLoading: false,
  onCardClick: undefined,
  icon: null,
};

export default ExpressDealsSectionMobile;

