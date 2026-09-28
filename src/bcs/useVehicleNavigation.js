import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { navigateToCarTrimDetail } from '../utils/navigateToCarDetail';
import { navigateToDetail } from '../mobilePages/utils/navigateDetail';

/**
 * 차량 카드를 눌렀을 때 PC는 트림 상세, 모바일은 차량 라인 상세로 보낸다.
 * vehicle 은 toVehicleCardModel 결과를 받는다.
 */
export function useVehicleNavigation() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isMobile = pathname.startsWith('/m');

  return useCallback(
    (vehicle) => {
      if (!vehicle) return;
      if (isMobile) {
        navigateToDetail(navigate, { vehicleLineId: vehicle.vehicleLineId, trimId: vehicle.trimId });
        return;
      }
      if (vehicle.trimId) {
        navigateToCarTrimDetail(navigate, vehicle.trimId, {
          brand: vehicle.brandName,
          model: vehicle.vehicleName,
        });
      }
    },
    [isMobile, navigate],
  );
}
