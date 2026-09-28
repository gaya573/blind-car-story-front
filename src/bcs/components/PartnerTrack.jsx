import React from 'react';
import { PARTNERS } from '../site';

/** 퍼블리싱 renderPartners: 흐르는 띠를 위해 목록을 두 번 이어 붙이고 두 번째 묶음은 스크린리더에서 숨긴다. */
export default function PartnerTrack() {
  const list = [...PARTNERS, ...PARTNERS];
  return (
    <div className="partner-track">
      {list.map((partner, index) => (
        <div className="partner-card" key={`${partner.name}-${index}`} aria-hidden={index >= PARTNERS.length ? 'true' : undefined}>
          <div className="partner-logo">
            <img src={partner.logoUrl} alt={`${partner.name} 로고`} loading="lazy" decoding="async" />
          </div>
          <p className="partner-name">{partner.name}</p>
        </div>
      ))}
    </div>
  );
}
