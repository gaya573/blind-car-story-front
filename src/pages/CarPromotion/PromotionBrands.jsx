import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Breadcrumb from '../../components/Breadcrumb';
import PromotionCard from '../../components/PromotionCard';
import styles from './PromotionBrands.module.css';
import { contentAPI } from '../../services/contentApi';
import { useCarBrandsQuery } from '../../hooks/queries/carQueries';

export default function PromotionBrands() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') || 'active');
  const [brand, setBrand] = useState(searchParams.get('maker') || '전체');

  // 브랜드 API 호출
  const { data: brandsData = [] } = useCarBrandsQuery();

  const breadcrumbItems = useMemo(
    () => [
      { label: '홈', link: '/' },
      { label: '할인 프로모션', link: '/promotion' },
      { label: '브랜드별 혜택 전체' },
    ],
    [],
  );

  const {
    data: promotions,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['brand-promotions', tab, { brand }],
    queryFn: () => {
      // 탭에 따라 position 설정: 'active' -> 'TOP', 'ended' -> 'BOTTOM'
      const position = tab === 'active' ? 'TOP' : 'BOTTOM';
      return contentAPI.getBrandPromotions(position, 100);
    },
  });

  // 프로모션 데이터에서 브랜드 정보 추출 (title 기준)
  const promotionBrands = useMemo(() => {
    if (!promotions || !brandsData) return [];
    
    const brandSet = new Set();
    
    promotions.forEach((promo) => {
      // extraInfo(추가정보) 우선
      if (promo.extraInfo) {
        brandSet.add(promo.extraInfo);
        return;
      }
      // fallback: title에서 브랜드 이름 추출
      if (promo.title) {
        const title = promo.title;
        let matched = false;
        for (const brandItem of brandsData) {
          if (title.includes(brandItem.name)) {
            brandSet.add(brandItem.name);
            matched = true;
            break;
          }
        }
        // 공식 브랜드명을 찾지 못하면 title 자체를 사용
        if (!matched) {
          brandSet.add(title);
        }
      }
    });
    
    return Array.from(brandSet).sort();
  }, [promotions, brandsData]);

  // 브랜드 목록 생성 (프로모션 중인 브랜드만)
  const BRANDS = useMemo(() => {
    return ['전체', ...promotionBrands];
  }, [promotionBrands]);

  const displayed = useMemo(() => {
    if (!promotions) return [];
    if (brand === '전체') return promotions;
    
    // 브랜드 필터링: extraInfo(추가정보) 우선, 그 다음 title
    return promotions.filter((item) => {
      // 추가정보 기준
      if (item.extraInfo && (item.extraInfo === brand || item.extraInfo.includes(brand))) return true;
      // fallback: 제목 기준
      if (item.title && (item.title === brand || item.title.includes(brand))) return true;
      return false;
    });
  }, [promotions, brand]);

  const handleSelectBrand = (next) => {
    setBrand(next);
    const p = new URLSearchParams(searchParams);
    if (next === '전체') p.delete('maker'); else p.set('maker', next);
    setSearchParams(p, { replace: true });
  };

  const isEnded = tab === 'ended';

  return (
    <div className={styles['promo-page']}>
      <div className={`${styles['promo-container']} ${isEnded ? styles['ended'] : ''}`}>
        <Breadcrumb items={breadcrumbItems} />

        <div className={styles['promo-header']}>
          <h2 className={styles['promo-title']}>브랜드별 혜택 전체</h2>
          <p className={styles['promo-sub']}>브랜드 선택 후, 진행중/종료된 기획전을 확인하세요</p>
         
        </div>

        <div className={styles['brand-bar']} role="listbox" aria-label="브랜드 선택">
          <div className={styles['brand-scroller']}>
            {BRANDS.map((b) => (
              <button
                key={b}
                type="button"
                className={`${styles['brand-pill']} ${brand === b ? styles['selected'] : ''}`}
                aria-selected={brand === b}
                onClick={() => handleSelectBrand(b)}
              >
                <div className={styles['brand-circle']} aria-hidden="true" />
                <span className={styles['brand-label']}>{b}</span>
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className={styles['promo-empty']}>프로모션을 불러오는 중입니다...</div>
        ) : isError ? (
          <div className={styles['promo-empty']}>프로모션 정보를 불러오지 못했습니다.</div>
        ) : displayed.length === 0 ? (
          <div className={styles['promo-empty']}>표시할 프로모션이 없습니다.</div>
        ) : (
          <div className={styles['promo-grid']}>
            {displayed.map((item) => {
              const handleNavigate = () => {
                const detailPath = `/promotion/brands/detail/${item.id}`;
                navigate(detailPath, { state: { promotion: item } });
              };
              return (
                <PromotionCard
                  key={item.id}
                  id={item.id}
                  name={item.title ?? item.extraInfo ?? '블라인드 카스토리'}
                  desc={item.subtitle ?? item.description ?? ''}
                  img={item.imageUrl ?? '/placeholder/car.svg'}
                  brand={item.extraInfo ?? '블라인드 카스토리'}
                  onClick={handleNavigate}
                  buttonText="혜택 상담 받기"
                  ended={isEnded}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


