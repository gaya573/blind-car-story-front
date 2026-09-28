/**
 * 카카오 로그인 유틸리티
 */
// 카카오 JavaScript 키 (환경변수 또는 기본값)
const getKakaoJsKey = () => {
  try {
    // Vite 환경변수에서 가져오기
    // @ts-ignore
    if (import.meta.env?.VITE_KAKAO_JS_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_KAKAO_JS_KEY;
    }
  } catch (e) {
    // 환경변수 접근 실패 시 무시
  }
  // 기본값 (환경변수로 교체 가능)
  // 카카오 개발자 콘솔(https://developers.kakao.com/)에서 JavaScript 키 발급 필요
  return '140fc06809f8841e879f22d2c5b91613';
};

const KAKAO_JS_KEY = getKakaoJsKey();

/**
 * 카카오 SDK 초기화
 */
export const initKakaoSDK = () => {
  if (window.Kakao) {
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_JS_KEY);
      console.log('카카오 SDK 초기화 완료');
    }
  } else {
    console.error('카카오 SDK가 로드되지 않았습니다.');
  }
};

/**
 * 카카오 SDK 동적 로드
 * @returns {Promise<void>}
 */
const loadKakaoSDK = () => {
  return new Promise((resolve, reject) => {
    // 이미 로드되어 있으면 바로 resolve
    if (window.Kakao) {
      resolve();
      return;
    }

    // 이미 스크립트가 로드 중이면 대기
    const existingScript = document.querySelector('script[src*="kakao_js_sdk"]');
    if (existingScript) {
      // 스크립트 로드 완료 대기
      existingScript.onload = () => {
        if (window.Kakao) {
          resolve();
        } else {
          reject(new Error('카카오 SDK 스크립트는 로드되었지만 초기화되지 않았습니다.'));
        }
      };
      existingScript.onerror = () => {
        reject(new Error('카카오 SDK 스크립트 로드에 실패했습니다.'));
      };
      return;
    }

    // 스크립트 동적 로드 (v1 SDK 사용 - login 지원)
    const script = document.createElement('script');
    script.src = 'https://developers.kakao.com/sdk/js/kakao.min.js';
    script.async = true;
    
    script.onload = () => {
      // SDK가 로드되면 약간의 지연 후 확인
      setTimeout(() => {
        if (window.Kakao) {
          resolve();
        } else {
          reject(new Error('카카오 SDK 스크립트는 로드되었지만 초기화되지 않았습니다.'));
        }
      }, 100);
    };
    
    script.onerror = () => {
      reject(new Error('카카오 SDK 스크립트 로드에 실패했습니다. 네트워크 연결을 확인해주세요.'));
    };
    
    document.head.appendChild(script);
  });
};

/**
 * 카카오 SDK 로드 대기
 * @returns {Promise<void>}
 */
const waitForKakaoSDK = async () => {
  // 먼저 동적 로드 시도
  try {
    await loadKakaoSDK();
    return;
  } catch (error) {
    console.warn('SDK 동적 로드 실패, 기존 스크립트 대기:', error);
  }

  // 이미 스크립트가 있으면 로드 대기 (최대 15초)
  return new Promise((resolve, reject) => {
    if (window.Kakao) {
      resolve();
      return;
    }

    let attempts = 0;
    const maxAttempts = 150; // 15초 (150 * 100ms)
    const checkInterval = setInterval(() => {
      attempts++;
      if (window.Kakao) {
        clearInterval(checkInterval);
        resolve();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        reject(new Error('카카오 SDK 로드를 기다리는 시간이 초과되었습니다. 페이지를 새로고침해주세요.'));
      }
    }, 100);
  });
};

/**
 * 요청할 스코프 배열 정규화
 * @param {string[]|string} scopes
 * @returns {string[]}
 */
const ALLOWED_SCOPES = ['phone_number', 'name'];

