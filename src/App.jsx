import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useParams, useNavigate } from 'react-router-dom';
import { PcHeader, PcFooter, QuickConsultAside } from './bcs/layout/PcLayout';
import { MobileBottomNav } from './bcs/layout/MobileLayout';
import { BcsUiProvider } from './bcs/BcsUiContext';
import Home from './pages/Home/Home';
import CarList from './pages/Car/CarList';
import CarLineDetail from './pages/Car/CarLineDetail';
import CarTrimDetail from './pages/Car/CarTrimDetail';
import ExpressDealDetail from './pages/ExpressDeals/ExpressDealDetail';
import ExpressDeals from './pages/ExpressDeals/ExpressDeals';
import ExpressDealsAll from './pages/ExpressDeals/ExpressDealsAll';
import Promotion from './pages/CarPromotion/Promotion';
import PromotionBrands from './pages/CarPromotion/PromotionBrands';
import BrandPromotionDetail from './pages/CarPromotion/BrandPromotionDetail.jsx';
import Review from './pages/Review/Review';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import PrivacyPolicy from './pages/auth/PrivacyPolicy';
import {  MobleMain, MobleCarSearch, MobleCarDetail } from './mobilePages/main/index.js';
import { MobleCarBrandSearch, MobileBrandBenefits, MobileBrandBenefitDetail  } from './mobilePages/brand/index.js';
import MobileReview from './mobilePages/Review/MobileReview.jsx';
import MobileReviewDetail from './mobilePages/Review/MobileReviewDetail.jsx';
import MobileSearch from './mobilePages/search/MobileSearch.jsx';
import MobileAdvance from './mobilePages/advance/MobileAdvance.jsx';
import MobileAdvanceAll from './mobilePages/advance/MobileAdvanceAll.jsx';
import MobileMenu from './mobilePages/menu/MobileMenu.jsx';

// 전역 스타일 최소화: 리셋/변수만 유지. 페이지/컴포넌트 스타일은 모두 CSS Modules로 격리
import './App.css';
// 퍼블리싱(design/publishing-step2-1) 스타일은 레거시 전역 스타일 뒤에 둔다.
import './styles/bcs-index.css';
import MobleCarSearchResult from './mobilePages/main/MobleCarSearchResult.jsx';
import { useUserTracking } from './hooks/useUserTracking';

const LegacyCarDetailRedirect = () => {
  const { carId } = useParams();

  if (!carId) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={`/car-detail/trim/${carId}`} replace />;
};
function WebApp() {
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith('/auth');
  
  return (
    <div className="bcs-app">
      <a className="skip-link" href="#main-content">본문 바로가기</a>
      <PcHeader />
      <main id="main-content">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/carlist" element={<Navigate to="/carlist/domestic" replace />} />
        <Route path="/carlist/:carType" element={<CarList />} />
        <Route path="/car-detail/car/:carId" element={<CarLineDetail />} />
        <Route path="/car-detail/trim/:trimId" element={<CarTrimDetail />} />
        <Route path="/car-detail/:carId" element={<LegacyCarDetailRedirect />} />
        <Route path="/express-deals" element={<ExpressDeals />} />
        <Route path="/express-deals/all" element={<ExpressDealsAll />} />
        <Route path="/express-deals/detail/:carId" element={<ExpressDealDetail />} />
        <Route path="/promotion" element={<Promotion />} />
        <Route path="/promotion/brands" element={<PromotionBrands />} />
        <Route path="/promotion/brands/detail/:id" element={<BrandPromotionDetail />} />
        <Route path="/review" element={<Review />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<Signup />} />
        <Route path="/auth/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </main>
      <PcFooter />
      {!isAuthPage && <QuickConsultAside />}
    </div>
  );
}

