import React from 'react';
import { useCountdown } from '../../hooks/useCountdown';

const pad = (value) => String(value ?? 0).padStart(2, '0');

/** 퍼블리싱 .countdown (일/시/분/초). deadline 이 없으면 00으로 멈춰 있다. */
export default function Countdown({ deadline, style }) {
  const { days, hours, minutes, seconds } = useCountdown(deadline);
  const items = [
    [days, '일'],
    [hours, '시'],
    [minutes, '분'],
    [seconds, '초'],
  ];
  return (
    <div className="countdown" aria-label="마감까지 남은 시간" style={style}>
      {items.map(([value, unit]) => (
        <div className="countdown__item" key={unit}>
          <div className="countdown__value">{pad(value)}</div>
          <span className="countdown__unit">{unit}</span>
        </div>
      ))}
    </div>
  );
}
