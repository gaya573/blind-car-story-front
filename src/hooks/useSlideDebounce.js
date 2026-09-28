import { useState, useCallback } from 'react';

/**
 * 슬라이드 디바운스 훅
 * 애니메이션 진행 중 중복 클릭 방지
 */
export const useSlideDebounce = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  /**
   * 디바운스된 액션 실행
   * @param {Function} action - 실행할 함수
   * @returns {boolean} - 실행 여부
   */
  const executeDebounced = useCallback((action) => {
    // 애니메이션 진행 중이면 실행 안 함
    if (isTransitioning) return false;
    
    // 애니메이션 시작
    setIsTransitioning(true);
    
    // 액션 실행
    if (action) action();
    
    return true;
  }, [isTransitioning]);

  /**
   * 애니메이션 완료 처리
   */
  const completeTransition = useCallback(() => {
    setIsTransitioning(false);
  }, []);

  return {
    isTransitioning,
    executeDebounced,
    completeTransition
  };
};

