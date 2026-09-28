import React from 'react';

const extractYoutubeId = (url) => {
  if (!url) return null;
  const match = String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  return match ? match[1] : null;
};

/** 제휴 어드민 YOUTUBE 콘텐츠 한 건을 퍼블리싱 .youtube-card 로 그린다. 썸네일이 없으면 유튜브 썸네일을 쓴다. */
export default function YoutubeCardLink({ video, className = 'youtube-card' }) {
  const url = video?.youtubeUrl ?? video?.youtube_url ?? '';
  const videoId = extractYoutubeId(url);
  const fallback = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '';
  const thumbnail = video?.imageUrl || (videoId ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : fallback);
  const title = video?.title ?? '';

  return (
    <a className={className} href={url} target="_blank" rel="noopener noreferrer">
      <div className="youtube-card__thumb">
        <img
          src={thumbnail}
          alt={title}
          loading="lazy"
          onError={(event) => {
            if (fallback && event.currentTarget.src !== fallback) event.currentTarget.src = fallback;
          }}
        />
        <div className="youtube-card__play">
          <span aria-hidden="true">▶</span>
        </div>
      </div>
      <p>{title}</p>
    </a>
  );
}
