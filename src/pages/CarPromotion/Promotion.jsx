import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import styles from './Promotion.module.css';
import { contentAPI } from '../../services/contentApi';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import { getPageSeo } from '../../config/seoConfig';
import Breadcrumb from '../../components/Breadcrumb';

export default function Promotion() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('active');

  // Breadcrumb 항목 정의
  const breadcrumbItems = [
    { label: '홈', link: '/' },
    { label: '국산차 견적내기', link: null }
  ];

  // API로 브랜드 프로모션 데이터 가져오기 (탭에 따라 position 파라미터로 요청)
  const {
    data: promotions,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['brand-promotions', tab],
    queryFn: () => {
      // 탭에 따라 position 설정: 'active' -> 'TOP', 'ended' -> 'BOTTOM'
      const position = tab === 'active' ? 'TOP' : 'BOTTOM';
      return contentAPI.getBrandPromotions(position, 100); // 모든 데이터 가져오기
    },
  });

  // 현재 페이지의 아이템만 표시 (모든 아이템 표시)
  const displayedItems = useMemo(() => {
    if (!promotions) return [];
    return promotions;
  }, [promotions]);

  const { title: seoTitle, description: seoDescription, keywords: seoKeywords } = getPageSeo('promotion');

  // SEO용 대표 이미지: 현재 탭의 첫 프로모션 카드 이미지 사용
  const seoImage = useMemo(() => {
    const first = (displayedItems ?? [])[0];
    if (!first) return undefined;
    return first.imageUrl || first.image_url || undefined;
  }, [displayedItems]);

  return (
    <>
      <SeoHelmet
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        image={seoImage}
      />
    <div className={styles['promo-page']}>
      <div className={styles['breadcrumb-container']}>
    <Breadcrumb items={breadcrumbItems} />
    </div>
      <div className={`${styles['promo-container']} ${tab === 'ended' ? styles['ended'] : ''}`}>
          <div className={styles['promo-header']}>
            <h2 className={styles['promo-title']}>브랜드별 혜택</h2>
            <p className={styles['promo-sub']}>블라인드 카스토리가 제안하는 브랜드 혜택, 지금 확인해보세요</p>
          </div>

          <div className={styles['promo-tabs']}>
            <button
              type="button"
              className={`${styles['promo-tab']} ${tab === 'active' ? styles['active'] : ''}`}
              onClick={() => setTab('active')}
            >
              진행중 기획전
            </button>
            <button
              type="button"
              className={`${styles['promo-tab']} ${tab === 'ended' ? styles['active'] : ''}`}
              onClick={() => setTab('ended')}
            >
              종료된 기획전
            </button>
          </div>

          {isLoading ? (
            <div className={styles['promo-empty']}>프로모션을 불러오는 중입니다...</div>
          ) : isError ? (
            <div className={styles['promo-empty']}>프로모션 정보를 불러오지 못했습니다.</div>
          ) : displayedItems.length === 0 ? (
            <div className={styles['promo-empty']}>표시할 프로모션이 없습니다.</div>
          ) : (
            <div className={styles['promo-grid']}>
              {displayedItems.map((item) => {
                const detailPath = `/promotion/brands/detail/${item.id}`;
                return (
                  <div 
                    key={item.id} 
                    className={styles['promo-card']}
                    onClick={() => navigate(detailPath, { state: { promotion: item } })}
                  >
                    <div className={styles['promo-card-top']}>
                      <img 
                        src={item.imageUrl ?? '/placeholder/car.svg'} 
                        alt={item.title ?? '블라인드 카스토리'}
                      />
                      {item.badges && (
                        <div className={styles['promo-card-badges']}>
                          {item.badges.map((badge, idx) => (
                            <span key={idx} className={styles['badge-item']}>{badge}</span>
                          ))}
                        </div>
                      )}
                      {item.discount && (
                        <div className={styles['promo-card-discount']}>
                          {item.discount}
                        </div>
                      )}
                      {item.condition && (
                        <div className={styles['promo-card-condition']}>
                          {item.condition}
                        </div>
                      )}
                    </div>
                    <div className={styles['promo-card-body']}>
                      <h3>{item.title ?? item.extraInfo ?? '블라인드 카스토리'}</h3>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </div>
    </>
  );
}


