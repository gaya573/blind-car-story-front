import React from 'react';
import '../../pages/Car/CarList.css';

/**
 * PC 전용 제조사 필터 컴포넌트
 * - 모바일과 완전히 분리된 데스크톱 전용 컴포넌트
 * - /carlist, 재고/선구매 페이지 등에서 재사용 가능
 */
const CarManufacturerFilterDesktop = ({
  manufacturers = [],
  selectedManufacturer = '전체',
  onSelectManufacturer,
}) => {
  if (!manufacturers.length) return null;

  return (
    <div className="carlist-filter-section">
      <h3 className="carlist-filter-title">제조사</h3>
      <div className="carlist-manufacturer-grid">
        {manufacturers.map((manufacturer) => {
          const isActive = manufacturer.name === selectedManufacturer;

          return (
            <button
              key={manufacturer.name}
              className={`carlist-manufacturer-btn ${isActive ? 'active' : ''}`}
              type="button"
              aria-label={manufacturer.name}
              onClick={() => onSelectManufacturer?.(manufacturer)}
            >
              {manufacturer.image ? (
                <img
                  src={manufacturer.image}
                  alt={manufacturer.name}
                  className="manufacturer-logo-image"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.visibility = 'hidden';
                  }}
                />
              ) : (
                <span
                  className={`manufacturer-logo-text ${
                    manufacturer.name.length > 3 ? 'manufacturer-logo-text__small' : ''
                  }`}
                >
                  {manufacturer.name === '전체' ? '전체보기' : manufacturer.name}
                </span>
              )}

              {manufacturer.name && (
                <span className="manufacturer-label">
                  {manufacturer.name === '전체'
                    ? '전체보기'
                    : manufacturer.name === 'KG모빌리티'
                      ? 'KGM'
                      : manufacturer.name}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CarManufacturerFilterDesktop;




