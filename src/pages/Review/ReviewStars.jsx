import React from 'react';

/** 퍼블리싱 review.js stars(): 채운 별은 .is-on */
export default function ReviewStars({ rating }) {
  return (
    <div className="rv-stars" role="img" aria-label={`별점 ${rating}점`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <span key={value} className={`rv-star${value <= rating ? ' is-on' : ''}`} aria-hidden="true">
          ★
        </span>
      ))}
    </div>
  );
}
