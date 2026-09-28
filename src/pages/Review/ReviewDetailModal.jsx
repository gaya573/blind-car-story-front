import React, { useState } from 'react';
import styles from './ReviewDetailModal.module.css';

const FALLBACK_IMAGE = '/placeholder/car.svg';

/**
 * ReviewDetailModal 컴포넌트
 * 리뷰 상세 보기 및 새 리뷰 작성 모달
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {boolean} props.isOpen - 모달 열림 상태
 * @param {Function} props.onClose - 모달 닫기 함수
 * @param {Object} props.reviewData - 리뷰 데이터 (상세 보기 모드일 때)
 * @param {boolean} props.isWritingMode - 작성 모드 여부
 * @param {Function} props.onEstimateClick - 견적 버튼 클릭 핸들러
 */
const ReviewDetailModal = ({ isOpen, onClose, reviewData, isWritingMode = false, onEstimateClick }) => {
  // 작성 모드 상태 관리
  const [formData, setFormData] = useState({
    productName: '',
    reviewText: '',
    rating: 0,
    author: ''
  });

  // 모달이 닫힐 때 폼 데이터 초기화
  React.useEffect(() => {
    if (!isOpen) {
      setFormData({
        productName: '',
        reviewText: '',
        rating: 0,
        author: ''
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  /**
   * 별점 렌더링 함수
   * @param {number} rating - 별점 (1-5)
   * @param {boolean} interactive - 클릭 가능한 별점인지 여부
   * @returns {Array} 별점 요소 배열
   */
  const renderStars = (rating, interactive = false) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span 
          key={i} 
          className={`${styles.star} ${i < rating ? styles.filledStar : styles.emptyStar} ${interactive ? styles.interactiveStar : ''}`}
          onClick={interactive ? () => setFormData(prev => ({ ...prev, rating: i + 1 })) : undefined}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  /**
   * 폼 제출 처리
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isWritingMode) {
      // 새 리뷰 작성 로직
      console.log('새 리뷰 작성:', formData);
      alert('리뷰가 성공적으로 작성되었습니다!');
    }
    onClose();
  };

  /**
   * 입력 필드 변경 처리
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 실제 이미지 URL 확인
  const hasImage = reviewData?.imageUrl && reviewData.imageUrl !== 'placeholder' && reviewData.imageUrl !== FALLBACK_IMAGE;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* 모달 헤더 */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {isWritingMode ? '새 리뷰 작성' : '고객 후기'}
          </h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>

        {/* 모달 본문 */}
        <div className={styles.modalBody}>
          {/* 이미지 영역 */}
          <div className={styles.imageContainer}>
            {hasImage ? (
              <img 
                src={reviewData.imageUrl} 
                alt={reviewData.productName || '리뷰 이미지'}
                className={styles.reviewImage}
              />
            ) : (
              <div className={styles.imagePlaceholder}>
                <span className={styles.placeholderText}>이미지</span>
              </div>
            )}
          </div>

          {/* 리뷰 상세 정보 */}
          <div className={styles.reviewDetail}>
            <div className={styles.reviewHeader}>
              <h3 className={styles.productName}>{reviewData?.productName || '제품명'}</h3>
            </div>
            
            <div className={styles.reviewTextContainer}>
              <p className={styles.reviewText}>
                {reviewData?.reviewText || reviewData?.reviewTextFull || '리뷰 내용이 없습니다.'}
              </p>
            </div>
            <div>
            <div className={styles.metaInfo}>
              <div className={styles.authorInfo}>
                <span className={styles.author}>{reviewData?.author || '익명'}</span>
                {/* <span className={styles.authorDetail}>30대 | 남성</span> */}
              </div>
              <span className={styles.date}>{reviewData?.date || ''}</span>
            </div>

            <div className={styles.rating}>
              {renderStars(reviewData?.rating || 0)}
            </div>
            </div>
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <div className={styles.modalFooter}>
          <button 
            className={styles.estimateButton}
            onClick={() => {
              if (onEstimateClick) {
                onEstimateClick(reviewData);
              }
            }}
          >
            같은 차량 견적내기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewDetailModal;
    