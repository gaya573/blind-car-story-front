import React from 'react';
import { useNavigate } from 'react-router-dom';
import { promotionBadgeText, promotionDetailPath } from './promotionModel';

/**
 * 퍼블리싱 promotion.js 의 기획전 카드(.pm-card > .pm-tile).
 * 어드민에 등록한 기획전 썸네일이 있으면 타일에 그 이미지를 채우고,
 * 없을 때만 퍼블리싱처럼 글자 타일(제휴사·헤드라인·혜택·기간)로 그린다.
 */
export default function PromotionTileCard({ promo, raw }) {
  const navigate = useNavigate();
  const open = () => navigate(promotionDetailPath(promo.id), { state: { promotion: raw } });
  const hasImage = Boolean(promo.imageUrl);

  return (
    <article className={`pm-card${promo.ended ? ' pm-card--ended' : ''}`} data-promo-id={promo.id} onClick={open}>
      <div className={`pm-tile pm-tile--${promo.theme}${hasImage ? ' pm-tile--image' : ''}`}>
        {hasImage ? <img className="pm-tile__image" src={promo.imageUrl} alt={promo.title} loading="lazy" /> : null}
        <span className="pm-tile__badge">{promotionBadgeText(promo)}</span>
        {!hasImage && (
          <>
            {promo.brand ? <span className="pm-tile__brand">{promo.brand}</span> : null}
            <div className="pm-tile__text">
              {promo.partner ? <p className="pm-tile__partner">{promo.partner}</p> : null}
              <h3 className="pm-tile__headline">{promo.headline}</h3>
              {promo.benefit ? <p className="pm-tile__benefit">{promo.benefit}</p> : null}
            </div>
            {promo.period ? <p className="pm-tile__period">{promo.period}</p> : null}
          </>
        )}
      </div>
      <h4 className="pm-card__title">
        <a
          href={promotionDetailPath(promo.id)}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            open();
          }}
        >
          {promo.title}
        </a>
      </h4>
    </article>
  );
}
