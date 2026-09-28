import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useHomeContent } from '../../hooks/queries/useHomeContent';
import { coalitionAPI } from '../../services/coalitionApi';
import { carAPI } from '../../services/carApi';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import StructuredData, { getOrganizationSchema, getLocalBusinessSchema } from '../../components/StructuredData.jsx';
import { getPageSeo } from '../../config/seoConfig';
import { useConsultForm } from '../../bcs/useConsultForm';
import { useVehicleNavigation } from '../../bcs/useVehicleNavigation';
import { toVehicleCardModel, earliestDeadline } from '../../bcs/vehicle';
import { PERIOD_OPTIONS, SITE_NAME, YOUTUBE_CHANNEL_URL, YOUTUBE_PROFILE_URL } from '../../bcs/site';
import VehicleCard from '../../bcs/components/VehicleCard';
import Countdown from '../../bcs/components/Countdown';
import PartnerTrack from '../../bcs/components/PartnerTrack';
import PrivacyRow from '../../bcs/components/PrivacyRow';
import ConsultBannerForm from '../../bcs/components/ConsultBannerForm';
import YoutubeCardLink from '../../bcs/components/YoutubeCardLink';

// 제휴 어드민에 메인 배너가 없을 때 보여줄 퍼블리싱 기본 배너.
const FALLBACK_SLIDES = [
  { key: 'fallback-main', variant: 'fit', imageUrl: '/bcs/images/banner/hero-main.png' },
  { key: 'fallback-panel', variant: 'panel', imageUrl: YOUTUBE_PROFILE_URL },
];

const scrollToComparisonConsult = () => {
  const target = document.getElementById('comparison-consult');
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  window.setTimeout(() => target.querySelector('input[name="name"]')?.focus({ preventScroll: true }), 500);
};

const listOf = (query) => (Array.isArray(query?.data) ? query.data : []);
const nameOf = (item) => item?.name ?? item?.brandName ?? item?.vehicleLineName ?? item?.title ?? '';

function HeroBanner({ banners }) {
  const [index, setIndex] = useState(0);
  const slides = banners.length
    ? banners.map((banner, i) => ({ key: banner.id ?? i, variant: 'fit', imageUrl: banner.imageUrl, linkUrl: banner.linkUrl, alt: banner.title }))
    : FALLBACK_SLIDES;
  const current = Math.min(index, slides.length - 1);
  const move = (step) => setIndex((current + step + slides.length) % slides.length);

  return (
    <div className="hero-banner">
      <div className="hero-track" style={{ transform: `translateX(-${current * 100}%)` }}>
        {slides.map((slide) => {
          if (slide.variant === 'panel') {
            return (
              <div className="hero-slide hero-slide--panel" key={slide.key}>
                <img src={slide.imageUrl} alt={SITE_NAME} />
                <p>
                  합리적인 신차구매
                  <br />
                  함께 할까요?
                </p>
              </div>
            );
          }
          const image = <img src={slide.imageUrl} alt={slide.alt || `${SITE_NAME} 배너`} />;
          return (
            <div className="hero-slide hero-slide--fit" key={slide.key}>
              {slide.linkUrl ? (
                <a href={slide.linkUrl} target={/^https?:/.test(slide.linkUrl) ? '_blank' : undefined} rel="noopener noreferrer">
                  {image}
                </a>
              ) : (
                image
              )}
            </div>
          );
        })}
      </div>
      <div className="hero-pager">
        <button type="button" aria-label="이전" onClick={() => move(-1)}>
          ‹
        </button>
        <span>
          {current + 1}/{slides.length}
        </span>
        <button type="button" aria-label="다음" onClick={() => move(1)}>
          ›
        </button>
      </div>
    </div>
  );
}