const normalizeScopes = (scopes) => {
  if (!scopes) return [];
  const scopeArray = Array.isArray(scopes) ? scopes : [scopes];
  return [
    ...new Set(
      scopeArray
        .filter(Boolean)
        .filter((scope) => ALLOWED_SCOPES.includes(scope))
    ),
  ];
};

/**
 * 스코프에 대응하는 property_keys 생성
 * @param {string[]} scopes
 * @returns {string[]}
 */
const getPropertyKeysForScopes = (scopes) => {
  const keys = [];

  if (scopes.includes('name')) {
    keys.push('kakao_account.name');
  }
  if (scopes.includes('phone_number')) {
    keys.push(
      'kakao_account.phone_number',
      'kakao_account.phone_number_needs_agreement'
    );
  }

  return keys;
};

/**
 * 카카오 인증 토큰 정보 정리
 * @param {Record<string, any>} authObj
 * @param {string} fallbackScope
 * @returns {{
 *  accessToken: string,
 *  refreshToken: string,
 *  idToken: string,
 *  expiresIn: number,
 *  scope: string,
 *  tokenType: string
 * }}
 */
const buildTokenPayload = (authObj = {}, fallbackScope = '') => {
  return {
    accessToken: authObj.access_token || '',
    refreshToken: authObj.refresh_token || '',
    idToken: authObj.id_token || '',
    expiresIn: authObj.expires_in || 0,
    scope: authObj.scope || fallbackScope || '',
    tokenType: authObj.token_type || 'Bearer',
  };
};

/**
 * 카카오 로그인 실행
 * @param {{
 *  scopes?: string[] | string,
 *  fetchUserInfo?: boolean,
 *  includeRawProfile?: boolean
 * }} options
 * @returns {Promise<{
 *  name: string,
 *  phone: string,
 *  email: string,
 *  tokens: ReturnType<typeof buildTokenPayload>,
 *  rawProfile?: any
 * }>} 사용자 및 토큰 정보
 */
