import React from 'react';
import '../../pages/Car/CarList.css';

const CarFilterPanel = ({
  manufacturers = [],
  carTypes = [],
  fuelTypes = [],
  minPrice = 0,
  maxPrice = 0,
  priceRanges = [],
  onMinPriceChange = () => {},
  onMaxPriceChange = () => {},
  selectedManufacturer = '전체',
  onSelectManufacturer,
  selectedCarType = '전체',
  onSelectCarType,
  selectedFuel = '전체',
  onSelectFuel,
  priceMinLimit = 0,
  priceMaxLimit = 100000000,
  priceStep = 1000000,
  formatPrice = (value) => `${(value / 10000).toFixed(0)}만원`,
  showManufacturerSection = true,
  showPriceSection = true,
  showCarTypeSection = true,
  showFuelSection = true,
  carType,
}) => {
  return (
    <aside className={`carlist-filter-panel ${carType === 'imported' ? 'carlist-filter-panel--imported' : ''}`}>
      {showManufacturerSection && manufacturers.length > 0 && (
      <div className="carlist-filter-section">
        <h3 className="carlist-filter-title">제조사</h3>
        <div className="carlist-manufacturer-grid">
          {manufacturers.map((manufacturer) => (
            <button
              key={manufacturer.name}
              className={`carlist-manufacturer-btn ${manufacturer.name === selectedManufacturer ? 'active' : ''}`}
              onClick={() => onSelectManufacturer && onSelectManufacturer(manufacturer)}
              type="button"
              aria-label={manufacturer.name}
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
          ))}
        </div>
      </div>
      )}

    

      {showFuelSection && fuelTypes.length > 0 && (
      <div className="carlist-filter-section">
        <h3 className="carlist-filter-title">연료</h3>
        <div className="carlist-filter-grid-2">
          {fuelTypes.map((item, i) => (
            <button
              key={i}
              className={`carlist-filter-btn ${item === selectedFuel ? 'active' : ''}`}
              onClick={() => onSelectFuel && onSelectFuel(item)}
                type="button"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      )}
    </aside>
  );
};

export default CarFilterPanel;


