import React from 'react';
import styles from './MobileBottomNav.module.css';

const MobileBottomNav = ({ items = [], activeKey, onSelect }) => {
  return (
    <nav className={styles.container}>
      <div className={styles.inner}>
        {items.map((item) => {
          const isActive = item.key === activeKey;

          return (
            <button
              key={item.key}
              type="button"
              className={`${styles.item} ${isActive ? styles.active : ''}`}
              aria-label={item.label}
              onClick={() => onSelect?.(item.key)}
            >
              <span className={styles.icon} aria-hidden="true">
                {item.icon}
              </span>
              <span className={styles.label}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
