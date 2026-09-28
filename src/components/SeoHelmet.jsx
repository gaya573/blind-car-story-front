import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';

const SeoHelmet = ({ title, description, keywords, canonical, image }) => {
  const baseTitle = '블라인드 카스토리 | 신차 장기렌트·자동차 리스 최저가 비교견적';
  const resolvedTitle = title || baseTitle;

  // 기본 canonical URL: 현재 위치 기준 (쿼리스트링/해시 제거)
  let resolvedCanonical = canonical;
  if (!resolvedCanonical && typeof window !== 'undefined') {
    const { origin, pathname } = window.location;
    resolvedCanonical = `${origin}${pathname}`;
  }

  // 기본 OG 이미지: 사이트 공통 대표 썸네일
  const resolvedImage = image ;

  return (
    <Helmet>
      <title>{resolvedTitle}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}

      {resolvedCanonical && <link rel="canonical" href={resolvedCanonical} />}

      {/* 기본 OG 메타 */}
      <meta property="og:title" content={resolvedTitle} />
      {description && <meta property="og:description" content={description} />}
      {resolvedCanonical && <meta property="og:url" content={resolvedCanonical} />}
      {resolvedImage && <meta property="og:image" content={resolvedImage} />}
    </Helmet>
  );
};

SeoHelmet.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  keywords: PropTypes.string,
  canonical: PropTypes.string,
  image: PropTypes.string,
};

export default SeoHelmet;


