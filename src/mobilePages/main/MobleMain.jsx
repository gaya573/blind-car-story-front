import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { contentAPI } from '../../services/contentApi.js';
import { coalitionAPI, COALITION_PAGE_TYPE } from '../../services/coalitionApi.js';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import StructuredData, { getOrganizationSchema, getLocalBusinessSchema } from '../../components/StructuredData.jsx';
import { getPageSeo } from '../../config/seoConfig';
import { MobileFooter, MobileMainHeader } from '../../bcs/layout/MobileLayout';
import { useBcsUi } from '../../bcs/BcsUiContext';
import { useConsultForm } from '../../bcs/useConsultForm';
import { useVehicleNavigation } from '../../bcs/useVehicleNavigation';
import { toVehicleCardModel, earliestDeadline } from '../../bcs/vehicle';
import { formatMonthly, formatWonTilde } from '../../bcs/format';
import { PARTNERS, SITE_NAME, YOUTUBE_CHANNEL_URL } from '../../bcs/site';
import Countdown from '../../bcs/components/Countdown';
import PartnerTrack from '../../bcs/components/PartnerTrack';
import PrivacyRow from '../../bcs/components/PrivacyRow';
import YoutubeCardLink from '../../bcs/components/YoutubeCardLink';
import MobileReviewCard, { REVIEW_PLACEHOLDERS } from '../search/MobileReviewCard';

const staleTime = 1000 * 60;

// 제휴 어드민에 메인 배너가 없을 때 보여줄 퍼블리싱 모바일 배너
const HERO_FALLBACK = {
  imageUrl: '/bcs/images/banner/hero-mobile.png',
  alt: '블라인드 카스토리 장기렌트·리스 비교견적 - 월 납입금부터 재고·출고까지 빠르게 확인해보세요. 실시간 비교견적, 초기비용 맞춤 설계, 빠른 출고 확인.',
};

const listOf = (query) => (Array.isArray(query?.data) ? query.data : []);

/**
 * 퍼블리싱 mobile.js initAutoSlider 를 옮긴 자동 슬라이드.
 * viewport 안의 트랙(trackSelf 면 viewport 자신)의 자식들을 step 개씩 넘기고, 현재 위치(점 표시)를 돌려준다.
 * 복제본이 붙어 있으면(sourceItemCount * 2) 마지막에서 복제본으로 넘긴 뒤 처음으로 순간 이동한다.
 * resetKey 가 바뀌면(목록 교체) 처음부터 다시 잡는다.
 */
