import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { closeButtonSx } from '../../styles/panels';

/** Small close icon in a panel's top-right corner that hides the panel. */
const CloseButton = ({ onClick, label = 'Hide' }) => (
  <Tooltip title={label} placement="left" arrow>
    <IconButton size="small" onClick={onClick} aria-label={label} sx={closeButtonSx}>
      <CloseIcon sx={{ fontSize: 16 }} />
    </IconButton>
  </Tooltip>
);

export default CloseButton;
