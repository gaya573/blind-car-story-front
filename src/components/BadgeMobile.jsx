import React from 'react';
import styles from './BadgeMobile.module.css';

/**
 * BadgeMobile
 * - 기본: pill 형태, 높이 20px, 라운드 6px
 * - 커스터마이즈: bg(배경), color(글자색), style(추가 스타일)
 */
export default function BadgeMobile({
  children,
  bg = '#F04438', // 기본 빨간색
  color = '#FFFFFF', // 기본 흰색 글자
  className = '',
  style = {},
}) {
  const mergedStyle = { background: bg, color, ...style };
  return (
    <span className={`${styles.badge} ${className}`} style={mergedStyle}>
      {children}
    </span>
  );
}


