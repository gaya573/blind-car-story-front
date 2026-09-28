import React, { useMemo, useState, useCallback } from 'react';
import styles from './MobileHeroBanner.module.css';

const MobileHeroBanner = ({ slides = [], showPager = true }) => {
  const validSlides = useMemo(() => (Array.isArray(slides) ? slides.filter(Boolean) : []), [slides]);
  const [index, setIndex] = useState(0);

  const goPrev = useCallback(() => {
    if (validSlides.length === 0) return;
    setIndex((prev) => (prev - 1 + validSlides.length) % validSlides.length);
  }, [validSlides.length]);

  const goNext = useCallback(() => {
    if (validSlides.length === 0) return;
    setIndex((prev) => (prev + 1) % validSlides.length);
  }, [validSlides.length]);

  // 슬라이드 한 장을 100% 폭으로 사용하는 가로 슬라이더
  // 기기 폭(375, 390 등)에 관계없이 꽉 차게 보이도록 % 단위 사용
  const translateX = -(index * 100);

  return (
    <div className={styles.banner}>
      <div className={styles.track} style={{ transform: `translateX(${translateX}%)` }}>
        {validSlides.length === 0 ? (
          <div className={styles.slide} style={{ background: 'linear-gradient(180deg,#000000,#111111)' }}>배너가 없습니다</div>
        ) : (
          validSlides.map((s, i) => (
            <div key={i} className={styles.slide} style={{ background: s.background || 'linear-gradient(180deg,#000000,#111111)' }}>
              {s.image && <img src={s.image} alt={s.title || `slide-${i + 1}`} className={styles.imageCover} />}
              {s.children}
            </div>
          ))
        )}
      </div>
      <div className={styles.overlay} />
      {/*
        우측 하단 슬라이드 내비게이션(1/1 표시, 좌우 화살표)을 잠시 숨긴다.
        필요 시 아래 블록을 복원하면 기존 UI로 다시 노출된다.
      */}
      {showPager && (
        <div className={styles.pager}>
          <button className={styles.arrow} aria-label="이전" onClick={goPrev}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className={styles.pagerText}>{validSlides.length ? `${index + 1}/${validSlides.length}` : '0/0'}</span>
          <button className={styles.arrow} aria-label="다음" onClick={goNext}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default MobileHeroBanner;


