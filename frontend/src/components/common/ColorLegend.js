import React from 'react';
import { spacedIndices } from '../../utils';
import { legendStyles } from '../../styles/display';

/** Labels a compact legend can carry before they start touching. */
const COMPACT_MAX_LABELS = 5;

/**
 * Vertical colour bar for the globe views, which have no built-in one.
 * `legend` is `{ colors, labels }`, ordered from the low end upwards.
 */
const ColorLegend = ({ legend, unit = null, compact = false }) => {
  if (!legend) return null;

  // Every label keeps its slot, to stay aligned with its band; crowded ones blank out.
  const shown = spacedIndices(legend.labels.length, compact ? COMPACT_MAX_LABELS : Infinity);

  return (
    <div style={legendStyles.container(Boolean(unit), compact)}>
      <div style={legendStyles.swatches}>
        {legend.colors.map((color, i) => (
          <div key={i} style={{ flex: 1, backgroundColor: color }} />
        ))}
      </div>

      <div style={legendStyles.labels}>
        {legend.labels.map((label, i) => (
          <div key={i} style={legendStyles.label(compact)}>
            {shown.has(i) ? label : ''}
          </div>
        ))}
      </div>

      {unit && <div style={legendStyles.unit}>{unit}</div>}
    </div>
  );
};

export default ColorLegend;
