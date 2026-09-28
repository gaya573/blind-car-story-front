import React from 'react';
import styles from './CarGrid.module.css';

const CarGrid = ({ cars = [], onClickCard, className = '', columns = 3 }) => {
  return (
    <div className={`${styles.grid} ${className}`.trim()} style={{ ['--cols']: columns }}>
      {cars.map((car, idx) => (
        <div 
          key={car.id ?? idx}
          className={styles.card}
          onClick={() => onClickCard && onClickCard(car.id ?? idx)}
          style={{ cursor: 'pointer' }}
        >
          <img src={car.img} alt={car.name} className={styles.img} />
          <div className={styles.content}>
            <h3 className={styles.name}>{car.name}</h3>
            <p className={styles.price}>{car.priceText}</p>
          </div>
          <button 
            className={styles.btn}
            onClick={(e) => {
              e.stopPropagation();
              onClickCard && onClickCard(car.id ?? idx);
            }}
          >
            내 견적 알아보기
          </button>
        </div>
      ))}
    </div>
  );
};

export default CarGrid;


