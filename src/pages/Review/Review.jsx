import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import Breadcrumb from '../../components/Breadcrumb';
import ReviewCard from './ReviewCard';
import ReviewDetailModal from './ReviewDetailModal';
import styles from './Review.module.css';
import { contentAPI } from '../../services/contentApi';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import PrivacyConsentCheckbox from '../../components/PrivacyConsentCheckbox.jsx';
import BrowserContactModal from '../../components/BrowserContactModal.jsx';
import ConsultSuccessModal from '../../components/ConsultSuccessModal.jsx';
import SeoHelmet from '../../components/SeoHelmet.jsx';
import StructuredData, { getReviewSchema } from '../../components/StructuredData.jsx';
import { getPageSeo } from '../../config/seoConfig';
import { getStoredUserPhone } from '../../utils/phoneStorage';
import ConsultBanner from '../../components/ConsultBanner';

const PAGE_SIZE = 12;
const FALLBACK_IMAGE = '/placeholder/car.svg';
const REVIEW_CONTACT_PROMPT =
  '휴대폰 번호를 남겨주시면 차량 전문 매니저가 곧 연락드립니다.';

const Review = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactModalMessage, setContactModalMessage] = useState('');
  const [contactModalInitialPhone, setContactModalInitialPhone] = useState('');
  const [contactPayload, setContactPayload] = useState(null);
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const breadcrumbItems = useMemo(
    () => [
      { label: '홈', link: '/' },
      { label: '출고후기 및 리뷰' },
    ],
    [],
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    isError,
  } = useInfiniteQuery({
    queryKey: ['reviews', 'infinite'],
    queryFn: ({ pageParam = 1 }) => contentAPI.getReviewsPage({ page: pageParam, limit: PAGE_SIZE }),
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.pagination;
      if (!pagination) return undefined;
      if (pagination.page < pagination.totalPages) {
        return pagination.page + 1;
      }
      return undefined;
    },
    keepPreviousData: true,
  });

  const mappedReviews = useMemo(() => {
    if (!data?.pages) return [];
    const allItems = data.pages.flatMap((page) => page.items || []);
    return allItems.map((item) => ({
      id: item.id,
      productName: item.title ?? '블라인드 카스토리 고객 후기',
      reviewTextSnippet: item.description?.slice(0, 80) ?? '',
      reviewText: item.description ?? '',
      reviewTextFull: item.description ?? '',
      rating: item.rating ?? 5,
      author: item.authorName ?? '익명 고객',
      date: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '',
      imageUrl: item.imageUrl ?? FALLBACK_IMAGE,
    }));
  }, [data]);

  const handleReviewClick = (review) => {
    setSelectedReview(review);
    setIsModalOpen(true);
  };

  const { observerRef } = useInfiniteScroll({
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
  });

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReview(null);
  };

  const handleEstimateClick = async (review) => {
    // 리뷰 모달 닫기
    handleCloseModal();
    
    // 상담 페이로드 구성
    const payload = {
      consultType: '휴대폰연락',
      source: 'review-detail',
      entryLabel: `리뷰 상세 > ${review?.productName || '차량'} 견적 문의`,
      model: review?.productName || '',
      extra: {
        note: `리뷰에서 접수된 차량 문의 - ${review?.productName || ''}`,
      },
    };

    try {
      // 1) 저장된 연락처 확인
      const savedPhone = getStoredUserPhone();
      
      // 2) 연락처 없으면 바로 모달 오픈 (카카오 OAuth 제거!)
      if (!savedPhone) {
        openContactModal(REVIEW_CONTACT_PROMPT, payload, '');
        return;
      }

      // 3) 연락처 있으면 바로 상담 신청
      const enriched = {
        ...payload,
        phone: savedPhone,
        name: localStorage.getItem('wgl_user_name') || '',
      };
      const { submitConsult } = await import('../../services/consultHelper');
      const result = await submitConsult(enriched, {
        useKakao: false,  // 카카오 OAuth 사용 안 함
      });

      // API 호출이 성공하면 무조건 성공 모달 표시
      if (result.success) {
        closeContactModal();
        setIsSuccessModalOpen(true);
      } else {
        openContactModal(
          result.message || '상담 신청에 실패했습니다. 다시 시도해주세요.',
          enriched,
          enriched.phone || '',
        );
      }
    } catch (error) {
      console.error('[Review] 견적 신청 실패', error);
      openContactModal(
        '상담 신청에 실패했습니다. 다시 시도해주세요.',
        payload,
        '',
      );
    }
  };

  const openContactModal = (message = REVIEW_CONTACT_PROMPT, payload = null, initialPhone = '') => {
    setContactPayload(payload);
    setContactModalMessage(message);
    setContactModalInitialPhone(initialPhone);
    setIsContactModalOpen(true);
  };

  const closeContactModal = () => {
    if (isContactSubmitting) return;
    setIsContactModalOpen(false);
    setContactModalMessage('');
    setContactModalInitialPhone('');
    setContactPayload(null);
  };

  const handleContactSubmit = async (phoneValue, nameValue) => {
    const phone = (phoneValue || '').trim();
    if (!phone) {
      setContactModalMessage('연락처를 입력해 주세요.');
      return;
    }
    setIsContactSubmitting(true);
    try {
      const { submitConsult } = await import('../../services/consultHelper');
      const payload = {
        ...(contactPayload || {}),
        phone,
        name: (nameValue || contactPayload?.name || '').trim(),
        consultType: contactPayload?.consultType || '휴대폰연락',
        source: contactPayload?.source || 'review-page',
        entryLabel: contactPayload?.entryLabel || '리뷰 페이지 > 차량 문의하기',
        extra: {
          note: '리뷰 CTA에서 접수된 차량 문의',
          ...(contactPayload?.extra || {}),
        },
      };
      const result = await submitConsult(payload, {
        useKakao: false,
        kakaoOpenTarget: '_blank',
      });

      // API 호출이 성공하면 무조건 성공 모달 표시
      if (result.success) {
        closeContactModal(); // 연락처 모달 닫기
        setIsSuccessModalOpen(true); // 성공 모달 표시
      } else {
        setContactModalMessage(result.message || '상담 신청에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('[Review] 연락처 보완 실패', error);
      setContactModalMessage('상담 신청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsContactSubmitting(false);
    }
  };

  const { title: seoTitle, description: seoDescription, keywords: seoKeywords } = getPageSeo('review');

  // SEO용 대표 이미지: 첫 리뷰 카드의 이미지를 사용
  const seoImage = useMemo(() => {
    const first = mappedReviews[0];
    if (!first) return undefined;
    return first.imageUrl || undefined;
  }, [mappedReviews]);

  const reviewSchema = useMemo(() => {
    const schemaReviews = mappedReviews.map((review) => ({
      author: review.author,
      date: review.date,
      text: review.reviewText,
      rating: review.rating
    }));
    return getReviewSchema(schemaReviews);
  }, [mappedReviews]);

  return (
    <>
      <SeoHelmet
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        image={seoImage}
      />
      <StructuredData data={reviewSchema} />
    <div className={styles.reviewPage}>
      <div className={styles.mainContent}>
        <Breadcrumb items={breadcrumbItems} />

        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>출고후기 및 리뷰</h2>
          <p className={styles.pageSubtitle}>블라인드 카스토리를 이용한 실제 고객들의 생생한 후기와 리뷰를 만나보세요.</p>
        </div>

        <div className={styles.reviewLayout}>
          <div className={styles.reviewSection}>
            {isLoading || isFetching ? (
              <div className={styles.reviewEmpty}>리뷰를 불러오는 중입니다...</div>
            ) : isError ? (
              <div className={styles.reviewEmpty}>리뷰 데이터를 불러오지 못했습니다.</div>
            ) : mappedReviews.length === 0 ? (
              <div className={styles.reviewEmpty}>등록된 리뷰가 없습니다.</div>
            ) : (
              <>
                <div className={styles.reviewGrid}>
                  {mappedReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} onClick={() => handleReviewClick(review)} />
                  ))}
                </div>

                <div ref={observerRef} style={{ height: '20px', marginTop: '20px' }}>
                  {isFetchingNextPage && (
                    <div className={styles.reviewEmpty}>더 불러오는 중...</div>
                  )}
                </div>
              </>
            )}

            <ConsultBanner 
              styles={styles}
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const name = formData.get('name')?.trim() || '';
                const phone = formData.get('phone')?.trim() || '';
                const carModel = formData.get('carModel')?.trim() || '';
                
                // 연락처 없으면 바로 모달 오픈 (카카오 OAuth 제거!)
                if (!phone) {
                  const payload = {
                    consultType: '휴대폰연락',
                    source: 'review-page',
                    entryLabel: '출고후기 페이지 > 상담신청',
                    name,
                    extra: {
                      note: '출고후기 CTA에서 접수된 차량 문의',
                      carModel,
                    },
                  };
                  openContactModal(REVIEW_CONTACT_PROMPT, payload, '');
                  return;
                }
                
                const payload = {
                  consultType: '휴대폰연락',
                  source: 'review-page',
                  entryLabel: '출고후기 페이지 > 상담신청',
                  name,
                  phone,
                  extra: {
                    note: '출고후기 CTA에서 접수된 차량 문의',
                    carModel,
                  },
                };
                
                setContactPayload(payload);
                
                try {
                  const { submitConsult } = await import('../../services/consultHelper');
                  const result = await submitConsult(payload, {
                    useKakao: false,  // 카카오 OAuth 사용 안 함
                  });

                  // API 호출이 성공하면 무조건 성공 모달 표시
                  if (result.success) {
                    closeContactModal();
                    e.target.reset();
                    setIsSuccessModalOpen(true);
                  } else {
                    openContactModal(
                      result.message || '상담 신청에 실패했습니다. 다시 시도해주세요.',
                      payload,
                      payload.phone || '',
                    );
                  }
                } catch (error) {
                  console.error('[Review] 상담 신청 실패', error);
                  openContactModal(
                    '상담 신청에 실패했습니다. 다시 시도해주세요.',
                    payload,
                    '',
                  );
                }
              }}
            />
          </div>
        </div>
      </div>

      {isModalOpen && (
        <ReviewDetailModal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          reviewData={selectedReview}
          onEstimateClick={handleEstimateClick}
        />
      )}
      <BrowserContactModal
        open={isContactModalOpen}
        onClose={closeContactModal}
        onSubmit={handleContactSubmit}
        isSubmitting={isContactSubmitting}
        description={contactModalMessage || undefined}
        initialPhone=""
      />
      <ConsultSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
      />
    </div>
    </>
  );
};

export default Review;
