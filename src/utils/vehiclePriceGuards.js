export const IMPORT_MIN_DISPLAY_PRICE = 20_000_000;

export const parseVehiclePrice = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const numeric = Number(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(numeric) ? numeric : 0;
  }
  return 0;
};

export const isImportedVehicleContext = (...values) =>
  values.some((value) => {
    const text = String(value ?? '').replace(/\s+/g, '').toUpperCase();
    return text === 'IMPORT' || text === 'IMPORTED' || text.includes('수입');
  });

export const isDisplayableImportVehiclePrice = (value) =>
  parseVehiclePrice(value) > IMPORT_MIN_DISPLAY_PRICE;

export const shouldKeepTrimForOrigin = (trim, isImported) => {
  if (!isImported) return true;
  return isDisplayableImportVehiclePrice(
    trim?.originalPrice ??
      trim?.original_price ??
      trim?.basePrice ??
      trim?.price ??
      trim?.representativeFinalPrice ??
      trim?.finalPrice,
  );
};
