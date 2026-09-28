import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { contentAPI } from '../../services/contentApi';
import { useCarDetailQuery } from '../../hooks/queries/carQueries';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import { useBcsUi } from '../../bcs/BcsUiContext';
import Countdown from '../../bcs/components/Countdown';
import { deadlineBadgeText, formatMonthly, formatWonTilde } from '../../bcs/format';
import { toReviewModel } from '../Review/reviewModel';
import ConsultBannerForm from '../../bcs/components/ConsultBannerForm';
import { PROMOTION_NOTES, promotionBadgeText, promotionDetailPath, promotionListQuery, toPromotionModel } from './promotionModel';
import './promotion-bcs.css';

// 퍼블리싱 promotion-detail.html "신청은 3단계면 끝납니다"
const STEPS = [
  ['01', '실시간 견적 신청', '이름과 연락처만 남기면 접수됩니다. 원하는 차종은 몰라도 괜찮습니다.'],
  ['02', '제휴사 조건 비교', '담당 매니저가 이 기획전 조건을 포함해 제휴사별 월 납입금을 비교해 드립니다.'],
  ['03', '계약 후 출고', '조건을 확정하면 서류는 모바일로 처리되고, 재고 차량은 최단 2일 내 인도됩니다.'],
];

// 기획전 안내 이미지는 세로로 매우 길어서 처음에는 이 높이까지만 보여준다(promotion-bcs.css 와 같은 값).
const VISUAL_COLLAPSED_HEIGHT = 900;

const listOf = (data) => (Array.isArray(data) ? data : []);

function PromotionVisual({ src, alt }) {
  const [tall, setTall] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className={`pd-visual${tall && !expanded ? ' is-collapsed' : ''}`}>
        <img
          src={src}
          alt={alt}
          onLoad={(event) => {
            const { naturalWidth, naturalHeight, clientWidth } = event.currentTarget;
            if (naturalWidth && clientWidth) setTall((clientWidth * naturalHeight) / naturalWidth > VISUAL_COLLAPSED_HEIGHT + 80);
          }}
        />
      </div>
      {tall && (
        <div className="pd-back pd-visual__more">
          <button className="pd-back__btn" type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
            {expanded ? '혜택 안내 접기' : '혜택 안내 전체 보기'}
          </button>
        </div>
      )}
    </>
  );
}

function MoreCard({ promo }) {
  const hasImage = Boolean(promo.imageUrl);
  return (
    <Link className="pd-more-card" to={promotionDetailPath(promo.id)}>
      <div className={`pd-more-card__tile pd-more-card__tile--${promo.theme}${hasImage ? ' pd-more-card__tile--image' : ''}`}>
        {hasImage ? <img className="pd-more-card__image" src={promo.imageUrl} alt="" loading="lazy" /> : null}
        <span className="pd-more-card__badge">{promotionBadgeText(promo)}</span>
        {!hasImage && <p className="pd-more-card__headline">{promo.headline}</p>}
      </div>
      <div className="pd-more-card__body">
        <p className="pd-more-card__title">{promo.title}</p>
        {promo.period ? <p className="pd-more-card__period">{promo.period}</p> : null}
      </div>
    </Link>
  );
}

function BrandPromotionDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { openQuote } = useBcsUi();

  // 목록에서 넘어오면 router state 를 먼저 쓰고, 직접 들어오면 진행중·종료 목록에서 찾는다.
  const activeQuery = useQuery(promotionListQuery('active'));
  const endedQuery = useQuery(promotionListQuery('ended'));
  const activeItems = useMemo(() => listOf(activeQuery.data), [activeQuery.data]);
  const endedItems = useMemo(() => listOf(endedQuery.data), [endedQuery.data]);

  const statePromotion = location.state?.promotion;
  const raw = useMemo(() => {
    if (statePromotion && String(statePromotion.id) === String(id)) return statePromotion;
    return [...activeItems, ...endedItems].find((item) => String(item.id) === String(id)) ?? null;
  }, [statePromotion, activeItems, endedItems, id]);
  const promo = useMemo(
    () => (raw ? toPromotionModel(raw, { ended: endedItems.some((item) => String(item.id) === String(raw.id)) }) : null),
    [raw, endedItems],
  );

  const { data: carDetail } = useCarDetailQuery(promo?.trimId ?? null);
  const trim = useMemo(
    () => listOf(carDetail?.trims).find((row) => String(row.id) === String(promo?.trimId)) ?? null,
    [carDetail, promo?.trimId],
  );

  const reviewsQuery = useQuery({
    queryKey: ['reviews', 'latest', 3],
    queryFn: () => contentAPI.getReviews(3),
    staleTime: 1000 * 60 * 5,
  });
  const reviews = useMemo(() => listOf(reviewsQuery.data).map(toReviewModel), [reviewsQuery.data]);

  const others = useMemo(() => {
    if (!promo) return [];
    const source = promo.ended ? endedItems : activeItems;
    return source
      .filter((item) => String(item.id) !== String(promo.id))
      .slice(0, 3)
      .map((item, index) => toPromotionModel(item, { ended: promo.ended, index: index + 1 }));
  }, [promo, activeItems, endedItems]);

  useEffect(() => {
    window.scrollTo?.(0, 0);
  }, [id]);

  const loading = !promo && (activeQuery.isLoading || endedQuery.isLoading);

  if (!promo) {
    return (
      <div className="bcs-page-promotion-detail">
        <section className="pd-page">
          <div className="container">
            <nav className="pd-breadcrumb" aria-label="현재 위치">
              <Link to="/">홈</Link>
              <span aria-hidden="true">›</span>
              <Link to="/promotion">브랜드별 혜택</Link>
              <span aria-hidden="true">›</span>
              <strong>혜택 상세</strong>
            </nav>
            <p className="pd-empty">{loading ? '브랜드별 혜택을 불러오는 중입니다...' : '해당 브랜드 혜택 정보를 찾을 수 없습니다.'}</p>
            {!loading && (
              <div className="pd-back">
                <Link className="pd-back__btn" to="/promotion">
                  기획전 목록으로 돌아가기
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  const carName = carDetail ? [carDetail.brandName, carDetail.name].filter(Boolean).join(' ') : promo.headline;
  const trimName = trim?.sourceTrimName || trim?.name || '';
  const monthly = trim?.lowestPrepayment30MonthlyFee ?? promo.monthly;
  const basePrice = trim?.basePrice ?? promo.basePrice;
  const trimPath = promo.trimId ? `/car-detail/trim/${promo.trimId}` : null;
  const hasDeadline = !promo.ended && typeof promo.remainingDays === 'number';

  const statusLabel = promo.ended ? '종료된 기획전' : hasDeadline ? `진행중 · ${deadlineBadgeText(promo.remainingDays)}` : '진행중';
  const stats = [
    { label: '차량가격', value: basePrice ? formatWonTilde(basePrice) : '상담 시 안내' },
    { label: '최저 월 렌탈료', value: monthly ? `${formatMonthly(monthly)}원` : '상담 시 안내' },
    promo.ended
      ? { label: '진행 상태', value: '종료' }
      : { label: hasDeadline ? '혜택 종료까지' : '진행 상태', value: hasDeadline ? deadlineBadgeText(promo.remainingDays) : '진행중' },
  ];

  const openPromotionQuote = (event) => {
    event.preventDefault();
    openQuote(carName || promo.brand, 'promotion-detail');
  };

  return (
    <div className="bcs-page-promotion-detail">
      <SeoHelmet title={`${promo.title} | 블라인드 카스토리`} description={promo.benefit || promo.partner || undefined} image={promo.imageUrl || undefined} />
      <section className="pd-page">
        <div className="container">
          <nav className="pd-breadcrumb" aria-label="현재 위치">
            <Link to="/">홈</Link>
            <span aria-hidden="true">›</span>
            <Link to="/promotion">브랜드별 혜택</Link>
            <span aria-hidden="true">›</span>
            <strong>{promo.brand ? `${promo.brand} 혜택` : '혜택 상세'}</strong>
          </nav>

          <section className={`pd-hero${promo.ended ? ' pd-hero--ended' : ''}`} aria-labelledby="pd-headline">
            <div className="pd-hero__main">
              <div className="pd-badges">
                <span className={`pd-status${promo.ended ? ' is-ended' : ''}`}>{statusLabel}</span>
                {promo.brand ? <span className="pd-brandchip">{promo.brand}</span> : null}
              </div>
              {promo.partner ? <p className="pd-partner">{promo.partner}</p> : null}
              <h1 className="pd-headline" id="pd-headline">
                {promo.headline}
              </h1>
              {promo.benefit ? <p className="pd-benefit">{promo.benefit}</p> : null}
              {monthly ? <p className="pd-discount">선납금 30% 기준 월 {formatMonthly(monthly)}원~</p> : null}
              <div className="pd-actions">
                <a className="pd-btn pd-btn--gold" href="#pd-apply" onClick={openPromotionQuote}>
                  이 혜택으로 견적받기
                </a>
                {trimPath ? (
                  <Link className="pd-btn pd-btn--ghost" to={trimPath}>
                    대상 차종 견적 보기
                  </Link>
                ) : (
                  <a className="pd-btn pd-btn--ghost" href="#pd-apply" onClick={openPromotionQuote}>
                    대상 차종 견적 보기
                  </a>
                )}
              </div>
            </div>

            <aside className="pd-timer">
              <p className="pd-timer__label">{hasDeadline ? '혜택 종료까지' : '진행 기간'}</p>
              <div>
                {hasDeadline ? (
                  <Countdown deadline={promo.endDate} />
                ) : (
                  <p className="pd-timer__ended">{promo.ended ? '기획전이 종료되었습니다' : '상시 진행'}</p>
                )}
              </div>
              {promo.period ? <p className="pd-timer__period">{promo.period}</p> : null}
            </aside>
          </section>

          <div className="pd-stats">
            {stats.map((stat) => (
              <div className="pd-stat" key={stat.label}>
                <p className="pd-stat__label">{stat.label}</p>
                <p className="pd-stat__value">{stat.value}</p>
              </div>
            ))}
          </div>

          {promo.topImage ? (
            <section className="pd-section">
              <div className="pd-section__head">
                <h2 className="pd-section__title">
                  이 기획전의 <em>핵심 혜택</em>
                </h2>
                <p className="pd-section__desc">제휴사가 안내한 기획전 혜택입니다. 계약 조건에 따라 적용 내용이 달라질 수 있습니다.</p>
              </div>
              <PromotionVisual src={promo.topImage} alt={`${promo.title} 혜택 안내`} />
            </section>
          ) : null}

          <section className="pd-section">
            <div className="pd-section__head">
              <h2 className="pd-section__title">대상 차종</h2>
              <p className="pd-section__desc">장기렌트 48개월 · 선납금 30% · 연 20,000km 기준 월 렌탈료입니다.</p>
            </div>
            <div className="pd-models">
              {trimPath ? (
                <Link className="pd-model" to={trimPath}>
                  <div>
                    <p className="pd-model__name">{carName}</p>
                    {trimName ? <p className="pd-model__trim">{trimName}</p> : null}
                  </div>
                  <div className="pd-model__price">
                    <small>월 렌탈료</small>
                    <strong>{monthly ? `${formatMonthly(monthly)}원` : '상담 시 안내'}</strong>
                  </div>
                </Link>
              ) : (
                <div className="pd-model">
                  <div>
                    <p className="pd-model__name">대상 차종 준비중</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="pd-section">
            <div className="pd-section__head">
              <h2 className="pd-section__title">
                신청은 <em>3단계</em>면 끝납니다
              </h2>
              <p className="pd-section__desc">방문 없이 비대면으로 진행되고, 계약 전까지 비용이 발생하지 않습니다.</p>
            </div>
            <ol className="pd-steps">
              {STEPS.map(([no, title, desc]) => (
                <li className="pd-step" key={no}>
                  <span className="pd-step__no">{no}</span>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </li>
              ))}
            </ol>
          </section>

          {reviews.length > 0 && (
            <section className="pd-section">
              <div className="pd-section__head">
                <h2 className="pd-section__title">
                  이미 이렇게 <em>타고 계십니다</em>
                </h2>
                <p className="pd-section__desc">블라인드 카스토리로 출고한 고객들의 실제 후기입니다.</p>
              </div>
              <div className="pd-reviews">
                {reviews.map((review) => (
                  <article className="pd-review" key={review.id}>
                    <p className="pd-review__stars" aria-label={`별점 ${review.rating}점`}>
                      {'★'.repeat(review.rating)}
                      {'☆'.repeat(5 - review.rating)}
                    </p>
                    <h3 className="pd-review__title">{review.title}</h3>
                    <p className="pd-review__text">{review.snippet}</p>
                    <div className="pd-review__meta">
                      <strong>{review.author}</strong>
                      <span>{review.carName || review.date}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <ConsultBannerForm
            key={carName}
            id="pd-apply"
            idPrefix="pd-banner"
            title={promo.ended ? '종료된 기획전이지만, 지금 조건도 비교해 드립니다' : `${promo.brand || '브랜드'} 혜택, 내 조건으로 계산해 보세요`}
            source="promotion-detail-banner"
            entryLabel="브랜드 혜택 상세 배너"
            carModel={carName}
            brand={promo.brand}
          />

          {others.length > 0 && (
            <section className="pd-section">
              <div className="pd-section__head">
                <h2 className="pd-section__title">함께 보면 좋은 기획전</h2>
              </div>
              <div className="pd-more-grid">
                {others.map((other) => (
                  <MoreCard key={other.id} promo={other} />
                ))}
              </div>
            </section>
          )}

          <div className="pd-back">
            <Link className="pd-back__btn" to="/promotion">
              기획전 목록으로 돌아가기
            </Link>
          </div>

          <div className="pd-fine">
            <p className="pd-fine__title">혜택 적용 안내</p>
            <ul>
              {PROMOTION_NOTES.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

export default BrandPromotionDetail;
