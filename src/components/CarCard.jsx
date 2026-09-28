import React from "react";
import styles from "./CarCard.module.css";
import stylesMobile from "./CarCardMobile.module.css";
const CarCard = ({ rank, name, brand, year, mileage, description, image }) => {
    return (
      <div className={styles['car-card-wrapper']}>
        {/* 차량 이미지 */}
        <div className={styles['car-card-image']}>
          <img src={image} alt={name} />
        </div>
        
        {/* 정보 영역 */}
        <div className={styles['car-card-content']}>
          {/* 순위 */}
          <div className={`${styles['car-card-rank']} ${rank <= 3 ? styles['top-three'] : styles['normal-rank']}`}>{rank}</div>
          
          {/* 차량 정보 */}
          <div className={styles['car-card-info']}>
          <div className={styles['car-card-name']}>{name}</div>
            <div className={styles['car-card-meta']}>
              {year} | {mileage}
            </div>
          </div>
          
          {/* 설명 */}
          <div className={styles['car-card-description']}>
            {description}
          </div>
        </div>
      </div>
  );
};


const CarCardMobile = ({ logo, name, price }) => {
  const numericPrice =
    typeof price === 'number'
      ? price
      : typeof price === 'string'
        ? Number(price.replace(/[^\d.-]/g, ''))
        : null;
  const priceText =
    typeof price === 'string' && Number.isNaN(numericPrice)
      ? price
      : numericPrice != null && !Number.isNaN(numericPrice)
        ? numericPrice.toLocaleString()
        : '';
  const showUnit = Boolean(priceText);

  return (
    <div className={stylesMobile.textCard}>
      <div className={stylesMobile.left}>
        {logo && <img src={logo} alt={`${name} logo`} className={stylesMobile.logo} />}
        <span className={stylesMobile.name}>{name}</span>
      </div>
      <div className={stylesMobile.right}>
        <span className={stylesMobile.price}>{priceText}</span>
        {showUnit && <span className={stylesMobile.unit}>원~</span>}
      </div>
    </div>
  );
};

const CarCardImageMobile = ({ image, name, price }) => {
  return (
    <div className={stylesMobile.imageCard}>
      <div className={stylesMobile.leftGroup}>
        <img src={image} alt={name} className={stylesMobile.thumbnail} />
        <span className={stylesMobile.carName}>{name}</span>
      </div>
      <div className={stylesMobile.rightGroup}>
        <span className={stylesMobile.arrow}>›</span>
      </div>
    </div>
  );
};

export { CarCard, CarCardMobile, CarCardImageMobile };