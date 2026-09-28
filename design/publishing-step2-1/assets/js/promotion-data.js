/* 브랜드별 혜택(기획전) 데이터 */
(function (mock) {
  if (!mock) return;

  mock.promotion = {
    subtitle: "블라인드 카스토리가 제안하는 브랜드 혜택, 지금 확인해보세요",

    tabs: [
      { value: "ongoing", label: "진행중 기획전" },
      { value: "ended", label: "종료된 기획전" }
    ],

    notes: [
      "표기된 혜택은 계약 조건(기간·선납금·보증금·주행거리)에 따라 달라질 수 있습니다.",
      "제휴 카드·캐피탈 심사 결과에 따라 적용 여부가 결정됩니다.",
      "재고 소진 시 사전 고지 없이 조기 종료될 수 있습니다.",
      "표기 월 렌탈료는 장기렌트 48개월 · 선납금 30% · 연 20,000km 기준입니다."
    ],

    items: [
      {
        id: "p1", status: "ongoing", theme: "dark",
        brand: "현대", title: "현대 투싼 (블라인드 카스토리 × 하나캐피탈)",
        headline: "레이 가격으로 타는 투싼",
        benefit: "월 렌탈료 최대 12% 인하",
        discountLabel: "최대 12% 인하",
        partner: "블라인드 카스토리 × 하나캐피탈",
        period: "2026.08.01 ~ 2026.09.30",
        remainingDays: 34,
        stats: [
          { label: "월 렌탈료 인하", value: "12%" },
          { label: "최저 월 렌탈료", value: "236,330원" },
          { label: "대상 트림", value: "3개" }
        ],
        benefits: [
          { title: "월 렌탈료 12% 인하", desc: "제휴 캐피탈 특별 금리를 적용해 동일 조건 대비 월 납입금을 낮췄습니다." },
          { title: "세금·보험료 포함", desc: "취등록세와 자동차 보험료가 렌탈료에 포함돼 초기 목돈이 들지 않습니다." },
          { title: "재고 우선 배정", desc: "출고 대기 없이 계약 순서대로 재고 차량을 우선 배정해 드립니다." }
        ],
        targetModels: [
          { name: "투싼 1.6 터보 모던", trim: "가솔린 2WD", monthly: 236330 },
          { name: "투싼 1.6 터보 프레스티지", trim: "가솔린 2WD", monthly: 268400 },
          { name: "투싼 하이브리드 모던", trim: "1.6 터보 하이브리드", monthly: 237110 }
        ]
      },
      {
        id: "p2", status: "ongoing", theme: "gold",
        brand: "기아", title: "기아 카니발 (블라인드 카스토리 × KB캐피탈)",
        headline: "9인승 패밀리카, 선납금 0원으로",
        benefit: "선납금 0% · 완전무보증 동시 적용",
        discountLabel: "선납금 0%",
        partner: "블라인드 카스토리 × KB캐피탈",
        period: "2026.08.10 ~ 2026.09.15",
        remainingDays: 19,
        stats: [
          { label: "계약 선납금", value: "0원" },
          { label: "최저 월 렌탈료", value: "296,170원" },
          { label: "대상 트림", value: "2개" }
        ],
        benefits: [
          { title: "선납금 0원 계약", desc: "초기 목돈 없이 계약일에 첫 달 렌탈료만 납부하면 인도가 가능합니다." },
          { title: "완전무보증 병행", desc: "보증금을 넣지 않아도 동일한 특판 금리를 그대로 적용받습니다." },
          { title: "9인승 세제 혜택", desc: "승합 분류에 따른 자동차세·통행료 절감 조건을 함께 안내해 드립니다." }
        ],
        targetModels: [
          { name: "카니발 1.6T 하이브리드", trim: "9인승 프레스티지", monthly: 296170 },
          { name: "카니발 3.5 가솔린", trim: "9인승 노블레스", monthly: 318500 }
        ]
      },
      {
        id: "p3", status: "ongoing", theme: "night",
        brand: "르노코리아", title: "르노코리아 그랑 콜레오스 (블라인드 카스토리 × NH농협캐피탈)",
        headline: "출고 대기 0일, 하이브리드 즉시 인도",
        benefit: "재고 차량 한정 특판 금리",
        discountLabel: "즉시 인도",
        partner: "블라인드 카스토리 × NH농협캐피탈",
        period: "2026.08.05 ~ 2026.09.05",
        remainingDays: 9,
        stats: [
          { label: "인도 대기", value: "0일" },
          { label: "최저 월 렌탈료", value: "268,400원" },
          { label: "대상 트림", value: "2개" }
        ],
        benefits: [
          { title: "계약 후 최단 2일 인도", desc: "이미 확보된 재고 차량이라 서류 처리만 끝나면 바로 인도됩니다." },
          { title: "하이브리드 전용 금리", desc: "하이브리드 모델에만 적용되는 제휴 캐피탈 특판 금리를 제공합니다." },
          { title: "블랙박스·틴팅 기본", desc: "필수 옵션인 블랙박스와 전면 틴팅을 추가 비용 없이 장착해 드립니다." }
        ],
        targetModels: [
          { name: "그랑 콜레오스 1.6 하이브리드", trim: "아이코닉", monthly: 268400 },
          { name: "그랑 콜레오스 2.0 가솔린", trim: "테크노", monthly: 249800 }
        ]
      },
      {
        id: "p4", status: "ongoing", theme: "dark",
        brand: "제네시스", title: "제네시스 GV70 (블라인드 카스토리 × 신한카드)",
        headline: "프리미엄 SUV, 카드 혜택까지 더해서",
        benefit: "카드 청구할인 + 취등록세 지원",
        discountLabel: "취등록세 지원",
        partner: "블라인드 카스토리 × 신한카드",
        period: "2026.08.01 ~ 2026.10.31",
        remainingDays: 65,
        stats: [
          { label: "카드 청구할인", value: "최대 50만원" },
          { label: "최저 월 렌탈료", value: "468,200원" },
          { label: "대상 트림", value: "2개" }
        ],
        benefits: [
          { title: "카드 청구할인 최대 50만원", desc: "제휴 카드로 렌탈료를 결제하면 이용 기간 중 청구금액에서 차감됩니다." },
          { title: "취등록세 전액 지원", desc: "장기렌트 계약 시 발생하는 취등록세를 렌탈사가 부담합니다." },
          { title: "법인 심사 우대", desc: "법인·개인사업자 계약 시 별도 심사 기준으로 빠르게 진행됩니다." }
        ],
        targetModels: [
          { name: "GV70 2.5 터보 가솔린", trim: "AWD 스탠다드", monthly: 468200 },
          { name: "GV70 3.5 터보 가솔린", trim: "AWD 스포츠", monthly: 552400 }
        ]
      },
      {
        id: "p5", status: "ongoing", theme: "gold",
        brand: "기아", title: "기아 EV5 (블라인드 카스토리 × 우리금융캐피탈)",
        headline: "보조금에 특판까지, 월 9만원 인하",
        benefit: "전기차 보조금 + 특판 금리 동시 적용",
        discountLabel: "월 9만원 인하",
        partner: "블라인드 카스토리 × 우리금융캐피탈",
        period: "2026.08.20 ~ 2026.09.20",
        remainingDays: 24,
        stats: [
          { label: "월 납입금 인하", value: "90,000원" },
          { label: "최저 월 렌탈료", value: "422,400원" },
          { label: "대상 트림", value: "2개" }
        ],
        benefits: [
          { title: "보조금·특판 동시 적용", desc: "국고 및 지자체 보조금과 제휴 특판 금리를 중복으로 반영합니다." },
          { title: "충전기 설치 지원 안내", desc: "가정용 완속 충전기 설치 절차와 지원 조건을 함께 안내합니다." },
          { title: "전기차 전용 정비", desc: "계약 기간 중 전기차 전용 정비 패키지를 렌탈료에 포함합니다." }
        ],
        targetModels: [
          { name: "EV5 스탠다드", trim: "전기 에어 A/T", monthly: 422400 },
          { name: "EV5 롱레인지", trim: "전기 어스 A/T", monthly: 468900 }
        ]
      },
      {
        id: "p6", status: "ongoing", theme: "night",
        brand: "현대", title: "현대 그랜저 (블라인드 카스토리 × BNK캐피탈)",
        headline: "9월 한정, 그랜저 초저금리",
        benefit: "선납금 30% 조건 특별 금리",
        discountLabel: "9월 한정",
        partner: "블라인드 카스토리 × BNK캐피탈",
        period: "2026.09.01 ~ 2026.09.30",
        remainingDays: 34,
        stats: [
          { label: "적용 금리", value: "특판 최저" },
          { label: "최저 월 렌탈료", value: "331,540원" },
          { label: "대상 트림", value: "2개" }
        ],
        benefits: [
          { title: "선납금 30% 초저금리", desc: "선납금 30% 조건에서 가장 낮은 특판 금리가 자동으로 적용됩니다." },
          { title: "한정 물량 우선 배정", desc: "9월 배정 물량 내에서 계약 순서대로 차량을 확보해 드립니다." },
          { title: "인수 시 잔가 우대", desc: "계약 종료 후 인수를 선택하면 잔존가치를 우대 적용합니다." }
        ],
        targetModels: [
          { name: "그랜저 2.5 가솔린", trim: "익스클루시브", monthly: 331540 },
          { name: "그랜저 1.6 터보 하이브리드", trim: "익스클루시브", monthly: 356800 }
        ]
      },

      {
        id: "p7", status: "ended", theme: "dark",
        brand: "아우디", title: "아우디 A8 연말할인",
        headline: "A8 연말 재고, 마지막 한 대까지",
        benefit: "수입 대형 세단 한정 수량",
        discountLabel: "연말 한정",
        partner: "블라인드 카스토리 × iM캐피탈",
        period: "2025.11.01 ~ 2025.12.31",
        stats: [
          { label: "진행 결과", value: "전량 소진" },
          { label: "최저 월 렌탈료", value: "1,182,000원" },
          { label: "대상 트림", value: "1개" }
        ],
        benefits: [
          { title: "연말 재고 한정 할인", desc: "연식 변경 전 잔여 재고에 한해 추가 할인이 적용되었습니다." },
          { title: "수입 대형 세단 조건", desc: "대형 세단 전용 잔가 조건으로 월 납입금 부담을 낮췄습니다." },
          { title: "인도 일정 우선 배정", desc: "계약 순서대로 연내 인도가 가능하도록 일정을 우선 배정했습니다." }
        ],
        targetModels: [{ name: "A8 55 TFSI", trim: "quattro", monthly: 1182000 }]
      },
      {
        id: "p8", status: "ended", theme: "night",
        brand: "벤츠", title: "메르세데스 벤츠 E클래스 연말할인",
        headline: "E클래스, 연말에 가장 좋은 조건으로",
        benefit: "연말 한정 특판 금리",
        discountLabel: "연말 특판",
        partner: "블라인드 카스토리 × JB우리캐피탈",
        period: "2025.11.15 ~ 2025.12.31",
        stats: [
          { label: "진행 결과", value: "종료" },
          { label: "최저 월 렌탈료", value: "742,000원" },
          { label: "대상 트림", value: "2개" }
        ],
        benefits: [
          { title: "연말 프로모션 금리", desc: "연말 한정으로 제휴 캐피탈 특판 금리가 적용되었습니다." },
          { title: "리스 승계 상담", desc: "기존 리스 승계 조건을 함께 검토해 총비용을 비교해 드렸습니다." },
          { title: "정비 패키지 제공", desc: "계약 기간 중 소모품 정비 패키지를 함께 제공했습니다." }
        ],
        targetModels: [
          { name: "E220d", trim: "아방가르드", monthly: 742000 },
          { name: "E300 4MATIC", trim: "AMG 라인", monthly: 898000 }
        ]
      },
      {
        id: "p9", status: "ended", theme: "dark",
        brand: "벤츠", title: "벤츠 1월 프로모션",
        headline: "새해 첫 달, 수입차 특판 금리",
        benefit: "선납금 조건별 금리 인하",
        discountLabel: "신년 특판",
        partner: "블라인드 카스토리 × 메리츠캐피탈",
        period: "2026.01.01 ~ 2026.01.31",
        stats: [
          { label: "진행 결과", value: "종료" },
          { label: "최저 월 렌탈료", value: "612,000원" },
          { label: "대상 트림", value: "2개" }
        ],
        benefits: [
          { title: "신년 한정 특판", desc: "1월 계약 건에 한해 수입차 전용 특판 조건이 적용되었습니다." },
          { title: "선납금별 금리 인하", desc: "선납금 비율을 높일수록 금리가 추가로 인하되는 구조였습니다." },
          { title: "출고 대기 단축", desc: "국내 재고 물량을 우선 배정해 출고 대기 기간을 줄였습니다." }
        ],
        targetModels: [
          { name: "C200", trim: "아방가르드", monthly: 612000 },
          { name: "GLC300 4MATIC", trim: "AMG 라인", monthly: 786000 }
        ]
      },
      {
        id: "p10", status: "ended", theme: "night",
        brand: "폭스바겐", title: "폭스바겐 연초할인",
        headline: "연초 재고 정리, 즉시 출고 한정",
        benefit: "즉시 출고 가능 차량 한정",
        discountLabel: "재고 정리",
        partner: "블라인드 카스토리 × 롯데캐피탈",
        period: "2026.01.05 ~ 2026.02.28",
        stats: [
          { label: "진행 결과", value: "종료" },
          { label: "최저 월 렌탈료", value: "398,000원" },
          { label: "대상 트림", value: "2개" }
        ],
        benefits: [
          { title: "연초 재고 정리 할인", desc: "잔여 재고 차량에 한해 추가 할인 조건이 적용되었습니다." },
          { title: "즉시 출고 한정", desc: "국내 보유 재고만 대상으로 진행해 대기 없이 인도했습니다." },
          { title: "옵션 무상 장착", desc: "블랙박스·틴팅 등 기본 옵션을 무상으로 장착해 드렸습니다." }
        ],
        targetModels: [
          { name: "티구안 2.0 TDI", trim: "프레스티지", monthly: 398000 },
          { name: "아테온 2.0 TSI", trim: "프레스티지", monthly: 486000 }
        ]
      },
      {
        id: "p11", status: "ended", theme: "gold",
        brand: "현대", title: "현대 쏘나타 (블라인드 카스토리 × 삼성카드)",
        headline: "쏘나타, 카드로 30만원 더 아끼기",
        benefit: "카드 청구할인 최대 30만원",
        discountLabel: "청구할인 30만원",
        partner: "블라인드 카스토리 × 삼성카드",
        period: "2026.03.01 ~ 2026.04.30",
        stats: [
          { label: "카드 청구할인", value: "최대 30만원" },
          { label: "최저 월 렌탈료", value: "279,580원" },
          { label: "대상 트림", value: "2개" }
        ],
        benefits: [
          { title: "카드 청구할인 30만원", desc: "제휴 카드로 렌탈료를 결제하면 청구금액에서 순차 차감되었습니다." },
          { title: "카드 신규 발급 혜택", desc: "제휴 카드를 신규 발급하면 추가 캐시백이 함께 제공되었습니다." },
          { title: "장기렌트·리스 동시 비교", desc: "두 상품의 총비용을 나란히 비교해 유리한 쪽을 안내했습니다." }
        ],
        targetModels: [
          { name: "쏘나타 디 엣지 2.0 가솔린", trim: "프리미엄", monthly: 279580 },
          { name: "쏘나타 1.6 터보", trim: "인스퍼레이션", monthly: 302400 }
        ]
      },
      {
        id: "p12", status: "ended", theme: "dark",
        brand: "기아", title: "기아 스포티지 1월 특판",
        headline: "스포티지 신년 특판, 대기 없이 출고",
        benefit: "재고 차량 한정 신년 금리",
        discountLabel: "신년 특판",
        partner: "블라인드 카스토리 × 오릭스캐피탈",
        period: "2026.01.10 ~ 2026.02.10",
        stats: [
          { label: "진행 결과", value: "종료" },
          { label: "최저 월 렌탈료", value: "238,000원" },
          { label: "대상 트림", value: "2개" }
        ],
        benefits: [
          { title: "신년 특판 금리", desc: "1월 한정으로 스포티지 전용 특판 금리가 적용되었습니다." },
          { title: "출고 대기 없는 재고", desc: "보유 재고 차량만 대상으로 진행해 계약 후 바로 인도했습니다." },
          { title: "블랙박스 기본 제공", desc: "전 계약 건에 블랙박스를 기본으로 장착해 드렸습니다." }
        ],
        targetModels: [
          { name: "스포티지 1.6 터보", trim: "프레스티지 2WD", monthly: 238000 },
          { name: "스포티지 하이브리드", trim: "노블레스 2WD", monthly: 264300 }
        ]
      }
    ]
  };
})(window.BCS_MOCK);
