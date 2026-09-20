// Pure helpers for colour scales, legends and label formatting.

import { ANNUAL_MONTH, MONTH_OPTIONS, SD_COLORSCALE } from './constants';

// --- labels ---------------------------------------------------------------

export const monthLabel = (month) =>
  MONTH_OPTIONS.find((o) => o.value === month)?.label ?? '';

/** "Copepods in March" / "Copepods Annual", as shown above a figure. */
export const figureTitle = (featureLabel, month) =>
  month === ANNUAL_MONTH
    ? `${featureLabel} Annual`
    : `${featureLabel} in ${monthLabel(month)}`;

/** Observations are counts for taxa datasets and presence/absence for diversity. */
export const observationTitle = (baseTitle, obsType) =>
  obsType === 'diversity'
    ? `${baseTitle} Observations`
    : `${baseTitle} Observation Density`;

/** Second title line of a figure, built from the NetCDF variable attributes. */
export const variableSubtitle = (varInfo, key) => {
  const parts = [varInfo?.[key]?.standard_name, varInfo?.[key]?.long_name].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
};

// --- colour scales --------------------------------------------------------

/** Evenly spaced stops, one per colour: a continuous gradient. */
export const colorStops = (colors) =>
  colors.map((color, i) => [parseFloat((i / (colors.length - 1)).toFixed(4)), color]);

/** Two stops per colour, which makes Plotly draw discrete bands instead of a ramp. */
export const bandedColorStops = (colors) =>
  colors.flatMap((color, i) => [
    [i / colors.length, color],
    [(i + 1) / colors.length, color],
  ]);

export const hexToRgb = (hex) => {
  const normalized = hex.replace('#', '');
  const fullHex =
    normalized.length === 3
      ? normalized.split('').map((c) => c + c).join('')
      : normalized;

  const value = parseInt(fullHex, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
};

/** Colour for `value` on `stops`, linearly interpolating between the two it falls between. */
export const getInterpolatedColorFromValue = (value, min, max, stops) => {
  if (value == null || !isFinite(value)) return 'rgba(0,0,0,0)';
  if (min === max) return stops[stops.length - 1][1];

  const norm = Math.max(0, Math.min(1, (value - min) / (max - min)));

  for (let i = 0; i < stops.length - 1; i++) {
    const [start, startColor] = stops[i];
    const [end, endColor] = stops[i + 1];
    if (norm < start || norm > end) continue;

    const span = end - start;
    if (span === 0) return endColor;

    const ratio = (norm - start) / span;
    const from = hexToRgb(startColor);
    const to = hexToRgb(endColor);
    const mix = (a, b) => Math.round(a + ratio * (b - a));

    return `rgb(${mix(from.r, to.r)},${mix(from.g, to.g)},${mix(from.b, to.b)})`;
  }

  return stops[stops.length - 1][1];
};

/** Colour for a standard deviation expressed as a percentage of its global maximum. */
export const interpolateSdColor = (percent) =>
  getInterpolatedColorFromValue(percent, 0, 100, SD_COLORSCALE);

// --- legends --------------------------------------------------------------

/** `numBins` evenly spaced tick values between min and max, plus their labels. */
export const generateColorbarTicks = (min, max, numBins) => {
  if (min == null || max == null) return { tickvals: [], ticktext: [] };

  const range = max - min;
  const step = range / (numBins - 1);
  const precision = range >= 10 ? 0 : 2;

  const tickvals = [];
  const ticktext = [];

  for (let i = 0; i < numBins; i++) {
    const val = min + step * i;
    tickvals.push(parseFloat(val.toFixed(precision)));
    ticktext.push(val.toFixed(precision));
  }

  return { tickvals, ticktext };
};

/** Of `count` labels, the `maxKept` to keep: both ends and an even spread. */
export const spacedIndices = (count, maxKept) => {
  const all = new Set(Array.from({ length: count }, (_, i) => i));
  if (count <= maxKept || maxKept < 2) return all;

  const step = Math.ceil((count - 1) / (maxKept - 1));
  const kept = new Set();
  for (let i = 0; i < count - 1; i += step) kept.add(i);
  kept.add(count - 1);
  return kept;
};

/** Drops intermediate colour bar ticks until at most `maxTicks` are left. */
export const thinColorbarTicks = ({ tickvals, ticktext }, maxTicks) => {
  const kept = spacedIndices(tickvals.length, maxTicks);
  return {
    tickvals: tickvals.filter((_, i) => kept.has(i)),
    ticktext: ticktext.filter((_, i) => kept.has(i)),
  };
};

export const getLegendFromColorscale = (stops, minValue, maxValue) => {
  const { ticktext } = generateColorbarTicks(minValue, maxValue, stops.length);
  return { colors: stops.map(([, color]) => color), labels: ticktext };
};

/** Legend for observation counts, which are drawn on a log10(count + 1) scale. */
export const getLegendFromColorscaleLog = (stops, max) => {
  if (max == null || max <= 0) return { colors: [], labels: [] };

  const logMax = Math.log10(max + 1);
  const colors = stops.map(([, color]) => color);
  const labels = colors.map((_, i) => {
    const binMidpoint = (i + 0.5) / stops.length;
    const value = Math.pow(10, binMidpoint * logMax) - 1;
    return value < 1 ? '<1' : String(Math.round(value));
  });

  return { colors, labels };
};

/** Decade ticks (1, 10, 100 …) for a log10(count + 1) colour bar. */
export const logColorbarTicks = (max) => {
  const maxValue = max ?? 1;
  const logMax = Math.log10(maxValue + 1);
  const tickvals = [0];
  const ticktext = ['0'];

  for (let exp = 0; Math.pow(10, exp) <= maxValue; exp++) {
    const value = Math.pow(10, exp);
    tickvals.push(Math.log10(value + 1));
    ticktext.push(String(value));
  }
  if (Math.pow(10, Math.floor(Math.log10(maxValue))) < maxValue) {
    tickvals.push(logMax);
    ticktext.push(String(Math.round(maxValue)));
  }

  return { tickvals, ticktext, zmin: 0, zmax: logMax };
};
