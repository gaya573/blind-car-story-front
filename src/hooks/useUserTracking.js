import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { analyzeReferrer, getOrCreateDeviceId, sendAnalyticsData } from '../utils/analyticsUtils';

// 간단한 throttle 함수 (lodash 없이)
const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
};

export const useUserTracking = () => {
  const location = useLocation();
  const maxScrollRef = useRef(0);
  const [previousPath, setPreviousPath] = useState('entry');
  
  // 섹션 추적용
  const currentSectionRef = useRef(null);

  // 1. 초기화 및 유입 경로 분석
  useEffect(() => {
    getOrCreateDeviceId();
    analyzeReferrer();
  }, []);

  // 2. 스크롤 깊이 + 섹션 뷰 추적
  useEffect(() => {
    const handleScroll = () => {
      // (1) Max Scroll Depth 계산
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
      
      if (scrollPercent > maxScrollRef.current) {
        maxScrollRef.current = scrollPercent;
      }

      // (2) 현재 보고 있는 섹션(Component) 감지
      // DOM에서 data-analytics-id 속성이 있는 요소를 찾음
      const viewportCenter = scrollTop + (window.innerHeight / 2);
      const sections = document.querySelectorAll('[data-analytics-id]');
      
      let visibleSectionId = null;

      sections.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const elTop = rect.top + scrollTop;
        const elBottom = rect.bottom + scrollTop;

        if (elTop <= viewportCenter && elBottom >= viewportCenter) {
          visibleSectionId = el.getAttribute('data-analytics-id');
        }
      });
      
      // 섹션이 변경되었을 때 로그 전송
      if (visibleSectionId && visibleSectionId !== currentSectionRef.current) {
        // 이전 섹션이 있었다면, 그 섹션의 체류시간 전송
        if (currentSectionRef.current) {
           sendAnalyticsData('section_view', {
               sectionId: currentSectionRef.current,
               scrollTop: Math.round(scrollTop),
               path: location.pathname
           });
        }
        
        // 새로운 섹션 시작
        currentSectionRef.current = visibleSectionId;
      }
    };

    const throttledScroll = throttle(handleScroll, 500); // 0.5초마다 체크
    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    return () => {
        window.removeEventListener('scroll', throttledScroll);
        // 컴포넌트 언마운트 시 마지막 섹션 데이터 전송은 handleBeforeUnload나 page_leave에서 처리됨
    };
  }, [location.pathname]);

  // 3. 페이지 변경 감지 (진입/이탈)
  useEffect(() => {
    // (A) 이전 페이지 이탈 로그
    if (previousPath !== location.pathname) {
        // 직전 페이지에서 마지막으로 보고 있던 섹션 로그 처리
        if (currentSectionRef.current) {
            // 섹션 뷰 전송 (페이지 떠나면서)
            sendAnalyticsData('section_view', {
                sectionId: currentSectionRef.current,
                scrollTop: Math.round(window.scrollY),
                path: previousPath
            });
        }

        if (previousPath !== 'entry') { // 첫 진입이 아닐 때만 page_leave 전송
             sendAnalyticsData('page_leave', {
                path: previousPath,
                maxScrollDepth: maxScrollRef.current,
                exitType: 'navigate_internal'
            });
        }
    }

    // (B) 새 페이지 진입 로그 (from -> to)
    sendAnalyticsData('page_view', {
        title: document.title,
        fromPath: previousPath,
        toPath: location.pathname
    });

    // 상태 초기화
    maxScrollRef.current = 0;
    currentSectionRef.current = null; // 페이지 바뀌면 섹션 리셋
    setPreviousPath(location.pathname);

  }, [location.pathname]);

  // 3-1. 페이지 진입 후 2초 이상 머문 위치(스크롤 높이) 스냅샷
  // - 사용자 입장에서 "실제로 본 위치"를 대략적으로 파악하기 위한 용도
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window === 'undefined' || typeof document === 'undefined') return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      const docHeight = document.documentElement.scrollHeight - viewportHeight;
      const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;

      sendAnalyticsData('height_view', {
        path: location.pathname,
        pageTitle: document.title,
        scrollTop: Math.round(scrollTop),
        viewportHeight,
        scrollPercent,
      });
    }, 2000); // 2초 뒤에 한 번만 측정

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // 4. 탭 닫기/새로고침 시 이탈 로그
  useEffect(() => {
    const handleBeforeUnload = () => {
      // 마지막 섹션 정보
      if (currentSectionRef.current) {
           sendAnalyticsData('section_view', {
               sectionId: currentSectionRef.current,
               path: location.pathname
           });
      }

      sendAnalyticsData('session_exit', {
        path: location.pathname,
        maxScrollDepth: maxScrollRef.current,
        exitType: 'browser_close'
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
         sendAnalyticsData('app_background', {
            path: location.pathname,
            maxScrollDepth: maxScrollRef.current
         });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname]);

  // 5. 클릭 추적
  useEffect(() => {
    const handleClick = (e) => {
        const target = e.target.closest('button, a, [data-analytics-click]');
        
        if (target) {
            let label = target.innerText || target.getAttribute('aria-label') || target.getAttribute('alt') || '';
            if (!label && target.querySelector('img')) {
                label = 'image_link';
            }
            if (label.length > 50) label = label.substring(0, 50) + '...';

            sendAnalyticsData('click', {
                elementType: target.tagName,
                elementText: label,
                elementId: target.id || null,
                elementClass: target.className || null,
                targetUrl: target.href || null,
                pageTitle: document.title
            });
        }
    };

    window.addEventListener('click', handleClick, { capture: true });
    return () => window.removeEventListener('click', handleClick, { capture: true });
  }, []);
};
