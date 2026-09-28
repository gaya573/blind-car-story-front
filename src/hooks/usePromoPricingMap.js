import { useEffect, useState } from 'react';
import { contentAPI } from '../services/contentApi';

// 홈/프로모션 영역에서 사용되는 trimId -> 가격 정보 매핑 훅
export function usePromoPricingMap(promoSourceItems) {
  const [promoPriceMap, setPromoPriceMap] = useState({});

  useEffect(() => {
    const trimIds = Array.from(
      new Set(
        (promoSourceItems || [])
          .map((item) => item?.trimId ?? item?.trim_id)
          .filter((id) => id !== null && id !== undefined),
      ),
    );

    if (trimIds.length === 0) {
      setPromoPriceMap({});
      return;
    }

    let cancelled = false;

    const fetchPricing = async () => {
      try {
        const pricingList = await contentAPI.getPromoPricing(trimIds);
        if (cancelled) return;

        const nextMap = {};
        pricingList.forEach((item) => {
          if (!item || item.trimId == null) return;
          nextMap[String(item.trimId)] = {
            basePrice: item.basePrice ?? null,
            finalPrice: item.finalPrice ?? item.basePrice ?? null,
            discountPercent: item.discountPercent ?? null,
            monthlyRentalFee: item.monthlyBase ?? null,
            discountedMonthlyFee: item.monthlyFinal ?? null,
            monthlyDiscountPercent: item.monthlyDiscountPercent ?? null,
          };
        });
        setPromoPriceMap(nextMap);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[usePromoPricingMap] 프로모션 가격 정보 로드 실패', error);
      }
    };

    fetchPricing();

    return () => {
      cancelled = true;
    };
  }, [promoSourceItems]);

  return promoPriceMap;
}


