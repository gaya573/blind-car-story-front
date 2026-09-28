export const resolveVehicleColorImageUrl = (color) => {
  const raw =
    color?.imageUrl ||
    color?.image_url ||
    color?.cloudfrontUrl ||
    color?.cloudfront_url ||
    color?.s3Url ||
    color?.s3_url ||
    '';
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
};

const FINISH_WORDS = [
  '\uD22C\uD1A4',
  '\uC6D0\uD1A4',
  '\uBB34\uAD11',
  '\uC720\uAD11',
  '\uB9E4\uD2B8',
  '\uD384',
  '\uBA54\uD0C8\uB9AD',
];

const getRawColorCode = (color) =>
  color?.hexCode ||
  color?.colorCode ||
  color?.rgb ||
  color?.rgbCode ||
  '';

const normalizeColorHex = (value) => {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!match) return null;
  const hex = match[1];
  if (hex.length === 3) {
    return `#${hex.split('').map((char) => char + char).join('').toUpperCase()}`;
  }
  return `#${hex.toUpperCase()}`;
};

const canonicalColorName = (name = '') =>
  String(name)
    .normalize('NFKC')
    .replace(/[（\[{]/g, '(')
    .replace(/[）\]}]/g, ')')
    .replace(/&/g, '/')
    .replace(/\(+\s*([A-Za-z0-9]{2,5})\s*\)+/g, '($1)')
    .replace(/\s*([/+|])\s*/g, '$1')
    .replace(/\s+\(/g, '(')
    .replace(/\)\s+/g, ') ')
    .replace(/\s+/g, ' ')
    .trim();

const extractColorCodes = (name = '') => {
  const codes = [];
  for (const match of canonicalColorName(name).matchAll(/\(([A-Za-z0-9]{2,5})\)/g)) {
    const code = match[1].toUpperCase();
    if (!codes.includes(code)) codes.push(code);
  }
  return codes;
};

const stripFinishWord = (value) => {
  let next = value;
  let changed = true;
  while (changed) {
    changed = false;
    FINISH_WORDS.forEach((word) => {
      if (next.endsWith(word)) {
        next = next.slice(0, -word.length);
        changed = true;
      }
    });
  }
  return next;
};

const normalizeColorNamePartGroups = (name = '') =>
  canonicalColorName(name)
    .toLowerCase()
    .split(/[\/|+]/)
    .map((part) => {
      const normalized = part
        .replace(/\([^)]*\)/g, ' ')
        .replace(/\s+/g, '')
        .trim();
      if (!normalized) return [];
      const stripped = stripFinishWord(normalized);
      return [...new Set([normalized, stripped].filter(Boolean))];
    })
    .filter((group) => group.length > 0);

const hasSameOrderedCodeSignature = (candidateCodes, selectedCodes) => {
  if (!candidateCodes.length || !selectedCodes.length) return false;
  if (candidateCodes.length !== selectedCodes.length) return false;
  return candidateCodes.every((code, index) => code === selectedCodes[index]);
};

const hasSameOrderedNameParts = (candidateGroups, selectedGroups) => {
  if (!candidateGroups.length || !selectedGroups.length) return false;
  if (candidateGroups.length !== selectedGroups.length) return false;
  return candidateGroups.every((candidateGroup, index) =>
    candidateGroup.some((candidatePart) => selectedGroups[index].includes(candidatePart)),
  );
};

const hasSinglePartContainedName = (candidateGroups, selectedGroups) => {
  if (candidateGroups.length !== 1 || selectedGroups.length !== 1) return false;
  return candidateGroups[0].some((candidatePart) =>
    selectedGroups[0].some(
      (selectedPart) =>
        candidatePart.includes(selectedPart) ||
        selectedPart.includes(candidatePart),
    ),
  );
};

const getColorImageMatchScore = (candidate, selectedColor) => {
  if (!candidate || !selectedColor) return 0;

  const candidateCodes = extractColorCodes(candidate.name);
  const selectedCodes = extractColorCodes(selectedColor.name);
  const bothHaveCodes = candidateCodes.length > 0 && selectedCodes.length > 0;

  if (bothHaveCodes) {
    if (!hasSameOrderedCodeSignature(candidateCodes, selectedCodes)) return 0;
    const candidateNames = normalizeColorNamePartGroups(candidate.name);
    const selectedNames = normalizeColorNamePartGroups(selectedColor.name);
    return hasSameOrderedNameParts(candidateNames, selectedNames) ? 160 : 0;
  }

  const candidateNames = normalizeColorNamePartGroups(candidate.name);
  const selectedNames = normalizeColorNamePartGroups(selectedColor.name);
  if (hasSameOrderedNameParts(candidateNames, selectedNames)) {
    return candidateNames.length > 1 ? 120 : 100;
  }

  if (!candidateCodes.length && !selectedCodes.length && hasSinglePartContainedName(candidateNames, selectedNames)) {
    return 70;
  }

  const candidateHex = normalizeColorHex(getRawColorCode(candidate));
  const selectedHex = normalizeColorHex(getRawColorCode(selectedColor));
  const genericHexes = new Set([
    '#777777',
    '#808080',
    '#888888',
    '#999999',
    '#C0C0C0',
  ]);
  if (
    !candidateCodes.length &&
    !selectedCodes.length &&
    candidateHex &&
    selectedHex &&
    candidateHex === selectedHex &&
    !genericHexes.has(candidateHex)
  ) {
    return 40;
  }

  return 0;
};

const collectColorsWithImages = (sources) => {
  const colors = [];
  const visit = (item) => {
    if (!item) return;
    if (Array.isArray(item)) {
      item.forEach(visit);
      return;
    }
    if (resolveVehicleColorImageUrl(item)) {
      colors.push(item);
    }
    if (Array.isArray(item.colors)) visit(item.colors);
    if (Array.isArray(item.availableColors)) visit(item.availableColors);
    if (Array.isArray(item.trims)) visit(item.trims);
    if (Array.isArray(item.modelGroups)) visit(item.modelGroups);
    if (Array.isArray(item.groups)) visit(item.groups);
  };

  visit(sources);
  return colors;
};

export const findBestMatchingColorImageUrl = (selectedColor, sources) => {
  if (!selectedColor) return null;
  const best = collectColorsWithImages(sources).reduce(
    (currentBest, color) => {
      const score = getColorImageMatchScore(color, selectedColor);
      return score > currentBest.score ? { color, score } : currentBest;
    },
    { color: null, score: 0 },
  );
  return best.score > 0 ? resolveVehicleColorImageUrl(best.color) : null;
};
