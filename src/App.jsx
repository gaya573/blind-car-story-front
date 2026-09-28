import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useParams, useNavigate } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import QuickConsult from './components/layout/QuickConsult';
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
import { MobleBottom }   from './components/MobleBottom.jsx';
import MobileHeader from './components/MobleHeader.jsx';
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
    <div className="app">
      <Header />
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
      <Footer />
      {!isAuthPage && <QuickConsult />}
    </div>
  );
}

function MobileApp() {
  const location = useLocation();
  const isMainPage = location.pathname === '/m' || location.pathname === '/m/';
  const isSearchPage = location.pathname.startsWith('/m/search');
  const shouldHideHeader = isMainPage || isSearchPage;

  return (
    <div className="mobile-app">
      {!shouldHideHeader && <MobileHeader />}
      <div className="mobile-app-content">
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
      </div>
      {/* 모바일에서는 항상 하단 네비게이션 노출 (고정 하단) */}
      <MobleBottom />
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

  return isMobile ? <MobileApp /> : <WebApp />;
}

export default App; 