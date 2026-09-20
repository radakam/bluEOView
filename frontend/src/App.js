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
      {/* Logo | title | About, on one line at every width: the side slots share
          the free space equally, so the title sits centred between them. */}
      <Box
        component="header"
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          columnGap: { xs: 1, sm: 2 },
          rowGap: 1,
          px: { xs: 1.5, sm: 2 },
          pt: { xs: 1.5, sm: 2 },
          pb: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            minWidth: 0,
            flex: { xs: '0 0 auto', sm: '1 1 0' },
          }}
        >
          <LogoTile
            logo={BlueCloudLogo}
            width={{ xs: 88, sm: 160, md: 220, lg: 320 }}
            height={{ xs: 24, sm: 48, md: 60, lg: 70 }}
          />
        </Box>

        <Box
          sx={{
            flex: { xs: '1 1 auto', sm: '0 1 auto' },
            minWidth: 0,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h1"
            sx={{
              // Scales with the viewport, to hold its line between logo and About.
              fontSize: { xs: 'clamp(1.2rem, 6vw, 1.7rem)', sm: '2.6rem', md: '3.1rem', lg: '3.5rem' },
              fontWeight: 'bold',
              color: 'white',
              lineHeight: 1.1,
            }}
          >
            {APP_TITLE}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: 'clamp(0.68rem, 3.2vw, 0.9rem)', sm: '1.1rem', md: '1.25rem' },
              color: 'white',
              lineHeight: 1.3,
              mt: 0.25,
            }}
          >
            Visualisation of{' '}
            <img
              src="/assets/cephalopod_logo.png"
              alt="C"
              style={{ height: '1.2em', verticalAlign: 'middle' }}
            />
            EPHALOPOD
          </Typography>
        </Box>

        <Box
          sx={{
            flex: { xs: '0 0 auto', sm: '1 1 0' },
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <ReferencesButton metadata={metadata} />
        </Box>
      </Box>

      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.3)', mt: 1, mb: { xs: 1.5, sm: 2 } }} />

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

      <Box sx={{ flexGrow: 1, display: 'flex', px: { xs: 0.5, sm: 1 } }}>
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

      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.3)', my: { xs: 1.5, sm: 2 } }} />
      <Footer />
    </Box>
  );
};

export default App;
