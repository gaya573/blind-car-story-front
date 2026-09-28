document.addEventListener("DOMContentLoaded", function () {
  const mock = window.BCS_MOCK;
  const api = window.BCS;
  if (!mock || !api || !mock.promotion) return;

  const data = mock.promotion;
  const tabRoot = api.qs("[data-promo-tabs]");
  const grid = api.qs("[data-promo-grid]");
  const emptyEl = api.qs("[data-promo-empty]");
  const countEl = api.qs("[data-promo-count]");
  const subEl = api.qs("[data-promo-sub]");

  let status = "ongoing";

  function filteredItems() {
    return data.items.filter(function (item) {
      return item.status === status;
    });
  }

  function badgeText(item) {
    if (item.status === "ended") return "종료";
    if (typeof item.remainingDays === "number") return "D-" + item.remainingDays;
    return "진행중";
  }

  function renderTabs() {
    tabRoot.innerHTML = "";
    data.tabs.forEach(function (tab) {
      const btn = document.createElement("button");
      const active = tab.value === status;
      btn.type = "button";
      btn.className = "pm-tab" + (active ? " is-active" : "");
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", active ? "true" : "false");
      btn.setAttribute("data-promo-tab", tab.value);
      btn.textContent = tab.label;
      btn.addEventListener("click", function () {
        status = tab.value;
        renderTabs();
        renderItems();
      });
      tabRoot.appendChild(btn);
    });
  }

  function renderItems() {
    const items = filteredItems();

    grid.innerHTML = "";
    items.forEach(function (item) {
      const card = document.createElement("article");
      card.className =
        "pm-card" + (item.status === "ended" ? " pm-card--ended" : "");
      card.setAttribute("data-promo-id", item.id);

      card.innerHTML =
        '<div class="pm-tile pm-tile--' + item.theme + '">' +
        '<span class="pm-tile__badge">' + badgeText(item) + "</span>" +
        '<span class="pm-tile__brand">' + item.brand + "</span>" +
        '<div class="pm-tile__text">' +
        '<p class="pm-tile__partner">' + item.partner + "</p>" +
        '<h3 class="pm-tile__headline">' + item.headline + "</h3>" +
        '<p class="pm-tile__benefit">' + item.benefit + "</p>" +
        (item.discountLabel
          ? '<span class="pm-tile__discount">' + item.discountLabel + "</span>"
          : "") +
        "</div>" +
        '<p class="pm-tile__period">' + item.period + "</p>" +
        "</div>" +
        '<h4 class="pm-card__title">' + item.title + "</h4>";

      card.addEventListener("click", function () {
        location.href = "./pages/promotion-detail.html?id=" + item.id;
      });
      grid.appendChild(card);
    });

    if (countEl) countEl.textContent = items.length.toLocaleString("ko-KR");
    if (emptyEl) emptyEl.hidden = items.length !== 0;
  }

  if (subEl) subEl.textContent = data.subtitle;
  renderTabs();
  renderItems();

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