function HeroQuoteCard() {
  const { handleSubmit, error, submitting } = useConsultForm({ source: 'home-page', entryLabel: '메인 상단 견적문의' });
  const [brandId, setBrandId] = useState('');
  const brandsQuery = useQuery({ queryKey: ['bcs', 'brands'], queryFn: () => carAPI.getBrands(), staleTime: 1000 * 60 * 10 });
  const linesQuery = useQuery({
    queryKey: ['bcs', 'vehicle-lines', brandId],
    queryFn: () => carAPI.getVehicleLines(brandId),
    enabled: Boolean(brandId),
    staleTime: 1000 * 60 * 10,
  });
  const brands = listOf(brandsQuery);
  const lines = listOf(linesQuery);

  // 상담에는 id가 아니라 이름이 저장되어야 하므로, 선택한 브랜드 id를 이름으로 바꿔 hidden 필드로 보낸다.
  const brandName = nameOf(brands.find((brand) => String(brand.id) === brandId));

  return (
    <aside className="quote-card" id="quote-form">
      <h2>
        <span>실시간</span> 견적문의
      </h2>
      <form
        className="quote-form"
        onSubmit={(event) => {
          handleSubmit(event);
        }}
        onReset={() => setBrandId('')}
        noValidate
      >
        <div className="field">
          <label htmlFor="pc-name">성함</label>
          <input id="pc-name" name="name" type="text" placeholder="ex) 홍길동" autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="pc-phone">
            연락처<span className="required">*</span>
          </label>
          <input id="pc-phone" name="phone" type="tel" inputMode="numeric" placeholder="ex) 01012345678" />
        </div>
        <div className="field">
          <label className="visually-hidden" htmlFor="pc-brand">
            브랜드
          </label>
          <select id="pc-brand" value={brandId} onChange={(event) => setBrandId(event.target.value)}>
            <option value="" disabled>
              브랜드
            </option>
            {brands.map((brand) => (
              <option key={brand.id} value={String(brand.id)}>
                {nameOf(brand)}
              </option>
            ))}
          </select>
          <input type="hidden" name="brand" value={brandName} />
        </div>
        <div className="form-row-half">
          <div className="field">
            <label className="visually-hidden" htmlFor="pc-model">
              모델
            </label>
            <select id="pc-model" name="model" defaultValue="" key={brandId} disabled={!brandId}>
              <option value="" disabled>
                모델
              </option>
              {lines.map((line) => (
                <option key={line.id ?? nameOf(line)} value={nameOf(line)}>
                  {nameOf(line)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="visually-hidden" htmlFor="pc-period">
              계약기간
            </label>
            <select id="pc-period" name="period" defaultValue="">
              <option value="" disabled>
                계약기간
              </option>
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <PrivacyRow id="pc-privacy" />
        <p className="form-error">{error}</p>
        <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
          {submitting ? '접수 중…' : '실시간 무료견적 받기'}
        </button>
      </form>
    </aside>
  );
}

function TopCarRow({ car }) {
  const goToDetail = useVehicleNavigation();
  const meta = [car.subtitle, car.extraInfo].filter(Boolean).join(' | ');
  const open = () => goToDetail(toVehicleCardModel(car));
  return (
    <article
      className="top-car"
      data-trim-id={car.trimId ?? ''}
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === 'Enter') open();
      }}
    >
      <img src={car.imageUrl || '/bcs/images/cars/car-suv.svg'} alt={car.title ?? ''} loading="lazy" />
      <div className="top-car__rank">{car.rank}</div>
      <div className="top-car__panel">
        <div className="top-car__name">{car.title}</div>
        <div className="top-car__meta">{meta}</div>
        <div className="top-car__desc">{car.description ?? ''}</div>
      </div>
    </article>
  );
}

const PRODUCT_CHOICES = [
  ['rental', '장기렌트', '보험·자동차세를 월 대여료에 포함해 이용하는 상품'],
  ['lease', '리스', '일반 번호판과 개인 보험 경력을 유지하는 금융상품'],
];

const PRODUCT_ROWS = [
  ['등록 명의', '렌터카 회사', '리스 회사'],
  ['자동차 보험', '렌터카 회사 보험 적용', '이용자 명의로 직접 가입'],
  ['번호판', '하·허·호 렌터카 번호판', '일반 번호판'],
  ['세금·정비', '자동차세 포함 · 정비 옵션 선택', '자동차세 별도 · 직접 관리'],
  ['만기 선택', '반납 · 인수 · 계약 연장', '반납 · 인수 · 재리스'],
];

// 퍼블리싱의 비교 예시 수치. 실제 견적이 아니므로 화면에 "예시"를 함께 표기한다.
const TOTAL_ROWS = [
  ['초기 납입', '38,960,000원', '11,688,000원', '0원'],
  ['48개월 월 납입 합계', '0원', '30,432,000원', '23,274,240원'],
  ['취득 관련 비용', '2,727,200원', '2,727,200원', '월 대여료 포함'],
  ['보험·자동차세 4년', '6,000,000원', '6,000,000원', '월 대여료 포함'],
];

const Home = () => {
  const { heroBanner, closingSoon, topCars, hotDeals } = useHomeContent();
  const youtubeQuery = useQuery({
    queryKey: ['coalition', 'youtube', 'home'],
    queryFn: () => coalitionAPI.getYoutubeVideos(3),
    staleTime: 1000 * 60,
  });

  const banners = listOf(heroBanner);
  const closingItems = useMemo(() => listOf(closingSoon).slice(0, 4), [closingSoon]);
  const closingCards = useMemo(() => closingItems.map(toVehicleCardModel), [closingItems]);
  const specialCards = useMemo(() => listOf(hotDeals).slice(0, 8).map(toVehicleCardModel), [hotDeals]);
  const topCarList = useMemo(
    () => listOf(topCars).map((car, index) => ({ ...car, rank: car.rank ?? index + 1 })).slice(0, 5),
    [topCars],
  );
  const videos = listOf(youtubeQuery);
  const deadline = useMemo(() => earliestDeadline(closingItems), [closingItems]);
  const [product, setProduct] = useState('rental');

  const { title: seoTitle, description: seoDescription, keywords: seoKeywords } = getPageSeo('home');

  return (
    <>
      <SeoHelmet title={seoTitle} description={seoDescription} keywords={seoKeywords} image={banners[0]?.imageUrl} />
      <StructuredData data={getOrganizationSchema()} />
      <StructuredData data={getLocalBusinessSchema()} />

      <section className="hero-section">
        <div className="container hero-layout">
          <HeroBanner banners={banners} />
          <HeroQuoteCard />
        </div>
      </section>

      {closingCards.length > 0 && (
        <section className="closing-section" id="closing-soon">
          <div className="container">
            <div className="section-header" style={{ textAlign: 'center' }}>
              <h2 className="section-title section-title--icon">
                <img className="section-title__icon" src="/bcs/images/banner/hotdeal-timer.svg" alt="" aria-hidden="true" />
                재고 특가 핫딜
              </h2>
              <p className="section-subtitle">현재 인기 차종, 잔여 재고 빠르게 소진 중</p>
            </div>
            <Countdown deadline={deadline} />
            <div className="featured-cars" style={{ marginTop: 32 }}>
              {closingCards.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} showBadge={false} source="home-closing-soon" />
              ))}
            </div>
            <p className="disclaimer">* 특가 혜택은 예고 없이 종료될 수 있습니다.</p>
          </div>
        </section>
      )}

      {videos.length > 0 && (
        <section className="youtube-section" id="youtube">
          <div className="container">
            <div className="youtube-head">
              <img src={YOUTUBE_PROFILE_URL} alt={`${SITE_NAME} YouTube`} width="48" height="48" />
              <h2 className="section-title">{SITE_NAME} YouTube</h2>
            </div>
            <div className="youtube-grid">
              {videos.map((video) => (
                <YoutubeCardLink key={video.id ?? video.youtubeUrl} video={video} />
              ))}
            </div>
            <div className="youtube-more">
              <a className="btn btn-primary" href={YOUTUBE_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                더 많은 차량 할인 팁 영상 보러가기 →
              </a>
            </div>
          </div>
        </section>
      )}

      <ConsultBannerForm idPrefix="banner-1" source="home-bottom-banner" entryLabel="메인 상담 배너" />

      {topCarList.length > 0 && (
        <section className="popular-section" id="top-cars">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">
                주간 인기차량 <span>TOP 5</span>
              </h2>
              <p className="section-subtitle">고객 계약 데이터를 기반으로 선정된 한 주간 가장 인기 있었던 차량입니다.</p>
            </div>
            <div className="popular-list">
              {topCarList.map((car) => (
                <TopCarRow key={car.id ?? car.rank} car={car} />
              ))}
            </div>
          </div>
        </section>
      )}

      {specialCards.length > 0 && (
        <section className="special-section" id="special-offers">
          <div className="container">
            <div className="special-head">
              <h2 className="section-title">특가 차량, 지금 아니면 놓칩니다!</h2>
              <Link to="/express-deals">더 많은 차량 보기 →</Link>
            </div>
            <div className="special-grid">
              {specialCards.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} source="home-special-offers" />
              ))}
            </div>
            <p className="disclaimer">* 계약 순서에 따라 혜택은 조기 종료될 수 있습니다.</p>
          </div>
        </section>
      )}

      <section className="factory-section trust-section" aria-labelledby="trust-title">
        <div className="container">
          <div className="section-header journey-heading">
            <span className="section-kicker">COMPARE QUOTES</span>
            <h2 className="section-title" id="trust-title">
              같은 차량도 견적은 다를 수 있습니다.
            </h2>
            <p className="section-subtitle">차량과 계약 조건을 맞춘 뒤 제휴사별 견적을 한 화면에서 비교해 보세요.</p>
          </div>
          <div className="quote-compare-card">
            <aside className="quote-vehicle">
              <span className="demo-label">동일 조건 비교 예시</span>
              <img src="/bcs/images/cars/sorento.png" alt="기아 쏘렌토 차량" />
              <strong>쏘렌토 2026년형 가솔린 터보 2.5</strong>
              <dl className="quote-conditions">
                <div>
                  <dt>초기 조건</dt>
                  <dd>선납금 30%</dd>
                </div>
                <div>
                  <dt>계약 기간</dt>
                  <dd>48개월</dd>
                </div>
                <div>
                  <dt>주행 거리</dt>
                  <dd>연 2만km</dd>
                </div>
              </dl>
            </aside>
            <div className="quote-options" aria-label="금융사별 견적 비교 예시">
              <article className="quote-option is-featured">
                <span className="best-chip">BEST</span>
                <p>하나캐피탈</p>
                <strong>월 252,303원</strong>
                <small>선납금 30% · 48개월</small>
              </article>
              <article className="quote-option">
                <p>KB캐피탈</p>
                <strong>월 258,800원</strong>
                <small>선납금 30% · 48개월</small>
              </article>
              <article className="quote-option">
                <p>NH농협캐피탈</p>
                <strong>월 265,400원</strong>
                <small>선납금 30% · 48개월</small>
              </article>
              <p className="data-note">
                표시 금액은 동일 조건 비교를 위한 예시이며 차량 옵션, 심사 결과, 계약 시점에 따라 달라질 수 있습니다.
              </p>
              <button className="btn btn-primary journey-button" type="button" onClick={scrollToComparisonConsult}>
                내 조건으로 비교 시작하기
              </button>
            </div>
          </div>
        </div>
      </section>

      <ConsultBannerForm
        idPrefix="banner-2"
        source="home-zero-fee-banner"
        entryLabel="메인 비교 상담 배너"
        id="comparison-consult"
        variant="journey"
        description="간단한 정보만 입력하면 내 조건에 맞는 견적을 비교할 수 있습니다."
      />

      <section className="longterm-section usage-section" aria-labelledby="usage-title">
        <div className="container">
          <div className="section-header journey-heading journey-heading--dark">
            <span className="section-kicker">HOW TO CHOOSE</span>
            <h2 className="section-title" id="usage-title">
              차를 이용하는 방법은 하나가 아닙니다.
            </h2>
            <p className="section-subtitle">월 납입금뿐 아니라 시작 비용, 관리 방식, 계약 종료 후 선택까지 함께 살펴보세요.</p>
          </div>
          <ol className="usage-grid">
            <li className="usage-item">
              <span>01</span>
              <strong>초기 비용</strong>
              <p>선납금과 보증금 등 시작 조건을 내 자금 계획에 맞춰 비교합니다.</p>
            </li>
            <li className="usage-item">
              <span>02</span>
              <strong>유지 관리</strong>
              <p>보험과 세금, 차량 관리 범위가 상품과 계약 조건에 따라 달라질 수 있습니다.</p>
            </li>
            <li className="usage-item">
              <span>03</span>
              <strong>계약 종료</strong>
              <p>만기 시 반납·인수 등 가능한 선택을 계약 전에 확인합니다.</p>
            </li>
          </ol>
          <button className="btn usage-cta" type="button" onClick={scrollToComparisonConsult}>
            내 조건에 맞는 방식 확인하기
          </button>
        </div>
      </section>

      <section className="compare-section product-section" data-selected-product={product} aria-labelledby="product-title">
        <div className="container">
          <div className="section-header journey-heading">
            <span className="section-kicker">PRODUCT GUIDE</span>
            <h2 className="section-title" id="product-title">
              장기렌트와 리스, 뭐가 나에게 맞을까요?
            </h2>
            <p className="section-subtitle">두 상품의 구조를 먼저 선택하고, 실제 세부 조건은 상담 견적에서 확인하세요.</p>
          </div>
          <div className="product-choices" aria-label="비교할 상품 선택">
            {PRODUCT_CHOICES.map(([value, label, summary]) => (
              <button
                key={value}
                className={`product-choice${product === value ? ' is-active' : ''}`}
                type="button"
                aria-pressed={product === value}
                onClick={() => setProduct(value)}
              >
                <span>{label}</span>
                <strong>{summary}</strong>
                <small>{product === value ? '선택됨' : '선택'}</small>
              </button>
            ))}
          </div>
          <div className="comparison-table-wrap">
            <table className="compare-table product-table">
              <thead>
                <tr>
                  <th>항목</th>
                  <th>장기렌트</th>
                  <th>리스</th>
                </tr>
              </thead>
              <tbody>
                {PRODUCT_ROWS.map(([label, rental, lease]) => (
                  <tr key={label}>
                    <td>{label}</td>
                    <td>{rental}</td>
                    <td>{lease}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="data-note">보험, 정비, 만기 선택은 금융사와 상품 유형에 따라 달라질 수 있으므로 계약 전 세부 조건을 확인해 주세요.</p>
          <button className="btn btn-primary journey-button" type="button" onClick={scrollToComparisonConsult}>
            장기렌트·리스 조건 비교하기
          </button>
        </div>
      </section>

      <section className="partner-section" id="partners">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">제휴 파트너사</h2>
            <p className="section-subtitle">국내 주요 캐피탈·카드사와 함께 더 좋은 조건을 비교합니다.</p>
          </div>
          <div className="partner-viewport">
            <PartnerTrack />
          </div>
        </div>
      </section>

      <section className="lump-section total-section" aria-labelledby="total-title">
        <div className="container">
          <div className="lump-hero">
            <div>
              <span className="section-kicker">TOTAL COST CHECK</span>
              <h2 id="total-title">월 납입금만 보면 놓치는 비용이 있습니다.</h2>
              <p className="section-subtitle">같은 차량과 이용 기간을 기준으로 초기 비용과 유지 항목까지 함께 확인해 보세요.</p>
            </div>
            <div className="total-status">
              <small>장기렌트 월 납입금 (예시)</small>
              <strong>월 484,880원</strong>
              <span>보증금·선납금 0% 기준</span>
            </div>
          </div>
          <div className="total-condition-grid" aria-label="비교 조건">
            {[
              ['차량', '기아 더 뉴 쏘렌토'],
              ['계약 기간', '48개월'],
              ['주행 거리', '연 2만km'],
              ['초기 조건', '보증금·선납금 0%'],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="comparison-table-wrap">
            <table className="lump-table total-table">
              <thead>
                <tr>
                  <th>비용 항목</th>
                  <th>일시불</th>
                  <th>할부</th>
                  <th>장기렌트</th>
                </tr>
              </thead>
              <tbody>
                {TOTAL_ROWS.map(([label, ...values]) => (
                  <tr key={label}>
                    <td>{label}</td>
                    {values.map((value, index) => (
                      <td key={index}>{value}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td>48개월 납부액</td>
                  <td>
                    <strong>47,687,200원</strong>
                  </td>
                  <td>
                    <strong>50,847,200원</strong>
                  </td>
                  <td>
                    <strong>23,274,240원</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="data-note">
            위 금액은 이해를 돕기 위한 예시입니다. 장기렌트는 만기 반납 기준이며 일시불·할부는 차량 소유 및 잔존가치를 포함하지 않은 납부액
            비교입니다. 보험료, 금리, 옵션, 심사 결과에 따라 최종 금액은 달라질 수 있습니다.
          </p>
        </div>
      </section>

      <section className="final-cta" aria-labelledby="final-cta-title">
        <div className="container final-cta__inner">
          <div>
            <span className="section-kicker">READY TO COMPARE</span>
            <h2 id="final-cta-title">어떤 조건이 유리한지 직접 비교해보세요.</h2>
          </div>
          <button className="btn final-cta__button" type="button" onClick={scrollToComparisonConsult}>
            내 차량 견적 받아보기
          </button>
        </div>
      </section>
    </>
  );
};

export default Home;
