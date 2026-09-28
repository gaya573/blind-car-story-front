import React from "react";
import styles from "./NoticeBox.module.css";

/**
 * NoticeBox Component
 * @param {string} title - 안내 제목
 * @param {Array<string>} items - 안내 내용 리스트
 * @param {string} icon - 아이콘 문자 (기본: ⓘ)
 */
const NoticeBox = ({ title = "안내드립니다", items = [], icon = "ⓘ" }) => {
  return (
    <div className={styles.container}>
      <div className={styles.titleRow}>
        <span className={styles.icon}>{icon}</span>
        <h2 className={styles.title}>{title}</h2>
      </div>
      <ul className={styles.list}>
        {items.map((text, idx) => (
          <li key={idx}>{text}</li>
        ))}
      </ul>
    </div>
  );
};

export default NoticeBox;
