import { carAPI } from '../services/carApi';

export async function navigateToCarLineDetail(navigate, trimId) {
  if (!trimId || typeof navigate !== 'function') return;

  try {
    const detail = await carAPI.getCarDetail(trimId);
    const vehicleLineId =
      detail?.vehicleLineId ??
      detail?.vehicleLine?.id ??
      null;

    if (vehicleLineId) {
      const url = `/car-detail/car/${encodeURIComponent(String(vehicleLineId))}?trimId=${encodeURIComponent(
        String(trimId),
      )}`;
      navigate(url);
      return;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[navigateToCarLineDetail] 차량 라인 상세 이동 중 오류, 트림 상세로 폴백', error);
  }
}

export async function navigateToCarTrimDetail(
  navigate,
  trimId,
  { brand, model, terms, consultType = '트림상세', source = 'car-trim-detail' } = {},
) {
  if (!trimId || typeof navigate !== 'function') return;

  try {
    const detail = await carAPI.getCarDetail(trimId);
    const params = new URLSearchParams();
    params.set('trimId', String(trimId));

    const vehicleLineId =
      detail?.vehicleLineId ??
      detail?.vehicleLine?.id ??
      detail?.trims?.[0]?.vehicleLineId ??
      null;
    if (vehicleLineId) {
      params.set('vehicleLineId', String(vehicleLineId));
    }

    params.set('brand', brand ?? detail?.brandName ?? '');
    params.set('model', model ?? detail?.name ?? detail?.vehicleLineName ?? '');

    if (terms) {
      params.set('terms', terms);
    }
    params.set('consultType', consultType);
    params.set('source', source);

    const url = `/car-detail/trim/${encodeURIComponent(String(trimId))}?${params.toString()}`;
    navigate(url);
  } catch (error) {
    console.error('[navigateToCarTrimDetail] 트림 상세 이동 중 오류', error);
  }
}
