import { useEffect, useRef, useState } from 'react';

/**
 * 디바운스 훅
 * @param {any} value - 디바운스할 값
 * @param {number} delay - 디바운스 지연 시간 (밀리초)
 * @returns {any} - 디바운스된 값
 */
export const useDebounce = (value, delay = 2000) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // 이전 타이머가 있으면 취소
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 새 타이머 설정
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // cleanup 함수
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * 디바운스된 콜백 함수를 반환하는 훅
 * @param {Function} callback - 디바운스할 콜백 함수
 * @param {number} delay - 디바운스 지연 시간 (밀리초)
 * @returns {Function} - 디바운스된 콜백 함수
 */
export const useDebouncedCallback = (callback, delay = 2000) => {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // callback이 변경될 때마다 ref 업데이트
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // cleanup 함수
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = (...args) => {
    // 이전 타이머가 있으면 취소
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 새 타이머 설정
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  };

  return debouncedCallback;
};

