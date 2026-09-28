import React from 'react';
import PropTypes from 'prop-types';
import PromotionCard from './PromotionCard';
import styles from './ExpressDealsSection.module.css';

const ExpressDealsSection = ({ deals, isLoading, onCardClick, icon }) => {
  const renderContent = () => {
    if (isLoading) {
      return <p className={styles['express-deals-placeholder']}>즉시 출고 차량을 불러오는 중입니다...</p>;
    }

    if (!deals?.length) {
      return <p className={styles['express-deals-placeholder']}>현재 즉시 출고 가능한 차량이 없습니다.</p>;
    }

    return (
      <div className={styles['express-deals-grid']}>
        {deals.map((car) => (
          <PromotionCard
            key={car.id ?? car.trimId}
            id={car.id ?? car.trimId}
            name={car.title ?? car.name}
            desc={car.description ?? car.subtitle}
            img={car.imageUrl ?? car.image_url ?? car.image}
            brand={car.brand ?? car.extraInfo}
            onClick={(id) => onCardClick?.(id, car)}
            buttonText="실시간 무료견적 받기"
          />
        ))}
      </div>
    );
  };

  return (
    <section className={styles['express-deals-section']}>
      <div className={styles['express-deals-header']}>
        <div className={styles['express-deals-title-wrapper']}>
          {icon && <span className={styles['express-deals-icon']}>{icon}</span>}
          <h2 className={styles['express-deals-title']}>즉시 출고, 지금 아니면 놓칩니다!</h2>
        </div>
        <a href="/express-deals" className={styles['express-deals-link']}>더 많은 차량 보기 →</a>
      </div>

      {renderContent()}

      <div className={styles['express-deals-disclaimer']}>
        * 계약 순서에 따라 혜택은 조기 종료될 수 있습니다.
      </div>
    </section>
  );
};

ExpressDealsSection.propTypes = {
  deals: PropTypes.arrayOf(PropTypes.object),
  isLoading: PropTypes.bool,
  onCardClick: PropTypes.func,
  icon: PropTypes.node,
};

ExpressDealsSection.defaultProps = {
  deals: [],
  isLoading: false,
  onCardClick: undefined,
  icon: null,
};

export default ExpressDealsSection;
