import React from 'react';
import ExpressDealsPage from './ExpressDealsPage.jsx';

/** /m/advance/all : 오늘 출고 마감 영역 없이 전체 재고 차량 목록만 보여 준다. */
export default function MobileAdvanceAll() {
  return <ExpressDealsPage showUrgent={false} pageSize={12} />;
}
