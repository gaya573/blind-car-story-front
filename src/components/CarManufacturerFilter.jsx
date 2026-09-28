import React, { useRef, useState, useEffect } from 'react';
import './CarManufacturerFilter.css';

const isAllManufacturer = (manufacturer) => manufacturer?.name === '전체';

const normalizeManufacturerKey = (value = '') => {
  const key = String(value).replace(/\s+/g, '').toLowerCase();
  if (['kgm', 'kg모빌리티', 'kgmobility', '쌍용', '쌍용자동차'].includes(key)) {
    return 'kgm';
  }
  if (['르노코리아', '르노삼성'].includes(key)) {
    return '르노코리아';
  }
  if (['쉐보레', '한국지엠', 'chevrolet'].includes(key)) {
    return '쉐보레';
  }
  if (['toyota', '도요타', '토요타'].includes(key)) {
    return '토요타';
  }
  if (['mercedesbenz', 'mercedes-benz', '메르세데스벤츠', '메르세데스-벤츠', '벤츠'].includes(key)) {
    return '벤츠';
  }
  if (['volkswagen', '폭스바겐'].includes(key)) {
    return '폭스바겐';
  }
  return key;
};

const isSelectedManufacturer = (selected, manufacturerName) =>
  normalizeManufacturerKey(selected) === normalizeManufacturerKey(manufacturerName);

const CarManufacturerFilter = ({ 
  manufacturers = [], 
  selectedManufacturer, 
  onSelectManufacturer,
  isImportCar = false 
}) => {
  const enableDrag = false; // 드래그 비활성화
  const containerRef = useRef(null);
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [failedImages, setFailedImages] = useState({});

  const startDragging = () => {
    dragStateRef.current.isDragging = true;
    setIsDragging(true);
  };

  const handleMouseDown = (e) => {
    if (!enableDrag || !isImportCar || !containerRef.current) return;
    const container = containerRef.current;
    dragStateRef.current.isDragging = false;
    dragStateRef.current.startX = e.pageX - container.offsetLeft;
    dragStateRef.current.scrollLeft = container.scrollLeft;
    dragStateRef.current.moved = false;
  };

  const handleMouseLeave = () => {
    if (!enableDrag || !isImportCar) return;
    dragStateRef.current.isDragging = false;
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    if (!enableDrag || !isImportCar) return;
    dragStateRef.current.isDragging = false;
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!enableDrag || !isImportCar || !containerRef.current) return;
    // 마우스 버튼이 올라간 상태면 드래그 종료
    if (e.buttons === 0) {
      dragStateRef.current.isDragging = false;
      dragStateRef.current.moved = false;
      setIsDragging(false);
      return;
    }
    const container = containerRef.current;
    const x = e.pageX - container.offsetLeft;
    const walk = x - dragStateRef.current.startX;

    // 이동 감지 시 드래그 모드 전환
    if (!dragStateRef.current.isDragging && Math.abs(walk) > 5) {
      dragStateRef.current.moved = true;
      startDragging();
    }

    if (!dragStateRef.current.isDragging) return;
    e.preventDefault();
    dragStateRef.current.moved = true;
    container.scrollLeft = dragStateRef.current.scrollLeft - walk;
  };

  const handleClick = (manufacturer) => {
    // 드래그 중 발생한 클릭은 무시
    if (enableDrag && isImportCar && (dragStateRef.current.moved || dragStateRef.current.isDragging)) {
      dragStateRef.current.moved = false;
      dragStateRef.current.isDragging = false;
      return;
    }
    dragStateRef.current.moved = false;
    onSelectManufacturer(manufacturer);
  };

  // 스크롤 위치에 따라 화살표 표시 여부 결정
  const updateArrowVisibility = () => {
    if (!isImportCar || !containerRef.current) return;
    
    const container = containerRef.current;
    const scrollLeft = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;
    
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < maxScroll - 10);
  };

  // 화살표 버튼 클릭 핸들러
  const handleScrollLeft = () => {
    if (!containerRef.current) return;
    const scrollAmount = 400; // 한 번에 스크롤할 거리
    containerRef.current.scrollBy({
      left: -scrollAmount,
      behavior: 'smooth'
    });
  };

  const handleScrollRight = () => {
    if (!containerRef.current) return;
    const scrollAmount = 400;
    containerRef.current.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  };

  // 스크롤 이벤트 리스너 등록
  useEffect(() => {
    if (!isImportCar || !containerRef.current) return;
    
    const container = containerRef.current;
    updateArrowVisibility();

    container.addEventListener('scroll', updateArrowVisibility);
    window.addEventListener('resize', updateArrowVisibility);

    return () => {
      container.removeEventListener('scroll', updateArrowVisibility);
      window.removeEventListener('resize', updateArrowVisibility);
    };
  }, [isImportCar, manufacturers]);

  return (
    <div className="manufacturer-filter-wrapper">
      {isImportCar && showLeftArrow && (
        <button
          className="manufacturer-arrow-btn manufacturer-arrow-left"
          onClick={handleScrollLeft}
          type="button"
          aria-label="이전 브랜드"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
      
      <div
        ref={containerRef}
        className={`car-manufacturer-filter ${isImportCar ? (enableDrag ? 'import-cars' : 'import-cars no-drag') : ''} ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        {manufacturers.map((manufacturer, index) => {
          const key = manufacturer.id || manufacturer.name || index;
          const logoSrc = failedImages[key] ? null : manufacturer.image;
          const shouldShowTextLogo = !logoSrc || isAllManufacturer(manufacturer);

          return (
            <button
              key={key}
              className={`manufacturer-btn ${
                isSelectedManufacturer(selectedManufacturer, manufacturer.name) ? 'active' : ''
              }`}
              onClick={() => handleClick(manufacturer)}
            >
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt={manufacturer.name}
                  className="manufacturer-logo"
                  onError={() => {
                    setFailedImages((prev) => ({ ...prev, [key]: true }));
                  }}
                />
              ) : (
                <span className="manufacturer-text">{manufacturer.name}</span>
              )}
              {!shouldShowTextLogo && <span className="manufacturer-name">{manufacturer.name}</span>}
            </button>
          );
        })}
      </div>

      {isImportCar && showRightArrow && (
        <button
          className="manufacturer-arrow-btn manufacturer-arrow-right"
          onClick={handleScrollRight}
          type="button"
          aria-label="다음 브랜드"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  );
};

export default CarManufacturerFilter;

