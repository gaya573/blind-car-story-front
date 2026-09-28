export const extractTrimYearLabel = (trim) => {
  if (trim?.modelYearLabel) {
    return String(trim.modelYearLabel).replace(/\s+/g, '');
  }

  const directText = [
    trim?.modelYear,
    trim?.year,
    trim?.releaseYear,
    trim?.release_year,
    trim?.trimYear,
    trim?.trim_year,
  ]
    .filter((value) => value != null && value !== '')
    .join(' ');

  const descriptionText =
    typeof trim?.description === 'string' ? trim.description : JSON.stringify(trim?.description ?? '');
  const text = `${directText} ${descriptionText}`;
  const match = text.match(/20\d{2}\s*년형/);
  return match ? match[0].replace(/\s+/g, '') : '';
};

export const formatTrimDisplayName = (name, modelName = '', trim = null) => {
  if (name == null) return '';

  const modelText = String(modelName ?? '');
  let displayName = String(name);

  displayName = displayName
    .replaceAll('렌터카 장애인용/택시', '')
    .replaceAll('렌트카 장애인용/택시', '')
    .replaceAll('렌터카 장애인용', '')
    .replaceAll('렌트카 장애인용', '')
    .replaceAll('렌터카/장애인용', '')
    .replaceAll('렌트카/장애인용', '')
    .replaceAll('장애인용/택시', '')
    .replaceAll('장애/택시', '')
    .replaceAll('장애인용', '')
    .replaceAll('일반판매용', '일반')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ');

  if (modelText.includes('하이브리드')) {
    displayName = displayName.replaceAll('하이브리드', '');
  }

  displayName = displayName
    .replace(/\s+&&/g, '&&')
    .replace(/&&\s+/g, '&&')
    .replace(/\s*&&\s*/g, '  ')
    .replace(/\s{3,}/g, '  ')
    .trim();

  const yearLabel = extractTrimYearLabel(trim);
  if (!yearLabel || displayName.startsWith(yearLabel)) {
    return displayName;
  }
  if (displayName.endsWith(yearLabel)) {
    return displayName;
  }
  return `${displayName} ${yearLabel}`;
};

export const hasAssistTaxiTrimLabel = (name) => {
  const text = String(name ?? '');
  return (
    text.includes('장애/택시') ||
    text.includes('장애인용/택시') ||
    text.includes('장애') ||
    text.includes('택시')
  );
};