function useAutoSlider(viewportRef, { logicalCount, sourceItemCount = 0, step = 1, interval = 3800, trackSelf = false, resetKey = '' }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const goToRef = useRef(() => {});

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackSelf ? viewport : viewport?.firstElementChild;
    if (!viewport || !track) return undefined;

    const items = Array.from(track.children);
    const count = Math.min(logicalCount || items.length, items.length);
    if (!count) return undefined;
    const sourceCount = Math.min(sourceItemCount || items.length, items.length);
    const hasLoopCopies = items.length >= sourceCount * 2;
    const reduceMotion = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);

    let current = 0;
    let timer = null;
    let resumeTimer = null;
    let wrapTimer = null;
    let scrollEndTimer = null;
    let wrapping = false;

    const scrollToLeft = (left, smooth) => {
      if (typeof viewport.scrollTo === 'function') {
        viewport.scrollTo({ left, behavior: smooth && !reduceMotion ? 'smooth' : 'auto' });
      } else {
        viewport.scrollLeft = left;
      }
    };
    const itemLeftByItemIndex = (itemIndex) => {
      const item = items[Math.min(itemIndex, items.length - 1)];
      return item ? item.offsetLeft - track.offsetLeft : 0;
    };
    const itemLeft = (index) => itemLeftByItemIndex(index * step);
    const mark = (index) => {
      current = index;
      setActiveIndex(index);
    };
    const goTo = (index, smooth) => {
      const next = (index + count) % count;
      mark(next);
      scrollToLeft(itemLeft(next), smooth);
    };
    const advance = () => {
      if (hasLoopCopies && current === count - 1) {
        wrapping = true;
        mark(0);
        scrollToLeft(itemLeftByItemIndex(sourceCount), true);
        clearTimeout(wrapTimer);
        wrapTimer = setTimeout(
          () => {
            scrollToLeft(0, false);
            wrapping = false;
          },
          reduceMotion ? 0 : 520,
        );
        return;
      }
      goTo(current + 1, true);
    };
    const start = () => {
      if (reduceMotion || count < 2 || timer) return;
      timer = setInterval(advance, interval);
    };
    const stop = () => {
      clearInterval(timer);
      timer = null;
    };
    const pauseThenResume = () => {
      stop();
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(start, 5000);
    };
    const onScroll = () => {
      if (wrapping) return;
      clearTimeout(scrollEndTimer);
      scrollEndTimer = setTimeout(() => {
        let nearest = 0;
        let distance = Infinity;
        for (let i = 0; i < count; i += 1) {
          const next = Math.abs(viewport.scrollLeft - itemLeft(i));
          if (next < distance) {
            distance = next;
            nearest = i;
          }
        }
        mark(nearest);
      }, 90);
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    viewport.addEventListener('scroll', onScroll, { passive: true });
    viewport.addEventListener('pointerdown', pauseThenResume, { passive: true });
    viewport.addEventListener('focusin', stop);
    viewport.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', onVisibility);
    goToRef.current = (index) => {
      goTo(index, true);
      pauseThenResume();
    };
    mark(0);
    start();

    return () => {
      stop();
      clearTimeout(resumeTimer);
      clearTimeout(wrapTimer);
      clearTimeout(scrollEndTimer);
      viewport.removeEventListener('scroll', onScroll);
      viewport.removeEventListener('pointerdown', pauseThenResume);
      viewport.removeEventListener('focusin', stop);
      viewport.removeEventListener('focusout', start);
      document.removeEventListener('visibilitychange', onVisibility);
      goToRef.current = () => {};
    };
  }, [viewportRef, logicalCount, sourceItemCount, step, interval, trackSelf, resetKey]);

  return [activeIndex, (index) => goToRef.current(index)];
}

function SliderDots({ count, activeIndex, onSelect, label, className = 'm-slider-dots' }) {
  return (
    <div className={className} aria-label={label}>
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          className={`m-slider-dot${index === activeIndex ? ' is-active' : ''}`}
          type="button"
          aria-label={`${index + 1}번째 슬라이드 보기`}
          aria-current={index === activeIndex ? 'true' : 'false'}
          onClick={() => onSelect(index)}
        />
      ))}
    </div>
  );
}

function MobilePriceRow({ label, value, gold = false }) {
  return (
    <div className="m-vehicle__price-row">
      <span className="m-vehicle__price-chip">{label}</span>
      <strong className={`m-vehicle__monthly${gold ? ' is-gold' : ''}`}>
        {formatMonthly(value)}
        <small>원</small>
      </strong>
    </div>
  );
}

/** 퍼블리싱 mobile.js renderMobileVehicleCard (.m-vehicle). 카드는 상세로, 버튼은 견적 모달로. */
function MobileVehicleCard({ item, closing = false, source }) {
  const { openQuote } = useBcsUi();
  const goToDetail = useVehicleNavigation();
  const vehicle = useMemo(() => toVehicleCardModel(item), [item]);
  const name = vehicle.vehicleName || '차량 정보';
  const badge = closing ? `D-${Math.max(0, Number(vehicle.remainingDays) || 0)}` : '재고 특가';
  const open = () => goToDetail(vehicle);

  return (
    <article
      className={`m-vehicle${closing ? ' m-vehicle--closing' : ''}`}
      data-car-id={vehicle.id ?? ''}
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === 'Enter') open();
      }}
    >
      <div className="m-vehicle__media">
        <span className="m-vehicle__brand">{vehicle.brandName}</span>
        <span className="m-vehicle__badge">{badge}</span>
        <img src={vehicle.imageUrl || '/bcs/images/cars/car-suv.svg'} alt={name} loading="lazy" />
      </div>
      <div className="m-vehicle__body">
        <h3 className="m-vehicle__name">{name}</h3>
        <p className="m-vehicle__trim">{vehicle.trimName}</p>
        <div className="m-vehicle__base">
          <span>차량가격</span>
          <strong>{formatWonTilde(vehicle.basePrice)}</strong>
        </div>
        <div className="m-vehicle__prices">
          <MobilePriceRow label="선납금 30%" value={vehicle.prepayment30} gold />
          <MobilePriceRow label="보증금 30%" value={vehicle.deposit30} />
          <MobilePriceRow label="완전무보증" value={vehicle.noDeposit} />
        </div>
        <p className="m-vehicle__note">48개월 · 연 2만km 기준</p>
        <button
          className="m-vehicle__cta"
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

