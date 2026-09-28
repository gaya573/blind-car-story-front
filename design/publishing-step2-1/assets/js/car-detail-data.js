/* 차량 상세 기본 프리셋 (트림·옵션·색상·계약조건) */
(function (mock) {
  if (!mock) return;

  mock.carDetailPreset = {
    /* 외장색상 (국산차 기준 팔레트) */
    colors: [
      { id: "c1", name: "메타 블루 펄 (PM2)", hex: "#636d88" },
      { id: "c2", name: "에코트로닉 그레이 펄", hex: "#667574" },
      { id: "c3", name: "셰일 그레이 메탈릭", hex: "#797c85" },
      { id: "c4", name: "딥 포레스트 그린 펄", hex: "#3f443e" },
      { id: "c5", name: "아틀라스 화이트", hex: "#e8e7e7" },
      { id: "c6", name: "어비스 블랙 펄", hex: "#0e0f0f" },
      { id: "c7", name: "울트라 레드", hex: "#9c252b" },
      { id: "c8", name: "사이버 그레이 메탈릭", hex: "#52555e" }
    ],

    /* 추가 옵션 */
    optionsDomestic: [
      { id: "o1", name: "하이패스", price: 200000 },
      { id: "o2", name: "컨비니언스", price: 370000 },
      { id: "o3", name: "17인치 알로이 휠 & 타이어", price: 480000 },
      { id: "o4", name: "스마트센스 (주행보조)", price: 680000 },
      { id: "o5", name: "인포테인먼트 내비게이션", price: 780000 }
    ],
    optionsImported: [
      { id: "o1", name: "파노라마 글라스 선루프", price: 1900000 },
      { id: "o2", name: "헤드업 디스플레이", price: 1200000 },
      { id: "o3", name: "프리미엄 사운드 시스템", price: 1500000 },
      { id: "o4", name: "스포츠 패키지", price: 3200000 }
    ],

    /* 세부모델(트림) 생성 규칙 : 기본 트림 + 상위 3단계 */
    trimSteps: [
      { suffix: "", rate: 0 },
      { suffix: " (컨비니언스 팩)", rate: 0.07 },
      { suffix: " (프레스티지 팩)", rate: 0.15 },
      { suffix: " (시그니처 팩)", rate: 0.23 }
    ],

    /* 계약 조건 */
    contract: [
      {
        key: "usage", label: "이용방법",
        options: ["장기렌트", "리스", "신차구입(할부)"], value: "장기렌트"
      },
      {
        key: "term", label: "계약기간",
        options: ["24개월", "36개월", "48개월", "60개월"], value: "48개월"
      },
      {
        key: "deposit", label: "보증금",
        options: ["없음", "10%", "20%", "30%", "40%"], value: "없음"
      },
      {
        key: "prepay", label: "선납금",
        options: ["없음", "10%", "20%", "30%", "40%"], value: "30%"
      },
      {
        key: "mileage", label: "연간 약정운행거리",
        options: ["10,000km", "20,000km", "30,000km", "40,000km", "50,000km"], value: "20,000km"
      },
      {
        key: "age", label: "보험 연령",
        options: ["만 26세이상", "만 21세이상"], value: "만 26세이상"
      }
    ]
  };
})(window.BCS_MOCK);
