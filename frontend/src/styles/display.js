// Inline styles for the map and globe panels. These render plain DOM (Plotly and
// react-globe.gl own their containers), so they use `style` rather than MUI `sx`.

/** Matches `glassPanelSx`, so figures sit on the same card as the Control and Quality panels. */
const SURFACE_BG = 'rgba(0,0,0,0.25)';
const SURFACE_BORDER = '1px solid rgba(255,255,255,0.15)';
const SURFACE_RADIUS = 4;

/** Plot margins, also used to position the uncertainty hatching. */
export const PLOT_MARGIN = { l: 20, r: 70, t: 70, b: 20 };

/** 16:9 placeholder that the absolutely positioned surface fills. */
export const aspectBoxStyle = { position: 'relative', width: '100%', paddingTop: '56.25%' };

export const surfaceStyle = (loading) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: SURFACE_BG,
  backdropFilter: 'blur(8px)',
  border: SURFACE_BORDER,
  borderRadius: SURFACE_RADIUS,
  overflow: 'hidden',
  cursor: loading ? 'wait' : 'default',
});

export const panelStyle = { flex: 1, minWidth: 0 };

export const panelRowStyle = (isNarrow) => ({
  display: 'flex',
  flexDirection: isNarrow ? 'column' : 'row',
  gap: 8,
  alignItems: 'stretch',
});

export const titleStyle = {
  position: 'absolute',
  top: 10,
  left: 0,
  width: '100%',
  textAlign: 'center',
  fontSize: 19,
  color: 'white',
  pointerEvents: 'none',
  zIndex: 5,
};

export const subtitleStyle = {
  position: 'absolute',
  top: 40,
  left: 0,
  width: '100%',
  textAlign: 'center',
  fontSize: 16,
  color: 'rgba(255,255,255,0.7)',
  pointerEvents: 'none',
  zIndex: 5,
};

export const overlayStyle = (visible) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: visible ? 1 : 0,
  pointerEvents: visible ? 'all' : 'none',
  transition: 'opacity 0.2s ease',
  borderRadius: SURFACE_RADIUS,
  zIndex: 20,
});

export const zoomHintStyle = (visible) => ({
  position: 'absolute',
  bottom: 15,
  left: '50%',
  transform: `translateX(-50%) translateY(${visible ? 0 : 8}px)`,
  opacity: visible ? 1 : 0,
  transition: 'all 0.25s ease',
  pointerEvents: 'none',
  zIndex: 10,
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.8)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 20,
  padding: '6px 14px',
  color: 'white',
  fontSize: 12,
});

/** Colour bar drawn next to a globe (Plotly draws its own on the flat map). */
export const legendStyles = {
  container: (hasUnit) => ({
    position: 'absolute',
    top: 50,
    right: 10,
    width: hasUnit ? 84 : 70,
    height: 'calc(100% - 70px)',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: 10,
  }),
  swatches: { flex: 2, display: 'flex', flexDirection: 'column-reverse', height: '96%' },
  labels: {
    flex: 3,
    display: 'flex',
    flexDirection: 'column-reverse',
    justifyContent: 'space-between',
    marginLeft: 4,
    height: '97%',
  },
  label: { color: 'white', fontSize: 12 },
  unit: {
    writingMode: 'vertical-rl',
    transform: 'rotate(180deg)',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    marginLeft: 4,
    alignSelf: 'center',
  },
};

/** Plotly colour bar shared by every map panel. */
export const colorbarBase = {
  tickcolor: 'white',
  tickfont: { color: 'white', size: 11 },
  ticks: 'outside',
  thickness: 18,
  len: 0.84,
  yanchor: 'top',
  y: 0.9,
  xanchor: 'left',
  x: 1.01,
  outlinecolor: 'rgba(255,255,255,0.15)',
};

/**
 * Plotly only pushes a right-side colour bar title clear of the tick labels it
 * overlaps, so a short unit such as '1' can sit in the gap between two labels.
 * Invisible padding makes the title span the labels whatever the bar's height;
 * it is wrapped in a span because Plotly trims the title text.
 */
const UNIT_TITLE_PADDING = `<span>${' '.repeat(60)}</span>`;

/** Plotly colour bar title, only rendered when the variable declares a unit. */
export const colorbarUnitTitle = (unit) =>
  unit
    ? {
        title: {
          text: `${UNIT_TITLE_PADDING}${unit}${UNIT_TITLE_PADDING}`,
          side: 'right',
          font: { color: 'rgba(255,255,255,0.7)', size: 10 },
        },
      }
    : null;

export const errorTextStyle = { color: '#ff6b6b', textAlign: 'center', padding: '10px' };
