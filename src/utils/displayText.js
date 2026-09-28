export const normalizeDoubleAmpersand = (value) => {
  if (typeof value !== 'string') return value;

  return value
    .replace(/\s*&&\s*/g, '  ')
    .replace(/\s{3,}/g, '  ')
    .trim();
};
