import React, { useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import styles from '../advance/MobileAdvance.module.css';
import { contentAPI } from '../../services/contentApi.js';

const FALLBACK_IMAGE = '/placeholder/car.svg';

function MobileBrandBenefitDetail() {
  const { id } = useParams();
  const location = useLocation();
  const initialPromotion = location.state?.promotion ?? null;

  const {
    data: promotions = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['mobile-brand-benefit-detail', id],
    queryFn: () => contentAPI.getBrandPromotions(null, 200),
    enabled: !initialPromotion,
    staleTime: 1000 * 60 * 5,
  });

  const promotion = useMemo(() => {
    if (initialPromotion) return initialPromotion;
    const stringId = String(id ?? '');
    return promotions.find((item) => String(item.id) === stringId) ?? null;
  }, [initialPromotion, promotions, id]);

  const dateText = useMemo(() => {
    if (!promotion) return '';

    const start =
      promotion.startDate ||
      promotion.start_date ||
      promotion.startAt ||
      promotion.start_at ||
      null;
    const end =
      promotion.endDate ||
      promotion.end_date ||
      promotion.endAt ||
      promotion.end_at ||
      null;

    const format = (value) => {
      const d = value ? new Date(value) : null;
      if (!d || Number.isNaN(d.getTime())) return null;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}.${m}.${day}`;
    };

    const startStr = format(start);
    const endStr = format(end);

    if (startStr && endStr) return `${startStr} ~ ${endStr}`;
    if (startStr) return startStr;
    if (endStr) return endStr;
    return '';
  }, [promotion]);

  if (isLoading && !promotion) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loading}>브랜드별 혜택을 불러오는 중입니다...</div>
        </div>
      </div>
    );
  }

  if (isError || !promotion) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.empty}>해당 브랜드 혜택 정보를 찾을 수 없습니다.</div>
        </div>
      </div>
    );
  }

  // 메인 API(MainContentDto)는 topPromotionImage / bottomPromotionImage 필드를 사용
  const topImage =
    promotion.topPromotionImage ||
    promotion.top_promotion_image ||
    promotion.topImageUrl ||
    promotion.top_image_url ||
    promotion.imageUrl ||
    promotion.image_url ||
    FALLBACK_IMAGE;

  const bottomImage =
    promotion.bottomPromotionImage ||
    promotion.bottom_promotion_image ||
    promotion.bottomImageUrl ||
    promotion.bottom_image_url ||
    promotion.subImageUrl ||
    promotion.sub_image_url ||
    topImage;

  const title = promotion.title || promotion.extraInfo || '브랜드별 특가 혜택';
  const subtitle =
    dateText ||
    promotion.subtitle ||
    promotion.description ||
    '브랜드별 상단/하단 프로모션 이미지를 확인해 주세요.';

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* 상단 텍스트 헤더 */}
        <section className={styles.topHeroSection}>
          <div className={`${styles.topHeroInner} ${styles.detailHeroInner}`}>
            <h1 className={`${styles.topHeroTitle} ${styles.detailTitle}`}>{title}</h1>
            <p className={`${styles.topHeroSubtitle} ${styles.detailSubtitle}`}>{subtitle}</p>
          </div>
        </section>

        {/* 상단 프로모션 이미지 */}
        <section className={styles.section}>
          <img
            src={topImage}
            alt={`${title} 상단 프로모션 이미지`}
            style={{ width: '100%', borderRadius: 8, display: 'block' }}
            loading="lazy"
          />
        </section>

        {/* 하단 프로모션 이미지 */}
        <section className={styles.section} style={{ marginTop: 24 }}>
          <img
            src={bottomImage}
            alt={`${title} 하단 프로모션 이미지`}
            style={{ width: '100%', borderRadius: 8, display: 'block' }}
            loading="lazy"
          />
        </section>
      </div>
    </div>
  );
}

export default MobileBrandBenefitDetail;


