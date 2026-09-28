/* 실시간 견적 받기 모달 (재고 특가 핫딜 · 출고후기 등 여러 화면에서 공용) */
(function () {
  const PARTNERS = [
    { name: "하나캐피탈", logoUrl: "./assets/images/partners/hana-capital.svg", monthly: "306,500", takeover: "41,495,120" },
    { name: "KB캐피탈", logoUrl: "./assets/images/partners/kb-capital.svg", monthly: "316,120", takeover: "41,495,120" },
    { name: "NH농협캐피탈", logoUrl: "./assets/images/partners/nh-capital.svg", monthly: "326,340", takeover: "41,495,120" },
    { name: "신한카드", logoUrl: "./assets/images/partners/shinhan-card.svg", monthly: "336,560", takeover: "41,495,120" },
    { name: "삼성카드", logoUrl: "./assets/images/partners/samsung-card.svg", monthly: "348,910", takeover: "41,495,120" }
  ];

  function partnerRows() {
    return PARTNERS.map(function (partner) {
      return (
        '<div class="qm-partner">' +
        '<span class="qm-partner__mark"><img src="' + partner.logoUrl + '" alt="" /></span>' +
        '<span class="qm-partner__name">' + partner.name + "</span>" +
        '<span class="qm-partner__price"><strong>월 ' + partner.monthly + "원</strong>" +
        "<small>*인수가 " + partner.takeover + "원</small></span>" +
        '<span class="qm-partner__arrow">›</span>' +
        "</div>"
      );
    }).join("");
  }

  function markup() {
    return (
      '<div class="modal-overlay qm-overlay" id="quote-modal" aria-hidden="true">' +
      '<div class="qm-card" role="dialog" aria-modal="true" aria-labelledby="qm-title">' +
      '<div class="qm-head"><h2 id="qm-title">실시간 견적 받기</h2></div>' +
      '<button class="qm-close" type="button" data-qm-close aria-label="닫기">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">' +
      '<path d="M6 6l12 12M18 6L6 18" /></svg></button>' +
      '<div class="qm-body">' +
      '<form class="qm-form" data-qm-form>' +
      '<p class="qm-title"><strong>1분만에</strong> 견적만 <em>스으윽</em> 받아보세요</p>' +
      '<p class="qm-desc">휴대폰 번호를 남겨주시면 차량 전문 매니저가 곧 연락드립니다.</p>' +
      '<div class="qm-fields">' +
      '<div class="qm-row"><label for="qm-name">이름</label>' +
      '<input id="qm-name" name="name" type="text" placeholder="예: 홍길동" autocomplete="name" /></div>' +
      '<div class="qm-row"><label for="qm-phone">휴대폰 번호<span class="required">*</span></label>' +
      '<input id="qm-phone" name="phone" type="tel" inputmode="numeric" placeholder="예: 010-1234-5678" /></div>' +
      '<div class="qm-row"><label for="qm-car">차종</label>' +
      '<input id="qm-car" name="carModel" type="text" placeholder="ex) 쏘렌토" data-qm-car /></div>' +
      "</div>" +
      '<div class="qm-agree">' +
      '<input id="qm-privacy" name="privacyAgree" type="checkbox" checked />' +
      '<label for="qm-privacy">[필수] 개인정보 이용 동의</label>' +
      '<a href="#" data-open-privacy>[보기]</a>' +
      "</div>" +
      '<p class="qm-note">*견적은 카카오톡으로 발송되며, 미사용 시 문자로 전송됩니다.</p>' +
      '<p class="form-error" data-form-error></p>' +
      '<button class="qm-submit" type="submit">실시간 무료견적 받기</button>' +
      "</form>" +
      '<div class="qm-preview" aria-hidden="true">' +
      '<div class="qm-phone">' +
      '<div class="qm-phone__head">최대 <em>30개사</em> 조건별 월 납입금 비교</div>' +
      partnerRows() +
      "</div>" +
      '<p class="qm-preview__note">조건별 월 납입금은 상담 시 안내드립니다.</p>' +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  let modal = null;
  let form = null;
  let carInput = null;
  let lastFocused = null;

  function close() {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function open(carName) {
    if (!modal) return;
    lastFocused = document.activeElement;
    if (carInput) carInput.value = carName || "";
    const errorEl = form && form.querySelector("[data-form-error]");
    if (errorEl) errorEl.textContent = "";
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    const phone = modal.querySelector("#qm-phone");
    if (phone) {
      setTimeout(function () {
        phone.focus();
      }, 0);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    const api = window.BCS;
    const phone = form.querySelector('[name="phone"]');
    const privacy = form.querySelector('[name="privacyAgree"]');
    const errorEl = form.querySelector("[data-form-error]");
    const digits = String(phone ? phone.value : "").replace(/\D/g, "");

    if (privacy && !privacy.checked) {
      if (errorEl) errorEl.textContent = "개인정보 이용 동의에 체크해 주세요.";
      return;
    }
    if (!digits) {
      if (errorEl) errorEl.textContent = "휴대폰 번호를 입력해 주세요.";
      return;
    }
    if (digits.length < 10 || digits.length > 11) {
      if (errorEl) errorEl.textContent = "휴대폰 번호 형식을 확인해 주세요.";
      return;
    }

    if (errorEl) errorEl.textContent = "";
    form.reset();
    if (privacy) privacy.checked = true;
    close();
    if (api) api.showToast(api.DEMO_TOAST);
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("quote-modal")) {
      modal = document.getElementById("quote-modal");
    } else {
      const holder = document.createElement("div");
      holder.innerHTML = markup();
      modal = holder.firstElementChild;
      document.body.appendChild(modal);
    }

    form = modal.querySelector("[data-qm-form]");
    carInput = modal.querySelector("[data-qm-car]");

    modal.querySelectorAll("[data-qm-close]").forEach(function (btn) {
      btn.addEventListener("click", close);
    });
    modal.addEventListener("click", function (event) {
      if (event.target === modal) close();
    });
    if (form) form.addEventListener("submit", handleSubmit);

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && modal.classList.contains("is-open")) close();
    });
  });

  window.BCS_QUOTE = { open: open, close: close };
})();
