import React, { useState } from 'react';
import { Box, ButtonBase, IconButton, Link, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const creditSx = {
  fontSize: 10,
  lineHeight: 1.3,
  color: 'rgba(255,255,255,0.7)',
  mt: 0.5,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

/** Photograph of the selected taxon over a figure. Dismissing it hides only this taxon's picture. */
const SpeciesCard = ({ photo, top, right }) => {
  const [dismissedUrl, setDismissedUrl] = useState(null);
  if (!photo || dismissedUrl === photo.url) return null;

  const { url, title, author, licenseName, licenseUrl, pageUrl, sourceName } = photo;
  // Public-domain works are credited without a ©.
  const credit = author && (licenseUrl ? `© ${author}` : author);

  return (
    <Box
      sx={{
        position: 'absolute',
        top,
        right,
        // Above the plot and zoom hint, below the loading overlay.
        zIndex: 12,
        width: 'clamp(96px, 22%, 180px)',
        maxHeight: '55%',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        p: 0.5,
        backgroundColor: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 1,
      }}
    >
      <Box
        component="a"
        href={pageUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={[title, sourceName].filter(Boolean).join(' · ')}
        sx={{ display: 'flex', justifyContent: 'center', minHeight: 0 }}
      >
        <Box
          component="img"
          src={url}
          alt={title || 'Photograph of the selected taxon'}
          sx={{ display: 'block', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      </Box>

      <Typography sx={creditSx} title={[credit, licenseName].filter(Boolean).join(' · ')}>
        {credit}
        {credit && licenseName && ' · '}
        {licenseName &&
          (licenseUrl ? (
            <Link href={licenseUrl} target="_blank" rel="noopener noreferrer" color="inherit">
              {licenseName}
            </Link>
          ) : (
            licenseName
          ))}
      </Typography>

      <IconButton
        size="small"
        aria-label="Hide photograph"
        onClick={() => setDismissedUrl(url)}
        sx={{
          position: 'absolute',
          top: 2,
          right: 2,
          p: 0.25,
          color: '#fff',
          backgroundColor: 'rgba(0,0,0,0.5)',
          '&:hover': { backgroundColor: 'rgba(0,0,0,0.75)' },
        }}
      >
        <CloseIcon sx={{ fontSize: 12 }} />
      </IconButton>
    </Box>
  );
};

/** Phone thumbnail by the variable picker; its credit is in the WoRMS dialog it opens. */
export const SpeciesThumbnail = ({ photo, onClick }) => (
  <ButtonBase
    onClick={onClick}
    aria-label="Show photograph and WoRMS record"
    sx={{
      width: 40,
      height: 40,
      flexShrink: 0,
      borderRadius: 1,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.25)',
    }}
  >
    <Box
      component="img"
      src={photo.url}
      alt={photo.title || 'Photograph of the selected taxon'}
      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  </ButtonBase>
);

export default SpeciesCard;
