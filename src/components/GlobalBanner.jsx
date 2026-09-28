import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { coalitionAPI } from '../services/coalitionApi';
import './GlobalBanner.css';

const GlobalBanner = () => {
  const navigate = useNavigate();

  // 전체 배너 데이터 가져오기 - 제휴사 어드민의 "메인 홈 + 하단" 배너
  const { data: bannerData } = useQuery({
    queryKey: ['coalition', 'banners', 'global-bottom'],
    queryFn: () => coalitionAPI.getGlobalBanners(),
    staleTime: 1000 * 60 * 5, // 5분
  });

  // 배너 목록 추출 (BOTTOM 포지션만 사용)
  const banners = useMemo(() => {
    if (!bannerData) return [];

    const toArray = (data) => {
      if (Array.isArray(data)) return data;
      if (data.items && Array.isArray(data.items)) return data.items;
      return data ? [data] : [];
    };

    return toArray(bannerData)
      .filter((b) => {
        const pos = b?.position || b?.positionType;
        if (!pos) return true; // 예전 데이터 호환: position 없으면 그대로 사용
        return pos === 'BOTTOM';
      })
      .filter((b) => b.imageUrl || b.image_url);
  }, [bannerData]);

  // 배너 슬라이드 상태
  const [bannerIndex, setBannerIndex] = useState(0);

  // 배너 데이터 변경 시 인덱스 리셋
  useEffect(() => {
    setBannerIndex(0);
  }, [banners.length]);

  // 배너 클릭 핸들러
  const handleBannerClick = (banner) => {
    if (banner?.linkUrl || banner?.link_url) {
      const url = banner.linkUrl || banner.link_url;
      if (url.startsWith('http://') || url.startsWith('https://')) {
        window.open(url, '_blank');
      } else {
        navigate(url);
      }
    }
  };

  // 배너가 없으면 표시하지 않음
  if (banners.length === 0) {
    return null;
  }

  return (
    <div className="global-banner-wrapper">
      <div 
        className="global-banner-track"
        style={{ transform: `translateX(-${bannerIndex * 100}%)` }}
      >
        {banners.map((banner, index) => (
          <div
            key={banner.id || index}
            className="global-banner"
            onClick={() => handleBannerClick(banner)}
            style={{
              cursor: (banner?.linkUrl || banner?.link_url) ? 'pointer' : 'default',
              ...(banner?.imageUrl || banner?.image_url ? {
                backgroundImage: `url("${banner.imageUrl || banner.image_url}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } : {})
            }}
          >
            <div className="global-banner-content">
            </div>
          </div>
        ))}
      </div>
      {banners.length > 1 && (
        <div className="global-banner-pager">
          <button
            type="button"
            className="global-banner-arrow"
            onClick={() => setBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)}
            aria-label="이전"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="global-banner-pager-text">
            {bannerIndex + 1}/{banners.length}
          </span>
          <button
            type="button"
            className="global-banner-arrow"
            onClick={() => setBannerIndex((prev) => (prev + 1) % banners.length)}
            aria-label="다음"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default GlobalBanner;

