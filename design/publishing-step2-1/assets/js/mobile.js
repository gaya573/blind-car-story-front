document.addEventListener("DOMContentLoaded", function () {
  const mock = window.BCS_MOCK;
  const api = window.BCS;
  if (!mock || !api) return;

  api.qsa("[data-consult-form]").forEach(api.bindDemoForm);
  api.bindComingSoonLinks();
  api.bindPrivacyModal();

  api.qsa("[data-demo-contact]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      api.showToast(api.DEMO_TOAST);
    });
  });

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function mobilePriceRow(label, value, accentClass) {
    return (
      '<div class="m-vehicle__price-row">' +
      '<span class="m-vehicle__price-chip">' + label + "</span>" +
      '<strong class="m-vehicle__monthly ' + accentClass + '">' +
      escapeHtml(api.formatMonthly(value)) + '<small>원</small></strong>' +
      "</div>"
    );
  }

  function renderMobileVehicleCard(car, options) {
    options = options || {};
    const name = car.vehicleName || car.title || "차량 정보";
    const trim = car.trimName || car.subtitle || car.description || "";
    const brand = car.brandName || car.extraInfo || "";
    const badge = options.closing
      ? "D-" + Math.max(0, Number(car.remainingDays) || 0)
      : "재고 특가";
    const article = document.createElement("article");
    article.className = "m-vehicle" + (options.closing ? " m-vehicle--closing" : "");
    article.setAttribute("data-car-id", car.id || "");
    article.innerHTML =
      '<div class="m-vehicle__media">' +
      '<span class="m-vehicle__brand">' + escapeHtml(brand) + "</span>" +
      '<span class="m-vehicle__badge">' + escapeHtml(badge) + "</span>" +
      '<img src="' + escapeHtml(car.imageUrl || "") + '" alt="' + escapeHtml(name) + '">' +
      "</div>" +
      '<div class="m-vehicle__body">' +
      '<h3 class="m-vehicle__name">' + escapeHtml(name) + "</h3>" +
      '<p class="m-vehicle__trim">' + escapeHtml(trim) + "</p>" +
      '<div class="m-vehicle__base"><span>차량가격</span><strong>' + escapeHtml(api.formatWonTilde(car.basePrice)) + "</strong></div>" +
      '<div class="m-vehicle__prices">' +
      mobilePriceRow("선납금 30%", car.lowest_prepayment_30_monthly_fee, "is-gold") +
      mobilePriceRow("보증금 30%", car.lowest_deposit_30_monthly_fee, "") +
      mobilePriceRow("완전무보증", car.lowest_no_deposit_monthly_fee, "") +
      "</div>" +
      '<p class="m-vehicle__note">48개월 · 연 2만km 기준</p>' +
      '<button class="m-vehicle__cta" type="button">실시간 무료견적 받기</button>' +
      "</div>";

    article.querySelector(".m-vehicle__cta").addEventListener("click", function (event) {
      event.stopPropagation();
      api.showToast(api.DEMO_TOAST);
    });
    article.addEventListener("click", function () {
      location.href = "./pages/m-car-detail.html?src=mock&car=" + (car.id || "");
    });
    return article;
  }

  const closingRoot = api.qs("[data-closing-list]");
  mock.closingSoon.slice(0, 2).forEach(function (car) {
    closingRoot.appendChild(renderMobileVehicleCard(car, { closing: true }));
  });
  api.startCountdown(api.qs("[data-countdown]"), mock.closingSoon[0] && mock.closingSoon[0].deadline);

  const hotRoot = api.qs("[data-hotdeal-list]");
  mock.hotDeals
    .filter(function (car) {
      return (car.cardType || "").toUpperCase() !== "PROMOTION_EVENT";
    })
    .slice(0, 5)
    .forEach(function (car) {
      hotRoot.appendChild(renderMobileVehicleCard(car));
    });

  const youtubeRoot = api.qs("[data-youtube-list]");
  mock.youtubeItems.forEach(function (item) {
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

  const reviewRoot = api.qs("[data-review-list]");
  const reviewItems = mock.reviews.concat(mock.reviews);
  reviewItems.forEach(function (review, index) {
    const card = document.createElement("article");
    card.className = "review-card";
    card.setAttribute("data-content-type", review.contentType || "");
    if (index >= mock.reviews.length) card.setAttribute("aria-hidden", "true");
    card.innerHTML =
      '<img src="' +
      review.imageUrl +
      '" alt="출고후기 준비중">' +
      '<div class="review-card__body"><h3>' +
      review.title +
      "</h3><p>" +
      review.description +
      "</p><p>" +
      review.authorName +
      "</p></div>";
    reviewRoot.appendChild(card);
  });

  api.renderPartners(api.qs("[data-partner-track]"));

  function initAutoSlider(options) {
    const viewport = api.qs(options.viewport);
    const track = api.qs(options.track);
    const dotsRoot = api.qs(options.dots);
    if (!viewport || !track || !dotsRoot) return;

    const items = Array.from(track.children);
    const logicalCount = Math.min(options.logicalCount || items.length, items.length);
    const step = Math.max(1, options.step || 1);
    if (!logicalCount) return;

    let activeIndex = 0;
    let timer = null;
    let resumeTimer = null;
    let wrapTimer = null;
    let isWrapping = false;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sourceItemCount = Math.min(options.sourceItemCount || items.length, items.length);
    const hasLoopCopies = items.length >= sourceItemCount * 2;

    dotsRoot.innerHTML = "";
    for (let i = 0; i < logicalCount; i += 1) {
      const dot = document.createElement("button");
      dot.className = "m-slider-dot";
      dot.type = "button";
      dot.setAttribute("aria-label", i + 1 + "번째 슬라이드 보기");
      dot.addEventListener("click", function () {
        goTo(i, true);
        pauseThenResume();
      });
      dotsRoot.appendChild(dot);
    }

    const dots = Array.from(dotsRoot.children);

    function updateDots(index) {
      dots.forEach(function (dot, dotIndex) {
        const isActive = dotIndex === index;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-current", isActive ? "true" : "false");
      });
    }

    function itemLeftByItemIndex(itemIndex) {
      itemIndex = Math.min(itemIndex, items.length - 1);
      return items[itemIndex] ? items[itemIndex].offsetLeft - track.offsetLeft : 0;
    }

    function itemLeft(index) {
      return itemLeftByItemIndex(index * step);
    }

    function goTo(index, smooth) {
      activeIndex = (index + logicalCount) % logicalCount;
      viewport.scrollTo({ left: itemLeft(activeIndex), behavior: smooth && !reduceMotion ? "smooth" : "auto" });
      updateDots(activeIndex);
    }

    function advance() {
      if (hasLoopCopies && activeIndex === logicalCount - 1) {
        activeIndex = 0;
        isWrapping = true;
        viewport.scrollTo({
          left: itemLeftByItemIndex(sourceItemCount),
          behavior: reduceMotion ? "auto" : "smooth"
        });
        updateDots(0);
        if (wrapTimer) window.clearTimeout(wrapTimer);
        wrapTimer = window.setTimeout(function () {
          viewport.scrollTo({ left: 0, behavior: "auto" });
          isWrapping = false;
        }, reduceMotion ? 0 : 520);
        return;
      }
      goTo(activeIndex + 1, true);
    }

    function start() {
      if (reduceMotion || logicalCount < 2 || timer) return;
      timer = window.setInterval(advance, options.interval || 3800);
    }

    function stop() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    function pauseThenResume() {
      stop();
      if (resumeTimer) window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(start, 5000);
    }

    let scrollEndTimer = null;
    viewport.addEventListener("scroll", function () {
      if (isWrapping) return;
      if (scrollEndTimer) window.clearTimeout(scrollEndTimer);
      scrollEndTimer = window.setTimeout(function () {
        let nearest = 0;
        let distance = Infinity;
        for (let i = 0; i < logicalCount; i += 1) {
          const nextDistance = Math.abs(viewport.scrollLeft - itemLeft(i));
          if (nextDistance < distance) {
            distance = nextDistance;
            nearest = i;
          }
        }
        activeIndex = nearest;
        updateDots(activeIndex);
      }, 90);
    }, { passive: true });

    viewport.addEventListener("pointerdown", pauseThenResume, { passive: true });
    viewport.addEventListener("focusin", stop);
    viewport.addEventListener("focusout", start);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });

    updateDots(0);
    start();
  }

  initAutoSlider({
    viewport: "[data-youtube-slider]",
    track: "[data-youtube-list]",
    dots: "[data-youtube-dots]",
    logicalCount: mock.youtubeItems.length,
    interval: 4200
  });

  initAutoSlider({
    viewport: "[data-review-slider]",
    track: "[data-review-list]",
    dots: "[data-review-dots]",
    logicalCount: mock.reviews.length,
    sourceItemCount: mock.reviews.length,
    interval: 3600
  });

  initAutoSlider({
    viewport: "[data-partner-slider]",
    track: "[data-partner-track]",
    dots: "[data-partner-dots]",
    logicalCount: Math.ceil(mock.partners.length / 4),
    sourceItemCount: mock.partners.length,
    step: 4,
    interval: 2800
  });


  api.qsa("[data-scroll]").forEach(function (el) {
    el.addEventListener("click", function () {
      const target = api.qs(el.getAttribute("data-scroll"));
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  const tabs = api.qsa(".m-tabs button");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (item) {
        item.classList.remove("is-active");
      });
      tab.classList.add("is-active");
    });
  });

  const navItems = api.qsa("[data-nav-item]");
  navItems.forEach(function (item) {
    item.addEventListener("click", function () {
      navItems.forEach(function (nav) {
        nav.classList.remove("is-active");
      });
      item.classList.add("is-active");
    });
  });
});
