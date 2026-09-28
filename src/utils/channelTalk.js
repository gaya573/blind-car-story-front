/**
 * 채널톡 SDK 유틸리티
 * 채널톡 SDK를 통해 사용자 정보를 설정하고 관리합니다.
 */

const CHANNEL_TALK_PLUGIN_KEY = '2aafbb44-86fa-4798-a037-6279b0f5aa6a'; // 채널톡 플러그인 키
let channelTalkBootPromise = null;

/**
 * 채널톡 SDK 로드
 */
export const loadChannelTalkSDK = () => {
  return new Promise((resolve, reject) => {
    // 이미 로드되어 있으면 바로 resolve
    if (window.ChannelIO) {
      resolve();
      return;
    }

    // 이미 스크립트가 로드 중이면 대기
    const existingScript = document.querySelector('script[src*="ch-plugin"]');
    if (existingScript) {
      existingScript.onload = () => {
        if (window.ChannelIO) {
          resolve();
        } else {
          reject(new Error('채널톡 SDK 스크립트는 로드되었지만 초기화되지 않았습니다.'));
        }
      };
      existingScript.onerror = () => {
        reject(new Error('채널톡 SDK 스크립트 로드에 실패했습니다.'));
      };
      return;
    }

    // 스크립트 동적 로드
    const script = document.createElement('script');
    script.src = 'https://cdn.channel.io/plugin/ch-plugin-web.js';
    script.async = true;
    
    script.onload = () => {
      setTimeout(() => {
        if (window.ChannelIO) {
          resolve();
        } else {
          reject(new Error('채널톡 SDK 스크립트는 로드되었지만 초기화되지 않았습니다.'));
        }
      }, 100);
    };
    
    script.onerror = () => {
      reject(new Error('채널톡 SDK 스크립트 로드에 실패했습니다. 네트워크 연결을 확인해주세요.'));
    };
    
    document.head.appendChild(script);
  });
};

/**
 * 채널톡 초기화 및 사용자 정보 설정
 * @param {Object} userInfo - 사용자 정보
 * @param {string} userInfo.name - 사용자 이름
 * @param {string} userInfo.phone - 사용자 전화번호
 * @param {string} userInfo.email - 사용자 이메일
 */
export const initChannelTalk = async (userInfo = null) => {
  try {
    await loadChannelTalkSDK();
  } catch (error) {
    console.error('채널톡 SDK 로드 실패:', error);
    throw error;
  }

  if (!window.ChannelIO) {
    throw new Error('채널톡 SDK가 로드되지 않았습니다.');
  }

  const pluginKey = CHANNEL_TALK_PLUGIN_KEY;

  // 사용자 정보가 있으면 설정
  const profile = userInfo ? {
    name: userInfo.name || '',
    mobileNumber: userInfo.phone || '',
    email: userInfo.email || '',
  } : undefined;

  return new Promise((resolve, reject) => {
    window.ChannelIO('boot', {
      pluginKey: pluginKey,
      profile: profile,
      appearance: 'light',
      language: 'ko',
    }, (error, user) => {
      if (error) {
        console.error('채널톡 초기화 실패:', error);
        reject(error);
      } else {
        console.log('채널톡 초기화 완료:', user);
        resolve(user);
      }
    });
  });
};

const ensureChannelTalkBooted = async (userInfo = null) => {
  if (typeof window === 'undefined') {
    throw new Error('채널톡은 브라우저 환경에서만 사용할 수 있습니다.');
  }

  if (!channelTalkBootPromise) {
    channelTalkBootPromise = initChannelTalk(userInfo).catch((error) => {
      channelTalkBootPromise = null;
      throw error;
    });
  } else if (userInfo) {
    updateChannelTalkUser(userInfo);
  }

  return channelTalkBootPromise;
};

export const sendChannelTalkMessage = async (message, userInfo = null) => {
  if (typeof window === 'undefined') {
    console.warn('채널톡 메시지는 브라우저 환경에서만 전송할 수 있습니다.');
    return false;
  }

  if (!message) {
    console.warn('채널톡으로 전송할 메시지가 비어 있습니다.');
    return false;
  }

  try {
    await ensureChannelTalkBooted(userInfo);

    if (!window.ChannelIO) {
      throw new Error('채널톡 SDK가 초기화되지 않았습니다.');
    }

    if (userInfo) {
      updateChannelTalkUser(userInfo);
    }

    window.ChannelIO('show');

    try {
      window.ChannelIO('sendUserMessage', message);
    } catch (sendError) {
      console.warn('채널톡 sendUserMessage 호출 실패 - track 이벤트로 대체합니다.', sendError);
      window.ChannelIO('track', 'quick_consult_message', { message });
    }

    return true;
  } catch (error) {
    console.error('채널톡 메시지 전송 실패:', error);
    return false;
  }
};

/**
 * 채널톡에 사용자 정보 업데이트
 * @param {Object} userInfo - 사용자 정보
 */
