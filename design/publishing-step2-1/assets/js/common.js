(function () {
  const DEMO_TOAST = "견적 신청이 접수되었습니다.\n담당 매니저가 순차적으로 연락드립니다.";
  const PAGE_TOAST = "준비 중인 서비스입니다.";

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function formatWon(value) {
    if (value == null || value === "") return "-";
    return Number(value).toLocaleString("ko-KR") + "원";
  }

  function formatWonTilde(value) {
    if (value == null || value === "") return "-";
    return Number(value).toLocaleString("ko-KR") + "원~";
  }

  function formatMonthly(value) {
    if (value == null || value === "") return "-";
    return Number(value).toLocaleString("ko-KR");
  }

  function badgeText(car) {
    if (typeof car.remainingDays === "number") {
      if (car.remainingDays <= 0) return "오늘 마감";
      if (car.remainingDays === 1) return "D-1";
      return "D-" + car.remainingDays;
    }
    return "";
  }

  let toastTimer = null;
  function showToast(message) {
    const el = qs("#demo-toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove("is-visible");
    }, 2400);
  }

  function validatePhone(value) {
    const digits = String(value || "").replace(/\D/g, "");
    if (!digits) return "연락처를 입력해 주세요.";
    if (digits.length < 10 || digits.length > 11) return "연락처 형식을 확인해 주세요.";
    return "";
  }

  function bindDemoForm(form) {
    if (!form) return;
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const phone = form.querySelector('[name="phone"]');
      const privacy = form.querySelector('[name="privacyAgree"]');
      const errorEl = form.querySelector("[data-form-error]");

      if (privacy && !privacy.checked) {
        if (errorEl) errorEl.textContent = "개인정보 이용 동의에 체크해 주세요.";
        showToast("개인정보 이용 동의에 체크해 주세요.");
        return;
      }

      const phoneError = validatePhone(phone ? phone.value : "");
      if (phoneError) {
        if (errorEl) errorEl.textContent = phoneError;
        showToast(phoneError);
        return;
      }

      if (errorEl) errorEl.textContent = "";
      form.reset();
      if (privacy) privacy.checked = true;
      form.querySelectorAll("select").forEach(function (sel) {
        sel.selectedIndex = 0;
      });
      showToast(DEMO_TOAST);
    });
  }

  function bindComingSoonLinks() {
    qsa("[data-coming-soon]").forEach(function (el) {
      el.addEventListener("click", function (event) {
        event.preventDefault();
        showToast(PAGE_TOAST);
      });
    });
  }

  function bindPrivacyModal() {
    const overlay = qs("#privacy-modal");
    if (!overlay) return;
    let lastFocused = null;

    function openPrivacy() {
      lastFocused = document.activeElement;
      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      const closeButton = overlay.querySelector("[data-close-privacy]");
      if (closeButton) closeButton.focus();
    }

    function closePrivacy() {
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      if (!qs(".modal-overlay.is-open")) document.body.style.overflow = "";
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    qsa("[data-open-privacy]").forEach(function (el) {
      el.addEventListener("click", function (event) {
        event.preventDefault();
        openPrivacy();
      });
    });
    qsa("[data-close-privacy]").forEach(function (el) {
      el.addEventListener("click", closePrivacy);
    });
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) closePrivacy();
    });
  }

  const RENTAL_CONDITION_LABEL = "48개월 / 선납 30% / 2만km 기준";

  function monthlyRow(label, value, amountClass) {
    return (
      '<div class="vehicle-monthly-row">' +
      '<span class="vehicle-chip">' + label + "</span>" +
      '<strong class="vehicle-amount ' + amountClass + '">' +
      formatMonthly(value) +
      '<span class="price-suffix">원</span></strong>' +
      "</div>"
    );
  }

  function renderVehicleCard(car, options) {
    options = options || {};
    const badge = options.showBadge === false ? "" : badgeText(car);
    const brand = car.brandName || car.extraInfo || "";
    const vehicleName = car.vehicleName || car.title || "";
    const trimName = car.trimName || car.subtitle || car.description || "";
    const article = document.createElement("article");
    article.className = "vehicle-card";
    article.setAttribute("data-trim-id", car.trimId || "");
    article.setAttribute("data-vehicle-line-id", car.vehicleLineId || "");
    article.setAttribute("data-brand-id", car.brandId || "");
    article.setAttribute("data-card-type", car.cardType || "");
    article.setAttribute("data-content-type", car.contentType || "");

    article.innerHTML =
      '<div class="vehicle-card__media">' +
      (brand ? '<span class="vehicle-card__brand">' + brand + "</span>" : "") +
      (badge ? '<span class="vehicle-card__badge">' + badge + "</span>" : "") +
      '<img class="vehicle-image" src="' +
      (car.imageUrl || "") +
      '" alt="' +
      (vehicleName || "차량 이미지") +
      '">' +
      "</div>" +
      '<div class="vehicle-card__body">' +
      '<div><h3 class="vehicle-name">' +
      vehicleName +
      "</h3>" +
      '<p class="vehicle-trim">' +
      trimName +
      "</p></div>" +
      '<div class="vehicle-price-block">' +
      '<div class="vehicle-price-row"><span class="vehicle-price-label">차량가격</span><span class="vehicle-base-price">' +
      formatWonTilde(car.basePrice) +
      "</span></div>" +
      '<p class="vehicle-monthly-label">월 렌탈료</p>' +
      monthlyRow("선납금 30%", car.lowest_prepayment_30_monthly_fee, "vehicle-prepayment-price") +
      monthlyRow("보증금 30%", car.lowest_deposit_30_monthly_fee, "vehicle-deposit-price") +
      monthlyRow("완전무보증", car.lowest_no_deposit_monthly_fee, "vehicle-no-deposit-price") +
      "</div>" +
      '<p class="vehicle-card__note">' + RENTAL_CONDITION_LABEL + "</p>" +
      '<button class="vehicle-cta" type="button">실시간 무료견적 받기</button>' +
      "</div>";

    const cta = article.querySelector(".vehicle-cta");
    cta.addEventListener("click", function () {
      showToast(DEMO_TOAST);
    });
    article.addEventListener("click", function (event) {
      if (event.target.closest(".vehicle-cta")) return;
      const detailPage = document.body.classList.contains("mobile-page")
        ? "./pages/m-car-detail.html"
        : "./pages/car-detail.html";
      location.href = detailPage + "?src=mock&car=" + (car.id || "");
    });
    return article;
  }

  function pad(num) {
    return String(num).padStart(2, "0");
  }

  function startCountdown(root, deadline) {
    if (!root) return;
    const target = deadline ? new Date(deadline).getTime() : Date.now() + 1000 * 60 * 60 * 24 * 13;
    const daysEl = root.querySelector("[data-countdown-days]");
    const hoursEl = root.querySelector("[data-countdown-hours]");
    const minsEl = root.querySelector("[data-countdown-minutes]");
    const secsEl = root.querySelector("[data-countdown-seconds]");

    function tick() {
      const diff = Math.max(0, target - Date.now());
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      if (daysEl) daysEl.textContent = pad(days);
      if (hoursEl) hoursEl.textContent = pad(hours);
      if (minsEl) minsEl.textContent = pad(mins);
      if (secsEl) secsEl.textContent = pad(secs);
    }

    tick();
    setInterval(tick, 1000);
  }

  function renderPartners(target) {
    if (!target || !window.BCS_MOCK) return;
    const partners = window.BCS_MOCK.partners;
    const list = partners.concat(partners);
    target.innerHTML = "";
    list.forEach(function (partner, index) {
      const item = document.createElement("div");
      item.className = "partner-card";
      if (index >= partners.length) item.setAttribute("aria-hidden", "true");

      const logo = document.createElement("div");
      logo.className = "partner-logo";
      const image = document.createElement("img");
      image.src = partner.logoUrl;
      image.alt = partner.name + " 로고";
      image.loading = "lazy";
      image.decoding = "async";
      logo.appendChild(image);

      const name = document.createElement("p");
      name.className = "partner-name";
      name.textContent = partner.name;

      item.appendChild(logo);
      item.appendChild(name);
      target.appendChild(item);
    });
  }

  function fillSelect(select, options, placeholder) {
    if (!select) return;
    select.innerHTML = "";
    const first = document.createElement("option");
    first.value = "";
    first.textContent = placeholder;
    first.disabled = true;
    first.selected = true;
    select.appendChild(first);
    options.forEach(function (opt) {
      const el = document.createElement("option");
      el.value = opt.value;
      el.textContent = opt.label;
      select.appendChild(el);
    });
  }

  window.BCS = {
    DEMO_TOAST: DEMO_TOAST,
    PAGE_TOAST: PAGE_TOAST,
    qs: qs,
    qsa: qsa,
    formatWon: formatWon,
    formatWonTilde: formatWonTilde,
    formatMonthly: formatMonthly,
    showToast: showToast,
    bindDemoForm: bindDemoForm,
    bindComingSoonLinks: bindComingSoonLinks,
    bindPrivacyModal: bindPrivacyModal,
    renderVehicleCard: renderVehicleCard,
    startCountdown: startCountdown,
    renderPartners: renderPartners,
    fillSelect: fillSelect
  };
})();

/* 화면 폭이 좁아지면 플로팅 상담창을 자동으로 접어 본문을 가리지 않게 한다 */
(function () {
  const COLLAPSE_WIDTH = 1280;
  let userToggled = false;

  function toggles() {
    return Array.from(document.querySelectorAll("[data-quick-toggle]"));
  }

  function applyCollapse() {
    const quick = document.querySelector("[data-quick-consult]");
    if (!quick || userToggled) return;
    const forcedClosed = quick.getAttribute("data-quick-default") === "closed";
    const closed = forcedClosed || window.innerWidth < COLLAPSE_WIDTH;
    quick.classList.toggle("is-closed", closed);
    toggles().forEach(function (btn) {
      btn.setAttribute("aria-expanded", closed ? "false" : "true");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyCollapse();
    toggles().forEach(function (btn) {
      btn.addEventListener("click", function () {
        userToggled = true;
      });
    });
  });

  window.addEventListener("resize", applyCollapse);
})();
