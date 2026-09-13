import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import Globe from 'react-globe.gl';
import CloseButton from './common/CloseButton';
import ColorLegend from './common/ColorLegend';
import LoadingOverlay from './common/LoadingOverlay';
import PanelTitle from './common/PanelTitle';
import { useElementSize } from '../hooks/useElementSize';
import { useIsNarrow } from '../hooks/useIsNarrow';
import {
  EARTH_TEXTURE,
  PRESENCE_COLOR,
  SD_THRESHOLD,
  SD_TICK_PERCENTS,
  VIRIDIS_COLORS,
} from '../constants';
import {
  colorStops,
  getInterpolatedColorFromValue,
  getLegendFromColorscale,
  getLegendFromColorscaleLog,
  interpolateSdColor,
  observationTitle,
  variableSubtitle,
} from '../utils';
import {
  aspectBoxStyle,
  errorTextStyle,
  panelRowStyle,
  panelStyle,
  subtitleStyle,
  surfaceStyle,
  titleStyle,
} from '../styles/display';

/** Plot every nth grid cell: the full grid is far more points than a globe can show. */
const GRID_STEP = 3;

const UNCERTAIN_COLOR = 'rgba(0,0,0,0.6)';

/**
 * Flatten the lat/lon grids into the point clouds the three globes render.
 * Rows of the data arrays run north to south, the opposite of `lats`.
 */
const buildPoints = ({ lats, lons, mean, sd, obs, obsMax, obsType, hasObs, scale }) => {
  const points = { mean: [], std: [], obs: [] };
  if (!mean?.length || !lats.length || !lons.length) return points;

  const obsLogMax = Math.log10((obsMax ?? 1) + 1);

  for (let latIndex = 0; latIndex < lats.length; latIndex += GRID_STEP) {
    const lat = lats[latIndex];
    const row = lats.length - 1 - latIndex;

    for (let lonIndex = 0; lonIndex < lons.length; lonIndex += GRID_STEP) {
      const lng = lons[lonIndex] > 180 ? lons[lonIndex] - 360 : lons[lonIndex];
      const meanValue = mean?.[row]?.[lonIndex];
      const sdPercent = sd?.[row]?.[lonIndex] ?? 0;
      const obsValue = obs?.[row]?.[lonIndex];

      if (meanValue === null || meanValue === undefined) continue;

      points.mean.push({ lat, lng, val: meanValue, isUncertain: sdPercent > SD_THRESHOLD });

      if (sdPercent !== null && sdPercent !== undefined) {
        points.std.push({ lat, lng, color: interpolateSdColor(sdPercent) });
      }

      if (hasObs && obsValue !== null && obsValue !== undefined) {
        points.obs.push({
          lat,
          lng,
          color:
            obsType === 'diversity'
              ? PRESENCE_COLOR
              : getInterpolatedColorFromValue(Math.log10(obsValue + 1), 0, obsLogMax, scale),
        });
      }
    }
  }

  return points;
};

/**
 * Keeps globe cameras in step, following the globe last interacted with.
 * Returns `register(globe)`, which returns an unregister function.
 */
const useSyncedGlobes = () => {
  const globesRef = useRef(new Set());
  const leaderRef = useRef(null);

  return useCallback((globe) => {
    const globes = globesRef.current;
    const controls = globe.controls();

    // A globe that appears later starts from the view the others already share.
    const [current] = globes;
    if (current) globe.camera().position.copy(current.camera().position);
    globes.add(globe);

    const onStart = () => {
      leaderRef.current = globe;
    };
    const onChange = () => {
      if (leaderRef.current !== globe) return;
      const { position } = globe.camera();
      globes.forEach((other) => {
        if (other !== globe) other.camera().position.copy(position);
      });
    };

    controls.addEventListener('start', onStart);
    controls.addEventListener('change', onChange);

    return () => {
      controls.removeEventListener('start', onStart);
      controls.removeEventListener('change', onChange);
      globes.delete(globe);
      if (leaderRef.current === globe) leaderRef.current = null;
    };
  }, []);
};

