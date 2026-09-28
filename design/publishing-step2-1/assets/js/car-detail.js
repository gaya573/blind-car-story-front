document.addEventListener("DOMContentLoaded", function () {
  const mock = window.BCS_MOCK;
  const api = window.BCS;
  if (!mock || !api || !mock.carDetailPreset) return;

  const preset = mock.carDetailPreset;
  const params = new URLSearchParams(location.search);

  /* ------------------------------------------------------------------
     여러 목록 화면에서 넘어온 차량을 공통 형태로 변환
     ------------------------------------------------------------------ */
  function fromCarlist(id, category) {
    const set = mock.carlist && mock.carlist[category || "domestic"];
    if (!set) return null;
    const car = set.cars.find(function (item) {
      return item.id === id;
    });
    if (!car) return null;
    const brandInfo = set.brands.find(function (item) {
      return item.value === car.brand;
    });
    return {
      title: car.title,
      trim: car.trim,
      brandLabel: car.brandLabel,
      basePrice: car.basePrice,
      discount: car.discount || 0,
      imageUrl: car.imageUrl,
      brandLogoUrl: brandInfo ? brandInfo.logoUrl : "",
      category: category || "domestic"
    };
  }

  function fromExpress(id) {
    if (!mock.express) return null;
    const car = mock.express.cars.find(function (item) {
      return item.id === id;
    });
    if (!car) return null;
    const brandInfo = mock.express.brands.find(function (item) {
      return item.value === car.brand;
    });
    return {
      title: car.title,
      trim: car.trim,
      brandLabel: car.brandLabel,
      basePrice: car.basePrice,
      discount: 0,
      imageUrl: car.imageUrl,
      brandLogoUrl: brandInfo ? brandInfo.logoUrl : "",
      category: "domestic"
    };
  }

  function fromMock(id) {
    const pools = [mock.closingSoon || [], mock.hotDeals || [], mock.topCars || []];
    let found = null;
    pools.forEach(function (pool) {
      if (found) return;
      found =
        pool.find(function (item) {
          return String(item.id) === String(id);
        }) || null;
    });
    if (!found) return null;
    const brandInfo = mock.carlist && mock.carlist.domestic
      ? mock.carlist.domestic.brands.find(function (item) {
          return item.label === found.extraInfo;
        })
      : null;
    return {
      title: found.title,
      trim: found.subtitle || found.description || "기본 트림",
      brandLabel: found.extraInfo || "",
      basePrice: found.basePrice || 0,
      discount: 0,
      imageUrl: found.imageUrl,
      brandLogoUrl: brandInfo ? brandInfo.logoUrl : "",
      category: "domestic"
    };
  }

  function resolveCar() {
    const src = params.get("src");
    const id = params.get("car");
    let car = null;
    if (src === "express") car = fromExpress(id);
    else if (src === "mock") car = fromMock(id);
    else if (id) car = fromCarlist(id, params.get("cat"));

    if (!car && mock.carlist) car = fromCarlist("d1", "domestic");
    return car;
  }

  const car = resolveCar();
  if (!car) return;

  const isImported = car.category === "imported";

  /* ------------------------------------------------------------------
     상세 구성 (트림 / 옵션 / 색상)
     ------------------------------------------------------------------ */
  function roundTo(value, unit) {
    return Math.round(value / unit) * unit;
  }

  const trims = preset.trimSteps.map(function (step, index) {
    return {
      id: "t" + (index + 1),
      name: car.trim + step.suffix,
      price: roundTo(car.basePrice * (1 + step.rate), 10000)
    };
  });

  const options = isImported ? preset.optionsImported : preset.optionsDomestic;
  const colors = isImported ? [] : preset.colors;

  const state = {
    trimId: trims[0].id,
    colorId: colors.length ? colors[0].id : null,
    optionIds: [],
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

  function selectedOptions() {
    return options.filter(function (item) {
      return state.optionIds.indexOf(item.id) !== -1;
    });
  }

  function optionTotal() {
    return selectedOptions().reduce(function (sum, item) {
      return sum + item.price;
    }, 0);
  }

  function totalPrice() {
    return Math.max(0, currentTrim().price + optionTotal() - car.discount);
  }

  /* ------------------------------------------------------------------
     렌더링
     ------------------------------------------------------------------ */
  const el = {
    crumb: api.qs("[data-cd-crumb]"),
    hierarchy: api.qs("[data-cd-hierarchy]"),
    image: api.qs("[data-cd-image]"),
    mark: api.qs("[data-cd-mark]"),
    title: api.qs("[data-cd-title]"),
    brand: api.qs("[data-cd-brand]"),
    origin: api.qs("[data-cd-origin]"),
    priceBox: api.qs("[data-cd-price-box]"),
    colorSection: api.qs("[data-cd-colors]"),
    colorName: api.qs("[data-cd-color-name]"),
    palette: api.qs("[data-cd-palette]"),
    trims: api.qs("[data-cd-trims]"),
    optionCard: api.qs("[data-cd-option-card]"),
    options: api.qs("[data-cd-options]"),
    contract: api.qs("[data-cd-contract]"),
    estTrim: api.qs("[data-cd-est-trim]"),
    estTrimPrice: api.qs("[data-cd-est-trim-price]"),
    estOptions: api.qs("[data-cd-est-options]"),
    estDiscount: api.qs("[data-cd-est-discount]"),
    estDiscountValue: api.qs("[data-cd-est-discount-value]"),
    estTotal: api.qs("[data-cd-est-total]")
  };

  function renderHead() {
    document.title = car.title + " 상세 | 블라인드 카스토리";
    if (el.crumb) el.crumb.textContent = car.title;
    if (el.image) {
      el.image.src = car.imageUrl;
      el.image.alt = car.title;
    }
    if (el.mark) {
      el.mark.classList.toggle("has-logo", Boolean(car.brandLogoUrl));
      el.mark.innerHTML = car.brandLogoUrl
        ? '<img src="' + car.brandLogoUrl + '" alt="" />'
        : (car.brandLabel || "BCS").slice(0, 2);
    }
    if (el.title) el.title.textContent = car.title;
    if (el.brand) el.brand.textContent = car.brandLabel;
    if (el.origin) {
      el.origin.textContent = isImported ? "수입차" : "국산차";
      el.origin.classList.toggle("is-imported", isImported);
    }
  }

  function renderPriceBox() {
    if (!el.priceBox) return;
    let html =
      '<div class="cd-price-row">' +
      '<span class="cd-price-row__label">기본 차량가격</span>' +
      '<span class="cd-price-row__value">' +
      api.formatWon(currentTrim().price) +
      "</span></div>";
    if (car.discount > 0) {
      html +=
        '<div class="cd-price-row">' +
        '<span class="cd-price-row__label">즉시 할인 혜택</span>' +
        '<span class="cd-price-row__value is-discount">-' +
        api.formatWon(car.discount) +
        "</span></div>" +
        '<div class="cd-price-row cd-price-row--final">' +
        '<span class="cd-price-row__label">최종 가격</span>' +
        '<span class="cd-price-row__value">' +
        api.formatWon(currentTrim().price - car.discount) +
        "</span></div>";
    }
    el.priceBox.innerHTML = html;
  }

  function renderColors() {
    if (!el.colorSection) return;
    if (!colors.length) {
      el.colorSection.hidden = true;
      return;
    }
    el.colorSection.hidden = false;
    el.palette.innerHTML = "";
    colors.forEach(function (color) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cd-swatch" + (color.id === state.colorId ? " is-selected" : "");
      btn.style.background = color.hex;
      btn.title = color.name;
      btn.setAttribute("aria-label", color.name);
      btn.addEventListener("click", function () {
        state.colorId = color.id;
        renderColors();
        renderEstimate();
      });
      el.palette.appendChild(btn);
    });
    const color = currentColor();
    if (el.colorName) el.colorName.textContent = color ? color.name : "선택 없음";
  }

  function renderTrims() {
    if (!el.trims) return;
    el.trims.innerHTML = "";
    trims.forEach(function (trim) {
      const active = trim.id === state.trimId;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cd-trim" + (active ? " is-active" : "");
      btn.setAttribute("aria-pressed", active ? "true" : "false");
      btn.innerHTML =
        '<span class="cd-radio">' +
        (active ? "✓" : "") +
        "</span>" +
        '<span class="cd-trim__name">' +
        trim.name +
        "</span>" +
        '<span class="cd-trim__price">' +
        api.formatWon(trim.price) +
        "</span>";
      btn.addEventListener("click", function () {
        state.trimId = trim.id;
        renderTrims();
        renderHierarchy();
        renderPriceBox();
        renderEstimate();
      });
      el.trims.appendChild(btn);
    });
  }

  function renderOptions() {
    if (!el.options) return;
    if (!options.length) {
      if (el.optionCard) el.optionCard.hidden = true;
      return;
    }
    el.options.innerHTML = "";
    options.forEach(function (option) {
      const checked = state.optionIds.indexOf(option.id) !== -1;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cd-option" + (checked ? " is-checked" : "");
      btn.setAttribute("aria-pressed", checked ? "true" : "false");
      btn.innerHTML =
        '<span class="cd-checkbox">' +
        (checked ? "✓" : "") +
        "</span>" +
        '<span class="cd-option__name">' +
        option.name +
        "</span>" +
        '<span class="cd-option__price">+' +
        api.formatWon(option.price) +
        "</span>";
      btn.addEventListener("click", function () {
        const index = state.optionIds.indexOf(option.id);
        if (index === -1) state.optionIds.push(option.id);
        else state.optionIds.splice(index, 1);
        renderOptions();
        renderEstimate();
      });
      el.options.appendChild(btn);
    });
  }

  function renderContract() {
    if (!el.contract) return;
    el.contract.innerHTML = "";
    preset.contract.forEach(function (row) {
      const wrap = document.createElement("div");
      wrap.className = "cd-contract-row";
      wrap.innerHTML = '<span class="cd-contract-row__label">' + row.label + "</span>";

      const grid = document.createElement("div");
      grid.className = "cd-contract-row__grid";
      row.options.forEach(function (option) {
        const active = state.contract[row.key] === option;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cd-contract-btn" + (active ? " is-active" : "");
        btn.setAttribute("aria-pressed", active ? "true" : "false");
        btn.textContent = option;
        btn.addEventListener("click", function () {
          state.contract[row.key] = option;
          renderContract();
          renderHierarchy();
        });
        grid.appendChild(btn);
      });
      wrap.appendChild(grid);
      el.contract.appendChild(wrap);
    });
  }

  function renderHierarchy() {
    if (!el.hierarchy) return;
    const terms = [
      state.contract.usage,
      state.contract.term,
      "선납금 " + state.contract.prepay,
      state.contract.mileage
    ].join(" · ");
    el.hierarchy.innerHTML =
      "<strong>" +
      car.title +
      "</strong> → " +
      currentTrim().name +
      '<span class="cd-hierarchy__terms">' +
      terms +
      "</span>";
  }

  function renderEstimate() {
    const trim = currentTrim();
    if (el.estTrim) el.estTrim.textContent = trim.name;
    if (el.estTrimPrice) el.estTrimPrice.textContent = api.formatWon(trim.price);

    if (el.estOptions) {
      const rows = [];
      const color = currentColor();
      rows.push(
        '<div class="cd-est-option"><span>차량 외장색상</span><em>' +
          (color ? color.name : "선택 없음") +
          "</em></div>"
      );
      selectedOptions().forEach(function (option) {
        rows.push(
          '<div class="cd-est-option"><span>' +
            option.name +
            "</span><em>+" +
            api.formatWon(option.price) +
            "</em></div>"
        );
      });
      if (!selectedOptions().length) {
        rows.push('<div class="cd-est-option"><span>추가 옵션</span><em>선택 없음</em></div>');
      }
      el.estOptions.innerHTML = rows.join("");
    }

    if (el.estDiscount) {
      el.estDiscount.hidden = car.discount <= 0;
      if (el.estDiscountValue) el.estDiscountValue.textContent = "-" + api.formatWon(car.discount);
    }

    if (el.estTotal) el.estTotal.textContent = api.formatWon(totalPrice());
  }

  /* 아코디언 */
  api.qsa("[data-cd-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const card = btn.closest(".cd-card");
      if (!card) return;
      const closed = card.classList.toggle("is-closed");
      btn.setAttribute("aria-expanded", closed ? "false" : "true");
      const icon = btn.querySelector(".cd-card__icon");
      if (icon) icon.textContent = closed ? "+" : "−";
    });
  });

  /* 견적서 CTA */
  const estimateForm = api.qs("[data-cd-estimate-form]");
  if (estimateForm) {
    estimateForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const privacy = estimateForm.querySelector('[name="privacyAgree"]');
      const errorEl = estimateForm.querySelector("[data-form-error]");
      if (privacy && !privacy.checked) {
        if (errorEl) errorEl.textContent = "개인정보 이용 동의에 체크해 주세요.";
        api.showToast("개인정보 이용 동의에 체크해 주세요.");
        return;
      }
      if (errorEl) errorEl.textContent = "";
      api.showToast(api.DEMO_TOAST);
    });
  }

  renderHead();
  renderPriceBox();
  renderColors();
  renderTrims();
  renderOptions();
  renderContract();
  renderHierarchy();
  renderEstimate();

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
