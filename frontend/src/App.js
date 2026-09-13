import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, CircularProgress, Divider, Typography } from '@mui/material';
import DataPanel from './components/DataPanel';
import Footer from './components/Footer';
import InfoModal from './components/InfoModal';
import ReferencesButton from './components/ReferencesButton';
import LogoTile from './components/common/LogoTile';
import { useDatasets } from './hooks/useDatasets';
import { useFeatures } from './hooks/useFeatures';
import { BlueCloudLogo } from './constants';
import { APP_TITLE, welcomeLongText, welcomeShortText } from './content';
import { errorTextSx } from './styles/panels';
import './App.css';

/** Dataset shown on first load: diversity from occurrence, third alphabetically. */
const INITIAL_DATASET_INDEX = 2;

const App = () => {
  const { datasets, loading: datasetsLoading, error: datasetsError } = useDatasets();

  // Datasets offered by the backend, plus any URL the user pasted this session.
  const [customSources, setCustomSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState('');

  const [welcomeOpen, setWelcomeOpen] = useState(
    () => !localStorage.getItem('hideProjectExplanation')
  );
  const [infoModal, setInfoModal] = useState(null);

  const { features, metadata, timeLongName, varInfo, loading: featuresLoading, error: featuresError } =
    useFeatures(selectedSource);

  useEffect(() => {
    if (!datasets.length || selectedSource) return;
    setSelectedSource((datasets[INITIAL_DATASET_INDEX] ?? datasets[0]).value);
  }, [datasets, selectedSource]);

  const sources = useMemo(
    () => [
      ...datasets,
      ...customSources
        .filter((url) => !datasets.some((d) => d.value === url))
        .map((url) => ({ label: url, value: url })),
    ],
    [customSources, datasets]
  );

  const selectSource = useCallback((url) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setSelectedSource(trimmed);
    setCustomSources((prev) => (prev.includes(trimmed) ? prev : [trimmed, ...prev]));
  }, []);

  const openInfoModal = useCallback(
    (title, text) => setInfoModal({ title, text: text || 'No information available' }),
    []
  );

  return (
    <Box className="App" sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box
        component="header"
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          textAlign: 'center',
        }}
      >
        <Box sx={{ position: 'absolute', top: 25, left: 8, display: { xs: 'none', sm: 'block' } }}>
          <LogoTile logo={BlueCloudLogo} width={350} />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography
            variant="h1"
            sx={{ fontSize: '3.5rem', fontWeight: 'bold', color: 'white', lineHeight: 1, mt: 2 }}
          >
            {APP_TITLE}
          </Typography>
          <Typography variant="h6" sx={{ fontSize: '1.25rem', color: 'white', mt: 0.5 }}>
            Visualisation of{' '}
            <img
              src="/assets/cephalopod_logo.png"
              alt="C"
              style={{ height: '1.2em', verticalAlign: 'middle' }}
            />
            EPHALOPOD
          </Typography>
        </Box>

        <ReferencesButton metadata={metadata} />
      </Box>

      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.3)', mt: 1, mb: 2 }} />

      <InfoModal
        open={welcomeOpen}
        onClose={() => setWelcomeOpen(false)}
        title={`Welcome to ${APP_TITLE}`}
        shortText={welcomeShortText}
        longText={welcomeLongText}
        buttonText="Get Started"
        showDontShowAgain
      />

      <InfoModal
        open={Boolean(infoModal)}
        onClose={() => setInfoModal(null)}
        title={infoModal?.title}
        shortText={infoModal?.text}
      />

      <Box sx={{ flexGrow: 1, display: 'flex', px: 1 }}>
        <Box
          sx={{
            flexGrow: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: datasetsLoading || datasetsError ? 'center' : 'stretch',
          }}
        >
          {datasetsLoading ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                color: 'white',
              }}
            >
              <CircularProgress color="inherit" />
              <Typography>Synchronizing dataset structure...</Typography>
            </Box>
          ) : datasetsError ? (
            <Typography sx={errorTextSx}>
              Error establishing handshake with file manager: {datasetsError}
            </Typography>
          ) : (
            <DataPanel
              netcdfUrl={selectedSource}
              sources={sources}
              onSelectSource={selectSource}
              featureOptions={features}
              featuresLoading={featuresLoading}
              featuresError={featuresError}
              timeLongName={timeLongName}
              varInfo={varInfo}
              openInfoModal={openInfoModal}
            />
          )}
        </Box>
      </Box>

      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.3)', my: 2 }} />
      <Footer />
    </Box>
  );
};

export default App;
