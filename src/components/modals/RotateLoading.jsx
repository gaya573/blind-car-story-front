import React, { useEffect, useState, useRef } from 'react';
import './RotateLoading.css';

const BRANDS = [
  '/rotateloading/KB캐피탈.svg',
  '/rotateloading/우리카드.svg',
  '/rotateloading/롯데렌탈.svg',
  '/rotateloading/BNK캐피탈.svg',
  '/rotateloading/메리츠캐피탈.svg',
  '/rotateloading/하나캐피탈.svg'
];

const FINAL_IMAGE = '/rotateloading/견적 산출이 완료되었습니다. 지금 카카오톡으로 발송됩니다..svg';

const RotateLoading = ({ open, onClose, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const completeCalled = useRef(false);

  const triggerCompleteIfNeeded = () => {
    if (!completeCalled.current && typeof onComplete === 'function') {
      completeCalled.current = true;
      onComplete();
    }
  };

  useEffect(() => {
    if (!open) {
      setCurrentIndex(0);
      setFinished(false);
      completeCalled.current = false;
      return;
    }

    if (finished) {
      if (!completeCalled.current && onComplete) {
        const delayTimer = setTimeout(() => {
          triggerCompleteIfNeeded();
        }, 1000);
        return () => clearTimeout(delayTimer);
      }
      return;
    }

    const timer = setTimeout(() => {
      if (currentIndex < BRANDS.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setFinished(true);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [open, currentIndex, finished, onComplete]);

  if (!open) return null;

  const handleCloseClick = () => {
    onClose?.();
    // onPhoneMissingClose 제거 - onComplete에서 이미 처리함
    if (finished) {
      triggerCompleteIfNeeded();
    }
  };

  return (
    <div className="rotate-loading-overlay">
      <div className="rotate-loading-content">
        {!finished ? (
          <>
            <div className="brand-logo-container">
              <img 
                src={BRANDS[currentIndex]} 
                alt="금융사 로고" 
                className="brand-logo fade-in"
                key={currentIndex} 
              />
            </div>
            <p className="loading-text">AI 견적 산출 중...</p>
          </>
        ) : (
          <div className="final-message-container">
            <img 
              src={FINAL_IMAGE} 
              alt="견적 산출 완료" 
              className="final-message fade-in"
            />
            <button className="close-btn" onClick={handleCloseClick}>닫기</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RotateLoading;
