import React from 'react';
import { Link } from 'react-router-dom';
import { brandResultsPath } from './brandGroups';

/** 퍼블리싱 m-search.html .m-brandgrid (mobile-pages.js renderSearch). 로고가 없으면 이름을 마크로 쓴다. */
export default function MobileBrandGrid({ origin, brands }) {
  return (
    <div className="m-brandgrid">
      {brands.map((brand) => (
        <Link key={brand.name} className="m-brandbtn" to={brandResultsPath(origin, brand.name)}>
          <span className="m-brandbtn__mark">{brand.logoUrl ? <img src={brand.logoUrl} alt="" /> : brand.name}</span>
          <span className="m-brandbtn__name">{brand.name}</span>
        </Link>
      ))}
    </div>
  );
}
