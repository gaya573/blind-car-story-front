import { useQueries } from '@tanstack/react-query';
import { contentAPI } from '../../services/contentApi';
import { coalitionAPI, COALITION_PAGE_TYPE } from '../../services/coalitionApi';

const staleTime = 1000 * 60; // 1분

export const useHomeContent = () => {
  const queryResults = useQueries({
    queries: [
      {
        queryKey: ['coalition', 'banners', 'main-hero'],
        // 메인 히어로 배너: 제휴사 어드민의 "메인 홈" 배너만 사용
        queryFn: () => coalitionAPI.getBanners(COALITION_PAGE_TYPE.MAIN),
        staleTime,
      },
      {
        queryKey: ['content', 'closing-soon'],
        queryFn: () => contentAPI.getClosingSoon(10), // 관리자가 선택한 마감임박 차량 사용
        staleTime,
      },
      {
        queryKey: ['content', 'top-cars'],
        queryFn: () => contentAPI.getTopCars(),
        staleTime,
      },
      {
        queryKey: ['promotions', 'brand', { position: 'TOP' }],
        queryFn: () => contentAPI.getBrandPromotions('TOP'),
        staleTime,
      },
      {
        queryKey: ['inventory', 'urgent', { limit: 8 }],
        queryFn: () => contentAPI.getUrgentInventory(),
        staleTime,
      },
      {
        queryKey: ['prepurchase', 'hot-deals', { limit: 100 }],
        // 선구매 핫딜 전체: /api/content/pre-purchase?limit=100
        queryFn: () => contentAPI.getHotDeals(100),
        staleTime,
      },
    ],
  });

  const [heroBanner, closingSoon, topCars, brandPromotions, urgentInventory, hotDeals] = queryResults;

  return {
    heroBanner,
    closingSoon,
    topCars,
    brandPromotions,
    urgentInventory,
    hotDeals,
  };
};


