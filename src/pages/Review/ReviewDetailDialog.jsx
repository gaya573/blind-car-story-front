import React, { useEffect, useRef, useState } from 'react';
import ReviewStars from './ReviewStars';

/**
 * 퍼블리싱 review.html #review-modal (.rvm-*).
 * 후기 사진이 여러 장이면 큰 사진 아래에 작은 사진을 두어 바꿔 볼 수 있게 했다.
 * 페이지 전용 CSS(.bcs-page-review) 가 적용되도록 페이지 안에 그린다.
 */
export default function ReviewDetailDialog({ review, onClose, onQuote }) {
  const [imageIndex, setImageIndex] = useState(0);
  const closeRef = useRef(null);
  const open = Boolean(review);

  useEffect(() => {
    setImageIndex(0);
  }, [review]);

  useEffect(() => {
    if (!open) return undefined;
    const lastFocused = document.activeElement;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      lastFocused?.focus?.();
    };
  }, [open, onClose]);

  const images = review?.images ?? [];
  const image = images[imageIndex] ?? review?.imageUrl ?? '';

  return (
    <div
      className={`modal-overlay rvm-overlay${open ? ' is-open' : ''}`}
      aria-hidden={open ? 'false' : 'true'}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="rvm-card" role="dialog" aria-modal="true" aria-labelledby="rvm-title">
        <div className="rvm-head">
          <h2 id="rvm-title">고객 후기</h2>
          <button ref={closeRef} className="rvm-close" type="button" aria-label="닫기" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {review ? (
          <>
            <div className={`rvm-media${image ? ' rvm-media--photo' : ''}`}>
              <img src={image || '/bcs/images/cars/car-suv.svg'} alt={review.carName || review.title} />
            </div>
            {images.length > 1 && (
              <div className="rvm-thumbs" aria-label="후기 사진">
                {images.map((url, index) => (
                  <button
                    key={url}
                    type="button"
                    className={`rvm-thumb${index === imageIndex ? ' is-active' : ''}`}
                    aria-label={`${index + 1}번째 사진 보기`}
                    aria-pressed={index === imageIndex}
                    onClick={() => setImageIndex(index)}
                  >
                    <img src={url} alt="" />
                  </button>
                ))}
              </div>
            )}

            {review.carName ? <span className="rvm-car">{review.carName}</span> : null}
            <h3 className="rvm-title">{review.title}</h3>
            <div className="rvm-body">
              {(review.body.length ? review.body : [review.snippet]).map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>

            <div className="rvm-meta">
              <div>
                <p className="rvm-meta__author">{review.author}</p>
                <ReviewStars rating={review.rating} />
              </div>
              <p className="rvm-meta__date">{review.date}</p>
            </div>

            <button className="rvm-cta" type="button" onClick={() => onQuote(review)}>
              같은 차량 견적내기
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
