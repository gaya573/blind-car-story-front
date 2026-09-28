import React, { useRef } from 'react';
import styles from './BrandFilterChips.module.css';

const BrandFilterChips = ({
  items = [],
  activeKey,
  onChange
}) => {
  const containerRef = useRef(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const hasMoved = useRef(false);
  const startPageX = useRef(0);
  const isDragging = useRef(false);
  const DRAG_THRESHOLD = 5; // 드래그로 인식하는 최소 거리 (픽셀)

  const handleMouseDown = (e) => {
    if (!containerRef.current) return;

    isDown.current = true;
    hasMoved.current = false;
    isDragging.current = false;
    startPageX.current = e.pageX;
    startX.current = e.pageX - containerRef.current.offsetLeft;
    scrollLeft.current = containerRef.current.scrollLeft;
    containerRef.current.style.cursor = 'grabbing';
  };

  const handleMouseLeave = () => {
    isDown.current = false;
    isDragging.current = false;
    hasMoved.current = false;

    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseUp = () => {
    const wasDragging = isDragging.current;

    isDown.current = false;
    isDragging.current = false;

    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab';
    }

    hasMoved.current = false;

    if (!wasDragging) {
      setTimeout(() => {
        hasMoved.current = false;
      }, 10);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDown.current || !containerRef.current) return;

    const moveDistance = Math.abs(e.pageX - startPageX.current);

    if (moveDistance > DRAG_THRESHOLD && !isDragging.current) {
      isDragging.current = true;
      containerRef.current.style.cursor = 'grabbing';
    }

    if (isDragging.current) {
      e.preventDefault();
      const x = e.pageX - containerRef.current.offsetLeft;
      const walk = (x - startX.current) * 2;
      containerRef.current.scrollLeft = scrollLeft.current - walk;
      hasMoved.current = true;
    }
  };

  const handleTouchStart = (e) => {
    if (!containerRef.current) return;

    isDown.current = true;
    hasMoved.current = false;
    isDragging.current = false;
    startPageX.current = e.touches[0].pageX;
    startX.current = e.touches[0].pageX - containerRef.current.offsetLeft;
    scrollLeft.current = containerRef.current.scrollLeft;
    containerRef.current.style.cursor = 'grabbing';
  };

  const handleTouchMove = (e) => {
    if (!isDown.current || !containerRef.current) return;

    const moveDistance = Math.abs(e.touches[0].pageX - startPageX.current);

    if (moveDistance > DRAG_THRESHOLD && !isDragging.current) {
      isDragging.current = true;
    }

    if (isDragging.current) {
      const x = e.touches[0].pageX - containerRef.current.offsetLeft;
      const walk = (x - startX.current) * 2;
      containerRef.current.scrollLeft = scrollLeft.current - walk;
      hasMoved.current = true;
    }
  };

  const handleTouchEnd = () => {
    const wasDragging = isDragging.current;

    isDown.current = false;
    isDragging.current = false;

    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab';
    }

    hasMoved.current = false;

    if (!wasDragging) {
      setTimeout(() => {
        hasMoved.current = false;
      }, 10);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={styles.container}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {items.map(({ key, label }) => {
        const isActive = key === activeKey;
        return (
          <button
            key={key}
            type="button"
            className={`${styles.chip} ${isActive ? styles.active : ''}`}
            onClick={() => {
              if (!isDragging.current) {
                onChange?.(key);
              }
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default BrandFilterChips;
