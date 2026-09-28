document.addEventListener("DOMContentLoaded", function () {
  const mock = window.BCS_MOCK;
  const api = window.BCS;
  if (!mock || !api || !mock.reviewPage) return;

  const PAGE_SIZE = 9;
  const data = mock.reviewPage;

  const grid = api.qs("[data-review-grid]");
  const emptyEl = api.qs("[data-review-empty]");
  const moreBtn = api.qs("[data-review-more]");
  const subEl = api.qs("[data-review-sub]");

  let visible = PAGE_SIZE;

  function stars(rating) {
    let html = "";
    for (let i = 1; i <= 5; i += 1) {
      html +=
        '<span class="rv-star' + (i <= rating ? " is-on" : "") + '" aria-hidden="true">★</span>';
    }
    return '<div class="rv-stars" role="img" aria-label="별점 ' + rating + '점">' + html + "</div>";
  }

  function renderReviews() {
    const items = data.items;
    const slice = items.slice(0, visible);

    grid.innerHTML = "";
    slice.forEach(function (item) {
      const card = document.createElement("article");
      card.className = "rv-card";
      card.setAttribute("data-review-id", item.id);

      card.innerHTML =
        '<div class="rv-card__media">' +
        (item.recommend ? '<span class="rv-card__badge">추천해요!</span>' : "") +
        '<img src="' + item.imageUrl + '" alt="' + item.carName + '" loading="lazy">' +
        "</div>" +
        '<div class="rv-card__body">' +
        '<span class="rv-card__car">' + item.carName + "</span>" +
        '<h3 class="rv-card__title">' + item.title + "</h3>" +
        '<p class="rv-card__snippet">' + item.snippet + "</p>" +
        stars(item.rating) +
        '<div class="rv-card__meta">' +
        "<span>" + item.author + "</span>" +
        "<span>" + item.date + "</span>" +
        "</div>" +
        "</div>";

      card.addEventListener("click", function () {
        openReviewModal(item);
      });
      grid.appendChild(card);
    });

    if (emptyEl) emptyEl.hidden = items.length !== 0;
    if (moreBtn) {
      const rest = items.length - slice.length;
      moreBtn.hidden = rest <= 0;
      moreBtn.textContent = "후기 더보기 (" + rest + ")";
    }
  }

  /* ------------------------------------------------------------------
     후기 상세 모달
     ------------------------------------------------------------------ */
  const reviewModal = api.qs("#review-modal");
  const rvm = {
    image: api.qs("[data-rvm-image]"),
    car: api.qs("[data-rvm-car]"),
    heading: api.qs("[data-rvm-heading]"),
    body: api.qs("[data-rvm-body]"),
    author: api.qs("[data-rvm-author]"),
    stars: api.qs("[data-rvm-stars]"),
    date: api.qs("[data-rvm-date]"),
    quote: api.qs("[data-rvm-quote]")
  };
  let activeReview = null;
  let lastFocused = null;

  function openReviewModal(item) {
    if (!reviewModal) return;
    activeReview = item;
    lastFocused = document.activeElement;

    if (rvm.image) {
      rvm.image.src = item.imageUrl;
      rvm.image.alt = item.carName;
    }
    if (rvm.car) rvm.car.textContent = item.carName;
    if (rvm.heading) rvm.heading.textContent = item.title;
    if (rvm.body) {
      const lines = item.body && item.body.length ? item.body : [item.snippet];
      rvm.body.innerHTML = lines
        .map(function (line) {
          return "<p>" + line + "</p>";
        })
        .join("");
    }
    if (rvm.author) rvm.author.textContent = item.author;
    if (rvm.stars) rvm.stars.innerHTML = stars(item.rating).replace(/<\/?div[^>]*>/g, "");
    if (rvm.date) rvm.date.textContent = item.date;

    reviewModal.classList.add("is-open");
    reviewModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeReviewModal() {
    if (!reviewModal) return;
    reviewModal.classList.remove("is-open");
    reviewModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  api.qsa("[data-rvm-close]").forEach(function (btn) {
    btn.addEventListener("click", closeReviewModal);
  });

  if (reviewModal) {
    reviewModal.addEventListener("click", function (event) {
      if (event.target === reviewModal) closeReviewModal();
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && reviewModal && reviewModal.classList.contains("is-open")) {
      closeReviewModal();
    }
  });

  /* 같은 차량 견적내기 → 실시간 견적 모달 */
  if (rvm.quote) {
    rvm.quote.addEventListener("click", function () {
      const carName = activeReview ? activeReview.carName : "";
      closeReviewModal();
      if (window.BCS_QUOTE) window.BCS_QUOTE.open(carName);
    });
  }

  if (subEl) subEl.textContent = data.subtitle;
  renderReviews();

  if (moreBtn) {
    moreBtn.addEventListener("click", function () {
      visible += PAGE_SIZE;
      renderReviews();
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
