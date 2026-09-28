import React from 'react';
import PropTypes from 'prop-types';
import PromotionCard from './PromotionCard';
import styles from './InventoryHotDealSection.module.css';

const InventoryHotDealSection = ({ deals, isLoading, onCardClick, icon }) => {
  const renderContent = () => {
    if (isLoading) {
      return <p className={styles['inventory-hotdeal-placeholder']}>재고 특가 핫딜을 불러오는 중입니다...</p>;
    }

    if (!deals?.length) {
      return <p className={styles['inventory-hotdeal-placeholder']}>현재 재고 특가 핫딜 차량이 없습니다.</p>;
    }

    return (
      <div className={styles['inventory-hotdeal-grid']}>
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
    <section className={styles['inventory-hotdeal-section']}>
      <div className={styles['inventory-hotdeal-header']}>
        <div className={styles['inventory-hotdeal-title-wrapper']}>
          {icon && <span className={styles['inventory-hotdeal-icon']}>{icon}</span>}
          <h2 className={styles['inventory-hotdeal-title']}>재고 특가 핫딜 리스트</h2>
        </div>
        <a href="/express-deals" className={styles['inventory-hotdeal-link']}>더 많은 차량 보기 →</a>
      </div>

      {renderContent()}

      <div className={styles['inventory-hotdeal-disclaimer']}>
        * 계약 순서에 따라 혜택은 조기 종료될 수 있습니다.
      </div>
    </section>
  );
};

InventoryHotDealSection.propTypes = {
  deals: PropTypes.arrayOf(PropTypes.object),
  isLoading: PropTypes.bool,
  onCardClick: PropTypes.func,
  icon: PropTypes.node,
};

InventoryHotDealSection.defaultProps = {
  deals: [],
  isLoading: false,
  onCardClick: undefined,
  icon: null,
};

export default InventoryHotDealSection;

