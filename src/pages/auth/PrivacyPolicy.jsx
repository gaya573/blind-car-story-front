import React from 'react';
import { Link } from 'react-router-dom';
import styles from './PrivacyPolicy.module.css';

// 모달/페이지에서 공통으로 사용하는 약관 본문
export const PrivacyPolicyContent = () => {
  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>개인정보 처리방침</h1>
        <p className={styles.lastUpdated}>최종 수정일: 2025년 11월 7일</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>1. 총칙</h2>
        <p className={styles.paragraph}>
          블라인드 카스토리(이하 &quot;회사&quot;)는 이용자의 개인정보를 소중히 여기며, 「개인정보 보호법」, 
          「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 준수하고 있습니다. 
          회사는 개인정보 처리방침을 통하여 이용자가 제공하는 개인정보가 어떠한 용도와 방식으로 
          이용되고 있으며, 개인정보 보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>2. 수집하는 개인정보의 항목 및 수집 방법</h2>
        <div className={styles.subSection}>
          <h3 className={styles.subTitle}>가. 수집하는 개인정보 항목</h3>
          <p className={styles.paragraph}>
            회사는 회원가입, 상담, 서비스 신청 등을 위해 아래와 같은 개인정보를 수집하고 있습니다.
          </p>
          <ul className={styles.list}>
            <li><strong>필수 항목:</strong> 이름, 전화번호, 비밀번호</li>
            <li><strong>선택 항목:</strong> 이메일 주소</li>
            <li><strong>자동 수집 항목:</strong> IP주소, 쿠키, MAC주소, 서비스 이용 기록, 접속 로그, 방문 일시</li>
          </ul>
        </div>
        <div className={styles.subSection}>
          <h3 className={styles.subTitle}>나. 개인정보 수집 방법</h3>
          <ul className={styles.list}>
            <li>홈페이지 회원가입 및 서비스 이용 과정에서 이용자가 직접 입력</li>
            <li>카카오톡 간편 가입·간편 상담 이용 시 카카오 계정을 통한 정보 자동 수집 (상담 요청 처리 및 알림톡 발송을 위해 카카오 로그인은 필수입니다.)</li>
            <li>고객센터를 통한 상담 과정에서 수집</li>
            <li>서비스 이용 과정에서 자동으로 생성되어 수집</li>
          </ul>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>3. 개인정보의 처리 목적</h2>
        <p className={styles.paragraph}>
          회사는 수집한 개인정보를 다음의 목적으로 활용합니다.
        </p>
        <ul className={styles.list}>
          <li><strong>회원 관리:</strong> 회원 식별, 회원가입 의사 확인, 본인 확인, 부정 이용 방지, 계약 이행 및 약관 변경 등의 고지</li>
          <li><strong>서비스 제공:</strong> 장기렌트/리스 상품 안내, 견적 문의 처리, 상담 서비스 제공</li>
          <li><strong>서비스 개선:</strong> 신규 서비스 개발 및 특화, 서비스 품질 향상, 맞춤 서비스 제공</li>
          <li><strong>마케팅 활용:</strong> 이벤트 및 프로모션 정보 제공, 광고성 정보 전달(이메일, SMS 등)</li>
        </ul>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>4. 개인정보의 보유 및 이용 기간</h2>
        <div className={styles.subSection}>
          <p className={styles.paragraph}>
            회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 
            개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
          </p>
          <ul className={styles.list}>
            <li><strong>회원 정보:</strong> 회원 탈퇴 시까지 (단, 관련 법령에 따라 일정 기간 보관 필요 시 해당 기간 동안 보관)</li>
            <li><strong>계약 또는 청약철회 등에 관한 기록:</strong> 5년</li>
            <li><strong>대금결제 및 재화 등의 공급에 관한 기록:</strong> 5년</li>
            <li><strong>소비자의 불만 또는 분쟁처리에 관한 기록:</strong> 3년</li>
            <li><strong>웹사이트 방문 기록:</strong> 3개월</li>
          </ul>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>5. 개인정보의 제3자 제공</h2>
        <p className={styles.paragraph}>
          회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.
        </p>
        <ul className={styles.list}>
          <li>이용자가 사전에 동의한 경우</li>
          <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
          <li>서비스 제공에 따른 요금정산을 위해 필요한 경우</li>
        </ul>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>6. 개인정보 처리의 위탁</h2>
        <p className={styles.paragraph}>
          회사는 서비스 향상을 위해 다음과 같이 개인정보 처리업무를 외부 전문업체에 위탁하여 운영할 수 있습니다.
        </p>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>위탁업체</th>
                <th>위탁업무 내용</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>카카오</td>
                <td>카카오톡 간편 로그인 서비스 제공</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>7. 정보주체의 권리·의무 및 행사방법</h2>
        <p className={styles.paragraph}>
          이용자는 언제든지 다음의 권리를 행사할 수 있습니다.
        </p>
        <ul className={styles.list}>
          <li>개인정보 열람 요구</li>
          <li>개인정보 정정·삭제 요구</li>
          <li>개인정보 처리정지 요구</li>
          <li>개인정보 수집·이용·제공에 대한 동의 철회</li>
        </ul>
        <p className={styles.paragraph}>
          위 권리 행사는 회사에 대해 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며, 
          회사는 이에 대해 지체 없이 조치하겠습니다.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>8. 개인정보의 파기</h2>
        <p className={styles.paragraph}>
          회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 
          지체 없이 해당 개인정보를 파기합니다. 파기의 절차 및 방법은 다음과 같습니다.
        </p>
        <ul className={styles.list}>
          <li><strong>파기 절차:</strong> 이용자가 입력한 정보는 목적 달성 후 별도의 DB에 옮겨져(종이의 경우 별도의 서류) 
          내부 방침 및 기타 관련 법령에 따라 일정기간 저장된 후 혹은 즉시 파기됩니다.</li>
          <li><strong>파기 방법:</strong> 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다. 
          종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.</li>
        </ul>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>9. 개인정보 보호책임자</h2>
        <p className={styles.paragraph}>
          회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 
          불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
        </p>
        <div className={styles.contactBox}>
          <p><strong>개인정보 보호책임자</strong></p>
          <p>성명: 정보 준비중</p>
          <p>연락처: 1577-8319</p>
          <p>이메일: 정보 준비중</p>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>10. 개인정보의 안전성 확보 조치</h2>
        <p className={styles.paragraph}>
          회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.
        </p>
        <ul className={styles.list}>
          <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육 등</li>
          <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 
          보안프로그램 설치</li>
          <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
        </ul>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>11. 고지의 의무</h2>
        <p className={styles.paragraph}>
          본 개인정보 처리방침은 법령·정책 또는 보안기술의 변경에 따라 내용의 추가·삭제 및 수정이 있을 시에는 
          변경사항의 시행 7일 전부터 홈페이지의 공지사항을 통하여 고지할 것입니다.
        </p>
      </div>
    </>
  );
};

const PrivacyPolicy = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <PrivacyPolicyContent />

        <div className={styles.footer}>
          <Link to="/auth/signup" className={styles.backLink}>
            ← 회원가입으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

