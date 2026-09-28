import React, { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import styles from '../advance/MobileAdvance.module.css';
import mobileMainStyles from '../main/MobleMain.module.css';
import { contentAPI } from '../../services/contentApi.js';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import { getPageSeo } from '../../config/seoConfig';
import Event from '../../components/mobileMain/Event.jsx';
import { sendToKakaoOnly } from '../../services/consultHelper';
import { setStoredUserPhone } from '../../utils/phoneStorage';

const FALLBACK_IMAGE = '/placeholder/car.svg';

function MobileBrandBenefits() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('active');
  const [eventSubmitting, setEventSubmitting] = useState(false);

  const { data: promotions = [] } = useQuery({
    queryKey: ['mobile-brand-benefits', tab],
    // 데스크탑 /promotion 과 동일하게 탭에 따라 position=TOP/BOTTOM 조회
    queryFn: () => {
      const position = tab === 'active' ? 'TOP' : 'BOTTOM';
      return contentAPI.getBrandPromotions(position, 100);
    },
    staleTime: 1000 * 60 * 5,
  });

  const cards = useMemo(() => {
    return (promotions || []).map((item) => {
      const brandName = item.extraInfo || item.brandName || item.brand?.name || '블라인드 카스토리';
      const title = item.title || `${brandName} 프로모션`;
      const subtitle = item.subtitle || item.description || '지금 계약 시, 인기 브랜드 즉시 출고 혜택';
      const image = item.imageUrl || item.image_url || FALLBACK_IMAGE;

      return {
        id: item.id?.toString() || `brand-benefit-${Math.random()}`,
        title,
        subtitle,
        image,
        badgeText: brandName,
        badgeVariant: 'yellow',
        promotion: item,
      };
    });
  }, [promotions]);

  // SEO용 대표 이미지: 현재 탭의 첫 브랜드 혜택 카드 이미지 사용
  const seoImage = useMemo(() => {
    const first = cards[0];
    if (!first) return undefined;
    return first.image || undefined;
  }, [cards]);

  const sanitizePhone = useCallback((value) => {
    if (!value) return '';
    const str = String(value).trim();
    return str.length > 30 ? str.slice(0, 30) : str;
  }, []);

  const persistContactInfo = useCallback((phoneValue, nameValue) => {
    const sanitized = sanitizePhone(phoneValue);
    if (sanitized) {
      setStoredUserPhone(sanitized);
    }
    if (nameValue) {
      localStorage.setItem('wgl_user_name', nameValue);
    }
  }, [sanitizePhone]);

  const handleEventSubmit = useCallback(
    async ({ name, phone, carModel }) => {
      setEventSubmitting(true);
      try {
        const payload = {
          name: name || '',
          phone: sanitizePhone(phone || ''),
          carModel: carModel || '',
          consultType: '이벤트상담',
          source: 'mobile-brand-benefits',
          entryLabel: 'mobile-brand-benefits > 이벤트 섹션',
        };

        const result = await sendToKakaoOnly(payload);

        if (result?.success) {
          persistContactInfo(payload.phone, payload.name);
          alert('신청이 완료되었습니다.');
        } else {
          alert(result?.message || '상담 신청에 실패했습니다. 다시 시도해주세요.');
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[MobileBrandBenefits] 이벤트 상담 신청 실패', error);
        alert('상담 신청에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setEventSubmitting(false);
      }
    },
    [persistContactInfo, sanitizePhone],
  );

  return (
    <>
      <SeoHelmet
        {...getPageSeo('promotion')}
        image={seoImage}
      />
    <div className={styles.page}>
      <div className={styles.container}>
        {/* 상단 헤더 영역 */}
        <section className={styles.topHeroSection}>
          <div className={styles.topHeroInner}>
            <img
              src="/mobile/brand.svg"
              alt="브랜드별 특가 혜택"
              className={styles.topHeroImage}
              loading="lazy"
            />
            <h1 className={styles.topHeroTitle}>
              <span className={styles.topHeroTitleEm}>브랜드별</span>
              <span>특가 혜택</span>
            </h1>
            <p className={styles.topHeroSubtitle}>
              지금 계약 시, 인기 브랜드별 즉시 출고 혜택을 한눈에 확인해 보세요.
            </p>
          </div>
        </section>

        {/* 진행중 / 종료된 기획전 탭 */}
        <div className={styles.brandTabs}>
          <button
            type="button"
            className={`${styles.brandTab} ${tab === 'active' ? styles.brandTabActive : ''}`}
            onClick={() => setTab('active')}
          >
            진행중 기획전
          </button>
          <button
            type="button"
            className={`${styles.brandTab} ${tab === 'ended' ? styles.brandTabActive : ''}`}
            onClick={() => setTab('ended')}
          >
            종료된 기획전
          </button>
        </div>

        {/* 브랜드별 혜택 리스트 (세로 카드 리스트) */}
        <section className={styles.dealSection}>
          {cards.length === 0 ? (
            <div className={styles.emptyText}>
              {tab === 'active' ? '현재 진행 중인 브랜드별 혜택이 없습니다.' : '종료된 기획전이 없습니다.'}
            </div>
          ) : (
            <div className={styles.brandList}>
              {cards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className={styles.brandRow}
                  onClick={() => navigate(`/m/brand/detail/${card.id}`, { state: { promotion: card.promotion } })}
                >
                  <img
                    src={card.image}
                    alt={card.title}
                    className={styles.brandRowImage}
                    loading="lazy"
                  />
                  <div className={styles.brandRowInfo}>
                    <div className={styles.brandRowTitle}>{card.title}</div>
                  
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
    <Event
      styles={mobileMainStyles}
      onSubmitEvent={handleEventSubmit}
      isSubmitting={eventSubmitting}
      variant="yellow"
    />
    </>
  );
}

export default MobileBrandBenefits;


