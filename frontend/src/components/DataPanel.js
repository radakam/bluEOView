import React, { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import ControlPanel from './ControlPanel';
import GlobeDisplay from './GlobeDisplay';
import MapDisplay from './MapDisplay';
import QualityPanel from './QualityPanel';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useMapData } from '../hooks/useMapData';
import { ANNUAL_MONTH } from '../constants';
import { figureTitle } from '../utils';

/** How long the month slider must rest before the next grid is fetched. */
const MONTH_DEBOUNCE_MS = 500;

const NO_TITLES = { full: '', base: '' };

/**
 * Owns the current view (variable, month, map/globe, zoom) and pairs the
 * controls with the figures they drive.
 */
const DataPanel = ({
  netcdfUrl,
  sources,
  onSelectSource,
  featureOptions = [],
  featuresLoading,
  featuresError,
  timeLongName,
  varInfo = null,
  openInfoModal,
}) => {
  const [feature, setFeature] = useState(null);
  const [month, setMonth] = useState(ANNUAL_MONTH);
  const [view, setView] = useState('map');
  const [zoomedArea, setZoomedArea] = useState(null);
  const [showStd, setShowStd] = useState(false);
  const [showObs, setShowObs] = useState(false);

  const debouncedMonth = useDebouncedValue(month, MONTH_DEBOUNCE_MS);
  const { mapData, loading, error } = useMapData({
    file: netcdfUrl,
    feature,
    timeIndex: debouncedMonth,
  });

  // Follow the dataset: keep the selected variable if it still exists, else take the first.
  useEffect(() => {
    setFeature((current) => {
      if (!featureOptions.length) return null;
      return featureOptions.some((f) => f.value === current) ? current : featureOptions[0].value;
    });
  }, [featureOptions]);

  useEffect(() => setShowObs(false), [netcdfUrl]);

  // Update titles only once the matching grids arrive.
  const [titles, setTitles] = useState(NO_TITLES);
  const featureLabel = featureOptions.find((f) => f.value === feature)?.label ?? feature ?? '';

  useEffect(() => {
    if (!mapData) return;
    setTitles({ full: figureTitle(featureLabel, debouncedMonth), base: featureLabel });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapData]);

  const displayProps = {
    mapData,
    fullTitle: titles.full,
    baseTitle: titles.base,
    titleLoading: loading,
    showStd,
    showObs,
    onHideStd: () => setShowStd(false),
    onHideObs: () => setShowObs(false),
    varInfo,
    loading,
    error,
  };

  return (
    <Box
      sx={{
        flex: 1,
        width: '100%',
        boxSizing: 'border-box',
        p: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        borderRadius: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          gap: 1,
          mb: 1,
          width: '100%',
          alignItems: 'stretch',
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <ControlPanel
            feature={feature}
            featureOptions={featureOptions}
            onFeatureChange={(e) => setFeature(e.target.value)}
            openInfoModal={openInfoModal}
            month={month}
            onMonthChange={setMonth}
            view={view}
            onViewChange={setView}
            sources={sources}
            selectedSource={netcdfUrl}
            onSelectSource={onSelectSource}
            featuresLoading={featuresLoading}
            timeLongName={timeLongName}
            showStd={showStd}
            onToggleStd={() => setShowStd((v) => !v)}
            showObs={showObs}
            onToggleObs={() => setShowObs((v) => !v)}
            hasObs={mapData?.hasObs ?? false}
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <QualityPanel
            netcdfUrl={netcdfUrl}
            feature={feature}
            openInfoModal={openInfoModal}
          />
        </Box>
      </Box>

      <Box sx={{ flex: '1 1 auto', position: 'relative', width: '100%', minHeight: '400px' }}>
        {feature ? (
          view === 'map' ? (
            <MapDisplay
              {...displayProps}
              zoomedArea={zoomedArea}
              onZoomedAreaChange={setZoomedArea}
            />
          ) : (
            <GlobeDisplay {...displayProps} />
          )
        ) : (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              p: 3,
            }}
          >
            {featuresError ? (
              <Alert severity="error" sx={{ maxWidth: '600px' }}>
                {featuresError}
              </Alert>
            ) : (
              <>
                <CircularProgress color="primary" sx={{ mb: 2 }} />
                <Typography variant="h6" color="white">
                  Loading dataset features...
                </Typography>
              </>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default DataPanel;
