import { Helmet } from 'react-helmet';

/**
 * Schema.org 구조화 데이터 컴포넌트
 * Google 검색 결과에서 리치 스니펫을 표시하기 위함
 */
/** 배포 도메인이 확정되지 않아 실행 중인 주소를 그대로 쓴다. */
const siteOrigin = () =>
  typeof window !== 'undefined' && window.location ? window.location.origin : '';

const StructuredData = ({ data }) => {
  if (!data) return null;

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(data)}
      </script>
    </Helmet>
  );
};

// 조직 정보 (모든 페이지에 사용)
export const getOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "블라인드 카스토리",
  "url": siteOrigin(),
  "logo": `${siteOrigin()}/logo/carstory-logo.svg`,
  "description": "신차 장기렌트·리스 최저가 비교 서비스. 중간 수수료 0원으로 최대 할인. 경기·서울 전역 당일 상담, 전국 배송 가능. 22개 렌트·캐피탈사 비교 견적.",
  "telephone": "1577-8319",
  "address": {
    "@type": "PostalAddress",
    "addressRegion": "경기도",
    "addressCountry": "KR"
  },
  "areaServed": [
    {
      "@type": "State",
      "name": "경기도"
    },
    {
      "@type": "City",
      "name": "서울"
    },
    {
      "@type": "Country",
      "name": "대한민국"
    }
  ],
  "sameAs": [
    "https://www.youtube.com/@BlindCarstory"
  ]
});

// 지역 비즈니스 (홈페이지용)
export const getLocalBusinessSchema = () => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "블라인드 카스토리",
  "image": `${siteOrigin()}/logo/carstory-logo.svg`,
  "description": "경기·서울 전역 장기렌트·리스 전문. 중간 수수료 0원, 특판·전시·재고차 최대 할인. 전국 배송 가능. 저신용·무직자도 승인 가능.",
  "address": {
    "@type": "PostalAddress",
    "addressRegion": "경기도",
    "addressCountry": "KR"
  },
  "areaServed": [
    {
      "@type": "State",
      "name": "경기도"
    },
    {
      "@type": "City",
      "name": "서울특별시"
    },
    {
      "@type": "Country",
      "name": "대한민국"
    }
  ],
  "url": siteOrigin(),
  "telephone": "1577-8319",
  "priceRange": "$$",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"
      ],
      "opens": "09:00",
      "closes": "18:00"
    }
  ]
});

// 제품 리스트 (CarList용)
export const getProductListSchema = (products = []) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  "itemListElement": products.map((product, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "item": {
      "@type": "Product",
      "name": product.name,
      "description": product.description || `${product.name} 장기렌트·리스 최저가 비교`,
      "image": product.image,
      "offers": {
        "@type": "Offer",
        "priceCurrency": "KRW",
        "price": product.price,
        "priceValidUntil": product.priceValidUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        "availability": "https://schema.org/InStock",
        "url": `${siteOrigin()}${product.url}`
      }
    }
  }))
});

// 리뷰 (Review용)
export const getReviewSchema = (reviews = []) => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "블라인드 카스토리",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length).toFixed(1)
      : "5.0",
    "reviewCount": reviews.length || 1,
    "bestRating": "5",
    "worstRating": "1"
  },
  "review": reviews.slice(0, 10).map((review) => ({
    "@type": "Review",
    "author": {
      "@type": "Person",
      "name": review.author || "익명 고객"
    },
    "datePublished": review.date || new Date().toISOString().split('T')[0],
    "reviewBody": review.text || "블라인드 카스토리 이용 후기",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": review.rating || 5,
      "bestRating": "5",
      "worstRating": "1"
    }
  }))
});

// FAQ 스키마 (나중에 FAQ 페이지 만들 때 사용)
export const getFAQSchema = (faqs = []) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map((faq) => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
});

// 빵부스러기 (Breadcrumb)
export const getBreadcrumbSchema = (items = []) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.label,
    "item": item.link ? `${siteOrigin()}${item.link}` : undefined
  }))
});

export default StructuredData;
