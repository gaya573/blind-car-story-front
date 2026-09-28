import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginWithKakao } from '../../utils/kakaoAuth';
import kakaoIconSrc from '../../assets/icon/kako.png';
import styles from './Auth.module.css';

const Login = () => {
  const [formData, setFormData] = useState({
    phone: '',
    password: ''
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

    // 비밀번호 필수 체크
    if (!formData.password || formData.password.trim() === '') {
      newErrors.password = '비밀번호를 입력해주세요.';
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
      console.log('로그인 시도:', {
        phone: formData.phone.replace(/[^0-9]/g, ''),
        password: '***'
      });
      
      // 시뮬레이션: 로그인 성공
      setTimeout(() => {
        alert('로그인되었습니다. (백엔드 연결 전)');
        setIsLoading(false);
        // 로그인 성공 후 홈으로 이동
        navigate('/');
      }, 500);
    } catch (error) {
      console.error('로그인 실패:', error);
      alert('로그인에 실패했습니다. 다시 시도해주세요.');
      setIsLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
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
        setFormData(prev => ({
          ...prev,
          phone: ''
        }));
        setIsLoading(false);
        return;
      }

      // 전화번호 자동 입력
      const phoneNumber = userInfo.phone.replace(/[^0-9]/g, '');
      setFormData(prev => ({
        ...prev,
        phone: phoneNumber
      }));

      // 카카오 로그인 성공 처리 (백엔드 연결 전)
      alert('카카오 로그인되었습니다. (백엔드 연결 전)');
      
      // 로그인 성공 후 홈으로 이동
      navigate('/');
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
        <h1 className={styles.title}>로그인</h1>
        
        <form onSubmit={handleSubmit} className={styles.form}>
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
            <label htmlFor="password" className={styles.label}>
              비밀번호 <span className={styles.required}>*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              disabled={isLoading}
            />
            {errors.password && <span className={styles.error}>{errors.password}</span>}
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? '처리 중...' : '로그인'}
          </button>
        </form>

        <div className={styles.divider}>
          <span>또는</span>
        </div>

        <button
          type="button"
          onClick={handleKakaoLogin}
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
          카카오로 로그인
        </button>

        <div className={styles.linkContainer}>
          <span className={styles.loginText}>계정이 없으신가요?</span>
          <Link to="/auth/signup" className={styles.link}>
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

