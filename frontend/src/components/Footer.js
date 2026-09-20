import React from 'react';
import { Box } from '@mui/material';
import LogoTile from './common/LogoTile';
import { logos } from '../constants';

const Footer = () => (
  <Box
    sx={{
      display: 'flex',
      gap: { xs: 0.75, sm: 1 },
      flexWrap: 'wrap',
      justifyContent: 'center',
      px: 1,
      mb: 1,
    }}
  >
    {logos.map((logo) => (
      <LogoTile
        key={logo.alt}
        logo={logo}
        width={{ xs: 140, sm: 170, md: 200 }}
        height={{ xs: 48, sm: 60, md: 70 }}
      />
    ))}
  </Box>
);

export default Footer;
