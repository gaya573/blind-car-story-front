import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { coalitionAPI } from '../services/coalitionApi';
import './YoutubeCard.css';

const YoutubeCard = () => {
  // 제휴사 어드민 "배너관리"에 유튜브 유형으로 등록한 영상만 노출한다.
  const { data: popularVehicles, isLoading, isError } = useQuery({
    queryKey: ['coalition', 'youtube', 'pc'],
    queryFn: () => coalitionAPI.getYoutubeVideos(3),
    staleTime: 1000 * 60, // 1분
  });

  // YouTube URL에서 비디오 ID 추출
  const extractVideoId = (url) => {
    if (!url) return null;
    // 여러 형식 지원: youtube.com/watch?v=, youtu.be/, youtube.com/embed/
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

  const videos = React.useMemo(
    () => (popularVehicles || []).filter((item) => item && (item.youtube_url || item.youtubeUrl)),
    [popularVehicles],
  );

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="youtube-card">
        <div className="youtube-header">
          <div className="youtube-title-section">
            <div className="youtube-title-section-left">
              <img
                src="/유튜브.png"
                alt="YouTube"
                width="48"
                height="48"
                loading="lazy"
              />
              <h2 className="youtube-main-title">블라인드 카스토리 유튜브</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 에러 또는 데이터가 없는 경우
  if (isError || !videos || videos.length === 0) {
    return null; // 데이터가 없으면 표시하지 않음
  }

  return (
    <div className="youtube-card">
      {/* 최상단: 제목 */}
      <div className="youtube-header">
        <div className="youtube-title-section">
          <div className="youtube-title-section-left">
            <img
              src="/유튜브.png"
              alt="YouTube"
              width="48"
              height="48"
              loading="lazy"
            />
            <h2 className="youtube-main-title">블라인드 카스토리 유튜브</h2>
          </div>
        </div>
      </div>

      {/* 콘텐츠 영역: 3개 영상 */}
      <div className="youtube-content">
        {/* 3개 영상 썸네일 */}
        <div className="videos-grid">
          {videos.map((item, index) => {
            const youtubeUrl = item.youtube_url || item.youtubeUrl;
            const videoId = extractVideoId(youtubeUrl || item.youtubeUrl);

            return (
              <div 
                key={item.id || `youtube-${index}`} 
                className="video-thumbnail-wrapper" 
                onClick={() => handleVideoClick(youtubeUrl)}
              >
                <div className="video-thumbnail-placeholder">
                  {/* YouTube 썸네일 이미지 */}
                  {videoId && (
                    <img 
                      src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                      alt="유튜브 영상"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        // 이미지 로드 실패 시 플레이스홀더 표시
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                </div>
                <div className="video-overlay">
                  <div className="play-button-circle">
                    <div className="play-icon">▶</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* 하단 버튼 */}
      <div className="youtube-bottom-button">
        <button className="more-videos-btn" onClick={handleChannelClick}>
          더 많은 차량 할인 팁 영상 보러가기 →
        </button>
      </div>
    </div>
  );
};

export default YoutubeCard;
