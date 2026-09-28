import { useEffect, useRef, useCallback } from 'react';

/**
 * 무한 스크롤을 위한 Intersection Observer 훅
 * @param {Function} fetchNextPage - 다음 페이지를 가져오는 함수
 * @param {boolean} hasNextPage - 다음 페이지가 있는지 여부
 * @param {boolean} isFetchingNextPage - 다음 페이지를 가져오는 중인지 여부
 * @param {Function} [onIntersect] - 교차 시점에 실행되는 함수. false를 반환하면 다음 페이지 요청을 차단
 * @returns {Object} { observerRef: ref for the observer element }
 */
export const useInfiniteScroll = ({ fetchNextPage, hasNextPage, isFetchingNextPage, onIntersect }) => {
  const observerRef = useRef(null);

  const handleObserver = useCallback(
    (entries) => {
      const [target] = entries;
      if (!target?.isIntersecting) {
        return;
      }

      let shouldFetch = true;
      if (typeof onIntersect === 'function') {
        const result = onIntersect();
        if (result === false) {
          shouldFetch = false;
        } else if (typeof result === 'boolean') {
          shouldFetch = result;
        }
      }

      if (shouldFetch && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage, onIntersect],
  );

  useEffect(() => {
    const element = observerRef.current;
    if (!element) return;

    const option = {
      root: null,
      rootMargin: '100px',
      threshold: 0,
    };

    const observer = new IntersectionObserver(handleObserver, option);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [handleObserver]);

  return { observerRef };
};

