import React from 'react';
import { Box, ButtonBase, Link, Typography } from '@mui/material';

const creditSx = {
  fontSize: 10,
  lineHeight: 1.3,
  color: 'rgba(255,255,255,0.7)',
  mt: 0.5,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

/** Clickable picture of the taxon; it opens the WoRMS dialog. */
const PhotoButton = ({ photo, onClick, sx }) => (
  <ButtonBase
    onClick={onClick}
    aria-label="Show photograph and WoRMS record"
    title={photo.title}
    sx={{
      flexShrink: 0,
      borderRadius: 1,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.25)',
      ...sx,
    }}
  >
    <Box
      component="img"
      src={photo.url}
      alt={photo.title || 'Photograph of the selected taxon'}
      sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
    />
  </ButtonBase>
);

/** Desktop photo with its credit; it fills the height of the controls beside it. */
const SpeciesCard = ({ photo, onClick }) => {
  const { author, licenseName, licenseUrl } = photo;
  // Public-domain works are credited without a ©.
  const credit = author && (licenseUrl ? `© ${author}` : author);
  const license = licenseUrl ? (
    <Link href={licenseUrl} target="_blank" rel="noopener noreferrer" color="inherit">
      {licenseName}
    </Link>
  ) : (
    licenseName
  );

  return (
    <Box sx={{ width: { sm: 150, md: 180 }, display: 'flex', flexDirection: 'column' }}>
      <PhotoButton photo={photo} onClick={onClick} sx={{ flex: 1, minHeight: 96 }} />
      <Typography sx={creditSx} title={[credit, licenseName].filter(Boolean).join(' · ')}>
        {credit}
        {credit && licenseName && ' · '}
        {licenseName && license}
      </Typography>
    </Box>
  );
};

/** Phone thumbnail by the variable picker; its credit is in the WoRMS dialog. */
export const SpeciesThumbnail = ({ photo, onClick }) => (
  <PhotoButton photo={photo} onClick={onClick} sx={{ width: 40, height: 40 }} />
);

export default SpeciesCard;