function MobileHero({ banners }) {
  const banner = banners[0];
  if (!banner) {
    return (
      <div className="m-hero">
        <img className="m-hero__image" src={HERO_FALLBACK.imageUrl} width="1448" height="1086" alt={HERO_FALLBACK.alt} />
      </div>
    );
  }
  const image = <img className="m-hero__image" src={banner.imageUrl} alt={banner.title || HERO_FALLBACK.alt} />;
  return (
    <div className="m-hero">
      {banner.linkUrl ? (
        <a href={banner.linkUrl} target={/^https?:/.test(banner.linkUrl) ? '_blank' : undefined} rel="noopener noreferrer">
          {image}
        </a>
      ) : (
        image
      )}
    </div>
  );
}

function MobileQuoteForm() {
  const { handleSubmit, error, submitting } = useConsultForm({
    source: 'mobile-main-quote-form',
    entryLabel: '모바일 메인 비교견적',
  });

  return (
    <section className="m-quote">
      <h2>실시간 비교견적 신청</h2>
      {/* 상담 통계 API가 아직 없어 퍼블리싱 자리표시를 그대로 둔다. */}
      <div className="m-stats">
        <div className="m-stat">
          <strong>정보 준비중</strong>
          <span>전체상담</span>
        </div>
        <div className="m-stat">
          <strong>정보 준비중</strong>
          <span>오늘상담</span>
        </div>
        <div className="m-stat">
          <strong>정보 준비중</strong>
          <span>전체계약건수</span>
        </div>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <div className="m-radio">
          <label>
            <input type="radio" name="carType" value="장기렌트" defaultChecked />
            <span>장기렌트</span>
          </label>
          <label>
            <input type="radio" name="carType" value="리스" />
            <span>리스</span>
          </label>
        </div>
        <div className="field">
          <label className="visually-hidden" htmlFor="m-name">
            이름
          </label>
          <input id="m-name" name="name" type="text" placeholder="이름을 입력해주세요 (선택)" autoComplete="name" />
        </div>
        <div className="field">
          <label className="visually-hidden" htmlFor="m-phone">
            연락처
          </label>
          <input id="m-phone" name="phone" type="tel" inputMode="numeric" placeholder="숫자만 입력해주세요" />
        </div>
        <PrivacyRow id="m-privacy" />
        <p className="form-error">{error}</p>
        <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
          {submitting ? '접수 중…' : '실시간 비교견적 받기'}
        </button>
      </form>
    </section>
  );
}