function MobileApp() {
  // 모바일 헤더는 페이지마다 다르다(메인: m-header + m-tabs, 하위: m-sub).
  // 퍼블리싱처럼 헤더가 <main> 밖에 오도록 각 페이지가 헤더와 <main id="main-content"> 를 직접 그린다.
  return (
    <div className="bcs-mobile-app">
      <a className="skip-link" href="#main-content">본문 바로가기</a>
        <Routes>
        <Route path="/m" element={<MobleMain />} />
        <Route path="/m/menu" element={<MobileMenu />} />
        <Route path="/m/search" element={<MobleCarSearch />} />
        <Route path="/m/search/find" element={<MobileSearch />} />
        <Route path="/m/advance" element={<MobileAdvance />} />
        <Route path="/m/advance/all" element={<MobileAdvanceAll />} />
        <Route path="/m/brand" element={<MobileBrandBenefits />} />
        <Route path="/m/brand/detail/:id" element={<MobileBrandBenefitDetail />} />
        <Route path="/m/brand/search" element={<MobleCarBrandSearch />} />
        <Route path="/m/search/results" element={<MobleCarSearchResult />} />
        <Route path="/m/car-detail/:carId" element={<MobleCarDetail />} />
        {/* 이전 선구매 요약 페이지(/m/advance/detail)는 더 이상 사용하지 않음 */}
        <Route path="/m/review" element={<MobileReview />} />
        <Route path="/m/review/:id" element={<MobileReviewDetail />} />
        
        <Route path="/m/auth/login" element={<Login />} />
        <Route path="/m/auth/signup" element={<Signup />} />
        <Route path="/m/auth/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="*" element={<Navigate to="/m" replace />} />
      </Routes>
      <MobileBottomNav />
    </div>
  );
}

function App() {
  useUserTracking(); // 유저 행동 데이터 수집 시작

  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileViewport, setIsMobileViewport] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false,
  );

  // 뷰포트가 일정 이하(모바일 브레이크포인트)일 때는 어떤 화면이든 무조건 /m 으로 이동
  // - CSS 반응형 기준과 맞춰서 768px 이하를 모바일로 간주
  // - 경로 변경 뿐 아니라 리사이즈 / 방향 전환에도 항상 평가
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const evaluateAndRedirect = () => {
      const isMobilePath = location.pathname.startsWith('/m');
      const isMobile = window.innerWidth <= 768;

      // 뷰포트 기준 상태도 함께 업데이트 (초기 진입 시에도 즉시 반영)
      setIsMobileViewport(isMobile);

      // 화면이 768px 이하인데 /m 이 아니면 항상 /m 으로 리다이렉트
      if (isMobile && !isMobilePath) {
        navigate('/m', { replace: true });
      }
    };

    // 최초 마운트 / 경로 변경 시 한 번 평가
    evaluateAndRedirect();

    // 리사이즈 / 방향 전환 시에도 항상 재평가
    window.addEventListener('resize', evaluateAndRedirect);
    window.addEventListener('orientationchange', evaluateAndRedirect);

    return () => {
      window.removeEventListener('resize', evaluateAndRedirect);
      window.removeEventListener('orientationchange', evaluateAndRedirect);
    };
  }, [location.pathname, navigate]);

  const isMobilePath = location.pathname.startsWith('/m');
  const isMobile = isMobilePath || isMobileViewport;

  // SPA 이동은 스크롤 위치를 유지하므로, 다른 페이지로 넘어가면 퍼블리싱(페이지 이동)처럼 맨 위에서 시작한다.
  useEffect(() => {
    if (!location.hash) window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

  // 퍼블리싱 CSS는 body.pc-page / body.mobile-page 를 기준으로 PC·모바일 스타일을 나눈다.
  useLayoutEffect(() => {
    document.body.classList.toggle('pc-page', !isMobile);
    document.body.classList.toggle('mobile-page', isMobile);
    document.documentElement.classList.toggle('pc-html', !isMobile);
    document.documentElement.classList.toggle('mobile-html', isMobile);
  }, [isMobile]);

  return <BcsUiProvider>{isMobile ? <MobileApp /> : <WebApp />}</BcsUiProvider>;
}

export default App; 