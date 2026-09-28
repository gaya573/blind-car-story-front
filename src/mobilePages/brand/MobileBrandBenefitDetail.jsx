import React, { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { carAPI } from '../../services/carApi.js';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import { formatTrimDisplayName } from '../../utils/trimDisplayName';
import { navigateToDetail } from '../utils/navigateDetail';
import { MobileSubHeader } from '../../bcs/layout/MobileLayout';
import { useBcsUi } from '../../bcs/BcsUiContext';
import { formatMonthly, formatWon } from '../../bcs/format';
import { SITE_NAME } from '../../bcs/site';
import styles from './MobileBrand.module.css';
import { PROMOTION_TABS, brandPromotionsQuery, promotionStatusText, toPromotionModel } from './brandPromotion';

// 퍼블리싱 promotion-data.js notes (혜택 적용 안내)
const NOTES = [
  '표기된 혜택은 계약 조건(기간·선납금·보증금·주행거리)에 따라 달라질 수 있습니다.',
  '제휴 카드·캐피탈 심사 결과에 따라 적용 여부가 결정됩니다.',
  '재고 소진 시 사전 고지 없이 조기 종료될 수 있습니다.',
  '표기 월 렌탈료는 장기렌트 48개월 · 선납금 30% · 연 20,000km 기준입니다.',
];

// 퍼블리싱 m-brand-detail.html 신청 3단계 (고정 안내 문구)
const STEPS = [
  ['실시간 견적 신청', '이름과 연락처만 남기면 접수됩니다.'],
  ['제휴사 조건 비교', '담당 매니저가 제휴사별 월 납입금을 비교해 드립니다.'],
  ['계약 후 출고', '서류는 모바일로 처리되고 재고 차량은 최단 2일 내 인도됩니다.'],
];

function Shell({ message }) {
  return (
    <>
      <MobileSubHeader title="혜택 상세" />
      <main id="main-content">
        <p className="m-empty">{message}</p>
      </main>
    </>
  );
}

/** 대상 차종: 기획전에 연결된 트림 1건. 누르면 모바일 차량 상세로 간다. */
function TargetModel({ promotion }) {
  const navigate = useNavigate();
  const { data: detail } = useQuery({
    queryKey: ['mobile-car-trim-detail', String(promotion.trimId)],
    queryFn: () => carAPI.getCarDetail(promotion.trimId),
    enabled: Boolean(promotion.trimId),
    staleTime: 1000 * 60 * 5,
  });

  const trim = Array.isArray(detail?.trims)
    ? detail.trims.find((item) => String(item.id) === String(promotion.trimId))
    : null;
  const name = detail?.name || promotion.title;
  const trimName = trim ? formatTrimDisplayName(trim.name, detail?.name, trim) : '';
  const monthly = trim?.lowestPrepayment30MonthlyFee ?? promotion.monthly;

  return (
    <button
      type="button"
      className={`m-bd-model ${styles.modelLink}`}
      onClick={() => navigateToDetail(navigate, { vehicleLineId: detail?.vehicleLineId, trimId: promotion.trimId })}
    >
      <div>
        <p className="m-bd-model__name">{name}</p>
        {trimName ? <p className="m-bd-model__trim">{trimName}</p> : null}
      </div>
      {monthly ? (
        <div className="m-bd-model__price">
          <small>월 렌탈료</small>
          <strong>{formatMonthly(monthly)}원</strong>
        </div>
      ) : null}
    </button>
  );
}

/** 브랜드 혜택 상세 (퍼블리싱 pages/m-brand-detail.html). 목록에서 넘어오면 state 로, 직접 들어오면 API 로 찾는다. */
function MobileBrandBenefitDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { openQuote } = useBcsUi();
  const statePromotion = location.state?.promotion ?? null;

  const ongoingQuery = useQuery({ ...brandPromotionsQuery(PROMOTION_TABS[0].position), enabled: !statePromotion });
  const endedQuery = useQuery({ ...brandPromotionsQuery(PROMOTION_TABS[1].position), enabled: !statePromotion });

  const promotion = useMemo(() => {
    if (statePromotion) return toPromotionModel(statePromotion, statePromotion.position ?? null);
    const findIn = (list) => (Array.isArray(list) ? list : []).find((item) => String(item.id) === String(id));
    const ongoing = findIn(ongoingQuery.data);
    if (ongoing) return toPromotionModel(ongoing, PROMOTION_TABS[0].position);
    const ended = findIn(endedQuery.data);
    return ended ? toPromotionModel(ended, PROMOTION_TABS[1].position) : null;
  }, [statePromotion, ongoingQuery.data, endedQuery.data, id]);

  if (!promotion) {
    const loading = !statePromotion && (ongoingQuery.isLoading || endedQuery.isLoading);
    return <Shell message={loading ? '브랜드별 혜택을 불러오는 중입니다...' : '해당 브랜드 혜택 정보를 찾을 수 없습니다.'} />;
  }

  const stats = [
    promotion.monthly ? ['월 렌탈료', `${formatMonthly(promotion.monthly)}원`] : null,
    promotion.basePrice ? ['차량가격', formatWon(promotion.basePrice)] : null,
    promotion.ended ? ['진행 상태', '종료'] : typeof promotion.remainingDays === 'number' ? ['남은 기간', promotion.remainingDays <= 0 ? '오늘 마감' : `D-${promotion.remainingDays}`] : null,
  ].filter(Boolean);

  return (
    <>
      <SeoHelmet title={`${promotion.title} | ${SITE_NAME}`} description={promotion.partner || undefined} image={promotion.imageUrl || undefined} />
      <MobileSubHeader title={promotion.brand ? `${promotion.brand} 혜택` : '혜택 상세'} />

      <main id="main-content">
        <section className={`m-bd-hero${promotion.ended ? ' is-ended' : ''}`}>
          <div className="m-bd-hero__badges">
            <span className={`m-bd-hero__status${promotion.ended ? ' is-ended' : ''}`}>{promotionStatusText(promotion)}</span>
            {promotion.brand ? <span className="m-bd-hero__brand">{promotion.brand}</span> : null}
          </div>
          {promotion.partner ? <p className="m-bd-hero__partner">{promotion.partner}</p> : null}
          <h1 className="m-bd-hero__headline">{promotion.headline}</h1>
          {promotion.description ? <p className="m-bd-hero__benefit">{promotion.description}</p> : null}
          {promotion.period ? <p className="m-bd-hero__period">{promotion.period}</p> : null}
        </section>

        {stats.length > 0 ? (
          <div className="m-bd-stats" style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
            {stats.map(([label, value]) => (
              <div className="m-bd-stat" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        ) : null}

        {promotion.detailImages.length > 0 ? (
          <section className="m-section" style={{ paddingTop: 8 }}>
            <div className="m-section__head">
              <h2>핵심 혜택</h2>
            </div>
            <div className="m-card-stack">
              {promotion.detailImages.map((url, index) => (
                <img key={url} className={styles.detailImage} src={url} alt={`${promotion.title} 혜택 안내 ${index + 1}`} loading="lazy" />
              ))}
            </div>
          </section>
        ) : null}

        {promotion.trimId ? (
          <section className="m-section" style={{ paddingTop: 0 }}>
            <div className="m-section__head">
              <h2>대상 차종</h2>
            </div>
            <div className="m-card-stack">
              <TargetModel promotion={promotion} />
            </div>
          </section>
        ) : null}

        <section className="m-section" style={{ paddingTop: 0 }}>
          <div className="m-section__head">
            <h2>신청 3단계</h2>
          </div>
          <div className="m-card-stack">
            {STEPS.map(([title, desc], index) => (
              <article className="m-bd-benefit" key={title}>
                <span className="m-bd-benefit__no">{String(index + 1).padStart(2, '0')}</span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="m-menu-promo">
          <strong>
            이 혜택, 내 조건으로
            <br />
            계산해 보세요
          </strong>
          <em>쉽고 투명한 신차 견적</em>
          <button
            className="m-callbar__btn"
            type="button"
            style={{ marginTop: 14, height: 44, padding: '0 22px' }}
            onClick={() => openQuote(promotion.title, 'm-brand-detail')}
          >
            실시간 무료견적 받기
          </button>
        </div>

        <div className="m-fine">
          <strong>혜택 적용 안내</strong>
          <ul>
            {NOTES.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}

export default MobileBrandBenefitDetail;
