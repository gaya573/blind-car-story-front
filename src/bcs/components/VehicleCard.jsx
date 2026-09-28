import React from 'react';
import { deadlineBadgeText, formatMonthly, formatWonTilde } from '../format';
import { RENTAL_CONDITION_LABEL } from '../site';
import { useBcsUi } from '../BcsUiContext';
import { useVehicleNavigation } from '../useVehicleNavigation';

function MonthlyRow({ label, value, amountClass }) {
  return (
    <div className="vehicle-monthly-row">
      <span className="vehicle-chip">{label}</span>
      <strong className={`vehicle-amount ${amountClass}`}>
        {formatMonthly(value)}
        <span className="price-suffix">원</span>
      </strong>
    </div>
  );
}

/**
 * 퍼블리싱 common.js renderVehicleCard 의 React 판.
 * vehicle 은 toVehicleCardModel(item) 결과. 카드를 누르면 상세로, CTA 를 누르면 견적 모달을 연다.
 */
export default function VehicleCard({ vehicle, showBadge = true, source = 'vehicle-card', onSelect }) {
  const { openQuote } = useBcsUi();
  const goToDetail = useVehicleNavigation();
  if (!vehicle) return null;

  const badge = showBadge ? deadlineBadgeText(vehicle.remainingDays) : '';
  const select = () => (onSelect ? onSelect(vehicle) : goToDetail(vehicle));

  return (
    <article
      className="vehicle-card"
      data-trim-id={vehicle.trimId ?? ''}
      data-vehicle-line-id={vehicle.vehicleLineId ?? ''}
      data-card-type={vehicle.cardType}
      role="link"
      tabIndex={0}
      onClick={select}
      onKeyDown={(event) => {
        if (event.key === 'Enter') select();
      }}
    >
      <div className="vehicle-card__media">
        {vehicle.brandName ? <span className="vehicle-card__brand">{vehicle.brandName}</span> : null}
        {badge ? <span className="vehicle-card__badge">{badge}</span> : null}
        <img className="vehicle-image" src={vehicle.imageUrl || '/bcs/images/cars/car-sedan.svg'} alt={vehicle.vehicleName || '차량 이미지'} loading="lazy" />
      </div>
      <div className="vehicle-card__body">
        <div>
          <h3 className="vehicle-name">{vehicle.vehicleName}</h3>
          <p className="vehicle-trim">{vehicle.trimName}</p>
        </div>
        <div className="vehicle-price-block">
          <div className="vehicle-price-row">
            <span className="vehicle-price-label">차량가격</span>
            <span className="vehicle-base-price">{formatWonTilde(vehicle.basePrice)}</span>
          </div>
          <p className="vehicle-monthly-label">월 렌탈료</p>
          <MonthlyRow label="선납금 30%" value={vehicle.prepayment30} amountClass="vehicle-prepayment-price" />
          <MonthlyRow label="보증금 30%" value={vehicle.deposit30} amountClass="vehicle-deposit-price" />
          <MonthlyRow label="완전무보증" value={vehicle.noDeposit} amountClass="vehicle-no-deposit-price" />
        </div>
        <p className="vehicle-card__note">{RENTAL_CONDITION_LABEL}</p>
        <button
          className="vehicle-cta"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            openQuote([vehicle.vehicleName, vehicle.trimName].filter(Boolean).join(' '), source);
          }}
        >
          실시간 무료견적 받기
        </button>
      </div>
    </article>
  );
}
