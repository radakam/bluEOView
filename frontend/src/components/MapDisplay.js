import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import Plot from 'react-plotly.js';
import CloseButton from './common/CloseButton';
import LoadingOverlay from './common/LoadingOverlay';
import PanelTitle from './common/PanelTitle';
import ZoomHint from './common/ZoomHint';
import { useIsNarrow } from '../hooks/useIsNarrow';
import {
  EARTH_TEXTURE,
  PRESENCE_COLORSCALE,
  SD_COLORSCALE,
  SD_THRESHOLD,
  SD_TICK_PERCENTS,
  VIRIDIS_COLORS,
} from '../constants';
import {
  bandedColorStops,
  generateColorbarTicks,
  logColorbarTicks,
  observationTitle,
  variableSubtitle,
} from '../utils';
import {
  aspectBoxStyle,
  colorbarBase,
  colorbarUnitTitle,
  errorTextStyle,
  panelRowStyle,
  panelStyle,
  PLOT_MARGIN,
  subtitleStyle,
  surfaceStyle,
  titleStyle,
} from '../styles/display';

const HIDDEN_AXIS = {
  showgrid: false,
  zeroline: false,
  showline: false,
  ticks: '',
  showticklabels: false,
};

const PLOT_CONFIG = {
  responsive: true,
  displayModeBar: false,
  doubleClick: false,
  showTips: false,
};

const UNCERTAIN_HOVER = { bg: 'rgba(160,0,0,0.9)', border: '#ff2222' };
const NORMAL_HOVER = { bg: 'rgba(30,30,30,0.85)', border: 'rgba(255,255,255,0.2)' };

/**
 * Diagonal hatching over the cells whose standard deviation is above threshold.
 * Plotly cannot pattern-fill a heatmap, so the mask is drawn on a canvas that is
 * inset to the plot area (never overlapping the colour bar).
 */
