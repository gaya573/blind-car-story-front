import React from 'react';
import { useCountdown } from '../../hooks/useCountdown';

const pad = (value) => String(value ?? 0).padStart(2, '0');

const isToday = (deadline) => {
  const date = deadline instanceof Date ? deadline : new Date(deadline);
  return !Number.isNaN(date.getTime()) && date.toDateString() === new Date().toDateString();
};

/**
 * 퍼블리싱 .ex-urgent__timer. 퍼블리싱은 자정까지(시·분·초)를 세지만,
 * 여기서는 실제 가장 빠른 마감일까지 센다. 하루 이상 남으면 "일" 칸을 더한다.
 */
export default function UrgentTimer({ deadline }) {
  const { days, hours, minutes, seconds } = useCountdown(deadline);
  const today = isToday(deadline);
  const items = [
    ...(days > 0 ? [[days, '일']] : []),
    [hours, '시'],
    [minutes, '분'],
    [seconds, '초'],
  ];
  const label = today ? '오늘 마감까지' : '특가 마감까지';

  return (
    <div className="ex-urgent__timer">
      <span className="ex-urgent__timer-label">{label}</span>
      <div className="countdown" aria-label={`${label} 남은 시간`}>
        {items.map(([value, unit]) => (
          <div className="countdown__item" key={unit}>
            <div className="countdown__value">{pad(value)}</div>
            <span className="countdown__unit">{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
