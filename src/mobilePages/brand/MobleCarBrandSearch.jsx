import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCarBrandsQuery } from '../../hooks/queries/carQueries';
import { MobileSubHeader } from '../../bcs/layout/MobileLayout';

// 퍼블리싱 manufacturers 로고. 차량 API 브랜드 이름으로 찾는다.
const LOGO_FILES = {
  현대: 'hyundai.svg',
  기아: 'kia.svg',
  제네시스: 'genesis.svg',
  르노코리아: 'renault-korea.svg',
  르노삼성: 'renault-korea.svg',
  KGM: 'kgm.svg',
  KG모빌리티: 'kgm.svg',
  쉐보레: 'chevrolet.svg',
  BMW: 'bmw.svg',
  벤츠: 'mercedes-benz.svg',
  아우디: 'audi.svg',
  폭스바겐: 'volkswagen.svg',
  볼보: 'volvo.svg',
  렉서스: 'lexus.svg',
  토요타: 'toyota.svg',
  도요타: 'toyota.svg',
  BYD: 'byd.svg',
  포드: 'ford.svg',
  폴스타: 'polestar.svg',
};

// 차량 API country 는 국산 KR / 수입 IMPORT 로 온다. 예전 데이터의 국가명 표기도 국산으로 본다.
const isDomesticCountry = (country) => {
  const value = String(country ?? '').trim().toLowerCase();
  return value === 'kr' || ['korea', '한국', '대한민국'].some((token) => value.includes(token));
};

const resultsPath = (origin, brandName) => {
  const params = new URLSearchParams({ carOrigin: origin, brand: brandName });
  return `/m/search/results?${params.toString()}`;
};

function BrandGroup({ title, origin, brands, last }) {
  return (
    <section className="m-brandgroup" style={last ? { paddingBottom: 24 } : undefined}>
      <h2 className="m-brandgroup__title">{title}</h2>
      {brands.length > 0 ? (
        <div className="m-brandgrid">
          {brands.map((brand) => {
            const logo = LOGO_FILES[brand.name];
            return (
              <Link className="m-brandbtn" key={brand.id ?? brand.name} to={resultsPath(origin, brand.name)}>
                <span className="m-brandbtn__mark">{logo ? <img src={`/bcs/images/manufacturers/${logo}`} alt="" /> : brand.name}</span>
                <span className="m-brandbtn__name">{brand.name}</span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

/** 제조사 선택 (/m/brand/search). 퍼블리싱 m-search 의 브랜드 그리드로 그리고, 누르면 해당 브랜드 검색결과로 간다. */
export default function MobleCarBrandSearch() {
  const { data: brandsData = [], isLoading } = useCarBrandsQuery();

  const { domestic, imported } = useMemo(() => {
    const list = Array.isArray(brandsData) ? brandsData.filter((brand) => brand?.name) : [];
    return {
      domestic: list.filter((brand) => isDomesticCountry(brand.country)),
      imported: list.filter((brand) => !isDomesticCountry(brand.country)),
    };
  }, [brandsData]);

  return (
    <>
      <MobileSubHeader title="제조사 선택" />
      <main id="main-content">
        <div className="m-pagehead">
          <h1>
            제조사를 <em>선택해 주세요</em>
          </h1>
          <p>브랜드를 선택하면 해당 브랜드 차량으로 견적을 제공합니다.</p>
        </div>

        {isLoading ? <p className="m-empty">브랜드를 불러오는 중...</p> : null}
        {!isLoading && domestic.length + imported.length === 0 ? <p className="m-empty">표시할 브랜드가 없습니다.</p> : null}

        <BrandGroup title="국산차" origin="domestic" brands={domestic} />
        <BrandGroup title="수입차" origin="imported" brands={imported} last />
      </main>
    </>
  );
}
