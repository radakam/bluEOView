import React, { useState } from 'react';
import { Box, Button } from '@mui/material';
import ReferencesModal from './ReferencesModal';

/** "About" link in the header, and the references dialog it opens. */
const ReferencesButton = ({ metadata, sx, ...buttonProps }) => {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ position: 'absolute', top: '30%', right: 16 }}>
      <Button
        onClick={() => setOpen(true)}
        sx={{
          color: 'white',
          textTransform: 'none',
          p: 0,
          fontSize: 17,
          '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
          ...sx,
        }}
        {...buttonProps}
      >
        About
      </Button>

      <ReferencesModal open={open} onClose={() => setOpen(false)} metadata={metadata} />
    </Box>
  );
};

export default ReferencesButton;
