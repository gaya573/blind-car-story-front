import React, { useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import styles from './BrandDetail.module.css';
import { contentAPI } from '../../services/contentApi';
import ConsultBanner from '../../components/ConsultBanner';
import { submitConsult, KAKAO_OAUTH_CANCELLED_MESSAGE } from '../../services/consultHelper';
import { handleKakaoPopupBlocked, KAKAO_POPUP_BLOCKED_MESSAGE } from '../../utils/kakaoPopup';

const FALLBACK_IMAGE = '/placeholder/car.svg';

/**
 * 브랜드별 혜택 데스크탑 상세 페이지
 * - /promotion, /promotion/brands 에서 진입
 * - 모바일 `MobileBrandBenefitDetail` 과 동일한 느낌의 단순한 비주얼 레이아웃
 * - 상단/하단 프로모션 이미지를 크게 보여주는 전용 페이지
 */
function BrandPromotionDetail() {
  const { id } = useParams();
  const location = useLocation();
  const initialPromotion = location.state?.promotion ?? null;

  const {
    data: promotions = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['brand-promotion-detail', id],
    queryFn: () => contentAPI.getBrandPromotions(null, 200),
    enabled: !initialPromotion,
    staleTime: 1000 * 60 * 5,
  });

  const promotion = useMemo(() => {
    if (initialPromotion) return initialPromotion;
    const stringId = String(id ?? '');
    return promotions.find((item) => String(item.id) === stringId) ?? null;
  }, [initialPromotion, promotions, id]);

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
    promotion.subtitle ||
    promotion.description ||
    '브랜드별 상단/하단 프로모션 이미지를 확인해 주세요.';

  const handleConsultSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name') || '';
    const phone = formData.get('phone') || '';
    const carModel = formData.get('carModel') || '';

    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        model: carModel.trim(),
        consultType: '브랜드상세',
        source: 'brand-promotion-detail',
        entryLabel: `브랜드 상세 > ${title}`,
      };

      const result = await submitConsult(payload, {
        openKakaoOnSuccess: true,
        kakaoOpenTarget: '_blank',
      });

      const handled = handleKakaoPopupBlocked(result, {
        onNeedContact: () => {
          alert(KAKAO_POPUP_BLOCKED_MESSAGE);
        },
      });

      if (handled) {
        return;
      }

      if (result?.success) {
        e.target.reset();
        alert('상담 신청이 완료되었습니다.');
      } else if (result?.meta?.kakaoCancelled) {
        alert(KAKAO_OAUTH_CANCELLED_MESSAGE);
      }
    } catch (error) {
      console.error('[BrandPromotionDetail] 상담 신청 실패', error);
      alert('상담 신청에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* 상단 텍스트 헤더 */}
        <section className={styles.topHeroSection}>
          <div className={styles.topHeroInner}>
            <h1 className={styles.topHeroTitle}>{title}</h1>
            <p className={styles.topHeroSubtitle}>{subtitle}</p>
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

        {/* 상담 배너 */}
        <ConsultBanner styles={styles} onSubmit={handleConsultSubmit} />

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

export default BrandPromotionDetail;