export const updateChannelTalkUser = (userInfo) => {
  if (!window.ChannelIO) {
    console.warn('채널톡 SDK가 로드되지 않았습니다.');
    return;
  }

  window.ChannelIO('updateUser', {
    name: userInfo.name || '',
    mobileNumber: userInfo.phone || '',
    email: userInfo.email || '',
  }, (error, user) => {
    if (error) {
      console.error('채널톡 사용자 정보 업데이트 실패:', error);
    } else {
      console.log('채널톡 사용자 정보 업데이트 완료:', user);
    }
  });
};

/**
 * 채널톡에서 사용자 정보 가져오기
 * 채널톡을 초기화하고 boot 콜백에서 사용자 정보를 가져옵니다.
 * @returns {Promise<Object>} 사용자 정보 {name, phone, email}
 */
export const getChannelTalkUser = async () => {
  try {
    console.log('[getChannelTalkUser] 시작');
    
    // SDK 로드
    await loadChannelTalkSDK();
    console.log('[getChannelTalkUser] SDK 로드 완료');
    
    if (!window.ChannelIO) {
      throw new Error('채널톡 SDK가 로드되지 않았습니다.');
    }

    const pluginKey = CHANNEL_TALK_PLUGIN_KEY;

    return new Promise((resolve, reject) => {
      console.log('[getChannelTalkUser] 채널톡 초기화 시작');
      
      // 채널톡 초기화 및 사용자 정보 가져오기
      window.ChannelIO('boot', {
        pluginKey: pluginKey,
        appearance: 'light',
        language: 'ko',
      }, (error, user) => {
        if (error) {
          console.error('[getChannelTalkUser] 채널톡 초기화 실패:', error);
          reject(new Error(`채널톡 초기화 실패: ${error.message || error}`));
          return;
        }
        
        console.log('[getChannelTalkUser] 채널톡 초기화 완료, 사용자 객체:', user);
        console.log('[getChannelTalkUser] 사용자 객체 전체:', JSON.stringify(user, null, 2));
        
        // 사용자 정보 추출 (다양한 가능한 경로 확인)
        const userInfo = {
          name: user?.name || user?.profile?.name || '',
          phone: user?.mobileNumber || user?.profile?.mobileNumber || user?.phone || user?.phoneNumber || '',
          email: user?.email || user?.profile?.email || '',
        };
        
        console.log('[getChannelTalkUser] 추출된 사용자 정보:', userInfo);
        
        // 연락처가 없으면 채널톡 채팅창을 열어서 사용자가 정보를 입력하도록 유도
        if (!userInfo.phone) {
          console.log('[getChannelTalkUser] 연락처 없음 - 채널톡 채팅창 열기');
          window.ChannelIO('show');
          
          // 채널톡 이벤트 리스너 등록
          window.ChannelIO('onBadgeChanged', (count) => {
            console.log('[getChannelTalkUser] 채널톡 배지 변경:', count);
          });
          
          // 채널톡 채팅창이 열린 후 사용자 정보 업데이트 대기
          // 채널톡에서 사용자가 정보를 입력하면 onProfileChanged 이벤트 발생
          let profileResolved = false;
          
          // 프로필 변경 이벤트 감지 (채널톡 SDK가 지원하는 경우)
          try {
            window.ChannelIO('onProfileChanged', (profile) => {
              console.log('[getChannelTalkUser] 프로필 변경 감지:', profile);
              if (profile && !profileResolved) {
                profileResolved = true;
                const updatedInfo = {
                  name: profile?.name || userInfo.name,
                  phone: profile?.mobileNumber || profile?.phone || userInfo.phone,
                  email: profile?.email || userInfo.email,
                };
                console.log('[getChannelTalkUser] 업데이트된 프로필:', updatedInfo);
                resolve(updatedInfo);
              }
            });
          } catch (e) {
            console.log('[getChannelTalkUser] onProfileChanged 이벤트 지원 안 함:', e);
          }
          
          // 일정 시간 후 타임아웃 (5초)
          setTimeout(() => {
            if (!profileResolved) {
              console.log('[getChannelTalkUser] 타임아웃 - 기존 정보 반환');
              profileResolved = true;
              resolve(userInfo);
            }
          }, 5000);
        } else {
          resolve(userInfo);
        }
      });
    });
  } catch (error) {
    console.error('[getChannelTalkUser] 에러:', error);
    throw error;
  }
};

/**
 * 채널톡 채팅창 열기
 */
export const openChannelTalk = () => {
  if (!window.ChannelIO) {
    console.warn('채널톡 SDK가 로드되지 않았습니다.');
    return;
  }

  window.ChannelIO('show');
};

/**
 * 채널톡 채팅창 닫기
 */
export const hideChannelTalk = () => {
  if (!window.ChannelIO) {
    return;
  }

  window.ChannelIO('hide');
};

