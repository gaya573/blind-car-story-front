document.addEventListener("DOMContentLoaded", function () {
  const mock = window.BCS_MOCK;
  const api = window.BCS;
  if (!mock || !api) return;

  api.fillSelect(api.qs("[data-brand-select]"), mock.brandOptions, "브랜드");
  api.fillSelect(api.qs("[data-model-select]"), mock.modelOptions, "모델");
  api.fillSelect(api.qs("[data-period-select]"), mock.periodOptions, "계약기간");

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

  const track = api.qs("[data-hero-track]");
  const indexEl = api.qs("[data-hero-index]");
  let heroIndex = 0;
  const slides = mock.banners.filter(function (item) {
    return item.is_active;
  });

  function renderHero() {
    if (!track) return;
    track.innerHTML = "";
    slides.forEach(function (banner) {
      const slide = document.createElement("div");
      if (banner.variant === "brand-panel") {
        slide.className = "hero-slide hero-slide--panel";
        slide.innerHTML =
          '<img src="' +
          banner.imageUrl +
          '" alt="블라인드 카스토리">' +
          "<p>합리적인 신차구매<br />함께 할까요?</p>";
      } else {
        slide.className = "hero-slide" + (banner.variant === "fit" ? " hero-slide--fit" : "");
        slide.innerHTML = '<img src="' + banner.imageUrl + '" alt="블라인드 카스토리 배너">';
      }
      track.appendChild(slide);
    });
    updateHero();
  }

  function updateHero() {
    if (!track || !slides.length) return;
    track.style.transform = "translateX(-" + heroIndex * 100 + "%)";
    if (indexEl) indexEl.textContent = heroIndex + 1 + "/" + slides.length;
  }

  api.qs("[data-hero-prev]")?.addEventListener("click", function () {
    heroIndex = (heroIndex - 1 + slides.length) % slides.length;
    updateHero();
  });
  api.qs("[data-hero-next]")?.addEventListener("click", function () {
    heroIndex = (heroIndex + 1) % slides.length;
    updateHero();
  });
  renderHero();

  const closingRoot = api.qs("[data-closing-list]");
  mock.closingSoon.slice(0, 4).forEach(function (car) {
    closingRoot.appendChild(api.renderVehicleCard(car, { showBadge: false }));
  });
  api.startCountdown(api.qs("[data-countdown]"), mock.closingSoon[0] && mock.closingSoon[0].deadline);

  const youtubeRoot = api.qs("[data-youtube-list]");
  mock.youtubeItems.slice(0, 3).forEach(function (item) {
    const card = document.createElement("a");
    card.className = "youtube-card";
    card.href = item.youtubeUrl;
    card.target = "_blank";
    card.rel = "noopener noreferrer";

    const thumb = document.createElement("div");
    thumb.className = "youtube-card__thumb";

    const img = document.createElement("img");
    img.src = item.thumbnailUrl;
    img.alt = item.title;
    img.loading = "lazy";
    if (item.thumbnailFallbackUrl) {
      img.addEventListener("error", function onThumbError() {
        img.removeEventListener("error", onThumbError);
        img.src = item.thumbnailFallbackUrl;
      });
    }

    const play = document.createElement("div");
    play.className = "youtube-card__play";
    play.innerHTML = '<span aria-hidden="true">▶</span>';

    thumb.appendChild(img);
    thumb.appendChild(play);

    const caption = document.createElement("p");
    caption.textContent = item.title;

    card.appendChild(thumb);
    card.appendChild(caption);
    youtubeRoot.appendChild(card);
  });

  const topRoot = api.qs("[data-top-list]");
  mock.topCars.forEach(function (car) {
    const row = document.createElement("article");
    row.className = "top-car";
    row.setAttribute("data-trim-id", car.trimId || "");
    row.setAttribute("data-vehicle-line-id", car.vehicleLineId || "");
    row.setAttribute("data-brand-id", car.brandId || "");
    row.setAttribute("data-content-type", car.contentType || "");
    const meta = [car.subtitle, car.extraInfo].filter(Boolean).join(" | ");
    row.innerHTML =
      '<img src="' +
      car.imageUrl +
      '" alt="' +
      car.title +
      '">' +
      '<div class="top-car__rank">' +
      car.rank +
      "</div>" +
      '<div class="top-car__panel"><div class="top-car__name">' +
      car.title +
      '</div><div class="top-car__meta">' +
      meta +
      '</div><div class="top-car__desc">' +
      (car.description || "") +
      "</div></div>";
    row.addEventListener("click", function () {
      api.showToast(api.PAGE_TOAST);
    });
    topRoot.appendChild(row);
  });

  const specialRoot = api.qs("[data-special-list]");
  mock.hotDeals.slice(0, 8).forEach(function (car) {
    specialRoot.appendChild(api.renderVehicleCard(car));
  });

  api.renderPartners(api.qs("[data-partner-track]"));

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

  api.qsa("[data-product-choice]").forEach(function (button) {
    button.addEventListener("click", function () {
      const section = button.closest("[data-selected-product]");
      if (section) section.dataset.selectedProduct = button.dataset.productChoice || "rental";
      api.qsa("[data-product-choice]").forEach(function (item) {
        const selected = item === button;
        item.classList.toggle("is-active", selected);
        item.setAttribute("aria-pressed", selected ? "true" : "false");
        const state = item.querySelector("small");
        if (state) state.textContent = selected ? "선택됨" : "선택";
      });
    });
  });

  api.qsa("[data-scroll-consult]").forEach(function (button) {
    button.addEventListener("click", function () {
      const target = document.getElementById("comparison-consult");
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(function () {
        target.querySelector('input[name="name"]')?.focus({ preventScroll: true });
      }, 500);
    });
  });
});
