import React from 'react';
import { useBcsUi } from '../../bcs/BcsUiContext';
import { deadlineBadgeText, formatMonthly, formatWonTilde } from '../../bcs/format';
import { RENTAL_CONDITION_LABEL } from '../../bcs/site';
import { EXPRESS_FALLBACK_IMAGE } from './expressModel';

function MonthlyRow({ label, value }) {
  return (
    <div className="ex-monthly-row">
      <span className="ex-chip">{label}</span>
      <span className="ex-amount">
        {formatMonthly(value)}
        <em>원</em>
      </span>
    </div>
  );
}

/**
 * 퍼블리싱 express.js renderCard 의 React 판(.ex-card).
 * car 는 toExpressCard(item) 결과. 퍼블리싱처럼 카드와 CTA 모두 실시간 견적 모달을 연다.
 * 목록 카드 배지는 재고 수량이 오면 "재고 N대", 없으면 마감 D-day 를 보여준다.
 */
export default function ExpressCard({ car, urgent = false, source = 'express-deals' }) {
  const { openQuote } = useBcsUi();
  if (!car) return null;

  const quoteName = [car.vehicleName, car.trimName].filter(Boolean).join(' ');
  const openQuoteModal = () => openQuote(quoteName, source);
  const deadlineText = deadlineBadgeText(car.remainingDays);
  const badge = urgent || car.stock === null ? deadlineText : `재고 ${car.stock}대`;

  return (
    <article
      className={`ex-card${urgent ? ' ex-card--urgent' : ''}`}
      data-car-id={car.id ?? ''}
      data-brand-id={car.brandName}
      onClick={openQuoteModal}
    >
      <div className="ex-card__media">
        {car.brandName ? <span className="ex-card__brand">{car.brandName}</span> : null}
        {badge ? <span className={`ex-card__badge${urgent ? ' ex-card__badge--urgent' : ''}`}>{badge}</span> : null}
        <img src={car.imageUrl || EXPRESS_FALLBACK_IMAGE} alt={car.vehicleName || '차량 이미지'} loading="lazy" />
      </div>
      <div className="ex-card__body">
        <h3 className="ex-card__name">{car.vehicleName}</h3>
        <p className="ex-card__trim">{car.trimName}</p>
        <div className="ex-card__prices">
          <div className="ex-price-row">
            <span className="ex-price-label">차량가격</span>
            <span className="ex-price-base">{formatWonTilde(car.basePrice)}</span>
          </div>
          <p className="ex-monthly-label">월 렌탈료</p>
          <MonthlyRow label="선납금 30%" value={car.prepayment30} />
          <MonthlyRow label="보증금 30%" value={car.deposit30} />
          <MonthlyRow label="완전무보증" value={car.noDeposit} />
        </div>
        <p className="ex-card__note">{RENTAL_CONDITION_LABEL}</p>
        <button
          className="ex-card__cta"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            openQuoteModal();
          }}
        >
          실시간 무료견적 받기
        </button>
      </div>
    </article>
  );
}
