/* 모바일 하위 페이지 공통 스크립트 (body[data-mpage] 로 분기) */
document.addEventListener("DOMContentLoaded", function () {
  const mock = window.BCS_MOCK;
  const api = window.BCS;
  if (!mock || !api) return;

  const params = new URLSearchParams(location.search);
  const page = document.body.getAttribute("data-mpage");

  function openQuote(carName) {
    if (window.BCS_QUOTE) window.BCS_QUOTE.open(carName || "");
    else api.showToast(api.DEMO_TOAST);
  }

  /* ------------------------------------------------------------------
     차량검색 : 브랜드 선택
     ------------------------------------------------------------------ */
  function renderSearch() {
    const groups = [
      { key: "domestic", label: "국산차", root: api.qs("[data-m-brands-domestic]") },
      { key: "imported", label: "수입차", root: api.qs("[data-m-brands-imported]") }
    ];
    groups.forEach(function (group) {
      const set = mock.carlist && mock.carlist[group.key];
      if (!group.root || !set) return;
      group.root.innerHTML = set.brands
        .filter(function (brand) {
          return brand.value !== "all";
        })
        .map(function (brand) {
          return (
            '<a class="m-brandbtn" href="./pages/m-search-results.html?origin=' + group.key +
            "&brand=" + brand.value + '">' +
            '<span class="m-brandbtn__mark">' +
            (brand.logoUrl ? '<img src="' + brand.logoUrl + '" alt="" />' : (brand.mark || brand.label)) +
            "</span>" +
            '<span class="m-brandbtn__name">' + brand.label + "</span>" +
            "</a>"
          );
        })
        .join("");
    });
  }

  /* ------------------------------------------------------------------
     검색 결과
     ------------------------------------------------------------------ */
  function renderResults() {
    const origin = params.get("origin") === "imported" ? "imported" : "domestic";
    const set = mock.carlist && mock.carlist[origin];
    if (!set) return;

    const chipRoot = api.qs("[data-m-chips]");
    const listRoot = api.qs("[data-m-results]");
    const countEl = api.qs("[data-m-count]");
    const emptyEl = api.qs("[data-m-empty]");
    const moreBtn = api.qs("[data-m-more]");
    const titleEl = api.qs("[data-m-title]");
    const PAGE_SIZE = 8;

    let brand = params.get("brand") || "all";
    let visible = PAGE_SIZE;

    if (titleEl) titleEl.textContent = set.label + " 검색결과";
    document.title = set.label + " 검색결과 | 블라인드 카스토리";

    function filtered() {
      const cars = set.cars.slice().sort(function (a, b) {
        return b.discount - a.discount;
      });
      return brand === "all"
        ? cars
        : cars.filter(function (car) {
            return car.brand === brand;
          });
    }

    function renderChips() {
      chipRoot.innerHTML = set.brands
        .map(function (item) {
          return (
            '<button class="m-chip' + (item.value === brand ? " is-active" : "") +
            '" type="button" data-brand="' + item.value + '">' + item.label + "</button>"
          );
        })
        .join("");
      chipRoot.querySelectorAll(".m-chip").forEach(function (btn) {
        btn.addEventListener("click", function () {
          brand = btn.getAttribute("data-brand");
          visible = PAGE_SIZE;
          renderChips();
          renderList();
        });
      });
    }

    function resultCard(car, rate) {
      return (
        '<article class="vehicle-card" data-car-id="' + car.id + '">' +
        '<div class="vehicle-card__media">' +
        '<span class="vehicle-card__brand">' + car.brandLabel + "</span>" +
        '<span class="vehicle-card__badge vehicle-card__badge--discount">' + rate + "% 할인</span>" +
        '<img class="vehicle-image" src="' + car.imageUrl + '" alt="' + car.title + '" loading="lazy">' +
        "</div>" +
        '<div class="vehicle-card__body">' +
        '<div><h3 class="vehicle-name">' + car.title + "</h3>" +
        '<p class="vehicle-trim">' + car.trim + "</p></div>" +
        '<div class="vehicle-price-block">' +
        '<div class="vehicle-price-row"><span class="vehicle-price-label">기존가격</span>' +
        '<span class="vehicle-base-price vehicle-base-price--strike">' +
        api.formatWonTilde(car.basePrice) + "</span></div>" +
        '<div class="vehicle-price-row"><span class="vehicle-price-label">할인가격</span>' +
        '<span class="vehicle-off-price">-' + api.formatWon(car.discount) + "</span></div>" +
        '<div class="vehicle-monthly-row">' +
        '<span class="vehicle-chip">최종가격</span>' +
        '<strong class="vehicle-amount">' + api.formatMonthly(car.promoPrice) +
        '<span class="price-suffix">원~</span></strong>' +
        "</div>" +
        "</div>" +
        '<button class="vehicle-cta" type="button">실시간 무료견적 받기</button>' +
        "</div>" +
        "</article>"
      );
    }

    function renderList() {
      const cars = filtered();
      const slice = cars.slice(0, visible);
      const rate = function (car) {
        return Math.round((car.discount / car.basePrice) * 100);
      };

      listRoot.innerHTML = slice
        .map(function (car) {
          return resultCard(car, rate(car));
        })
        .join("");

      listRoot.querySelectorAll(".vehicle-card").forEach(function (card) {
        const id = card.getAttribute("data-car-id");
        const car = slice.find(function (item) {
          return item.id === id;
        });
        card.querySelector(".vehicle-cta").addEventListener("click", function (event) {
          event.stopPropagation();
          openQuote(car ? car.title : "");
        });
        card.addEventListener("click", function () {
          location.href = "./pages/m-car-detail.html?cat=" + origin + "&car=" + id;
        });
      });

      if (countEl) countEl.textContent = cars.length.toLocaleString("ko-KR");
      if (emptyEl) emptyEl.hidden = cars.length !== 0;
      if (moreBtn) {
        const rest = cars.length - slice.length;
        moreBtn.hidden = rest <= 0;
        moreBtn.textContent = "차량 더보기 (" + rest + ")";
      }
    }

    if (moreBtn) {
      moreBtn.addEventListener("click", function () {
        visible += PAGE_SIZE;
        renderList();
      });
    }

    renderChips();
    renderList();
  }

  /* ------------------------------------------------------------------
     재고 특가 핫딜
     ------------------------------------------------------------------ */
  function dealCard(car, urgent) {
    const badge = urgent
      ? '<span class="m-deal__badge">긴급 D-' + car.remainingDays + "</span>"
      : '<span class="m-deal__badge m-deal__badge--stock">재고 ' + car.stock + "대</span>";
    const row = function (label, value) {
      return (
        '<div class="m-deal__row"><span class="m-deal__chip">' + label + "</span>" +
        '<span class="m-deal__amount">' + api.formatMonthly(value) + "<em>원</em></span></div>"
      );
    };
    return (
      '<article class="m-deal' + (urgent ? " m-deal--urgent" : "") + '" data-car-id="' + car.id + '">' +
      '<div class="m-deal__top">' + badge +
      '<span class="m-deal__brand">' + car.brandLabel + "</span></div>" +
      '<h3 class="m-deal__name">' + car.title + "</h3>" +
      '<p class="m-deal__trim">' + car.trim + "</p>" +
      '<div class="m-deal__media"><img src="' + car.imageUrl + '" alt="' + car.title + '" loading="lazy"></div>' +
      '<div class="m-deal__price"><span>차량가격</span><strong>' +
      api.formatWonTilde(car.basePrice) + "</strong></div>" +
      '<div class="m-deal__monthly">' +
      row("선납금 30%", car.prepayment30) +
      row("보증금 30%", car.deposit30) +
      row("완전무보증", car.noDeposit) +
      "</div>" +
      '<p class="m-deal__note">' + mock.express.conditionLabel + "</p>" +
      '<button class="m-deal__cta" type="button">실시간 무료견적 받기</button>' +
      "</article>"
    );
  }

  function renderExpress() {
    if (!mock.express) return;
    const urgentRoot = api.qs("[data-m-urgent]");
    const listRoot = api.qs("[data-m-deals]");
    const countEl = api.qs("[data-m-deal-count]");
    const moreBtn = api.qs("[data-m-deal-more]");
    const PAGE_SIZE = 6;
    let visible = PAGE_SIZE;

    if (urgentRoot) {
      urgentRoot.innerHTML = mock.express.cars
        .filter(function (car) {
          return car.urgent;
        })
        .map(function (car) {
          return dealCard(car, true);
        })
        .join("");
    }

    function renderList() {
      const cars = mock.express.cars;
      listRoot.innerHTML = cars
        .slice(0, visible)
        .map(function (car) {
          return dealCard(car, false);
        })
        .join("");
      if (countEl) countEl.textContent = cars.length.toLocaleString("ko-KR");
      if (moreBtn) {
        const rest = cars.length - Math.min(visible, cars.length);
        moreBtn.hidden = rest <= 0;
        moreBtn.textContent = "차량 더보기 (" + rest + ")";
      }
      bindDeals();
    }

    function bindDeals() {
      api.qsa(".m-deal").forEach(function (card) {
        if (card.getAttribute("data-bound")) return;
        card.setAttribute("data-bound", "1");
        const id = card.getAttribute("data-car-id");
        const car = mock.express.cars.find(function (item) {
          return item.id === id;
        });
        card.addEventListener("click", function () {
          openQuote(car ? car.title : "");
        });
      });
    }

    if (moreBtn) {
      moreBtn.addEventListener("click", function () {
        visible += PAGE_SIZE;
        renderList();
      });
    }

    renderList();
    bindDeals();

    const end = new Date();
    end.setHours(23, 59, 59, 999);
    api.startCountdown(api.qs("[data-countdown]"), end.getTime());
  }

  /* ------------------------------------------------------------------
     브랜드별 혜택
     ------------------------------------------------------------------ */
  function renderBrandList() {
    if (!mock.promotion) return;
    const tabRoot = api.qs("[data-m-promo-tabs]");
    const listRoot = api.qs("[data-m-promos]");
    let status = "ongoing";

    function renderTabs() {
      tabRoot.innerHTML = mock.promotion.tabs
        .map(function (tab) {
          return (
            '<button type="button" class="' + (tab.value === status ? "is-active" : "") +
            '" data-status="' + tab.value + '">' + tab.label + "</button>"
          );
        })
        .join("");
      tabRoot.querySelectorAll("button").forEach(function (btn) {
        btn.addEventListener("click", function () {
          status = btn.getAttribute("data-status");
          renderTabs();
          renderPromos();
        });
      });
    }

    function renderPromos() {
      const items = mock.promotion.items.filter(function (item) {
        return item.status === status;
      });
      listRoot.innerHTML = items
        .map(function (item) {
          const badge =
            item.status === "ended" ? "종료" : item.discountLabel || "진행중";
          return (
            '<a class="m-promo' + (item.status === "ended" ? " is-ended" : "") +
            '" href="./pages/m-brand-detail.html?id=' + item.id + '">' +
            '<div class="m-promo__tile m-promo__tile--' + item.theme + '">' +
            '<span class="m-promo__badge">' + badge + "</span>" +
            '<p class="m-promo__headline">' + item.headline + "</p>" +
            '<p class="m-promo__benefit">' + item.benefit + "</p>" +
            "</div>" +
            '<p class="m-promo__title">' + item.title + "</p>" +
            '<p class="m-promo__period">' + item.period + "</p>" +
            "</a>"
          );
        })
        .join("");
    }

    renderTabs();
    renderPromos();
  }

  /* ------------------------------------------------------------------
     브랜드 혜택 상세
     ------------------------------------------------------------------ */
  function renderBrandDetail() {
    if (!mock.promotion) return;
    const id = params.get("id");
    const item =
      mock.promotion.items.find(function (row) {
        return row.id === id;
      }) || mock.promotion.items[0];
    const ended = item.status === "ended";

    document.title = item.title + " | 블라인드 카스토리";
    const set = function (sel, value) {
      const el = api.qs(sel);
      if (el) el.textContent = value;
    };

    const hero = api.qs("[data-m-bd-hero]");
    if (hero) hero.classList.toggle("is-ended", ended);
    const status = api.qs("[data-m-bd-status]");
    if (status) {
      status.textContent = ended
        ? "종료"
        : "진행중 · D-" + (item.remainingDays || 0);
      status.classList.toggle("is-ended", ended);
    }
    set("[data-m-bd-brand]", item.brand);
    set("[data-m-bd-partner]", item.partner);
    set("[data-m-bd-headline]", item.headline);
    set("[data-m-bd-benefit]", item.benefit);
    set("[data-m-bd-period]", item.period);
    set("[data-m-sub-title]", item.brand + " 혜택");

    const discount = api.qs("[data-m-bd-discount]");
    if (discount) {
      discount.textContent = item.discountLabel || item.benefit;
      discount.hidden = !item.discountLabel;
    }

    const stats = api.qs("[data-m-bd-stats]");
    if (stats) {
      stats.innerHTML = (item.stats || [])
        .map(function (stat) {
          return (
            '<div class="m-bd-stat"><span>' + stat.label + "</span><strong>" +
            stat.value + "</strong></div>"
          );
        })
        .join("");
    }

    const benefits = api.qs("[data-m-bd-benefits]");
    if (benefits) {
      benefits.innerHTML = (item.benefits || [])
        .map(function (benefit, index) {
          return (
            '<article class="m-bd-benefit">' +
            '<span class="m-bd-benefit__no">0' + (index + 1) + "</span>" +
            "<h3>" + benefit.title + "</h3><p>" + benefit.desc + "</p></article>"
          );
        })
        .join("");
    }

    const models = api.qs("[data-m-bd-models]");
    if (models) {
      models.innerHTML = (item.targetModels || [])
        .map(function (model) {
          return (
            '<div class="m-bd-model"><div>' +
            '<p class="m-bd-model__name">' + model.name + "</p>" +
            '<p class="m-bd-model__trim">' + (model.trim || "") + "</p></div>" +
            '<div class="m-bd-model__price"><small>월 렌탈료</small><strong>' +
            api.formatMonthly(model.monthly) + "원</strong></div></div>"
          );
        })
        .join("");
    }

    const notes = api.qs("[data-m-bd-notes]");
    if (notes) {
      notes.innerHTML = (mock.promotion.notes || [])
        .map(function (note) {
          return "<li>" + note + "</li>";
        })
        .join("");
    }
  }

  /* ------------------------------------------------------------------
     차량 상세
     ------------------------------------------------------------------ */
  function resolveDetailCar() {
    const src = params.get("src");
    const id = params.get("car");

    if (src === "mock") {
      const pools = [mock.closingSoon || [], mock.hotDeals || [], mock.topCars || []];
      let found = null;
      pools.forEach(function (pool) {
        if (found) return;
        found =
          pool.find(function (item) {
            return String(item.id) === String(id);
          }) || null;
      });
      if (found) {
        return {
          title: found.title,
          trim: found.subtitle || found.description || "기본 트림",
          brandLabel: found.extraInfo || "",
          basePrice: found.basePrice || 0,
          discount: 0,
          imageUrl: found.imageUrl,
          category: "domestic"
        };
      }
    }

    if (src === "express" && mock.express) {
      const car = mock.express.cars.find(function (item) {
        return item.id === id;
      });
      if (car) {
        return {
          title: car.title,
          trim: car.trim,
          brandLabel: car.brandLabel,
          basePrice: car.basePrice,
          discount: 0,
          imageUrl: car.imageUrl,
          category: "domestic"
        };
      }
    }

    const origin = params.get("cat") === "imported" ? "imported" : "domestic";
    const set = mock.carlist && mock.carlist[origin];
    if (!set) return null;
    const car =
      set.cars.find(function (item) {
        return item.id === id;
      }) || set.cars[0];
    return {
      title: car.title,
      trim: car.trim,
      brandLabel: car.brandLabel,
      basePrice: car.basePrice,
      discount: car.discount || 0,
      imageUrl: car.imageUrl,
      category: origin
    };
  }

  function renderCarDetail() {
    const preset = mock.carDetailPreset;
    const car = resolveDetailCar();
    if (!preset || !car) return;

    const isImported = car.category === "imported";

    const trims = preset.trimSteps.map(function (step, index) {
      return {
        id: "t" + (index + 1),
        name: car.trim + step.suffix,
        price: Math.round((car.basePrice * (1 + step.rate)) / 10000) * 10000
      };
    });
    const colors = isImported ? [] : preset.colors;

    const state = {
      trimId: trims[0].id,
      colorId: colors.length ? colors[0].id : null,
      contract: {}
    };
    preset.contract.forEach(function (row) {
      state.contract[row.key] = row.value;
    });

    function currentTrim() {
      return (
        trims.find(function (item) {
          return item.id === state.trimId;
        }) || trims[0]
      );
    }
    function currentColor() {
      return (
        colors.find(function (item) {
          return item.id === state.colorId;
        }) || null
      );
    }
    function total() {
      return Math.max(0, currentTrim().price - car.discount);
    }

    document.title = car.title + " | 블라인드 카스토리";
    const setText = function (sel, value) {
      const el = api.qs(sel);
      if (el) el.textContent = value;
    };

    setText("[data-m-sub-title]", car.title);
    setText("[data-m-cd-name]", car.title);
    setText("[data-m-cd-brand]", car.brandLabel);
    const originEl = api.qs("[data-m-cd-origin]");
    if (originEl) {
      originEl.textContent = isImported ? "수입차" : "국산차";
      originEl.classList.toggle("is-imported", isImported);
    }
    const imageEl = api.qs("[data-m-cd-image]");
    if (imageEl) {
      imageEl.src = car.imageUrl;
      imageEl.alt = car.title;
    }

    const colorBlock = api.qs("[data-m-cd-colorblock]");
    function renderColors() {
      if (!colorBlock) return;
      if (!colors.length) {
        colorBlock.hidden = true;
        return;
      }
      const nameEl = api.qs("[data-m-cd-colorname]");
      const palette = api.qs("[data-m-cd-palette]");
      const color = currentColor();
      if (nameEl) nameEl.innerHTML = "선택한 색상 <strong>" + (color ? color.name : "-") + "</strong>";
      palette.innerHTML = colors
        .map(function (row) {
          return (
            '<button class="m-cd-swatch' + (row.id === state.colorId ? " is-selected" : "") +
            '" type="button" style="background:' + row.hex + '" data-color="' + row.id +
            '" aria-label="' + row.name + '"></button>'
          );
        })
        .join("");
      palette.querySelectorAll(".m-cd-swatch").forEach(function (btn) {
        btn.addEventListener("click", function () {
          state.colorId = btn.getAttribute("data-color");
          renderColors();
          renderSummary();
        });
      });
    }

    const trimRoot = api.qs("[data-m-cd-trims]");
    function renderTrims() {
      if (!trimRoot) return;
      trimRoot.innerHTML = trims
        .map(function (trim) {
          const active = trim.id === state.trimId;
          return (
            '<button class="m-cd-trim' + (active ? " is-active" : "") +
            '" type="button" data-trim="' + trim.id + '">' +
            '<span class="m-cd-radio">' + (active ? "✓" : "") + "</span>" +
            '<span class="m-cd-trim__name">' + trim.name + "</span>" +
            '<span class="m-cd-trim__price">' + api.formatWon(trim.price) + "</span>" +
            "</button>"
          );
        })
        .join("");
      trimRoot.querySelectorAll(".m-cd-trim").forEach(function (btn) {
        btn.addEventListener("click", function () {
          state.trimId = btn.getAttribute("data-trim");
          renderTrims();
          renderSummary();
        });
      });
    }

    const contractRoot = api.qs("[data-m-cd-contract]");
    function renderContract() {
      if (!contractRoot) return;
      contractRoot.innerHTML = preset.contract
        .map(function (row) {
          const opts = row.options
            .map(function (option) {
              return (
                '<button class="m-cd-opt' + (state.contract[row.key] === option ? " is-active" : "") +
                '" type="button" data-key="' + row.key + '" data-value="' + option + '">' +
                option + "</button>"
              );
            })
            .join("");
          return (
            '<div class="m-cd-row"><span class="m-cd-row__label">' + row.label + "</span>" +
            '<div class="m-cd-row__opts">' + opts + "</div></div>"
          );
        })
        .join("");
      contractRoot.querySelectorAll(".m-cd-opt").forEach(function (btn) {
        btn.addEventListener("click", function () {
          state.contract[btn.getAttribute("data-key")] = btn.getAttribute("data-value");
          renderContract();
        });
      });
    }

    function renderSummary() {
      setText("[data-m-cd-sum-trim]", currentTrim().name);
      setText("[data-m-cd-sum-base]", api.formatWon(currentTrim().price));
      const color = currentColor();
      setText("[data-m-cd-sum-color]", color ? color.name : "선택 없음");
      const offEl = api.qs("[data-m-cd-sum-offblock]");
      if (offEl) offEl.hidden = car.discount <= 0;
      setText("[data-m-cd-sum-off]", "-" + api.formatWon(car.discount));
      setText("[data-m-cd-sum-total]", api.formatWon(total()));
      setText("[data-m-cd-bar-total]", api.formatWon(total()));
    }

    const barBtn = api.qs("[data-m-cd-quote]");
    if (barBtn) {
      barBtn.addEventListener("click", function () {
        openQuote(car.title);
      });
    }

    renderColors();
    renderTrims();
    renderContract();
    renderSummary();
  }

  /* ------------------------------------------------------------------
     페이지 분기 + 공통 인터랙션
     ------------------------------------------------------------------ */
  if (page === "search") renderSearch();
  if (page === "results") renderResults();
  if (page === "express") renderExpress();
  if (page === "brand") renderBrandList();
  if (page === "brand-detail") renderBrandDetail();
  if (page === "car-detail") renderCarDetail();

  api.qsa("[data-consult-form]").forEach(api.bindDemoForm);
  api.bindComingSoonLinks();
  api.bindPrivacyModal();
  api.qsa("[data-demo-contact]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      api.showToast(api.DEMO_TOAST);
    });
  });
  api.qsa("[data-open-quote]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openQuote("");
    });
  });
});
