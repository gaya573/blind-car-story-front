/* 재고 특가 핫딜 데이터 */
(function (mock) {
  if (!mock) return;

  const SEDAN = "./assets/images/cars/car-sedan.svg";
  const SUV = "./assets/images/cars/car-suv.svg";

  mock.express = {
    conditionLabel: "48개월 / 선납 30% / 2만km 기준",

    brands: [
      { value: "all", label: "전체", mark: "전체" },
      { value: "hyundai", label: "현대", logoUrl: "./assets/images/manufacturers/hyundai.svg" },
      { value: "kia", label: "기아", logoUrl: "./assets/images/manufacturers/kia.svg" },
      { value: "genesis", label: "제네시스", logoUrl: "./assets/images/manufacturers/genesis.svg" },
      { value: "renault", label: "르노코리아", logoUrl: "./assets/images/manufacturers/renault-korea.svg" },
      { value: "kgm", label: "KG모빌리티", logoUrl: "./assets/images/manufacturers/kgm.svg" },
      { value: "chevrolet", label: "쉐보레", logoUrl: "./assets/images/manufacturers/chevrolet.svg" }
    ],

    cars: [
      {
        id: "e1", brand: "kia", brandLabel: "기아", urgent: true,
        title: "기아 스포티지", trim: "스포티지 가솔린 터보 1.6 프레스티지 2WD A/T",
        imageUrl: SUV, basePrice: 28630000,
        prepayment30: 238000, deposit30: 346280, noDeposit: 393430,
        remainingDays: 3, stock: 3
      },
      {
        id: "e2", brand: "kia", brandLabel: "기아", urgent: true,
        title: "기아 K8", trim: "K8 가솔린 2.5 노블레스 라이트 A/T",
        imageUrl: SEDAN, basePrice: 36790000,
        prepayment30: 328880, deposit30: 463300, noDeposit: 519800,
        remainingDays: 3, stock: 2
      },
      {
        id: "e3", brand: "hyundai", brandLabel: "현대", urgent: true,
        title: "현대 더 뉴 투싼", trim: "가솔린 1.6 터보 모던",
        imageUrl: SUV, basePrice: 28050000,
        prepayment30: 236330, deposit30: 358650, noDeposit: 399410,
        remainingDays: 2, stock: 4
      },
      {
        id: "e4", brand: "kia", brandLabel: "기아", urgent: true,
        title: "기아 더 뉴 쏘렌토", trim: "1.6 터보 프레스티지 5인승 2WD 하이브리드",
        imageUrl: SUV, basePrice: 38960000,
        prepayment30: 252390, deposit30: 429110, noDeposit: 484880,
        remainingDays: 1, stock: 1
      },
      {
        id: "e5", brand: "hyundai", brandLabel: "현대",
        title: "현대 투싼", trim: "모던 하이브리드",
        imageUrl: SUV, basePrice: 32700000,
        prepayment30: 237110, deposit30: 386100, noDeposit: 433180,
        remainingDays: 13, stock: 5
      },
      {
        id: "e6", brand: "hyundai", brandLabel: "현대",
        title: "현대 쏘나타", trim: "2.0 가솔린 프리미엄",
        imageUrl: SEDAN, basePrice: 28260000,
        prepayment30: 279580, deposit30: 402710, noDeposit: 447800,
        remainingDays: 13, stock: 6
      },
      {
        id: "e7", brand: "kia", brandLabel: "기아",
        title: "기아 더 뉴 카니발", trim: "1.6T 9인승 하이브리드",
        imageUrl: SUV, basePrice: 40910000,
        prepayment30: 296170, deposit30: 474210, noDeposit: 530530,
        remainingDays: 13, stock: 3
      },
      {
        id: "e8", brand: "kia", brandLabel: "기아",
        title: "기아 EV5", trim: "EV5 전기 스탠다드 에어 A/T",
        imageUrl: SUV, basePrice: 41530000,
        prepayment30: 422400, deposit30: 573800, noDeposit: 641200,
        remainingDays: 4, stock: 2
      },
      {
        id: "e9", brand: "kia", brandLabel: "기아",
        title: "기아 EV3", trim: "EV3 전기 스탠다드 에어 A/T",
        imageUrl: SUV, basePrice: 39950000,
        prepayment30: 236320, deposit30: 383250, noDeposit: 453590,
        remainingDays: 7, stock: 4
      },
      {
        id: "e10", brand: "kia", brandLabel: "기아",
        title: "기아 K5", trim: "K5 2.0 가솔린 노블레스 A/T",
        imageUrl: SEDAN, basePrice: 30600000,
        prepayment30: 252700, deposit30: 368900, noDeposit: 412500,
        remainingDays: 9, stock: 4
      },
      {
        id: "e11", brand: "hyundai", brandLabel: "현대",
        title: "현대 그랜저", trim: "2.5 가솔린 익스클루시브 A/T",
        imageUrl: SEDAN, basePrice: 42700000,
        prepayment30: 331540, deposit30: 498620, noDeposit: 556300,
        remainingDays: 9, stock: 2
      },
      {
        id: "e12", brand: "hyundai", brandLabel: "현대",
        title: "현대 아이오닉 5", trim: "롱레인지 2WD 익스클루시브",
        imageUrl: SUV, basePrice: 52700000,
        prepayment30: 398700, deposit30: 612400, noDeposit: 688900,
        remainingDays: 10, stock: 3
      },
      {
        id: "e13", brand: "hyundai", brandLabel: "현대",
        title: "현대 팰리세이드", trim: "2.5 가솔린 프레스티지 7인승",
        imageUrl: SUV, basePrice: 47600000,
        prepayment30: 372600, deposit30: 552300, noDeposit: 618700,
        remainingDays: 14, stock: 2
      },
      {
        id: "e14", brand: "genesis", brandLabel: "제네시스",
        title: "제네시스 G80", trim: "2.5 터보 가솔린 2WD",
        imageUrl: SEDAN, basePrice: 62900000,
        prepayment30: 512300, deposit30: 764900, noDeposit: 851600,
        remainingDays: 12, stock: 2
      },
      {
        id: "e15", brand: "genesis", brandLabel: "제네시스",
        title: "제네시스 GV70", trim: "2.5 터보 가솔린 AWD",
        imageUrl: SUV, basePrice: 55800000,
        prepayment30: 468200, deposit30: 693400, noDeposit: 772300,
        remainingDays: 8, stock: 3
      },
      {
        id: "e16", brand: "renault", brandLabel: "르노코리아",
        title: "르노코리아 그랑 콜레오스", trim: "1.6 하이브리드 아이코닉",
        imageUrl: SUV, basePrice: 36900000,
        prepayment30: 268400, deposit30: 431700, noDeposit: 489200,
        remainingDays: 11, stock: 5
      },
      {
        id: "e17", brand: "kgm", brandLabel: "KG모빌리티",
        title: "KG모빌리티 토레스", trim: "1.5 터보 T7 2WD",
        imageUrl: SUV, basePrice: 31200000,
        prepayment30: 241900, deposit30: 372600, noDeposit: 418300,
        remainingDays: 6, stock: 4
      },
      {
        id: "e18", brand: "chevrolet", brandLabel: "쉐보레",
        title: "쉐보레 트랙스 크로스오버", trim: "1.2 터보 프리미어",
        imageUrl: SUV, basePrice: 26700000,
        prepayment30: 219800, deposit30: 334500, noDeposit: 376900,
        remainingDays: 5, stock: 6
      }
    ]
  };
})(window.BCS_MOCK);
