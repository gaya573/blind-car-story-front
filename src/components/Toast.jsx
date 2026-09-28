import React, { useEffect } from 'react';
import styles from './Toast.module.css';

/**
 * 간단한 토스트 메시지 컴포넌트
 * - message: 표시할 텍스트
 * - visible: true 일 때만 노출
 * - duration: 자동으로 사라질 시간(ms)
 * - onClose: duration 후 또는 수동으로 닫을 때 호출
 */
const Toast = ({ message, visible, duration = 1000, onClose, position = 'top' }) => {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [visible, duration, onClose]);

  if (!visible || !message) return null;

  return (
    <div
      className={`${styles.toastWrapper} ${
        position === 'bottom' ? styles.toastWrapperBottom : styles.toastWrapperTop
      }`}
    >
      <div className={styles.toast}>{message}</div>
    </div>
  );
};

export default Toast;


