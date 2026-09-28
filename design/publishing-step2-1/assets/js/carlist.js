document.addEventListener("DOMContentLoaded", function () {
  const mock = window.BCS_MOCK;
  const api = window.BCS;
  if (!mock || !api || !mock.carlist) return;

  const PAGE_SIZE = 12;
  const grid = api.qs("[data-carlist-grid]");
  const emptyEl = api.qs("[data-carlist-empty]");
  const countEl = api.qs("[data-carlist-count]");
  const moreBtn = api.qs("[data-carlist-more]");
  const brandTrack = api.qs("[data-brand-track]");
  const crumbEl = api.qs("[data-crumb-current]");
  const heroImgEl = api.qs("[data-carlist-hero]");

  const HERO_BANNERS = {
    domestic: {
      src: "./assets/images/banner/hero-domestic.png",
      alt: "블라인드 카스토리 국산차 비교견적 - 국산차 공식 혜택 한 번에 비교. 브랜드별 프로모션부터 빠른 출고 정보까지 한눈에 확인해보세요."
    },
    imported: {
      src: "./assets/images/banner/hero-imported.png",
      alt: "블라인드 카스토리 수입차 비교견적 - 수입차 공식 할인 한 번에 비교. 브랜드별 프로모션부터 재고·출고 일정까지 빠르게 확인해보세요."
    }
  };

  let category = "domestic";
  let brand = "all";
  let visible = PAGE_SIZE;

  function currentSet() {
    return mock.carlist[category];
  }

  function filteredCars() {
    const cars = currentSet().cars;
    return brand === "all"
      ? cars
      : cars.filter(function (car) {
          return car.brand === brand;
        });
  }

  function formatDiscount(value) {
    return "-" + Math.round(value / 10000).toLocaleString("ko-KR") + "만원 할인";
  }

  function renderBrands() {
    brandTrack.innerHTML = "";
    currentSet().brands.forEach(function (item) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cl-brand" + (item.value === brand ? " is-active" : "");
      btn.setAttribute("data-brand", item.value);
      btn.innerHTML =
        '<span class="cl-brand__mark">' +
        (item.logoUrl ? '<img src="' + item.logoUrl + '" alt="" />' : (item.mark || item.label)) +
        "</span>" +
        '<span class="cl-brand__name">' + item.label + "</span>";
      btn.addEventListener("click", function () {
        brand = item.value;
        visible = PAGE_SIZE;
        renderBrands();
        renderCars();
      });
      brandTrack.appendChild(btn);
    });
  }

  function renderCars() {
    const cars = filteredCars();
    const slice = cars.slice(0, visible);

    grid.innerHTML = "";
    slice.forEach(function (car) {
      const card = document.createElement("article");
      card.className = "cl-card";
      card.setAttribute("data-car-id", car.id);
      card.setAttribute("data-brand-id", car.brand);
      card.innerHTML =
        '<div class="cl-card__head"><span class="cl-card__brand">' + car.brandLabel + "</span></div>" +
        '<div class="cl-card__media"><img src="' + car.imageUrl + '" alt="' + car.title + '" loading="lazy"></div>' +
        '<div class="cl-card__body">' +
        '<h3 class="cl-card__name">' + car.title + "</h3>" +
        '<p class="cl-card__trim">' + car.trim + "</p>" +
        '<dl class="cl-card__prices">' +
        '<div class="cl-price-row"><dt>차량 가격</dt><dd class="cl-price-base">' + api.formatWon(car.basePrice) + "</dd></div>" +
        '<div class="cl-price-row"><dt>최대할인가</dt><dd><span class="cl-price-discount">' + formatDiscount(car.discount) + "</span></dd></div>" +
        '<div class="cl-price-row cl-price-row--final"><dt>이달의 프로모션가</dt><dd class="cl-price-final">' + api.formatWon(car.promoPrice) + "</dd></div>" +
        "</dl>" +
        '<button class="cl-card__cta" type="button">실시간 무료견적 받기</button>' +
        "</div>";

      card.querySelector(".cl-card__cta").addEventListener("click", function (event) {
        event.stopPropagation();
        api.showToast(api.DEMO_TOAST);
      });
      card.addEventListener("click", function () {
        location.href = "./pages/car-detail.html?cat=" + category + "&car=" + car.id;
      });
      grid.appendChild(card);
    });

    if (countEl) countEl.textContent = cars.length.toLocaleString("ko-KR");
    if (emptyEl) emptyEl.hidden = cars.length !== 0;
    if (moreBtn) {
      const rest = cars.length - slice.length;
      moreBtn.hidden = rest <= 0;
      moreBtn.textContent = "차량 더보기 (" + rest + ")";
    }
  }

  function renderTabs() {
    api.qsa("[data-carlist-tab]").forEach(function (tab) {
      const active = tab.getAttribute("data-carlist-tab") === category;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    const banner = HERO_BANNERS[category];
    if (heroImgEl && banner) {
      heroImgEl.src = banner.src;
      heroImgEl.alt = banner.alt;
    }
    if (crumbEl) crumbEl.textContent = currentSet().label + " 견적내기";
    document.title = currentSet().label + " 견적내기 | 블라인드 카스토리";
  }

  function setCategory(next, updateHash) {
    if (!mock.carlist[next]) return;
    category = next;
    brand = "all";
    visible = PAGE_SIZE;
    renderTabs();
    renderBrands();
    renderCars();
    if (updateHash) history.replaceState(null, "", "#" + category);
  }

  api.qsa("[data-carlist-tab]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      setCategory(tab.getAttribute("data-carlist-tab"), true);
    });
  });

  if (moreBtn) {
    moreBtn.addEventListener("click", function () {
      visible += PAGE_SIZE;
      renderCars();
    });
  }

  const scrollStep = 240;
  api.qs("[data-brand-prev]")?.addEventListener("click", function () {
    brandTrack.scrollBy({ left: -scrollStep, behavior: "smooth" });
  });
  api.qs("[data-brand-next]")?.addEventListener("click", function () {
    brandTrack.scrollBy({ left: scrollStep, behavior: "smooth" });
  });

  window.addEventListener("hashchange", function () {
    setCategory(location.hash.replace("#", "") || "domestic", false);
  });

  /* 공통 인터랙션 */
  api.qsa("[data-consult-form]").forEach(api.bindDemoForm);
  api.bindComingSoonLinks();
  api.bindPrivacyModal();

  const search = api.qs("[data-demo-search]");
  if (search) {
    search.addEventListener("submit", function (event) {
      event.preventDefault();
      api.showToast(api.PAGE_TOAST);
    });
  }

  const quick = api.qs("[data-quick-consult]");
  api.qsa("[data-quick-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const closed = quick.classList.toggle("is-closed");
      api.qsa("[data-quick-toggle]").forEach(function (item) {
        item.setAttribute("aria-expanded", closed ? "false" : "true");
      });
    });
  });
  api.qsa("[data-scroll-top]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
  api.qsa("[data-demo-contact]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      api.showToast(api.DEMO_TOAST);
    });
  });

  setCategory(location.hash.replace("#", "") || "domestic", false);
});
