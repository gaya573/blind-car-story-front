import React, { useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import styles from './MobileReviewDetail.module.css';
import MobileContactModal from '../../components/MobileContactModal.jsx';
import ConsultSuccessModal from '../../components/ConsultSuccessModal.jsx';
import { contentAPI } from '../../services/contentApi.js';

const FALLBACK_IMAGE = '/placeholder/car.svg';

const normalizeId = (value) => {
  if (value === null || value === undefined) return null;
  const stringified = String(value).trim();
  return stringified.length > 0 ? stringified : null;
};

const pickReviewTrimId = (review) =>
  normalizeId(
    review?.trimId ??
      review?.trim_id ??
      review?.trim?.id ??
      review?.vehicleTrimId ??
      review?.vehicleLineTrimId ??
      review?.carTrimId ??
      review?.trimCode ??
      null,
  );

const pickReviewVehicleLineId = (review) =>
  normalizeId(
    review?.vehicleLineId ??
      review?.vehicleLine?.id ??
      review?.vehicle?.id ??
      review?.carLineId ??
      review?.vehicleLineID ??
      null,
  );

export default function MobileReviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const stateReview = location.state?.review;
  const [isNavigating, setIsNavigating] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // API로 리뷰 상세 가져오기
  const { data: reviewData, isLoading } = useQuery({
    queryKey: ['mobile-review-detail', id],
    queryFn: async () => {
      const reviews = await contentAPI.getReviews(100);
      return reviews.find(r => String(r.id) === String(id)) || stateReview || null;
    },
    enabled: Boolean(id) && !stateReview,
    staleTime: 1000 * 60,
  });

  const data = stateReview || reviewData;

  const reviewTrimId = useMemo(() => pickReviewTrimId(data), [data]);
  const reviewVehicleLineId = useMemo(() => pickReviewVehicleLineId(data), [data]);

  const resolvedVehicleLineId = useMemo(
    () => normalizeId(reviewVehicleLineId),
    [reviewVehicleLineId],
  );

  const buildConsultPayload = useCallback((phoneValue) => {
    return {
      brand: data?.brand || '',
      model: data?.title || data?.carModel || data?.model || '',
      trim: data?.subtitle || data?.carTrim || data?.trim || '',
      color: '',
      phone: (phoneValue || '').trim(),
      options: [],
      terms: [],
      consultType: '리뷰상세',
      source: 'mobile-review-detail',
      entryLabel: `모바일 리뷰 상세 > ${data?.title || data?.model || ''}`,
      extra: {
        reviewId: id,
        trimId: reviewTrimId,
        vehicleLineId: resolvedVehicleLineId,
      },
    };
  }, [data, id, reviewTrimId, resolvedVehicleLineId]);

  const handleNavigateToSelected = useCallback(
    async (entry) => {
      if (isNavigating) return;
      
      // trimId가 없으면 검색 페이지로
      if (!reviewTrimId) {
        navigate('/m/search');
        return;
      }

      setIsNavigating(true);
      try {
        // vehicleLineId가 있으면 차량 상세 페이지로 이동
        if (resolvedVehicleLineId) {
          const params = new URLSearchParams();
          params.set('trimId', reviewTrimId);
          params.set('source', 'mobile-review-detail');
          if (entry) {
            params.set('entry', entry);
          }
          
          // 차량 상세 페이지로 이동
          navigate(`/m/car-detail/${resolvedVehicleLineId}?${params.toString()}`);
        } else {
          // vehicleLineId가 없으면 trimId로 API 호출해서 vehicleLineId 가져오기
          try {
            const { carAPI } = await import('../../services/carApi');
            const trimDetail = await carAPI.getCarDetail(reviewTrimId);
            const vehicleLineId = trimDetail?.vehicleLineId || trimDetail?.vehicleLine?.id;
            
            if (vehicleLineId) {
              const params = new URLSearchParams();
              params.set('trimId', reviewTrimId);
              params.set('source', 'mobile-review-detail');
              if (entry) {
                params.set('entry', entry);
              }
              navigate(`/m/car-detail/${vehicleLineId}?${params.toString()}`);
            } else {
              // vehicleLineId를 찾을 수 없으면 검색 페이지로
              navigate('/m/search');
            }
          } catch (error) {
            console.error('[MobileReviewDetail] 차량 정보 조회 실패', error);
            navigate('/m/search');
          }
        }
      } finally {
        setIsNavigating(false);
      }
    },
    [isNavigating, navigate, resolvedVehicleLineId, reviewTrimId],
  );

  const handleQuickConsult = useCallback(async () => {
    try {
      const { getStoredUserPhone } = await import('../../utils/phoneStorage');
      const { submitConsult } = await import('../../services/consultHelper');
      const storedPhone = getStoredUserPhone();
      
      if (storedPhone) {
        // 로컬 스토리지에 연락처가 있으면 바로 상담 신청
        const payload = buildConsultPayload(storedPhone);
        const result = await submitConsult(payload, {
          openKakaoOnSuccess: false,
          useKakao: false,
        });
        
        if (result.success) {
          setIsSuccessModalOpen(true);
        } else {
          alert(result.message || '상담 신청에 실패했습니다. 잠시 후 다시 시도해주세요.');
        }
      } else {
        // 연락처가 없으면 모달 열기
        setIsContactModalOpen(true);
      }
    } catch (error) {
      console.error('[MobileReviewDetail] 빠른 상담 처리 실패', error);
      alert('상담 신청에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  }, [buildConsultPayload]);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loading}>리뷰를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.empty}>리뷰를 찾을 수 없습니다.</div>
        </div>
      </div>
    );
  }

  const images = data.imageUrls || data.images || data.thumbs || (data.imageUrl ? [data.imageUrl] : []);
  const mainImage = images[0] || data.imageUrl || FALLBACK_IMAGE;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <section className={styles.section}>
          <h1 className={styles.pageTitle}>상세 후기</h1>
          {id && <p className={styles.reviewId}>리뷰 ID: {id}</p>}
        </section>

        <section className={styles.section}>
          <article className={styles.detailCard}>
            <div className={styles.badge}>{data.serviceType || data.label || '장기렌트'}</div>
            <div className={styles.nameRow}>
              <span className={styles.name}>{(data.title || data.carModel || data.model || '').split(' ')[0]}</span>
              <div className={styles.rating}>
                {'★'.repeat(Math.floor(data.rating || 0))}{'☆'.repeat(5 - Math.floor(data.rating || 0))}
                <span className={styles.score}>{(data.rating || 0).toFixed(1)}</span>
              </div>
            </div>
            <div className={styles.metaRow}>
              {data.authorName || data.author || '고객님'} · 계약 일자 | {data.createdAt || data.date || ''}
            </div>

            {images.length > 0 && (
              <div className={styles.media}>
                <img 
                  className={styles.mainImage} 
                  src={mainImage} 
                  alt="main" 
                  draggable={false}
                  onClick={() => {
                    setSelectedImageIndex(0);
                    setIsGalleryOpen(true);
                  }}
                  style={{ cursor: 'pointer' }}
                />
                {images.length > 1 && (
                  <div className={styles.thumbs}>
                    {images.slice(1, 3).map((img, i) => (
                      <img 
                        key={i} 
                        className={styles.thumb} 
                        src={img} 
                        alt={`thumb${i + 1}`} 
                        draggable={false}
                        onClick={() => {
                          setSelectedImageIndex(i + 1);
                          setIsGalleryOpen(true);
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                    ))}
                    {images.length > 3 && (
                      <div 
                        className={styles.moreIndicator}
                        onClick={() => {
                          setSelectedImageIndex(3);
                          setIsGalleryOpen(true);
                        }}
                      >
                        +{images.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className={styles.contentWrap}>
              {data.title && (
                <h2 className={styles.title}>{data.title}</h2>
              )}
              {data.subtitle && (
                <p className={styles.subtitle}>{data.subtitle}</p>
              )}
              <p className={styles.content}>{data.content || data.description || ''}</p>
            </div>

            <div className={styles.cta}>
              <button
                className={`${styles.btn} ${styles.primary}`}
                onClick={() => handleNavigateToSelected('estimate')}
                disabled={isNavigating}
              >
                {isNavigating ? '이동 준비 중...' : '같은 차량 견적내기'}
              </button>
              <button
                className={`${styles.btn} ${styles.secondary}`}
                onClick={handleQuickConsult}
              >
                실시간 무료견적 받기
              </button>
            </div>
          </article>
        </section>
      </div>
      <div className={styles.bottomSpacer} />

      <MobileContactModal
        open={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        onSubmit={async (phoneValue) => {
          try {
            const { submitConsult } = await import('../../services/consultHelper');
            const payload = buildConsultPayload(phoneValue);

            const result = await submitConsult(payload, {
              kakaoOpenTarget: '_blank',
              openKakaoOnSuccess: false,
              useKakao: false,
            });

            // API 호출이 성공하면 연락처 모달 닫고 성공 모달 표시
            if (result.success) {
              setIsContactModalOpen(false);
              setIsSuccessModalOpen(true);
            } else {
              alert(result.message || '연락처 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
            }
          } catch (error) {
            console.error('[MobileReviewDetail] 연락처 보완 실패', error);
            alert('연락처 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
          }
        }}
      />

      <ConsultSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
      />

      {/* 이미지 갤러리 모달 */}
      {isGalleryOpen && (
        <div className={styles.galleryModal} onClick={() => setIsGalleryOpen(false)}>
          <div className={styles.galleryHeader}>
            <span className={styles.galleryCounter}>{selectedImageIndex + 1} / {images.length}</span>
            <button className={styles.galleryClose} onClick={() => setIsGalleryOpen(false)}>✕</button>
          </div>
          <div className={styles.galleryContent} onClick={(e) => e.stopPropagation()}>
            <button 
              className={styles.galleryPrev}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex(prev => prev > 0 ? prev - 1 : images.length - 1);
              }}
              disabled={images.length <= 1}
            >
              ‹
            </button>
            <img 
              src={images[selectedImageIndex]} 
              alt={`gallery-${selectedImageIndex}`}
              className={styles.galleryImage}
              draggable={false}
            />
            <button 
              className={styles.galleryNext}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex(prev => prev < images.length - 1 ? prev + 1 : 0);
              }}
              disabled={images.length <= 1}
            >
              ›
            </button>
          </div>
          <div className={styles.galleryThumbs}>
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`thumb-${idx}`}
                className={`${styles.galleryThumb} ${idx === selectedImageIndex ? styles.galleryThumbActive : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex(idx);
                }}
                draggable={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


