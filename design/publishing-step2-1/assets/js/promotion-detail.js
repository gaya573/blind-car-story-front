document.addEventListener("DOMContentLoaded", function () {
  const mock = window.BCS_MOCK;
  const api = window.BCS;
  if (!mock || !api || !mock.promotion) return;

  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const items = mock.promotion.items;
  const item =
    items.find(function (row) {
      return row.id === id;
    }) || items[0];

  const isEnded = item.status === "ended";

  const el = {
    crumb: api.qs("[data-pd-crumb]"),
    hero: api.qs("[data-pd-hero]"),
    status: api.qs("[data-pd-status]"),
    brandChip: api.qs("[data-pd-brand]"),
    partner: api.qs("[data-pd-partner]"),
    headline: api.qs("[data-pd-headline]"),
    benefit: api.qs("[data-pd-benefit]"),
    discount: api.qs("[data-pd-discount]"),
    timer: api.qs("[data-pd-timer]"),
    timerBody: api.qs("[data-pd-timer-body]"),
    timerPeriod: api.qs("[data-pd-timer-period]"),
    stats: api.qs("[data-pd-stats]"),
    benefits: api.qs("[data-pd-benefits]"),
    models: api.qs("[data-pd-models]"),
    reviews: api.qs("[data-pd-reviews]"),
    notes: api.qs("[data-pd-notes]"),
    more: api.qs("[data-pd-more]"),
    bannerTitle: api.qs("[data-pd-banner-title]")
  };

  /* 기간 문자열("2026.08.10 ~ 2026.09.15")에서 종료일 계산 */
  function deadlineOf(periodText) {
    const parts = String(periodText || "").split("~");
    const end = (parts[1] || "").trim().split(".");
    if (end.length < 3) return null;
    const date = new Date(Number(end[0]), Number(end[1]) - 1, Number(end[2]), 23, 59, 59);
    return isNaN(date.getTime()) ? null : date.getTime();
  }

  function statusLabel() {
    if (isEnded) return "종료된 기획전";
    if (typeof item.remainingDays === "number") return "진행중 · D-" + item.remainingDays;
    return "진행중";
  }

  function renderHero() {
    document.title = item.title + " | 블라인드 카스토리";
    if (el.crumb) el.crumb.textContent = item.brand + " 혜택";
    if (el.hero) el.hero.classList.toggle("pd-hero--ended", isEnded);

    if (el.status) {
      el.status.textContent = statusLabel();
      el.status.classList.toggle("is-ended", isEnded);
    }
    if (el.brandChip) el.brandChip.textContent = item.brand;
    if (el.partner) el.partner.textContent = item.partner;
    if (el.headline) el.headline.textContent = item.headline;
    if (el.benefit) el.benefit.textContent = item.benefit;
    if (el.discount) {
      el.discount.textContent = item.discountLabel || item.benefit;
      el.discount.hidden = !item.discountLabel;
    }
    if (el.bannerTitle) {
      el.bannerTitle.textContent = isEnded
        ? "종료된 기획전이지만, 지금 조건도 비교해 드립니다"
        : item.brand + " 혜택, 내 조건으로 계산해 보세요";
    }
  }

  function renderTimer() {
    if (!el.timerBody) return;
    const deadline = deadlineOf(item.period);
    if (el.timerPeriod) el.timerPeriod.textContent = item.period;

    if (isEnded || !deadline || deadline < Date.now()) {
      el.timerBody.innerHTML = '<p class="pd-timer__ended">기획전이 종료되었습니다</p>';
      const label = el.timer && el.timer.querySelector(".pd-timer__label");
      if (label) label.textContent = "진행 기간";
      return;
    }

    el.timerBody.innerHTML =
      '<div class="countdown" data-countdown aria-label="혜택 종료까지 남은 시간">' +
      '<div class="countdown__item"><div class="countdown__value" data-countdown-days>00</div><span class="countdown__unit">일</span></div>' +
      '<div class="countdown__item"><div class="countdown__value" data-countdown-hours>00</div><span class="countdown__unit">시</span></div>' +
      '<div class="countdown__item"><div class="countdown__value" data-countdown-minutes>00</div><span class="countdown__unit">분</span></div>' +
      '<div class="countdown__item"><div class="countdown__value" data-countdown-seconds>00</div><span class="countdown__unit">초</span></div>' +
      "</div>";
    api.startCountdown(el.timerBody.querySelector("[data-countdown]"), deadline);
  }

  function renderStats() {
    if (!el.stats) return;
    el.stats.innerHTML = (item.stats || [])
      .map(function (stat) {
        return (
          '<div class="pd-stat">' +
          '<p class="pd-stat__label">' + stat.label + "</p>" +
          '<p class="pd-stat__value">' + stat.value + "</p>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderBenefits() {
    if (!el.benefits) return;
    el.benefits.innerHTML = (item.benefits || [])
      .map(function (benefit, index) {
        return (
          '<article class="pd-benefit-card">' +
          '<span class="pd-benefit-card__no">0' + (index + 1) + "</span>" +
          "<h3>" + benefit.title + "</h3>" +
          "<p>" + benefit.desc + "</p>" +
          "</article>"
        );
      })
      .join("");
  }

  function renderModels() {
    if (!el.models) return;
    const models = item.targetModels || [];
    if (!models.length) {
      el.models.innerHTML =
        '<div class="pd-model"><div><p class="pd-model__name">대상 차종 준비중</p></div></div>';
      return;
    }
    el.models.innerHTML = models
      .map(function (model) {
        return (
          '<div class="pd-model">' +
          "<div>" +
          '<p class="pd-model__name">' + model.name + "</p>" +
          '<p class="pd-model__trim">' + (model.trim || "") + "</p>" +
          "</div>" +
          '<div class="pd-model__price">' +
          "<small>월 렌탈료</small>" +
          "<strong>" + api.formatMonthly(model.monthly) + "원</strong>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderReviews() {
    if (!el.reviews) return;
    const source = (mock.reviewPage && mock.reviewPage.items) || [];
    const picked = source.slice(0, 3);
    if (!picked.length) {
      el.reviews.closest(".pd-section").hidden = true;
      return;
    }
    el.reviews.innerHTML = picked
      .map(function (review) {
        let stars = "";
        for (let i = 1; i <= 5; i += 1) {
          stars += i <= review.rating ? "★" : "☆";
        }
        return (
          '<article class="pd-review">' +
          '<p class="pd-review__stars" aria-label="별점 ' + review.rating + '점">' + stars + "</p>" +
          '<h3 class="pd-review__title">' + review.title + "</h3>" +
          '<p class="pd-review__text">' + review.snippet + "</p>" +
          '<div class="pd-review__meta">' +
          "<strong>" + review.author + "</strong>" +
          "<span>" + review.carName + "</span>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  function renderNotes() {
    if (!el.notes) return;
    el.notes.innerHTML = (mock.promotion.notes || [])
      .map(function (note) {
        return "<li>" + note + "</li>";
      })
      .join("");
  }

  function renderMore() {
    if (!el.more) return;
    const others = items
      .filter(function (row) {
        return row.id !== item.id && row.status === item.status;
      })
      .slice(0, 3);

    el.more.innerHTML = others
      .map(function (row) {
        const badge = row.status === "ended" ? "종료" : row.discountLabel || "진행중";
        return (
          '<a class="pd-more-card" href="./pages/promotion-detail.html?id=' + row.id + '">' +
          '<div class="pd-more-card__tile pd-more-card__tile--' + row.theme + '">' +
          '<span class="pd-more-card__badge">' + badge + "</span>" +
          '<p class="pd-more-card__headline">' + row.headline + "</p>" +
          "</div>" +
          '<div class="pd-more-card__body">' +
          '<p class="pd-more-card__title">' + row.title + "</p>" +
          '<p class="pd-more-card__period">' + row.period + "</p>" +
          "</div>" +
          "</a>"
        );
      })
      .join("");
  }

  renderHero();
  renderTimer();
  renderStats();
  renderBenefits();
  renderModels();
  renderReviews();
  renderNotes();
  renderMore();

  api.qsa("[data-pd-quote]").forEach(function (button) {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      const firstModel = item.targetModels && item.targetModels[0];
      const carName = firstModel && firstModel.name ? firstModel.name : item.brand;
      if (window.BCS_QUOTE) window.BCS_QUOTE.open(carName);
    });
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
      api.qsa("[data-quick-toggle]").forEach(function (row) {
        row.setAttribute("aria-expanded", closed ? "false" : "true");
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
