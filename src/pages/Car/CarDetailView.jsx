import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PrivacyRow from '../../bcs/components/PrivacyRow';
import { formatWon } from '../../bcs/format';
import { resolveBrandLogoUrl } from './carBrandLogos';
import {
  CAR_TAX_OPTIONS,
  CONTRACT_PERIOD_OPTIONS,
  DEPOSIT_OPTIONS,
  INSURANCE_AGE_OPTIONS,
  MILEAGE_OPTIONS,
  PREPAYMENT_OPTIONS,
  contractMethodLabel,
  formatCurrency,
  formatOptionPrice,
} from './carDetailShared';
import './CarPages.css';

export const CAR_PLACEHOLDER_IMAGE = '/bcs/images/cars/car-sedan.svg';

/** 트림·색상·옵션 선택 전후, 로딩·오류 화면에서도 같은 틀(.bcs-page-car-detail .cd-page)을 쓴다. */
export function CarDetailStatus({ children }) {
  return (
    <div className="bcs-page-car-detail">
      <section className="cd-page">
        <div className="container">
          <div className="cd-status" role="status">
            {children}
          </div>
        </div>
      </section>
    </div>
  );
}

function AccordionCard({ title, children, hidden }) {
  const [closed, setClosed] = useState(false);
  if (hidden) return null;
  return (
    <section className={`cd-card${closed ? ' is-closed' : ''}`}>
      <button className="cd-card__head" type="button" aria-expanded={!closed} onClick={() => setClosed((value) => !value)}>
        <h2>{title}</h2>
        <span className="cd-card__icon" aria-hidden="true">
          {closed ? '+' : '−'}
        </span>
      </button>
      <div className="cd-card__body">{children}</div>
    </section>
  );
}

