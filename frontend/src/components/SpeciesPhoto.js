import React from 'react';
import { Box, CircularProgress, Link, Typography } from '@mui/material';
import { fetchSpeciesImage } from '../api/client';
import { useAsyncData } from '../hooks/useAsyncData';
import { insetTraySx } from '../styles/panels';

const FRAME_HEIGHT = 190;

const frameSx = {
  ...insetTraySx,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: FRAME_HEIGHT,
  overflow: 'hidden',
};

// Split so that links keep the theme's link colour instead of the muted one.
const captionMetricsSx = { fontSize: '0.7rem', lineHeight: 1.4 };
const captionSx = { ...captionMetricsSx, color: 'text.secondary' };

/** Muted one-liner standing in for a picture that is missing or on its way. */
const Placeholder = ({ children }) => (
  <Box sx={{ ...frameSx, height: 'auto', py: 1.5, gap: 1.5 }}>{children}</Box>
);

/**
 * The WoRMS photograph of one taxon, fetched only once `enabled` turns true so
 * that browsing the variable list does not hit the registry.
 *
 * Plenty of taxa have no picture, so its absence is reported as a quiet line
 * rather than an error.
 */
const SpeciesPhoto = ({ aphiaId, enabled }) => {
  const { data, loading, error } = useAsyncData(
    (signal) => fetchSpeciesImage(aphiaId, signal),
    [aphiaId],
    { enabled: Boolean(enabled && aphiaId), initialData: null, reset: true }
  );

  if (loading) {
    return (
      <Placeholder>
        <CircularProgress size={18} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Looking for a photograph...
        </Typography>
      </Placeholder>
    );
  }

  if (error || !data?.available) {
    return (
      <Placeholder>
        <Typography variant="body2" sx={{ color: 'text.secondary', opacity: 0.7 }}>
          {error ? 'Could not reach the WoRMS photogallery.' : 'No photograph in the WoRMS gallery.'}
        </Typography>
      </Placeholder>
    );
  }

  const { url, title, description, author, licenseName, licenseUrl, pageUrl } = data;

  return (
    <Box>
      <Box sx={frameSx}>
        <Box
          component="img"
          src={url}
          alt={title || 'Photograph of the selected taxon'}
          title={description || title || undefined}
          loading="lazy"
          sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
        />
      </Box>

      {/* The gallery also holds drawings and plates, so name the picture rather
          than let it pass for a photograph of the animal. */}
      {title && (
        <Typography sx={{ ...captionSx, color: 'text.primary', mt: 0.75 }}>{title}</Typography>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 0.75 }}>
        {author && <Typography sx={captionSx}>&copy; {author}</Typography>}
        {licenseName && (
          <Link href={licenseUrl} target="_blank" rel="noopener noreferrer" sx={captionMetricsSx}>
            {licenseName}
          </Link>
        )}
        <Link
          href={pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ ...captionMetricsSx, ml: 'auto' }}
        >
          WoRMS photogallery
        </Link>
      </Box>
    </Box>
  );
};

export default SpeciesPhoto;
