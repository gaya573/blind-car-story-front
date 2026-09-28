import React, { useState, useMemo } from 'react';
import styles from './MobleCarBrandSearch.module.css';
import { useNavigate } from 'react-router-dom';
import { ManufacturerSelectButtonMobile, ButtonLarge } from '../../components/Buttons.jsx';
import { useCarBrandsQuery } from '../../hooks/queries/carQueries';

// 국산 브랜드로 분류할 국가 목록
const DOMESTIC_COUNTRIES = ['한국', '대한민국', 'Korea', 'South Korea'];

export default function MobleCarBrandSearch() {
  const [selectedBrand, setSelectedBrand] = useState('');
  const navigate = useNavigate();

  // 브랜드 API 호출
  const { data: brandsData = [] } = useCarBrandsQuery();

  // 브랜드를 국산/수입으로 분류
  const { domesticBrands, importBrands } = useMemo(() => {
    const domestic = [];
    const importBrandsList = [];
    
    brandsData.forEach((brand) => {
      const country = brand.country?.toLowerCase() || '';
      const isDomestic = DOMESTIC_COUNTRIES.some((c) => country.includes(c.toLowerCase()));
      
      if (isDomestic) {
        domestic.push(brand);
      } else {
        importBrandsList.push(brand);
      }
    });
    
    return { domesticBrands: domestic, importBrands: importBrandsList };
  }, [brandsData]);

  const onSelectBrand = (brand) => setSelectedBrand(brand);
  const goNext = () => {
    if (!selectedBrand) return;
    navigate(`/m/search/results?brand=${encodeURIComponent(selectedBrand)}`);
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.lead}>
          <div className={styles.leadTitle}>제조사를 선택해주세요.</div>
          <div className={styles.leadSub}>브랜드를 선택하면 해당 브랜드 차량으로 견적을 제공합니다.</div>
        </div>
      </div>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>국내 브랜드</h3>
        <div className={styles.grid}>
          {domesticBrands.map((brand) => (
            <ManufacturerSelectButtonMobile
              key={brand.id}
              brandName={brand.name}
              isSelected={selectedBrand === brand.name}
              onClick={() => onSelectBrand(brand.name)}
            />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>수입 브랜드</h3>
        <div className={styles.grid}>
          {importBrands.map((brand) => (
            <ManufacturerSelectButtonMobile
              key={brand.id}
              brandName={brand.name}
              isSelected={selectedBrand === brand.name}
              onClick={() => onSelectBrand(brand.name)}
            />
          ))}
        </div>
      </section>

      <div className={styles.nextBar}>
        <ButtonLarge state={selectedBrand ? 'active' : 'disabled'} onClick={goNext}>
          다음
        </ButtonLarge>
      </div>
      <div className={styles.tabbarPlaceholder} />
    </div>
  );
}


