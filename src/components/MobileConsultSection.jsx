import React from 'react';
import styles from './MobileConsultSection.module.css';

const MobileConsultSection = ({
  hero = { title: '신차 장기렌트 상담', subtitle: '국내 최저가로 견적받고 빠르게 출고하기', image: '' },
  left = { title: '즉시출고 차량', desc: '재고보유 차량만 모아보기', image: '' },
  right = { title: '선구매 핫딜', desc: '선계약 고객 한정 할인', image: '' },
  special = { title: '한정수량 특가 차량', desc: '출고임박 단기계약 혜택 확인', icon: '', cta: '견적받기' },
  onSpecialClick,
}) => {
  return (
    <div className={styles.section}>
      <div className={styles.heroCard}>
        {hero.image ? (
          <img src={hero.image} alt={hero.title} className={styles.heroImage} />
        ) : (
          <div className={styles.heroImage} style={{ background: '#f6efd8' }} />
        )}
        <div className={styles.heroTexts}>
          <div className={styles.title}>{hero.title}</div>
          <div className={styles.subtitle}>{hero.subtitle}</div>
        </div>
      </div>

      <div className={styles.gridRow}>
        <div className={styles.miniCard}>
          <div className={styles.miniTexts}>
            <div className={styles.miniTitle}>{left.title}</div>
            <div className={styles.miniDesc}>{left.desc}</div>
          </div>
          {left.image ? (
            <img src={left.image} alt={left.title} className={styles.miniImage} />
          ) : (
            <div className={styles.miniImage} style={{ background: '#f6efd8' }} />
          )}
        </div>
        <div className={styles.miniCard}>
          <div className={styles.miniTexts}>
            <div className={styles.miniTitle}>{right.title}</div>
            <div className={styles.miniDesc}>{right.desc}</div>
          </div>
          {right.image ? (
            <img src={right.image} alt={right.title} className={styles.miniImage} />
          ) : (
            <div className={styles.miniImage} style={{ background: '#f6efd8' }} />
          )}
        </div>
      </div>

      <div className={styles.specialCard}>
        {special.icon ? (
          <img src={special.icon} alt="icon" className={styles.icon} />
        ) : (
          <div className={styles.icon} style={{ background: '#fde68a' }} />
        )}
        <div className={styles.specialTexts}>
          <div className={styles.specialTitle}>{special.title}</div>
          <div className={styles.specialDesc}>{special.desc}</div>
        </div>
        <button className={styles.cta} onClick={onSpecialClick}>{special.cta}</button>
      </div>
    </div>
  );
};

export default MobileConsultSection;