function ChoiceRow({ label, options, value, onSelect, format = (option) => option }) {
  return (
    <div className="cd-contract-row">
      <span className="cd-contract-row__label">{label}</span>
      <div className="cd-contract-row__grid">
        {options.map((option) => {
          const active = value === option;
          return (
            <button key={option} className={`cd-contract-btn${active ? ' is-active' : ''}`} type="button" aria-pressed={active} onClick={() => onSelect(option)}>
              {format(option)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ContractConditions({ contract }) {
  const {
    availableMethods,
    contractMethod,
    setContractMethod,
    contractPeriod,
    setContractPeriod,
    deposit,
    setDeposit,
    prepayment,
    setPrepayment,
    mileage,
    setMileage,
    carTax,
    setCarTax,
    insuranceAge,
    setInsuranceAge,
    isImported,
    isFinanceMode,
  } = contract;

  return (
    <div className="cd-contract">
      <ChoiceRow label="이용방법" options={availableMethods} value={contractMethod} onSelect={setContractMethod} format={contractMethodLabel} />
      <ChoiceRow
        label={isFinanceMode ? '할부기간' : '계약기간'}
        options={CONTRACT_PERIOD_OPTIONS}
        value={contractPeriod}
        onSelect={setContractPeriod}
        format={(option) => (isImported && option === '24개월' ? '일시불' : option)}
      />
      {!isFinanceMode && (
        <>
          <ChoiceRow label="보증금" options={DEPOSIT_OPTIONS} value={deposit} onSelect={setDeposit} />
          <ChoiceRow label="선납금" options={PREPAYMENT_OPTIONS} value={prepayment} onSelect={setPrepayment} />
          <ChoiceRow label="연간 약정운행거리" options={MILEAGE_OPTIONS} value={mileage} onSelect={setMileage} />
          {/* 자동차세는 리스에서만, 보험 연령은 장기렌트에서만 고른다. */}
          {contractMethod === '리스' && <ChoiceRow label="자동차세" options={CAR_TAX_OPTIONS} value={carTax} onSelect={setCarTax} />}
          {contractMethod === '장기렌탈' && (
            <ChoiceRow label="보험 연령" options={INSURANCE_AGE_OPTIONS} value={insuranceAge} onSelect={setInsuranceAge} />
          )}
        </>
      )}
      {isFinanceMode && (
        <>
          <ChoiceRow label="선납금" options={PREPAYMENT_OPTIONS} value={prepayment} onSelect={setPrepayment} />
          <div className="cd-contract-row">
            <span className="cd-contract-row__label">이자율</span>
            <p className="cd-contract-note">* 기준 이자율 4.9% 적용 (실제 이자율은 신용등급에 따라 변동 가능)</p>
          </div>
        </>
      )}
    </div>
  );
}

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

/** 저장된 연락처가 없을 때 이름·연락처를 받는 모달. 퍼블리싱 견적 모달(qm-*) 마크업을 쓴다. */
function ContactModal({ open, onClose, onSubmit, error, submitting, summary }) {
  const phoneRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const lastFocused = document.activeElement;
    document.body.style.overflow = 'hidden';
    const focusTimer = setTimeout(() => phoneRef.current?.focus(), 0);
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      lastFocused?.focus?.();
    };
  }, [open, onClose]);

  return (
    <div
      className={`modal-overlay qm-overlay${open ? ' is-open' : ''}`}
      aria-hidden={open ? 'false' : 'true'}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="qm-card cd-contact" role="dialog" aria-modal="true" aria-labelledby="cd-contact-title">
        <div className="qm-head">
          <h2 id="cd-contact-title">실시간 견적 받기</h2>
        </div>
        <button className="qm-close" type="button" aria-label="닫기" onClick={onClose}>
          <CloseIcon />
        </button>
        <div className="qm-body">
          <form className="qm-form" onSubmit={onSubmit} noValidate>
            <p className="qm-title">
              <strong>1분만에</strong> 견적만 <em>스으윽</em> 받아보세요
            </p>
            <p className="qm-desc">휴대폰 번호를 남겨주시면 담당 매니저가 빠르게 도와드립니다.</p>
            <div className="qm-fields">
              <div className="qm-row">
                <label htmlFor="cd-contact-name">이름</label>
                <input id="cd-contact-name" name="name" type="text" placeholder="예: 홍길동" autoComplete="name" />
              </div>
              <div className="qm-row">
                <label htmlFor="cd-contact-phone">
                  휴대폰 번호<span className="required">*</span>
                </label>
                <input ref={phoneRef} id="cd-contact-phone" name="phone" type="tel" inputMode="numeric" placeholder="예: 010-1234-5678" />
              </div>
            </div>
            <p className="form-error">{error}</p>
            <button className="qm-submit" type="submit" disabled={submitting}>
              {submitting ? '접수 중…' : '실시간 무료견적 받기'}
            </button>
          </form>
          <div className="cd-estimate cd-contact__summary">
            <div className="cd-estimate__top">선택한 견적 조건</div>
            <div className="cd-estimate__body">
              <div className="cd-est-block">
                <p className="cd-est-block__title">{summary.title}</p>
                <div className="cd-est-options">
                  {summary.rows.map(([label, value]) => (
                    <div className="cd-est-option" key={label}>
                      <span>{label}</span>
                      <em>{value}</em>
                    </div>
                  ))}
                </div>
              </div>
              <div className="cd-est-total">
                <span>총 차량가격</span>
                <strong>{summary.total}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 퍼블리싱 pages/car-detail.html 화면. 트림 상세·차량 라인 상세가 상태와 계산을 넘겨 그린다.
 *
 * modelTabs 가 두 개 이상이면 세부모델 카드 위쪽에 모델 선택 줄을 둔다(차량 라인 상세).
 */
export default function CarDetailView({
  listPath,
  title,
  brandName,
  origin,
  heroImage,
  heroFallbackImage,
  price,
  colors,
  selectedColorId,
  selectedColor,
  onSelectColor,
  modelTabs = [],
  activeModelKey,
  onSelectModel,
  trims,
  selectedTrimId,
  selectedTrimName,
  onSelectTrim,
  options,
  selectedOptionIds,
  onToggleOption,
  contract,
  estimate,
  consult,
}) {
  const brandLogo = resolveBrandLogoUrl(brandName);
  const isImported = origin === '수입차';
  const hasDiscount = price.discountAmount > 0;
  const colorName = selectedColor?.name || '선택 없음';
  const totalLabel = formatWon(estimate.total);

  const contactSummary = {
    title,
    rows: [
      ['세부모델', selectedTrimName || '-'],
      ['외장색상', colorName],
      ['계약조건', contract.displayTerms.join(' · ')],
      ...(estimate.options.length ? [['추가 옵션', estimate.options.map((option) => option.name).join(', ')]] : []),
    ],
    total: totalLabel,
  };

  return (
    <div className="bcs-page-car-detail">
      <section className="cd-page">
        <div className="container">
          <nav className="cd-breadcrumb" aria-label="현재 위치">
            <Link to="/">홈</Link>
            <span aria-hidden="true">›</span>
            <Link to={listPath}>차량 상세</Link>
            <span aria-hidden="true">›</span>
            <strong>{title}</strong>
          </nav>

          <div className="cd-hierarchy">
            <strong>{title}</strong>
            {selectedTrimName ? ` → ${selectedTrimName}` : null}
            <span className="cd-hierarchy__terms">{contract.displayTerms.join(' · ')}</span>
          </div>

          <div className="cd-layout">
            <div className="cd-left">
              <div className="cd-hero">
                <div className="cd-hero__media">
                  <img
                    key={heroImage || 'placeholder'}
                    src={heroImage || CAR_PLACEHOLDER_IMAGE}
                    alt={title}
                    onError={(event) => {
                      const image = event.currentTarget;
                      if (heroFallbackImage && image.src !== heroFallbackImage) image.src = heroFallbackImage;
                      else if (!image.src.endsWith(CAR_PLACEHOLDER_IMAGE)) image.src = CAR_PLACEHOLDER_IMAGE;
                    }}
                  />
                </div>
                <div className="cd-hero__info">
                  <div className="cd-brand">
                    <span className={`cd-brand__mark${brandLogo ? ' has-logo' : ''}`}>
                      {brandLogo ? <img src={brandLogo} alt="" /> : (brandName || 'BCS').slice(0, 2)}
                    </span>
                    <div>
                      <h1 className="cd-title">{title}</h1>
                      <div className="cd-brand__meta">
                        <span>{brandName}</span>
                        {origin && <span className={`cd-origin${isImported ? ' is-imported' : ''}`}>{origin}</span>}
                      </div>
                      {price.basePrice > 0 && (
                        <div className="cd-price">
                          <div className="cd-price-row">
                            <span className="cd-price-row__label">기본 차량가격</span>
                            <span className="cd-price-row__value">{formatWon(price.basePrice)}</span>
                          </div>
                          {hasDiscount && (
                            <>
                              <div className="cd-price-row">
                                <span className="cd-price-row__label">즉시 할인 혜택</span>
                                <span className="cd-price-row__value is-discount">-{formatWon(price.discountAmount)}</span>
                              </div>
                              <div className="cd-price-row cd-price-row--final">
                                <span className="cd-price-row__label">최종 가격</span>
                                <span className="cd-price-row__value">{formatWon(price.discountedBasePrice)}</span>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {colors.length > 0 && (
                    <div className="cd-colors">
                      <div className="cd-colors__head">
                        <span>외장색상 선택</span>
                        <strong>{colorName}</strong>
                      </div>
                      <div className="cd-colors__palette">
                        {colors.map((color) => (
                          <button
                            key={color.id ?? color.name}
                            className={`cd-swatch${color.id === selectedColorId ? ' is-selected' : ''}`}
                            type="button"
                            style={{ background: color.background }}
                            title={color.name}
                            aria-label={color.name}
                            aria-pressed={color.id === selectedColorId}
                            onClick={() => onSelectColor(color.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <AccordionCard title="세부모델 선택">
                {modelTabs.length > 1 && (
                  <div className="cd-contract-row cd-model-tabs">
                    <span className="cd-contract-row__label">모델</span>
                    <div className="cd-contract-row__grid">
                      {modelTabs.map((model) => {
                        const active = model.key === activeModelKey;
                        return (
                          <button
                            key={model.key}
                            className={`cd-contract-btn${active ? ' is-active' : ''}`}
                            type="button"
                            aria-pressed={active}
                            onClick={() => onSelectModel(model.key)}
                          >
                            {model.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {trims.length === 0 ? (
                  <p className="cd-empty">등록된 세부모델이 없습니다.</p>
                ) : (
                  <div className="cd-trims">
                    {trims.map((trim) => {
                      const active = trim.id === selectedTrimId;
                      return (
                        <button key={trim.id} className={`cd-trim${active ? ' is-active' : ''}`} type="button" aria-pressed={active} onClick={() => onSelectTrim(trim.id)}>
                          <span className="cd-radio">{active ? '✓' : ''}</span>
                          <span className="cd-trim__name">{trim.name}</span>
                          <span className="cd-trim__price">{formatCurrency(trim.price)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </AccordionCard>

              <AccordionCard title="추가 옵션 선택" hidden={options.length === 0}>
                <div className="cd-options">
                  {options.map((option) => {
                    const checked = selectedOptionIds.has(option.id);
                    return (
                      <button key={option.id ?? option.name} className={`cd-option${checked ? ' is-checked' : ''}`} type="button" aria-pressed={checked} onClick={() => onToggleOption(option.id)}>
                        <span className="cd-checkbox">{checked ? '✓' : ''}</span>
                        <span className="cd-option__name">{option.name}</span>
                        <span className="cd-option__price">{formatOptionPrice(option.price)}</span>
                      </button>
                    );
                  })}
                </div>
              </AccordionCard>

              <AccordionCard title="계약 조건 선택">
                <ContractConditions contract={contract} />
              </AccordionCard>
            </div>

            <aside className="cd-right">
              <div className="cd-estimate">
                <div className="cd-estimate__top">내 차 견적서</div>
                <form className="cd-estimate__body" onSubmit={consult.handleEstimateSubmit} noValidate>
                  <div className="cd-est-block">
                    <p className="cd-est-block__title">기본 차량가격</p>
                    <div className="cd-est-row">
                      <span>{estimate.trimName}</span>
                      <strong>{formatWon(estimate.trimPrice)}</strong>
                    </div>
                  </div>

                  <div className="cd-est-block">
                    <p className="cd-est-block__title">옵션가격</p>
                    <div className="cd-est-options">
                      <div className="cd-est-option">
                        <span>차량 외장색상</span>
                        <em>{colorName}</em>
                      </div>
                      {estimate.colorPrice > 0 && (
                        <div className="cd-est-option">
                          <span>{colorName}</span>
                          <em>+{formatWon(estimate.colorPrice)}</em>
                        </div>
                      )}
                      {estimate.options.map((option, index) => (
                        <div className="cd-est-option" key={`${option.name}-${index}`}>
                          <span>{option.name}</span>
                          <em>+{formatWon(option.price)}</em>
                        </div>
                      ))}
                      {estimate.options.length === 0 && (
                        <div className="cd-est-option">
                          <span>추가 옵션</span>
                          <em>선택 없음</em>
                        </div>
                      )}
                    </div>
                  </div>

                  {estimate.discountAmount > 0 && (
                    <div className="cd-est-block cd-est-block--discount">
                      <p className="cd-est-block__title">즉시할인가</p>
                      <div className="cd-est-row">
                        <span>즉시 할인 혜택</span>
                        <strong>-{formatWon(estimate.discountAmount)}</strong>
                      </div>
                    </div>
                  )}

                  <div className="cd-est-total">
                    <span>총 차량가격</span>
                    <strong>{totalLabel}</strong>
                  </div>

                  <PrivacyRow id="cd-privacy" label="[필수] 개인정보 이용 동의" />
                  <p className="form-error">{consult.estimateError}</p>
                  <button className="cd-estimate__cta" type="submit" disabled={consult.submitting}>
                    {consult.submitting ? '접수 중…' : '실시간 무료견적 받기'}
                  </button>
                </form>
              </div>
            </aside>
          </div>

          <p className="disclaimer">* 트림·옵션·가격은 제조사 정책에 따라 변경될 수 있습니다.</p>
        </div>
      </section>

      <ContactModal
        open={consult.contactOpen}
        onClose={consult.closeContact}
        onSubmit={consult.handleContactSubmit}
        error={consult.contactError}
        submitting={consult.submitting}
        summary={contactSummary}
      />
    </div>
  );
}
