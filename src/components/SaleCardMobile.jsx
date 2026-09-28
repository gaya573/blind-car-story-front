import React from "react";
import { useNavigate } from 'react-router-dom';
import { navigateToDetail } from '../mobilePages/utils/navigateDetail.js';
import styles from "./SaleCardMobile.module.css";

// ✅ V1
export const SaleCardMobileV1 = ({
  badgeText = "20% 할인",
  badgeVariant = 'yellow', // 'yellow' | 'red'
  showBadge = true,
  logo,
  image,
  title,
  subtitle,
  price, // 하위 호환성을 위해 유지
  trim, // 3가지 렌탈플랜 모두 포함 (lowestNoDepositMonthlyFee, lowestDeposit30MonthlyFee, lowestPrepayment30MonthlyFee)
  vehiclePrice, // Added prop
  buttonText = "실시간 무료견적 받기",
  onClick,
  onConsult,
}) => {
  // Parsing price for cleaner display if it's a string
  const formatPrice = (p) => {
    if (!p) return '상담문의';
    const num = Number(p);
    if (!isNaN(num)) return num.toLocaleString();
    return p;
  };

  const displayVehiclePrice = vehiclePrice ? `${formatPrice(vehiclePrice)}원` : (subtitle || '문의');
  
  // 완전무보증 렌탈료만 표시 (나중에 다른 플랜으로 변경 가능)
  const noDepositFee = trim?.lowestNoDepositMonthlyFee || price;

  return (
    <div className={styles.cardV1} onClick={onClick} role="button" tabIndex={0}>
      <div className={styles.imageContainerV1}>
        {image && <img src={image} alt={title || "car"} className={styles.vehicleV1} />}
      </div>
      
      <div className={styles.contentV1}>
        <div className={styles.titleV1}>{title || '차량명 없음'}</div>
        
        <div className={styles.priceRowV1}>
          <span className={styles.priceLabelV1}>차량가격</span>
          <span className={styles.priceValueV1}>{displayVehiclePrice}</span>
        </div>

        <div className={styles.rentalSectionV1}>
          <div className={styles.discountRowV1}>
             {showBadge && (
               <div className={styles.discountBadgeV1}>{badgeText}</div>
             )}
          </div>
          
          <div className={styles.rentalRowV1}>
            <span className={styles.rentalLabelV1}>완전무보증</span>
            <div style={{display: 'flex', alignItems: 'center'}}>
               <span className={styles.rentalValueV1}>{formatPrice(noDepositFee)}</span>
               <span className={styles.rentalUnitV1}>원</span>
            </div>
          </div>
        </div>
        
        <div className={styles.conditionsV1}>
            48개월/선납 30%/2만km 기준
        </div>
      </div>

      <button
        className={styles.ctaV1}
        onClick={(e) => {
          e.stopPropagation();
          onConsult && onConsult();
        }}
      >
        {buttonText}
      </button>
    </div>
  );
};

// ✅ V2
export const SaleCardMobileV2 = ({
  rightLabel,
  logo,
  thumbnailImage,
  title,
  subtitle,
  buttonText = "실시간 무료견적 받기",
  onClick,
  onConsult,
  // 상세 이동을 위한 선택적 페이로드: { carId } 또는 { trimId, optionIds: [] }
  detailPayload,
}) => {
  const navigate = useNavigate();
  const fallbackThumbnail = "/placeholder/car.svg";
  const displayRightLabel = rightLabel ?? "즉시 출고";
  const displayTitle = title ?? "즉시 출고 차량";
  const displaySubtitle = subtitle ?? "빠르게 상담이 가능한 차량입니다.";
  const displayThumbnail = thumbnailImage ?? fallbackThumbnail;
  return (
    <div className={styles.containerV2}>
      <div
        className={styles.cardV2}
        onClick={() => {
          if (typeof onClick === 'function') return onClick();
          if (detailPayload && (
            detailPayload?.carId || detailPayload?.id || detailPayload?.vehicleId ||
            detailPayload?.trimId || detailPayload?.trim ||
            (Array.isArray(detailPayload?.optionIds) && detailPayload.optionIds.length) ||
            (Array.isArray(detailPayload?.options) && detailPayload.options.length)
          )) {
            navigateToDetail(navigate, detailPayload);
          }
        }}
        role="button"
        tabIndex={0}
      >
        {/* 브랜드 로고 */}
        {logo && (
          <div className={styles.headerV2}>
            <img src={logo} alt="brand" className={styles.logoV2} />
          </div>
        )}

        {/* 레이블 (장기렌트 등) */}
        {displayRightLabel && <div className={styles.labelV2}>{displayRightLabel}</div>}

        {/* 왼쪽 콘텐츠 (제목 + 부제목 + 버튼) */}
        <div className={styles.contentV2}>
          <div className={styles.leftSectionV2}>
            {displayTitle && <h1 className={styles.titleV2}>{displayTitle}</h1>}
            {displaySubtitle && <p className={styles.subtitleV2}>{displaySubtitle}</p>}
          </div>
          <button
            className={styles.consultButtonV2}
            onClick={(e) => {
              e.stopPropagation();
              if (typeof onConsult === 'function') {
                onConsult();
                return;
              }
              if (detailPayload && (
                detailPayload?.carId || detailPayload?.id || detailPayload?.vehicleId ||
                detailPayload?.trimId || detailPayload?.trim ||
                (Array.isArray(detailPayload?.optionIds) && detailPayload.optionIds.length) ||
                (Array.isArray(detailPayload?.options) && detailPayload.options.length)
              )) {
                navigateToDetail(navigate, detailPayload);
              } else {
                navigate('/m/search');
              }
            }}
          >
            {buttonText}
          </button>
        </div>

        {/* 차량 이미지 */}
        <div className={styles.rightSectionV2}>
          {displayThumbnail && (
            <img
              src={displayThumbnail}
              alt={displayTitle}
              className={styles.carImageV2}
            />
          )}
        </div>
      </div>
    </div>
  );
};






export const SaleCardMobileV3 = ({
    badge = "한정수량 특가",
    carImage = "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop",
    title = "더 뉴 스포티지 NQ5 하이브리드",
    subtitle = "2.5 터보 익스클루시브 9인승",
    buttonText = "실시간 무료견적 받기",
    onConsult = () => console.log("상담 신청"),
  }) => {
    return (
      <div className={styles.containerV3}>
        <div className={styles.cardV3}>
          {/* 상단 노란 배지 */}
          <div className={styles.badgeV3}>
            <span className={styles.badgeTextV3}>{badge}</span>
          </div>
  
          {/* 차량 이미지 */}
          <div className={styles.imageSectionV3}>
            <img src={carImage} alt={title} className={styles.carImageV3} />
          </div>
  
          {/* 텍스트 영역 */}
          <div className={styles.textSectionV3}>
            <h2 className={styles.titleV3}>{title}</h2>
            <p className={styles.subtitleV3}>{subtitle}</p>
          </div>
  
          {/* 상담 버튼 */}
          <button
            className={styles.buttonV3}
            onClick={onConsult}
            onMouseEnter={(e) => {
              e.target.style.background = "#000000";
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#111111";
              e.target.style.transform = "translateY(0)";
            }}
          >
            {buttonText}
          </button>
        </div>
      </div>
    );
  };