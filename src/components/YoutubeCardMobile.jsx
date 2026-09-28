import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { coalitionAPI } from '../services/coalitionApi';
import styles from '../mobilePages/main/MobleMain.module.css';

const YoutubeCardMobile = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);
  const isScrollingRef = useRef(false);
  const autoScrollTimer = useRef(null);
  const autoScrollDisabled = useRef(false); // 자동 스크롤 영구 비활성화 플래그

  // 제휴사 어드민 "배너관리"에 유튜브 유형으로 등록한 영상만 노출한다.
  const { data: popularVehicles, isLoading, isError, error } = useQuery({
    queryKey: ['coalition', 'youtube', 'mobile'],
    queryFn: async () => {
      try {
        return await coalitionAPI.getYoutubeVideos(6);
      } catch (err) {
        console.error('[YoutubeCardMobile] API 호출 에러:', err);
        return [];
      }
    },
    staleTime: 1000 * 60, // 1분
    retry: 1, // 실패 시 1번만 재시도
    refetchOnWindowFocus: false,
  });

  // 15배 복사하여 무한 스크롤 구현 (MobileAdvance 방식)
  const videosRepeated = useMemo(() => {
    if (!popularVehicles || popularVehicles.length === 0) return [];
    const copies = [];
    for (let i = 0; i < 15; i++) {
      copies.push(...popularVehicles.map((item, idx) => ({
        ...item,
        _uniqueKey: `${i}-${idx}-${item.id || idx}`
      })));
    }
    return copies;
  }, [popularVehicles]);

  // YouTube URL에서 비디오 ID 추출
  const extractVideoId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const handleVideoClick = (videoUrl) => {
    if (videoUrl) {
      window.open(videoUrl, '_blank', 'noopener noreferrer');
    }
  };

  const handleChannelClick = () => {
    window.open('https://www.youtube.com/@BlindCarstory', '_blank', 'noopener noreferrer');
  };

  // 스크롤 핸들러 (무한 스크롤)
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !popularVehicles || popularVehicles.length <= 1) return;
    
    // 사용자가 직접 스크롤하면 자동 스크롤 비활성화
    if (!isScrollingRef.current) {
      autoScrollDisabled.current = true;
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    }
    
    const scrollLeft = scrollRef.current.scrollLeft;
    const cardWidth = 166 + 10; // 카드 너비 + 간격
    const pageWidth = cardWidth * 2; // 2개씩 보임
    const totalPages = Math.ceil(popularVehicles.length / 2);
    
    // 현재 페이지 계산 (15세트 중 중간 세트 기준)
    const currentAbsolutePage = Math.round(scrollLeft / pageWidth);
    const currentPage = currentAbsolutePage % totalPages;
    
    setCurrentIndex(currentPage);
    
    // 무한 스크롤: 양 끝에 도달하면 중간으로 순간이동 (애니메이션 없이)
    if (!isScrollingRef.current) return;
    
    if (currentAbsolutePage < totalPages * 3) {
      // 0~2번째 세트 → 7번째 세트로 순간이동
      const pageInSet = currentAbsolutePage % totalPages;
      const targetScroll = (totalPages * 7 + pageInSet) * pageWidth;
      scrollRef.current.scrollLeft = targetScroll;
    } else if (currentAbsolutePage >= totalPages * 12) {
      // 12~14번째 세트 → 7번째 세트로 순간이동
      const pageInSet = currentAbsolutePage % totalPages;
      const targetScroll = (totalPages * 7 + pageInSet) * pageWidth;
      scrollRef.current.scrollLeft = targetScroll;
    }
  }, [popularVehicles]);

  // 특정 페이지로 스크롤
  const scrollToPage = useCallback((targetPageIndex) => {
    if (!scrollRef.current || !popularVehicles || popularVehicles.length <= 1) return;
    
    const cardWidth = 166 + 10;
    const pageWidth = cardWidth * 2;
    const totalPages = Math.ceil(popularVehicles.length / 2);
    const currentScrollLeft = scrollRef.current.scrollLeft;
    const currentAbsolutePage = Math.round(currentScrollLeft / pageWidth);
    const currentPage = currentAbsolutePage % totalPages;
    
    // 같은 페이지 클릭 시 아무것도 안 함
    if (currentPage === targetPageIndex) return;
    
    // 목표 페이지 계산 (현재 세트에서 가장 가까운 위치)
    const currentSetBase = Math.floor(currentAbsolutePage / totalPages) * totalPages;
    let targetAbsolutePage = currentSetBase + targetPageIndex;
    
    // 거리 계산하여 더 가까운 세트 선택
    if (targetPageIndex < currentPage && currentPage - targetPageIndex > totalPages / 2) {
      targetAbsolutePage += totalPages;
    } else if (targetPageIndex > currentPage && targetPageIndex - currentPage > totalPages / 2) {
      targetAbsolutePage -= totalPages;
    }
    
    const targetScrollLeft = targetAbsolutePage * pageWidth;
    
    // 스크롤 중 플래그 설정
    isScrollingRef.current = true;
    
    // 목표 페이지로 스크롤
    scrollRef.current.scrollTo({
      left: targetScrollLeft,
      behavior: 'smooth',
    });
    
    // 페이지 인덱스 즉시 업데이트 (UX 개선)
    setCurrentIndex(targetPageIndex);
    
    // 스크롤 완료 후 플래그 해제
    setTimeout(() => {
      isScrollingRef.current = false;
      
      // 스크롤 완료 후 무한 스크롤 재조정 확인
      if (scrollRef.current) {
        const finalScrollLeft = scrollRef.current.scrollLeft;
        const finalAbsolutePage = Math.round(finalScrollLeft / pageWidth);
        const middleSetStart = totalPages * 7;
        
        // 끝 세트에 있으면 중간 세트(7번째)로 순간이동
        if (finalAbsolutePage < totalPages * 4 || finalAbsolutePage > totalPages * 11) {
          const pageInSet = finalAbsolutePage % totalPages;
          const middlePosition = (middleSetStart + pageInSet) * pageWidth;
          scrollRef.current.scrollLeft = middlePosition;
        }
      }
    }, 800);
  }, [popularVehicles]);

  // 다음 페이지로 자동 이동
  const goToNextPage = useCallback(() => {
    if (!popularVehicles || popularVehicles.length <= 1) return;
    const totalPages = Math.ceil(popularVehicles.length / 2);
    const nextIndex = (currentIndex + 1) % totalPages;
    scrollToPage(nextIndex);
  }, [currentIndex, popularVehicles, scrollToPage]);

  // 사용자가 터치하면 자동 스크롤 영구 중지
  const handleTouchStart = () => {
    isScrollingRef.current = true;
    autoScrollDisabled.current = true; // 자동 스크롤 영구 비활성화
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
    }
  };

  const handleTouchEnd = () => {
    setTimeout(() => {
      isScrollingRef.current = false;
      // autoScrollDisabled는 그대로 유지 (자동 스크롤 재개하지 않음)
    }, 500);
  };

  // 초기 스크롤 위치를 중간 세트(7번째)로 설정
  useEffect(() => {
    if (!scrollRef.current || !popularVehicles || popularVehicles.length === 0) return;
    
    const cardWidth = 166 + 10;
    const pageWidth = cardWidth * 2;
    const totalPages = Math.ceil(popularVehicles.length / 2);
    // 15배 복사 중 중간(7번째 세트)에 위치
    const middleSetStart = totalPages * 7 * pageWidth;
    
    // 초기 스크롤 시 자동 스크롤 비활성화 방지
    isScrollingRef.current = true;
    
    // 약간의 지연을 두고 스크롤 위치 설정 (DOM 렌더링 완료 후)
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = middleSetStart;
      }
      // 초기 스크롤 완료 후 플래그 해제
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 100);
    }, 0);
  }, [popularVehicles]);

  // 자동 슬라이드 (4초마다) - 사용자가 터치하면 영구 중지
  useEffect(() => {
    if (!popularVehicles || popularVehicles.length <= 1 || autoScrollDisabled.current) return;

    // 타이머 시작
    autoScrollTimer.current = setInterval(() => {
      if (!autoScrollDisabled.current) {
        goToNextPage();
      }
    }, 4000);

    // 클린업
    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, [goToNextPage, popularVehicles]);

  // 로딩 상태
  if (isLoading) {
    return (
      <section className={styles.sectionWhite}>
        <div className={styles.youtubeHeader}>
          <img
            src="/유튜브.png"
            alt="YouTube"
            width="48"
            height="48"
            loading="lazy"
            style={{ width: '48px', height: '48px' }}
          />
          <h2 className={styles.youtubeTitle}>블라인드 카스토리 유튜브</h2>
        </div>
        <p style={{ textAlign: 'center', color: '#999', fontSize: 14, padding: '20px 0' }}>유튜브 영상 로딩 중...</p>
      </section>
    );
  }

  // 에러 발생 시 로그 출력 (하지만 섹션은 표시)
  if (isError) {
    console.error('[YoutubeCardMobile] API 에러:', error);
  }

  // 데이터가 없는 경우에도 섹션은 표시하되, 채널 버튼만 보여줌
  const hasVideos = popularVehicles && popularVehicles.length > 0;

  return (
    <section className={styles.youtubeSection}>
      {/* 헤더 */}
      <div className={styles.youtubeHeaderContainer}>
        <div className={styles.youtubeHeaderLeft}>
          <div className={styles.youtubeIconWrapper}>
            <img
              src="/유튜브.png"
              alt="YouTube"
              className={styles.youtubeIcon}
              loading="lazy"
            />
          </div>
          <h2 className={styles.youtubeTitleNew}>
            <span className={styles.youtubeTitleMedium}>블라인드 카스토리</span>
            <span className={styles.youtubeTitleSemiBold}> 유튜브</span>
          </h2>
        </div>
        <button className={styles.youtubeViewAllBtn} onClick={handleChannelClick}>
          <span className={styles.youtubeViewAllText}>전체보기</span>
          <img src="/모바일메인/화살표_오른쪽.svg" alt="전체보기" className={styles.youtubeViewAllIcon} />
        </button>
      </div>
      {hasVideos ? (
        <>
          <div 
            ref={scrollRef}
            className={styles.youtubeScrollContainer}
            onScroll={handleScroll}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className={styles.youtubeGridNew}>
              {videosRepeated.map((item, index) => {
                const youtubeUrl = item.youtube_url || item.youtubeUrl;
                if (!youtubeUrl) return null;
                
                const videoId = extractVideoId(youtubeUrl);
                
                return (
                  <div key={item._uniqueKey || `youtube-mobile-${index}`} className={styles.videoWrapper}>
                    <div 
                      className={styles.videoThumbnail}
                      onClick={() => handleVideoClick(youtubeUrl)}
                      role="button"
                      tabIndex={0}
                    >
                      {/* YouTube 썸네일 이미지 */}
                      {videoId ? (
                        <img 
                          src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                          alt={item.title || '유튜브 영상'}
                          className={styles.thumbnailImage}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.style.background = '#1c1c1c';
                          }}
                        />
                      ) : (
                        <div className={styles.thumbnailPlaceholder}>
                          영상 {(index % 2) + 1}
                        </div>
                      )}
                      
                      {/* 재생 버튼 오버레이 */}
                      <div className={styles.playOverlay}>
                        <div className={styles.playButton}>
                          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="36" cy="36" r="24" fill="white" fillOpacity="0.6"/>
                            <circle cx="36" cy="36" r="20" fill="white" fillOpacity="0.2"/>
                            <path d="M32 28L46 36.5L32 45V28Z" fill="white"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* 하단 인디케이터 */}
          {popularVehicles.length > 1 && (
            <div className={styles.youtubeIndicators}>
              {Array.from({ length: Math.ceil(popularVehicles.length / 2) }).map((_, index) => (
                <button
                  type="button"
                  key={`indicator-${index}`} 
                  className={index === currentIndex ? styles.youtubeIndicatorActive : styles.youtubeIndicator}
                  onClick={() => {
                    autoScrollDisabled.current = true; // 인디케이터 클릭 시 자동 스크롤 비활성화
                    if (autoScrollTimer.current) {
                      clearInterval(autoScrollTimer.current);
                    }
                    scrollToPage(index);
                  }}
                  aria-label={`${index + 1}페이지로 이동`}
                />
              ))}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
};

export default YoutubeCardMobile;

