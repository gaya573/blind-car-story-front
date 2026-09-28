import React, { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { contentAPI } from '../../services/contentApi';
import ConsultBannerForm from '../../bcs/components/ConsultBannerForm';
import ExpressCard from './ExpressCard';
import { toExpressCard } from './expressModel';
import './express-bcs.css';

/**
 * 예전 재고 특가 상세 주소(/express-deals/detail/:carId).
 * 트림이 연결된 재고는 트림 상세로 보내고, 트림이 없으면 재고 카드와 상담 배너만 보여준다.
 */
const ExpressDealDetail = () => {
  const { carId } = useParams();
  const { data: item, isLoading, isError } = useQuery({
    queryKey: ['express-deal', 'item', carId],
    queryFn: async () => {
      const items = await contentAPI.getUrgentInventory(1000);
      return items.find((row) => String(row.id) === String(carId)) ?? null;
    },
    enabled: Boolean(carId),
  });
  const car = useMemo(() => (item ? toExpressCard(item) : null), [item]);

  if (car?.trimId) {
    return <Navigate to={`/car-detail/trim/${car.trimId}`} replace />;
  }

  return (
    <div className="bcs-page-express">
      <section className="express-page">
        <div className="container">
          <nav className="ex-breadcrumb" aria-label="현재 위치">
            <Link to="/">홈</Link>
            <span aria-hidden="true">›</span>
            <Link to="/express-deals">재고 특가 핫딜</Link>
            <span aria-hidden="true">›</span>
            <strong>{car?.vehicleName || '재고 차량'}</strong>
          </nav>

          <section className="ex-list-section ex-list-section--top" aria-labelledby="ex-detail-title">
            <div className="ex-section-head">
              <h1 className="ex-section-title" id="ex-detail-title">
                {car?.vehicleName || '재고 특가 차량'}
              </h1>
            </div>

            {isLoading ? (
              <p className="ex-empty">차량 정보를 불러오는 중입니다...</p>
            ) : isError || !car ? (
              <p className="ex-empty">
                차량 정보를 찾을 수 없습니다. 이미 마감된 재고일 수 있습니다.
                <br />
                <Link to="/express-deals">재고 특가 핫딜 목록으로 돌아가기</Link>
              </p>
            ) : (
              <div className="ex-grid">
                <ExpressCard car={car} source="express-deals-detail" />
              </div>
            )}
          </section>

          <ConsultBannerForm
            key={car?.id ?? 'loading'}
            idPrefix="express-detail-banner"
            source="express-deals-detail"
            entryLabel="재고 특가 상세 상담 배너"
            carModel={car?.vehicleName ?? ''}
          />
        </div>
      </section>
    </div>
  );
};

export default ExpressDealDetail;
