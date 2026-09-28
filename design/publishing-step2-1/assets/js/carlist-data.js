/* 내 차 견적(차량 리스트) 데이터 */
(function (mock) {
  if (!mock) return;

  const SEDAN = "./assets/images/cars/car-sedan.svg";
  const SUV = "./assets/images/cars/car-suv.svg";

  mock.carlist = {
    domestic: {
      label: "국산차",
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
        { id: "d1", brand: "hyundai", brandLabel: "현대", title: "아반떼 가솔린", trim: "1.6 가솔린 모던 A/T", imageUrl: SEDAN, basePrice: 24300000, discount: 1800000 },
        { id: "d2", brand: "hyundai", brandLabel: "현대", title: "쏘나타 디 엣지 가솔린", trim: "2.0 가솔린 프리미엄 A/T", imageUrl: SEDAN, basePrice: 30150000, discount: 2400000 },
        { id: "d3", brand: "hyundai", brandLabel: "현대", title: "그랜저 가솔린", trim: "2.5 가솔린 익스클루시브 A/T", imageUrl: SEDAN, basePrice: 42700000, discount: 3300000 },
        { id: "d4", brand: "hyundai", brandLabel: "현대", title: "투싼 하이브리드", trim: "1.6 터보 하이브리드 모던 2WD", imageUrl: SUV, basePrice: 34500000, discount: 2100000 },
        { id: "d5", brand: "hyundai", brandLabel: "현대", title: "싼타페 가솔린", trim: "2.5 터보 가솔린 프레스티지 2WD", imageUrl: SUV, basePrice: 40800000, discount: 2900000 },
        { id: "d6", brand: "hyundai", brandLabel: "현대", title: "아이오닉 5 전기", trim: "롱레인지 2WD 익스클루시브", imageUrl: SUV, basePrice: 52700000, discount: 4500000 },
        { id: "d7", brand: "hyundai", brandLabel: "현대", title: "팰리세이드 가솔린", trim: "2.5 가솔린 프레스티지 7인승", imageUrl: SUV, basePrice: 47600000, discount: 3200000 },
        { id: "d8", brand: "kia", brandLabel: "기아", title: "K5 가솔린", trim: "2.0 가솔린 노블레스 A/T", imageUrl: SEDAN, basePrice: 30600000, discount: 2300000 },
        { id: "d9", brand: "kia", brandLabel: "기아", title: "K8 가솔린", trim: "2.5 가솔린 노블레스 라이트 A/T", imageUrl: SEDAN, basePrice: 36790000, discount: 3100000 },
        { id: "d10", brand: "kia", brandLabel: "기아", title: "스포티지 가솔린", trim: "1.6 터보 가솔린 프레스티지 2WD", imageUrl: SUV, basePrice: 28630000, discount: 1900000 },
        { id: "d11", brand: "kia", brandLabel: "기아", title: "쏘렌토 하이브리드", trim: "1.6 터보 하이브리드 프레스티지 2WD", imageUrl: SUV, basePrice: 39200000, discount: 2600000 },
        { id: "d12", brand: "kia", brandLabel: "기아", title: "카니발 가솔린", trim: "3.5 가솔린 노블레스 9인승", imageUrl: SUV, basePrice: 41500000, discount: 2700000 },
        { id: "d13", brand: "kia", brandLabel: "기아", title: "EV5 전기", trim: "스탠다드 2WD 에어", imageUrl: SUV, basePrice: 41530000, discount: 3800000 },
        { id: "d14", brand: "genesis", brandLabel: "제네시스", title: "G80 가솔린", trim: "2.5 터보 가솔린 2WD", imageUrl: SEDAN, basePrice: 62900000, discount: 4200000 },
        { id: "d15", brand: "genesis", brandLabel: "제네시스", title: "GV70 가솔린", trim: "2.5 터보 가솔린 AWD", imageUrl: SUV, basePrice: 55800000, discount: 3900000 },
        { id: "d16", brand: "genesis", brandLabel: "제네시스", title: "G90 가솔린", trim: "3.5 터보 가솔린 2WD", imageUrl: SEDAN, basePrice: 94300000, discount: 6100000 },
        { id: "d17", brand: "renault", brandLabel: "르노코리아", title: "그랑 콜레오스 하이브리드", trim: "1.6 하이브리드 아이코닉", imageUrl: SUV, basePrice: 36900000, discount: 2500000 },
        { id: "d18", brand: "renault", brandLabel: "르노코리아", title: "QM6 가솔린", trim: "2.0 가솔린 RE 시그니처", imageUrl: SUV, basePrice: 29800000, discount: 2200000 },
        { id: "d19", brand: "kgm", brandLabel: "KG모빌리티", title: "토레스 가솔린", trim: "1.5 터보 T7 2WD", imageUrl: SUV, basePrice: 31200000, discount: 2000000 },
        { id: "d20", brand: "kgm", brandLabel: "KG모빌리티", title: "액티언 가솔린", trim: "1.5 터보 프레스티지", imageUrl: SUV, basePrice: 30400000, discount: 1900000 },
        { id: "d21", brand: "chevrolet", brandLabel: "쉐보레", title: "트랙스 크로스오버 가솔린", trim: "1.2 터보 프리미어", imageUrl: SUV, basePrice: 26700000, discount: 1700000 },
        { id: "d22", brand: "chevrolet", brandLabel: "쉐보레", title: "트레일블레이저 가솔린", trim: "1.35 터보 프리미어 2WD", imageUrl: SUV, basePrice: 29300000, discount: 1800000 }
      ]
    },

    imported: {
      label: "수입차",
      brands: [
        { value: "all", label: "전체", mark: "전체" },
        { value: "bmw", label: "BMW", logoUrl: "./assets/images/manufacturers/bmw.svg" },
        { value: "benz", label: "벤츠", logoUrl: "./assets/images/manufacturers/mercedes-benz.svg" },
        { value: "audi", label: "아우디", logoUrl: "./assets/images/manufacturers/audi.svg" },
        { value: "volkswagen", label: "폭스바겐", logoUrl: "./assets/images/manufacturers/volkswagen.svg" },
        { value: "tesla", label: "테슬라", mark: "테슬라" },
        { value: "volvo", label: "볼보", logoUrl: "./assets/images/manufacturers/volvo.svg" },
        { value: "lexus", label: "렉서스", logoUrl: "./assets/images/manufacturers/lexus.svg" },
        { value: "toyota", label: "토요타", logoUrl: "./assets/images/manufacturers/toyota.svg" },
        { value: "byd", label: "BYD", logoUrl: "./assets/images/manufacturers/byd.svg" },
        { value: "ford", label: "포드", logoUrl: "./assets/images/manufacturers/ford.svg" },
        { value: "polestar", label: "폴스타", logoUrl: "./assets/images/manufacturers/polestar.svg" }
      ],
      cars: [
        { id: "i1", brand: "bmw", brandLabel: "BMW", title: "3 Series 가솔린", trim: "2.0 320i M Sport A/T", imageUrl: SEDAN, basePrice: 62400000, discount: 6200000 },
        { id: "i2", brand: "bmw", brandLabel: "BMW", title: "5 Series 가솔린", trim: "2.0 520i M Sport A/T", imageUrl: SEDAN, basePrice: 74900000, discount: 8400000 },
        { id: "i3", brand: "bmw", brandLabel: "BMW", title: "X3 디젤", trim: "2.0 xDrive20d M Sport", imageUrl: SUV, basePrice: 82300000, discount: 7900000 },
        { id: "i4", brand: "bmw", brandLabel: "BMW", title: "X5 가솔린", trim: "3.0 xDrive40i M Sport", imageUrl: SUV, basePrice: 118600000, discount: 11500000 },
        { id: "i5", brand: "benz", brandLabel: "벤츠", title: "C-Class 가솔린", trim: "C200 아방가르드", imageUrl: SEDAN, basePrice: 68700000, discount: 6800000 },
        { id: "i6", brand: "benz", brandLabel: "벤츠", title: "E-Class 가솔린", trim: "E300 4MATIC AMG Line", imageUrl: SEDAN, basePrice: 89400000, discount: 9200000 },
        { id: "i7", brand: "benz", brandLabel: "벤츠", title: "GLC 가솔린", trim: "GLC300 4MATIC", imageUrl: SUV, basePrice: 92800000, discount: 8700000 },
        { id: "i8", brand: "benz", brandLabel: "벤츠", title: "S-Class 가솔린", trim: "S500 4MATIC 롱바디", imageUrl: SEDAN, basePrice: 187500000, discount: 14300000 },
        { id: "i9", brand: "audi", brandLabel: "아우디", title: "A6 가솔린", trim: "45 TFSI 콰트로 프리미엄", imageUrl: SEDAN, basePrice: 78600000, discount: 9800000 },
        { id: "i10", brand: "audi", brandLabel: "아우디", title: "Q5 가솔린", trim: "45 TFSI 콰트로 프리미엄", imageUrl: SUV, basePrice: 76300000, discount: 8900000 },
        { id: "i11", brand: "volkswagen", brandLabel: "폭스바겐", title: "티구안 디젤", trim: "2.0 TDI 프레스티지", imageUrl: SUV, basePrice: 51900000, discount: 6400000 },
        { id: "i12", brand: "volkswagen", brandLabel: "폭스바겐", title: "아테온 가솔린", trim: "2.0 TSI 프레스티지", imageUrl: SEDAN, basePrice: 58300000, discount: 7100000 },
        { id: "i13", brand: "tesla", brandLabel: "테슬라", title: "Model 3 전기", trim: "Long Range AWD", imageUrl: SEDAN, basePrice: 56900000, discount: 3600000 },
        { id: "i14", brand: "tesla", brandLabel: "테슬라", title: "Model Y 전기", trim: "Long Range AWD", imageUrl: SUV, basePrice: 64200000, discount: 4100000 },
        { id: "i15", brand: "volvo", brandLabel: "볼보", title: "XC60 마일드 하이브리드", trim: "B5 AWD 얼티메이트", imageUrl: SUV, basePrice: 74600000, discount: 5900000 },
        { id: "i16", brand: "volvo", brandLabel: "볼보", title: "S60 마일드 하이브리드", trim: "B5 얼티메이트", imageUrl: SEDAN, basePrice: 61200000, discount: 5200000 },
        { id: "i17", brand: "lexus", brandLabel: "렉서스", title: "ES 하이브리드", trim: "ES300h 럭셔리", imageUrl: SEDAN, basePrice: 71300000, discount: 4800000 },
        { id: "i18", brand: "lexus", brandLabel: "렉서스", title: "NX 하이브리드", trim: "NX350h AWD 럭셔리", imageUrl: SUV, basePrice: 73800000, discount: 5100000 },
        { id: "i19", brand: "toyota", brandLabel: "토요타", title: "캠리 하이브리드", trim: "2.5 하이브리드 XLE", imageUrl: SEDAN, basePrice: 45600000, discount: 3400000 },
        { id: "i20", brand: "toyota", brandLabel: "토요타", title: "라브4 하이브리드", trim: "2.5 하이브리드 AWD XLE", imageUrl: SUV, basePrice: 48900000, discount: 3700000 }
      ]
    }
  };

  Object.keys(mock.carlist).forEach(function (key) {
    mock.carlist[key].cars.forEach(function (car) {
      car.category = key;
      car.promoPrice = car.basePrice - car.discount;
    });
  });
})(window.BCS_MOCK);
