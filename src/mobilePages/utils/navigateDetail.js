import { carAPI } from '../../services/carApi.js';

// 공통 내비게이션 유틸: 전달된 payload(JSON)로 모바일 차량 디테일 페이지로 이동
// 지원 키:
// - 차량 라인 ID: id | carId | vehicleId | vehicleLineId
// - 트림 ID: trim | trimId
// - 옵션 ID 배열: options | optionIds
//
// 규칙:
// 1) trimId 또는 optionIds 가 있으면 -> 가능한 한 차량 라인 상세(/m/car-detail/:vehicleLineId?trimId=...&optionId=...)로 보냄
// 2) vehicleLineId 정보를 못 찾으면 -> trimId 기준으로 carAPI.getCarDetail 호출 후 vehicleLineId를 추론
// 3) 그래도 실패하면 -> /m/search 로 폴백
export async function navigateToDetail(navigate, payload = {}) {
  if (typeof navigate !== 'function') return;

  const {
    carId: carIdRaw,
    id: idRaw,
    vehicleId,
    vehicleLineId,
    trim,
    trimId: trimIdRaw,
    optionIds: optionIdsProp,
    options: optionsProp,
  } = payload || {};

  const baseId = carIdRaw || idRaw || vehicleId || vehicleLineId;
  const trimId = trimIdRaw || trim;

  const optionIdsRaw = optionIdsProp || optionsProp || [];
  const optionIds = Array.isArray(optionIdsRaw) ? optionIdsRaw : [optionIdsRaw].filter(Boolean);

  // 1) 차량 라인 ID가 이미 있는 경우: 바로 /m/car-detail 로 이동
  if (baseId) {
    const q = new URLSearchParams();
    if (trimId) q.set('trimId', trimId);
    optionIds.forEach((v) => q.append('optionId', String(v)));

    const search = q.toString();
    navigate(`/m/car-detail/${encodeURIComponent(String(baseId))}${search ? `?${search}` : ''}`);
    return;
  }

  // 2) 차량 라인 ID는 없고 trimId만 있는 경우: trim 상세에서 vehicleLineId 조회
  if (trimId) {
    try {
      const detail = await carAPI.getCarDetail(trimId);
      const vehicleLineIdFromDetail =
        detail?.vehicleLineId ||
        detail?.vehicleLine?.id ||
        detail?.vehicle?.id ||
        detail?.carLineId ||
        null;

      if (vehicleLineIdFromDetail) {
        const q = new URLSearchParams();
        q.set('trimId', trimId);
        optionIds.forEach((v) => q.append('optionId', String(v)));

        const search = q.toString();
        navigate(
          `/m/car-detail/${encodeURIComponent(String(vehicleLineIdFromDetail))}${
            search ? `?${search}` : ''
          }`,
        );
        return;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[navigateToDetail] 차량 상세 조회 실패', error);
    }
  }

  // 3) 그 외에는 검색 페이지로 폴백
  navigate('/m/search');
}

export default navigateToDetail;

