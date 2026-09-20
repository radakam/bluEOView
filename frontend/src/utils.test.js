import {
  bandedColorStops,
  figureTitle,
  generateColorbarTicks,
  getInterpolatedColorFromValue,
  hexToRgb,
  logColorbarTicks,
  observationTitle,
  spacedIndices,
  thinColorbarTicks,
  variableSubtitle,
} from './utils';
import { ANNUAL_MONTH } from './constants';

describe('labels', () => {
  test('figureTitle names the month, or the annual mean', () => {
    expect(figureTitle('Copepoda', 3)).toBe('Copepoda in March');
    expect(figureTitle('Copepoda', ANNUAL_MONTH)).toBe('Copepoda Annual');
  });

  test('observationTitle distinguishes presence/absence from counts', () => {
    expect(observationTitle('Copepoda', 'diversity')).toBe('Copepoda Observations');
    expect(observationTitle('Copepoda', 'taxa')).toBe('Copepoda Observation Density');
  });

  test('variableSubtitle joins the attributes that are present', () => {
    const varInfo = { mean: { standard_name: 'hsi', long_name: 'Habitat suitability' } };
    expect(variableSubtitle(varInfo, 'mean')).toBe('hsi · Habitat suitability');
    expect(variableSubtitle(varInfo, 'sd')).toBeNull();
    expect(variableSubtitle(null, 'mean')).toBeNull();
  });
});

describe('colour scales', () => {
  test('hexToRgb reads both short and long hex', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#440154')).toEqual({ r: 68, g: 1, b: 84 });
  });

  test('interpolation blends between the surrounding stops', () => {
    const stops = [[0, '#000000'], [1, '#ffffff']];
    expect(getInterpolatedColorFromValue(0.5, 0, 1, stops)).toBe('rgb(128,128,128)');
    expect(getInterpolatedColorFromValue(-5, 0, 1, stops)).toBe('rgb(0,0,0)');
    expect(getInterpolatedColorFromValue(null, 0, 1, stops)).toBe('rgba(0,0,0,0)');
  });

  test('banded stops repeat each colour so Plotly draws discrete bands', () => {
    expect(bandedColorStops(['#a', '#b'])).toEqual([
      [0, '#a'],
      [0.5, '#a'],
      [0.5, '#b'],
      [1, '#b'],
    ]);
  });
});

describe('colour bar ticks', () => {
  test('evenly spaced ticks span the range', () => {
    expect(generateColorbarTicks(0, 100, 3)).toEqual({
      tickvals: [0, 50, 100],
      ticktext: ['0', '50', '100'],
    });
  });

  test('missing bounds produce no ticks', () => {
    expect(generateColorbarTicks(null, 10, 3)).toEqual({ tickvals: [], ticktext: [] });
  });

  test('log ticks step by decade and close on the maximum', () => {
    const { ticktext, zmin } = logColorbarTicks(250);
    expect(ticktext).toEqual(['0', '1', '10', '100', '250']);
    expect(zmin).toBe(0);
  });

  test('thinning keeps both ends and spreads the rest', () => {
    const ticks = generateColorbarTicks(0, 100, 11);
    expect(thinColorbarTicks(ticks, 4).ticktext).toEqual(['0', '40', '80', '100']);
  });

  test('a bar with room to spare keeps every tick', () => {
    const ticks = generateColorbarTicks(0, 100, 3);
    expect(thinColorbarTicks(ticks, 6)).toEqual(ticks);
  });

  test('spacedIndices always keeps the first and the last', () => {
    expect([...spacedIndices(10, 4)]).toEqual([0, 3, 6, 9]);
    expect([...spacedIndices(3, 10)]).toEqual([0, 1, 2]);
  });
});
