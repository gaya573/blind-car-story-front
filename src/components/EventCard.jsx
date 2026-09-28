import React from 'react';
import styles from './EventCard.module.css';

const EventCard = ({
  title,
  image,
  theme = "default",
  ended = false,
  onClick
}) => {
  return (
    <div className={styles['event-card-wrapper']}>
      <div 
        className={`${styles['event-card']} ${styles[`theme-${theme}`]} ${ended ? styles['ended'] : ''}`}
        onClick={onClick}
      >
     
        {/* 중앙 이미지 영역 */}
        <div className={styles['event-image-area']}>
          <img
            src={image}
            alt={title}
            width={416}
            height={270}
            className={styles['event-car-image']}
          />
        </div>
      </div>
      
      {/* 카드 외부 설명 텍스트 */}
      {title && (
        <p className={styles['event-description']}>{title}</p>
      )}
    </div>
  );
};

export default EventCard;