function YoutubeSection({ videos }) {
  const viewportRef = useRef(null);
  const [activeIndex, goTo] = useAutoSlider(viewportRef, {
    logicalCount: videos.length,
    interval: 4200,
    trackSelf: true,
    resetKey: videos.map((video) => video.id ?? video.youtubeUrl).join(),
  });

  return (
    <section className="m-section" id="youtube">
      <div className="m-section__head">
        <h2>{SITE_NAME} YouTube</h2>
        <a href={YOUTUBE_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
          전체보기 <span aria-hidden="true">›</span>
        </a>
      </div>
      <div
        className="m-youtube-row"
        ref={viewportRef}
        role="region"
        aria-label={`${SITE_NAME} 유튜브 영상 슬라이드`}
        aria-roledescription="carousel"
      >
        {videos.map((video) => (
          <YoutubeCardLink key={video.id ?? video.youtubeUrl} video={video} />
        ))}
      </div>
      <SliderDots count={videos.length} activeIndex={activeIndex} onSelect={goTo} label="유튜브 영상 슬라이드 위치" />
    </section>
  );
}

function ReviewSection({ reviews }) {
  const viewportRef = useRef(null);
  // 실제 후기가 없으면 퍼블리싱 자리표시 카드를 보여준다.
  const list = reviews.length ? reviews : REVIEW_PLACEHOLDERS;
  const [activeIndex, goTo] = useAutoSlider(viewportRef, {
    logicalCount: list.length,
    sourceItemCount: list.length,
    interval: 3600,
    resetKey: list.map((review) => review.id).join(),
  });

  return (
    <section className="m-section" id="reviews">
      <div className="m-section__head">
        <h2>출고후기</h2>
        <Link to="/m/review">
          전체보기 <span aria-hidden="true">›</span>
        </Link>
      </div>
      <p className="section-subtitle" style={{ marginBottom: 12 }}>
        {SITE_NAME}를 선택한 이유, 직접 확인해보세요.
      </p>
      <div className="m-review-slider" ref={viewportRef} role="region" aria-label="출고후기 슬라이드" aria-roledescription="carousel">
        <div className="m-review-track">
          {[...list, ...list].map((review, index) => (
            <MobileReviewCard key={`${review.id}-${index}`} review={review} hidden={index >= list.length} />
          ))}
        </div>
      </div>
      <SliderDots count={list.length} activeIndex={activeIndex} onSelect={goTo} label="출고후기 슬라이드 위치" />
    </section>
  );
}

function PartnerSection() {
  const viewportRef = useRef(null);
  const pageCount = Math.ceil(PARTNERS.length / 4);
  const [activeIndex, goTo] = useAutoSlider(viewportRef, {
    logicalCount: pageCount,
    sourceItemCount: PARTNERS.length,
    step: 4,
    interval: 2800,
  });

  return (
    <section className="m-section" id="partners">
      <div className="m-section__head">
        <h2>제휴 파트너사</h2>
      </div>
      <p className="section-subtitle" style={{ marginBottom: 16 }}>
        국내 주요 캐피탈·카드사와 함께 더 좋은 조건을 비교합니다.
      </p>
      <div className="partner-viewport" ref={viewportRef} role="region" aria-label="제휴 파트너사 슬라이드" aria-roledescription="carousel">
        <PartnerTrack />
      </div>
      <SliderDots
        className="m-slider-dots m-slider-dots--partners"
        count={pageCount}
        activeIndex={activeIndex}
        onSelect={goTo}
        label="제휴 파트너사 슬라이드 위치"
      />
    </section>
  );
}

/** 퍼블리싱 mobile.html (모바일 메인). */
const MobleMain = () => {
  const bannerQuery = useQuery({
    queryKey: ['coalition', 'banners', 'main-hero'],
    queryFn: () => coalitionAPI.getBanners(COALITION_PAGE_TYPE.MAIN),
    staleTime,
  });
  const closingQuery = useQuery({
    queryKey: ['content', 'closing-soon'],
    queryFn: () => contentAPI.getClosingSoon(10),
    staleTime,
  });
  // 재고특가핫딜: 재고 API에서 프로모션 이벤트 카드를 뺀 앞 5대
  const hotDealQuery = useQuery({
    queryKey: ['mobile-main', 'hot-deals'],
    queryFn: async () => {
      const items = await contentAPI.getUrgentInventory(100);
      return (Array.isArray(items) ? items : [])
        .filter((item) => String(item.cardType ?? item.card_type ?? '').toUpperCase() !== 'PROMOTION_EVENT')
        .slice(0, 5);
    },
    staleTime,
  });
  const youtubeQuery = useQuery({
    queryKey: ['coalition', 'youtube', 'mobile'],
    queryFn: () => coalitionAPI.getYoutubeVideos(6),
    staleTime,
  });
  const reviewQuery = useQuery({
    queryKey: ['mobile-main', 'reviews'],
    queryFn: () => contentAPI.getReviews(10),
    staleTime,
  });

  const banners = listOf(bannerQuery);
  const closingData = closingQuery.data;
  const closingItems = useMemo(() => (Array.isArray(closingData) ? closingData.slice(0, 2) : []), [closingData]);
  const deadline = useMemo(() => earliestDeadline(closingItems), [closingItems]);
  const hotDeals = listOf(hotDealQuery);
  const videos = listOf(youtubeQuery);
  const reviews = listOf(reviewQuery);

  const { title: seoTitle, description: seoDescription, keywords: seoKeywords } = getPageSeo('home');

  return (
    <>
      <SeoHelmet title={seoTitle} description={seoDescription} keywords={seoKeywords} image={banners[0]?.imageUrl} />
      <StructuredData data={getOrganizationSchema()} />
      <StructuredData data={getLocalBusinessSchema()} />

      <MobileMainHeader />

      <main id="main-content">
        {bannerQuery.isPending ? <div className="m-hero" style={{ aspectRatio: '1448 / 1086' }} /> : <MobileHero banners={banners} />}

        <MobileQuoteForm />

        <section className="m-search">
          <p className="m-search__eyebrow">차량 간편 찾기</p>
          <h2>어떤 차를 찾으세요?</h2>
          <p className="m-search__description">원하는 구분을 선택하면 인기 차종과 혜택을 바로 보여드려요.</p>
          <div className="m-search-grid">
            <Link className="m-search-card" to="/m/search/results?carOrigin=domestic">
              <span className="m-search-card__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 14l1.7-4.1A3 3 0 0 1 8.5 8h7a3 3 0 0 1 2.7 1.7L20 14" />
                  <path d="M3 14h18v4a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-1h-11v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4Z" />
                  <path d="M6.5 14.5h2m7 0h2" />
                </svg>
              </span>
              <span className="m-search-card__copy">
                <strong>국산차</strong>
                <small>현대 · 기아 · 제네시스</small>
              </span>
              <span className="m-search-card__action">
                차종 보기 <span aria-hidden="true">→</span>
              </span>
            </Link>
            <Link className="m-search-card" to="/m/search/results?carOrigin=imported">
              <span className="m-search-card__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3.5 9h17M3.5 15h17M12 3c2.1 2.5 3.2 5.5 3.2 9S14.1 18.5 12 21c-2.1-2.5-3.2-5.5-3.2-9S9.9 5.5 12 3Z" />
                </svg>
              </span>
              <span className="m-search-card__copy">
                <strong>수입차</strong>
                <small>벤츠 · BMW · 아우디</small>
              </span>
              <span className="m-search-card__action">
                차종 보기 <span aria-hidden="true">→</span>
              </span>
            </Link>
          </div>
        </section>

        {closingItems.length > 0 ? (
          <section className="m-section" id="closing-soon">
            <div className="m-section__head">
              <div>
                <h2 className="m-title-icon">
                  <img src="/bcs/images/banner/hotdeal-timer.svg" alt="" aria-hidden="true" />
                  마감임박
                </h2>
                <p className="section-subtitle">현재 인기 차종, 잔여 재고 빠르게 소진 중</p>
              </div>
            </div>
            <Countdown deadline={deadline} style={{ marginBottom: 16 }} />
            <div className="m-card-stack">
              {closingItems.map((item, index) => (
                <MobileVehicleCard key={item.id ?? index} item={item} closing source="mobile-main-closing-soon" />
              ))}
            </div>
          </section>
        ) : null}

        {hotDeals.length > 0 ? (
          <section className="m-section" id="hot-deals">
            <div className="m-section__head">
              <div>
                <h2>재고특가핫딜</h2>
                <p className="section-subtitle">실시간 재고 기반으로 인기 차량을 특가 가격에!</p>
              </div>
              <Link to="/m/advance">전체보기</Link>
            </div>
            <div className="m-card-stack">
              {hotDeals.map((item, index) => (
                <MobileVehicleCard key={item.id ?? index} item={item} source="mobile-main-hot-deals" />
              ))}
            </div>
          </section>
        ) : null}

        {videos.length > 0 ? <YoutubeSection videos={videos} /> : null}

        {reviewQuery.isPending ? null : <ReviewSection reviews={reviews} />}

        <PartnerSection />
      </main>

      <MobileFooter />
    </>
  );
};

export default MobleMain;
