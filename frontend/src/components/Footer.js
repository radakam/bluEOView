import React from 'react';
import { Box } from '@mui/material';
import LogoTile from './common/LogoTile';
import { logos } from '../constants';

const Footer = () => (
  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', mb: 1 }}>
    {logos.map((logo) => (
      <LogoTile key={logo.alt} logo={logo} width={200} />
    ))}
  </Box>
);

export default Footer;
