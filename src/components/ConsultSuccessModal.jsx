import React from 'react';
import styles from './ConsultSuccessModal.module.css';

/**
 * 상담 신청 성공 모달
 * @param {boolean} isOpen - 모달 표시 여부
 * @param {function} onClose - 모달 닫기 콜백
 */
const ConsultSuccessModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* 상단: 말풍선(왼쪽, 절대배치) + 펭귄(오른쪽) */}
        <div className={styles.topSection}>
          {/* 말풍선 */}
          <div className={styles.speechBubble}>
            <p className={styles.description}>
              곧 상담원이 견적서 를<br />보낼 예정입니다.
            </p>
            <p className={styles.subDescription}>
              카카오톡 아이디가 없으시면<br />
              문자로 상담안내를 도와드립니다.
            </p>
          </div>

          {/* 펭귄 캐릭터 - 오른쪽 */}
          <div className={styles.penguinContainer}>
            <img 
              src="/mobileMain/상담하는 펭귄 1.svg" 
              alt="상담 펭귄" 
              className={styles.penguin}
            />
          </div>
        </div>

        {/* 확인 버튼 */}
        <button 
          className={styles.confirmButton}
          onClick={onClose}
        >
          확인
        </button>
      </div>
    </div>
  );
};

export default ConsultSuccessModal;




