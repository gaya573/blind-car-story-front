document.addEventListener("DOMContentLoaded", function () {
  const mock = window.BCS_MOCK;
  const api = window.BCS;
  if (!mock || !api || !mock.express) return;

  const PAGE_SIZE = 12;
  const data = mock.express;

  const urgentRoot = api.qs("[data-express-urgent]");
  const brandRoot = api.qs("[data-express-brands]");
  const grid = api.qs("[data-express-grid]");
  const emptyEl = api.qs("[data-express-empty]");
  const countEl = api.qs("[data-express-count]");
  const moreBtn = api.qs("[data-express-more]");

  let brand = "all";
  let visible = PAGE_SIZE;

  function filteredCars() {
    return brand === "all"
      ? data.cars
      : data.cars.filter(function (car) {
          return car.brand === brand;
        });
  }

  function deadlineLabel(car) {
    if (typeof car.remainingDays !== "number") return "";
    if (car.remainingDays <= 0) return "오늘 마감";
    return "D-" + car.remainingDays;
  }

  function monthlyRow(label, value) {
    return (
      '<div class="ex-monthly-row">' +
      '<span class="ex-chip">' + label + "</span>" +
      '<span class="ex-amount">' + api.formatMonthly(value) + "<em>원</em></span>" +
      "</div>"
    );
  }

  function renderCard(car, variant) {
    const urgent = variant === "urgent";
    const card = document.createElement("article");
    card.className = "ex-card" + (urgent ? " ex-card--urgent" : "");
    card.setAttribute("data-car-id", car.id);
    card.setAttribute("data-brand-id", car.brand);

    card.innerHTML =
      '<div class="ex-card__media">' +
      '<span class="ex-card__brand">' + car.brandLabel + "</span>" +
      (urgent
        ? '<span class="ex-card__badge ex-card__badge--urgent">' + deadlineLabel(car) + "</span>"
        : '<span class="ex-card__badge">재고 ' + car.stock + "대</span>") +
      '<img src="' + car.imageUrl + '" alt="' + car.title + '" loading="lazy">' +
      "</div>" +
      '<div class="ex-card__body">' +
      '<h3 class="ex-card__name">' + car.title + "</h3>" +
      '<p class="ex-card__trim">' + car.trim + "</p>" +
      '<div class="ex-card__prices">' +
      '<div class="ex-price-row">' +
      '<span class="ex-price-label">차량가격</span>' +
      '<span class="ex-price-base">' + api.formatWonTilde(car.basePrice) + "</span>" +
      "</div>" +
      '<p class="ex-monthly-label">월 렌탈료</p>' +
      monthlyRow("선납금 30%", car.prepayment30) +
      monthlyRow("보증금 30%", car.deposit30) +
      monthlyRow("완전무보증", car.noDeposit) +
      "</div>" +
      '<p class="ex-card__note">' + data.conditionLabel + "</p>" +
      '<button class="ex-card__cta" type="button">실시간 무료견적 받기</button>' +
      "</div>";

    card.querySelector(".ex-card__cta").addEventListener("click", function (event) {
      event.stopPropagation();
      if (window.BCS_QUOTE) window.BCS_QUOTE.open(car.title);
    });
    card.addEventListener("click", function () {
      if (window.BCS_QUOTE) window.BCS_QUOTE.open(car.title);
    });
    return card;
  }

  function renderUrgent() {
    if (!urgentRoot) return;
    urgentRoot.innerHTML = "";
    data.cars
      .filter(function (car) {
        return car.urgent;
      })
      .slice(0, 4)
      .forEach(function (car) {
        urgentRoot.appendChild(renderCard(car, "urgent"));
      });
  }

  function renderBrands() {
    if (!brandRoot) return;
    brandRoot.innerHTML = "";
    data.brands.forEach(function (item) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ex-brand" + (item.value === brand ? " is-active" : "");
      btn.setAttribute("data-brand", item.value);
      btn.setAttribute("aria-pressed", item.value === brand ? "true" : "false");
      btn.innerHTML =
        '<span class="ex-brand__mark">' +
        (item.logoUrl ? '<img src="' + item.logoUrl + '" alt="" />' : (item.mark || item.label)) +
        "</span>" +
        '<span class="ex-brand__name">' + item.label + "</span>";
      btn.addEventListener("click", function () {
        brand = item.value;
        visible = PAGE_SIZE;
        renderBrands();
        renderCars();
      });
      brandRoot.appendChild(btn);
    });
  }

  function renderCars() {
    if (!grid) return;
    const cars = filteredCars();
    const slice = cars.slice(0, visible);

    grid.innerHTML = "";
    slice.forEach(function (car) {
      grid.appendChild(renderCard(car, "list"));
    });

    if (countEl) countEl.textContent = cars.length.toLocaleString("ko-KR");
    if (emptyEl) emptyEl.hidden = cars.length !== 0;
    if (moreBtn) {
      const rest = cars.length - slice.length;
      moreBtn.hidden = rest <= 0;
      moreBtn.textContent = "차량 더보기 (" + rest + ")";
    }
  }

  function endOfToday() {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return end.getTime();
  }

  renderUrgent();
  renderBrands();
  renderCars();
  api.startCountdown(api.qs("[data-countdown]"), endOfToday());

  if (moreBtn) {
    moreBtn.addEventListener("click", function () {
      visible += PAGE_SIZE;
      renderCars();
    });
  }

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
});