const HatchOverlay = ({ uncertaintyMask, lats, lons, zoomedArea }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !uncertaintyMask.length) return;

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    const nRows = uncertaintyMask.length;
    const nCols = uncertaintyMask[0]?.length ?? 0;
    if (!nRows || !nCols) return;

    const lonMin = zoomedArea?.x?.[0] ?? lons[0];
    const lonMax = zoomedArea?.x?.[1] ?? lons[lons.length - 1];
    const latAtTop = zoomedArea?.y?.[1] ?? lats[0];
    const latAtBottom = zoomedArea?.y?.[0] ?? lats[lats.length - 1];

    const lonToX = (lon) => ((lon - lonMin) / (lonMax - lonMin)) * width;
    const latToY = (lat) => ((lat - latAtTop) / (latAtBottom - latAtTop)) * height;

    const cellLonHalf = lons.length > 1 ? Math.abs(lons[1] - lons[0]) / 2 : 0;
    const cellLatHalf = lats.length > 1 ? Math.abs(lats[1] - lats[0]) / 2 : 0;
    const latViewMin = Math.min(latAtTop, latAtBottom);
    const latViewMax = Math.max(latAtTop, latAtBottom);

    // Clip to the uncertain cells, then stroke parallel lines across the whole canvas.
    ctx.save();
    ctx.beginPath();
    for (let r = 0; r < nRows; r++) {
      for (let c = 0; c < nCols; c++) {
        if (uncertaintyMask[r][c] !== 1) continue;

        const lon = lons[c];
        const lat = lats[r];
        if (lon + cellLonHalf < lonMin || lon - cellLonHalf > lonMax) continue;
        if (lat + cellLatHalf < latViewMin || lat - cellLatHalf > latViewMax) continue;

        const x0 = lonToX(lon - cellLonHalf);
        const x1 = lonToX(lon + cellLonHalf);
        const y0 = latToY(lat - cellLatHalf);
        const y1 = latToY(lat + cellLatHalf);
        ctx.rect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
      }
    }
    ctx.clip();

    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    for (let i = -height; i < width + height; i += 6) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + height, height);
      ctx.stroke();
    }
    ctx.restore();
  }, [uncertaintyMask, lats, lons, zoomedArea]);

  return (
    <div
      style={{
        position: 'absolute',
        top: PLOT_MARGIN.t,
        left: PLOT_MARGIN.l,
        right: PLOT_MARGIN.r,
        bottom: PLOT_MARGIN.b,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 3,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      />
    </div>
  );
};

/** One titled, 16:9 map figure. */
const MapPanel = ({
  title,
  subtitle,
  titleLoading,
  loading,
  traces,
  layout,
  onRelayout,
  onResetZoom,
  isZoomed,
  onHide,
  children,
}) => (
  <div style={panelStyle}>
    <div style={aspectBoxStyle}>
      <div style={surfaceStyle(loading)}>
        <PanelTitle title={title} loading={titleLoading} style={titleStyle} />
        <div style={subtitleStyle}>{subtitle}</div>
        <Plot
          data={traces}
          layout={layout}
          useResizeHandler
          style={{ width: '100%', height: '100%' }}
          onRelayout={onRelayout}
          onDoubleClick={onResetZoom}
          config={PLOT_CONFIG}
        />
        {children}
        <LoadingOverlay visible={loading} />
        <ZoomHint visible={isZoomed && !loading} />
        {onHide && <CloseButton onClick={onHide} />}
      </div>
    </div>
  </div>
);

const MapDisplay = ({
  mapData,
  onZoomedAreaChange,
  zoomedArea,
  fullTitle,
  baseTitle,
  titleLoading = false,
  showStd,
  showObs,
  onHideStd,
  onHideObs,
  varInfo = null,
  loading = false,
  error = null,
}) => {
  const isNarrow = useIsNarrow();

  const {
    lats = [],
    lons = [],
    mean: meanData = [],
    sdPct: stdData = [],
    obs: obsData = [],
    obsMax = null,
    obsType = null,
    hasObs = false,
    minValue = null,
    maxValue = null,
  } = mapData ?? {};

  const colorscale = useMemo(() => bandedColorStops(VIRIDIS_COLORS), []);

  const meanTicks = useMemo(
    () => generateColorbarTicks(minValue, maxValue, colorscale.length),
    [minValue, maxValue, colorscale.length]
  );

  const uncertaintyMask = useMemo(
    () => stdData.map((row) => row.map((v) => (v !== null && v > SD_THRESHOLD ? 1 : 0))),
    [stdData]
  );
  const hasHighSD = useMemo(
    () => uncertaintyMask.some((row) => row.includes(1)),
    [uncertaintyMask]
  );

  const meanHover = useMemo(() => {
    const text = [];
    const bgcolor = [];
    const bordercolor = [];

    meanData.forEach((row, ri) => {
      text.push(
        row.map((v, ci) => {
          const isUnknown = v === null || (typeof v === 'number' && isNaN(v));
          const value = isUnknown ? 'Unknown' : typeof v === 'number' ? v.toFixed(3) : v;
          const uncertain = uncertaintyMask[ri]?.[ci] === 1;
          return `Lon: ${lons[ci]}<br>Lat: ${lats[ri]}<br>Value: ${value}${
            uncertain ? '<br>⚠ High uncertainty' : ''
          }`;
        })
      );
      bgcolor.push(
        row.map((_, ci) =>
          uncertaintyMask[ri]?.[ci] === 1 ? UNCERTAIN_HOVER.bg : NORMAL_HOVER.bg
        )
      );
      bordercolor.push(
        row.map((_, ci) =>
          uncertaintyMask[ri]?.[ci] === 1 ? UNCERTAIN_HOVER.border : NORMAL_HOVER.border
        )
      );
    });

    return { text, bgcolor, bordercolor };
  }, [meanData, uncertaintyMask, lats, lons]);

  // Observation counts span orders of magnitude, so they are drawn on a log scale.
  const obsLogData = useMemo(() => {
    if (obsType === 'diversity' || !obsData.length) return obsData;
    return obsData.map((row) => row.map((v) => (v == null ? null : Math.log10(v + 1))));
  }, [obsData, obsType]);

  const obsTicks = useMemo(
    () =>
      obsType === 'diversity'
        ? { tickvals: [0, 1], ticktext: ['Absent', 'Present'], zmin: 0, zmax: 1 }
        : logColorbarTicks(obsMax),
    [obsType, obsMax]
  );

  const layout = useMemo(
    () => ({
      margin: PLOT_MARGIN,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      autosize: true,
      dragmode: 'zoom',
      images: [
        {
          source: EARTH_TEXTURE,
          xref: 'x',
          yref: 'y',
          x: -180,
          y: -90,
          sizex: 360,
          sizey: 180,
          sizing: 'stretch',
          layer: 'below',
        },
      ],
      xaxis: { ...HIDDEN_AXIS, range: zoomedArea?.x ?? undefined },
      yaxis: {
        ...HIDDEN_AXIS,
        autorange: zoomedArea?.y ? false : 'reversed',
        range: zoomedArea?.y ?? undefined,
      },
    }),
    [zoomedArea]
  );

  const resetZoom = useCallback(() => onZoomedAreaChange?.(null), [onZoomedAreaChange]);

  const handleRelayout = useCallback(
    (evt) => {
      if (evt['xaxis.autorange'] || evt['yaxis.autorange']) {
        onZoomedAreaChange?.(null);
        return;
      }
      const x = evt['xaxis.range'] ?? [evt['xaxis.range[0]'], evt['xaxis.range[1]']];
      const y = evt['yaxis.range'] ?? [evt['yaxis.range[0]'], evt['yaxis.range[1]']];
      if (x?.[0] != null && y?.[0] != null) onZoomedAreaChange?.({ x, y });
    },
    [onZoomedAreaChange]
  );

  const panelProps = {
    titleLoading,
    loading,
    layout,
    onRelayout: handleRelayout,
    onResetZoom: resetZoom,
    isZoomed: zoomedArea != null,
  };

  const meanTraces = meanData.length
    ? [
        {
          type: 'heatmap',
          z: meanData,
          x: lons,
          y: lats,
          opacity: 0.7,
          colorscale,
          zauto: false,
          zmin: minValue,
          zmax: maxValue,
          colorbar: {
            ...colorbarBase,
            tickvals: meanTicks.tickvals,
            ticktext: meanTicks.ticktext,
            ...colorbarUnitTitle(varInfo?.mean?.unit),
          },
          text: meanHover.text,
          hovertemplate: '%{text}<extra></extra>',
          hoverlabel: {
            bgcolor: meanHover.bgcolor,
            bordercolor: meanHover.bordercolor,
            font: { color: 'white', size: 12 },
          },
        },
      ]
    : [];

  const stdTraces = stdData.length
    ? [
        {
          type: 'heatmap',
          z: stdData,
          x: lons,
          y: lats,
          colorscale: SD_COLORSCALE,
          zmin: 0,
          zmax: 100,
          colorbar: {
            ...colorbarBase,
            tickvals: SD_TICK_PERCENTS,
            ticktext: SD_TICK_PERCENTS.map((p) => `${p}%`),
          },
          hovertemplate: 'Lon: %{x}<br>Lat: %{y}<br>SD: %{z}%<extra></extra>',
        },
      ]
    : [];

  const isPresenceAbsence = obsType === 'diversity';
  const obsTraces = obsData.length
    ? [
        {
          type: 'heatmap',
          z: obsLogData,
          x: lons,
          y: lats,
          colorscale: isPresenceAbsence ? PRESENCE_COLORSCALE : colorscale,
          showscale: !isPresenceAbsence,
          zauto: false,
          zmin: obsTicks.zmin,
          zmax: obsTicks.zmax,
          ...(isPresenceAbsence
            ? {}
            : {
                colorbar: {
                  ...colorbarBase,
                  tickvals: obsTicks.tickvals,
                  ticktext: obsTicks.ticktext,
                  ...colorbarUnitTitle(varInfo?.obs?.unit),
                },
              }),
          hovertemplate: isPresenceAbsence
            ? 'Lon: %{x}<br>Lat: %{y}<br>Observed: %{z}<extra></extra>'
            : 'Lon: %{x}<br>Lat: %{y}<br>Obs count: %{z}<extra></extra>',
        },
      ]
    : [];

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={panelRowStyle(isNarrow)}>
        <MapPanel
          {...panelProps}
          title={fullTitle}
          subtitle={variableSubtitle(varInfo, 'mean')}
          traces={meanTraces}
        >
          {hasHighSD && (
            <HatchOverlay
              uncertaintyMask={uncertaintyMask}
              lats={lats}
              lons={lons}
              zoomedArea={zoomedArea}
            />
          )}
        </MapPanel>

        {showStd && (
          <MapPanel
            {...panelProps}
            title={`${fullTitle} Standard Deviation`}
            subtitle={variableSubtitle(varInfo, 'sd')}
            traces={stdTraces}
            onHide={onHideStd}
          />
        )}

        {showObs && hasObs && (
          <MapPanel
            {...panelProps}
            title={observationTitle(baseTitle, obsType)}
            subtitle={variableSubtitle(varInfo, 'obs')}
            traces={obsTraces}
            onHide={onHideObs}
          />
        )}
      </div>

      {error && <div style={errorTextStyle}>{error}</div>}
    </div>
  );
};

export default MapDisplay;