export const loginWithKakao = async (options = {}) => {
  console.log('[loginWithKakao] 시작');

  const {
    scopes: inputScopes = [],
    fetchUserInfo,
    includeRawProfile = false,
  } = options || {};

  const requestedScopes = normalizeScopes(inputScopes);
  const scopeString = requestedScopes.join(',');
  const propertyKeys = getPropertyKeysForScopes(requestedScopes);
  const shouldFetchUserInfo =
    fetchUserInfo !== undefined
      ? Boolean(fetchUserInfo)
      : propertyKeys.length > 0;

  console.log('[loginWithKakao] 요청된 스코프:', requestedScopes);
  if (!shouldFetchUserInfo && requestedScopes.length === 0) {
    console.log('[loginWithKakao] 최소 권한 모드로 로그인 시도');
  }

  try {
    console.log('[loginWithKakao] SDK 로드 대기 시작');
    // SDK 로드 대기
    await waitForKakaoSDK();
    console.log('[loginWithKakao] SDK 로드 완료');
  } catch (error) {
    console.error('[loginWithKakao] SDK 로드 실패:', error);
    throw new Error(`카카오 SDK 로드 실패: ${error.message}`);
  }

  return new Promise((resolve, reject) => {
    console.log('[loginWithKakao] Promise 시작');
    
    if (!window.Kakao) {
      console.error('[loginWithKakao] window.Kakao 없음');
      reject(new Error('카카오 SDK가 로드되지 않았습니다. 페이지를 새로고침해주세요.'));
      return;
    }

    try {
      console.log('[loginWithKakao] SDK 초기화 시작');
      initKakaoSDK();
      console.log('[loginWithKakao] SDK 초기화 완료');
    } catch (error) {
      console.error('[loginWithKakao] SDK 초기화 실패:', error);
      reject(new Error(`카카오 SDK 초기화 실패: ${error.message}`));
      return;
    }

    const auth = window.Kakao.Auth;
    const loginFn =
      typeof auth?.login === 'function'
        ? auth.login
        : typeof auth?.loginWithKakaoAccount === 'function'
          ? auth.loginWithKakaoAccount
          : null;

    if (!loginFn) {
      reject(new Error('카카오 로그인 기능을 사용할 수 없습니다. SDK 버전을 확인해주세요.'));
      return;
    }

    console.log('[loginWithKakao] 카카오 로그인 팝업 호출 - scope:', scopeString || '(요청 없음)');

    const timeoutHandle = setTimeout(() => {
      console.error('[loginWithKakao] 타임아웃 발생 (30초)');
      reject(new Error('카카오 로그인 시간이 초과되었습니다.'));
    }, 30000);

    const loginConfig = {};
    if (scopeString) {
      loginConfig.scope = scopeString;
    }

    loginFn.call(auth, {
      ...loginConfig,
      success: (authObj) => {
        clearTimeout(timeoutHandle);
        try {
          const tokens = buildTokenPayload(authObj, scopeString);
          console.log('[loginWithKakao] 토큰 수신:', tokens);

          if (!shouldFetchUserInfo || propertyKeys.length === 0 || !window.Kakao?.API) {
            resolve({
              name: '',
              phone: '',
              email: '',
              tokens,
            });
            return;
          }

          console.log('[loginWithKakao] 사용자 정보 조회 시작');
          window.Kakao.API.request({
            url: '/v2/user/me',
            data: {
              property_keys: propertyKeys,
            },
            success: (res) => {
              console.log('[loginWithKakao] 사용자 정보 조회 성공:', res);
              const kakaoAccount = res.kakao_account || {};
              const phoneNeedsAgreement =
                kakaoAccount.phone_number_needs_agreement;

              const userInfo = {
                name: requestedScopes.includes('name')
                  ? kakaoAccount.profile?.nickname || ''
                  : '',
                phone:
                  requestedScopes.includes('phone_number') && !phoneNeedsAgreement
                    ? kakaoAccount.phone_number || ''
                    : '',
                email: requestedScopes.includes('account_email')
                  ? kakaoAccount.email || ''
                  : '',
                tokens,
                ...(includeRawProfile ? { rawProfile: res } : {}),
              };

              console.log('[loginWithKakao] 사용자 정보 추출 완료:', userInfo);
              resolve(userInfo);
            },
            fail: (err) => {
              console.error('[loginWithKakao] 사용자 정보 조회 실패:', err);
              reject(new Error('사용자 정보를 가져오는데 실패했습니다.'));
            },
          });
        } catch (error) {
          console.error('[loginWithKakao] 로그인 처리 중 에러:', error);
          reject(error);
        }
      },
      fail: (err) => {
        clearTimeout(timeoutHandle);
        console.error('[loginWithKakao] 로그인 실패 콜백:', err);
        if (err.error === 'invalid_scope') {
          const invalidScopeError = Object.assign(
            new Error('요청한 카카오 권한이 승인되지 않았습니다. 카카오 개발자 콘솔을 확인해주세요.'),
            { code: 'INVALID_SCOPE', original: err }
          );
          reject(invalidScopeError);
        } else if (err.error === 'access_denied' || err.error === 'user_cancelled') {
          reject(new Error('카카오 로그인이 취소되었습니다.'));
        } else {
          reject(
            new Error(
              `카카오 로그인에 실패했습니다: ${err.error || err.error_description || '알 수 없는 오류'}`
            )
          );
        }
      },
    });
  });
};

/**
 * 카카오 로그인 상태 확인
 * @returns {boolean} 로그인 여부
 */
export const isKakaoLoggedIn = () => {
  if (!window.Kakao) return false;
  return window.Kakao.Auth.getAccessToken() !== null;
};

/**
 * 카카오 로그아웃
 */
export const logoutKakao = () => {
  if (window.Kakao && window.Kakao.Auth.getAccessToken()) {
    window.Kakao.Auth.logout(() => {
      console.log('카카오 로그아웃 완료');
    });
  }
};

