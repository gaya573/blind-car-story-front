import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginWithKakao } from '../../utils/kakaoAuth';
import kakaoIconSrc from '../../assets/icon/kako.png';
import styles from './Auth.module.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    passwordConfirm: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 카카오 SDK 초기화
    if (window.Kakao) {
      const { initKakaoSDK } = require('../../utils/kakaoAuth');
      initKakaoSDK();
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 에러 초기화
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // 이름 체크
    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = '이름을 입력해주세요.';
    }

    // 전화번호 필수 체크
    if (!formData.phone || formData.phone.trim() === '') {
      newErrors.phone = '전화번호를 입력해주세요.';
    } else {
      // 전화번호 형식 체크 (숫자만, 10-11자리)
      const phoneRegex = /^[0-9]{10,11}$/;
      const phoneNumber = formData.phone.replace(/[^0-9]/g, '');
      if (!phoneRegex.test(phoneNumber)) {
        newErrors.phone = '올바른 전화번호를 입력해주세요. (10-11자리 숫자)';
      }
    }

    // 이메일 체크 (선택사항이지만 형식 체크)
    if (formData.email && formData.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = '올바른 이메일 형식을 입력해주세요.';
      }
    }

    // 비밀번호 체크
    if (!formData.password || formData.password.trim() === '') {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 8자 이상이어야 합니다.';
    }

    // 비밀번호 확인 체크
    if (!formData.passwordConfirm || formData.passwordConfirm.trim() === '') {
      newErrors.passwordConfirm = '비밀번호 확인을 입력해주세요.';
    } else if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // 백엔드 연결 없이 로컬 처리
      console.log('회원가입 시도:', {
        name: formData.name,
        phone: formData.phone.replace(/[^0-9]/g, ''),
        email: formData.email,
        password: '***'
      });
      
      // 시뮬레이션: 회원가입 성공
      setTimeout(() => {
        alert('회원가입이 완료되었습니다. (백엔드 연결 전)');
        setIsLoading(false);
        // 회원가입 성공 후 로그인 페이지로 이동
        navigate('/auth/login');
      }, 500);
    } catch (error) {
      console.error('회원가입 실패:', error);
      alert('회원가입에 실패했습니다. 다시 시도해주세요.');
      setIsLoading(false);
    }
  };

  const handleKakaoSignup = async () => {
    try {
      setIsLoading(true);
      const userInfo = await loginWithKakao({
        scopes: ['phone_number', 'name'],
        fetchUserInfo: true,
      });
      
      console.log('카카오 로그인 성공:', userInfo);
      
      // 전화번호 필수 체크
      if (!userInfo.phone || userInfo.phone.trim() === '') {
        alert('카카오 계정에 전화번호가 등록되어 있지 않습니다. 전화번호를 입력해주세요.');
        setIsLoading(false);
        return;
      }

      // 폼에 정보 자동 입력
      const phoneNumber = userInfo.phone.replace(/[^0-9]/g, '');
      setFormData(prev => ({
        ...prev,
        name: userInfo.name || '',
        phone: phoneNumber,
        email: userInfo.email || ''
      }));

      alert('카카오 계정 정보를 불러왔습니다. 비밀번호를 입력해주세요.');
    } catch (error) {
      console.error('카카오 로그인 실패:', error);
      const errorMsg = error.message || '카카오 로그인에 실패했습니다.';
      if (errorMsg.includes('취소')) {
        // 사용자가 취소한 경우는 조용히 처리
      } else {
        alert(`카카오 로그인에 실패했습니다: ${errorMsg}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1 className={styles.title}>회원가입</h1>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>
              이름 <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="이름을 입력하세요"
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              disabled={isLoading}
            />
            {errors.name && <span className={styles.error}>{errors.name}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="phone" className={styles.label}>
              전화번호 <span className={styles.required}>*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="01012345678"
              className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
              disabled={isLoading}
            />
            {errors.phone && <span className={styles.error}>{errors.phone}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              이메일
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@email.com (선택사항)"
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              disabled={isLoading}
            />
            {errors.email && <span className={styles.error}>{errors.email}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              비밀번호 <span className={styles.required}>*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="8자 이상 입력하세요"
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              disabled={isLoading}
            />
            {errors.password && <span className={styles.error}>{errors.password}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="passwordConfirm" className={styles.label}>
              비밀번호 확인 <span className={styles.required}>*</span>
            </label>
            <input
              type="password"
              id="passwordConfirm"
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleChange}
              placeholder="비밀번호를 다시 입력하세요"
              className={`${styles.input} ${errors.passwordConfirm ? styles.inputError : ''}`}
              disabled={isLoading}
            />
            {errors.passwordConfirm && <span className={styles.error}>{errors.passwordConfirm}</span>}
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? '처리 중...' : '회원가입'}
          </button>
        </form>

        <div className={styles.divider}>
          <span>또는</span>
        </div>

        <button
          type="button"
          onClick={handleKakaoSignup}
          className={styles.kakaoButton}
          disabled={isLoading}
        >
          <img 
            src={kakaoIconSrc} 
            alt="카카오" 
            className={styles.kakaoIcon}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          카카오로 간편 가입
        </button>

        {/* 카카오 로그인 약관 안내 */}
        <div className={styles.termsNotice}>
          <p className={styles.termsText}>
            카카오톡 간편 가입 시 카카오 계정에 등록된 <strong>이름</strong>과 <strong>연락처(전화번호)</strong> 정보를 가져올 수 있습니다.
            블라인드 카스토리의 카카오 간편 상담·알림톡 발송을 이용하기 위해서는 <strong>카카오 로그인이 필수</strong>이며,
            개인정보 수집 및 이용에 동의하신 후 위 버튼을 클릭해주세요.
          </p>
        </div>

        <div className={styles.linkContainer}>
          <span className={styles.loginText}>이미 계정이 있으신가요?</span>
          <Link to="/auth/login" className={styles.link}>
            로그인
          </Link>
        </div>

        <div className={styles.privacyLinkContainer}>
          <Link to="/auth/privacy-policy" className={styles.privacyLink}>
            개인정보 처리방침
          </Link>
        </div>

        {/* 회원가입 절차 안내 */}
        <div className={styles.signupProcess}>
          <h2 className={styles.processTitle}>회원가입 절차</h2>
          <div className={styles.processSteps}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>회원정보 입력</h3>
                <p className={styles.stepDescription}>
                  이름, 전화번호, 이메일(선택), 비밀번호를 입력해주세요.
                </p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>정보 확인</h3>
                <p className={styles.stepDescription}>
                  입력하신 정보가 올바른지 확인해주세요.
                </p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>회원가입 완료</h3>
                <p className={styles.stepDescription}>
                  회원가입이 완료되면 로그인 페이지로 이동합니다.
                </p>
              </div>
            </div>
          </div>
          <div className={styles.processNote}>
            <p className={styles.noteText}>
              <strong>간편 가입:</strong> 카카오 계정을 통해 더 빠르게 회원가입할 수 있습니다. 
              카카오톡 간편 가입 시 카카오 계정에 등록된 이름과 연락처(전화번호) 정보를 자동으로 가져올 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;