/** One titled, 16:9 globe figure that sizes its canvas to its container. */
const GlobePanel = ({
  registerGlobe,
  title,
  subtitle,
  titleLoading,
  loading,
  points,
  pointColor,
  legend,
  unit,
  onHide,
}) => {
  const [containerRef, { width, height }] = useElementSize();
  const globeRef = useRef(null);

  useEffect(() => registerGlobe(globeRef.current), [registerGlobe]);

  return (
    <div style={{ ...panelStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={aspectBoxStyle}>
        <div ref={containerRef} style={surfaceStyle(loading)}>
          <PanelTitle title={title} loading={titleLoading} style={titleStyle} />
          <div style={subtitleStyle}>{subtitle}</div>
          <Globe
            ref={globeRef}
            width={width}
            height={height}
            globeImageUrl={EARTH_TEXTURE}
            backgroundColor="rgba(0,0,0,0)"
            pointsData={points}
            pointColor={pointColor}
            pointRadius={1.2}
            pointAltitude={0.005}
            pointsMerge
            pointTransitionDuration={0}
          />
          <ColorLegend legend={legend} unit={unit} />
          <LoadingOverlay visible={loading} />
          {onHide && <CloseButton onClick={onHide} />}
        </div>
      </div>
    </div>
  );
};

const GlobeDisplay = ({
  mapData,
  fullTitle,
  baseTitle,
  showStd,
  showObs,
  onHideStd,
  onHideObs,
  varInfo = null,
  loading = false,
  titleLoading = false,
  error = null,
}) => {
  const isNarrow = useIsNarrow();
  const registerGlobe = useSyncedGlobes();

  const {
    lats = [],
    lons = [],
    mean,
    sdPct: sd,
    obs,
    obsMax = null,
    obsType = null,
    hasObs = false,
    minValue = null,
    maxValue = null,
  } = mapData ?? {};

  const scale = useMemo(() => colorStops(VIRIDIS_COLORS), []);

  const points = useMemo(
    () => buildPoints({ lats, lons, mean, sd, obs, obsMax, obsType, hasObs, scale }),
    [lats, lons, mean, sd, obs, obsMax, obsType, hasObs, scale]
  );

  const meanLegend = useMemo(
    () =>
      minValue == null || maxValue == null
        ? null
        : getLegendFromColorscale(scale, minValue, maxValue),
    [minValue, maxValue, scale]
  );

  const sdLegend = useMemo(
    () => ({
      colors: SD_TICK_PERCENTS.map(interpolateSdColor),
      labels: SD_TICK_PERCENTS.map((p) => `${p}%`),
    }),
    []
  );

  const obsLegend = useMemo(
    () =>
      obsType === 'diversity' || obsMax == null
        ? null
        : getLegendFromColorscaleLog(scale, obsMax),
    [obsType, obsMax, scale]
  );

  const panelProps = { registerGlobe, titleLoading, loading };
  const pointOwnColor = (d) => d.color;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={panelRowStyle(isNarrow)}>
        <GlobePanel
          {...panelProps}
          title={fullTitle}
          subtitle={variableSubtitle(varInfo, 'mean')}
          points={points.mean}
          pointColor={(d) =>
            d.isUncertain
              ? UNCERTAIN_COLOR
              : getInterpolatedColorFromValue(d.val, minValue, maxValue, scale)
          }
          legend={meanLegend}
          unit={varInfo?.mean?.unit}
        />

        {showStd && (
          <GlobePanel
            {...panelProps}
            title={`${fullTitle} Standard Deviation`}
            subtitle={variableSubtitle(varInfo, 'sd')}
            points={points.std}
            pointColor={pointOwnColor}
            legend={sdLegend}
            onHide={onHideStd}
          />
        )}

        {showObs && hasObs && (
          <GlobePanel
            {...panelProps}
            title={observationTitle(baseTitle, obsType)}
            subtitle={variableSubtitle(varInfo, 'obs')}
            points={points.obs}
            pointColor={pointOwnColor}
            legend={obsLegend}
            unit={varInfo?.obs?.unit}
            onHide={onHideObs}
          />
        )}
      </div>

      {error && <div style={errorTextStyle}>{error}</div>}
    </div>
  );
};

export default GlobeDisplay;
