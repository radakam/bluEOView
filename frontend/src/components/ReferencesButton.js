import React, { useState } from 'react';
import { Button } from '@mui/material';
import ReferencesModal from './ReferencesModal';

/** "About" link in the header, and the references dialog it opens. */
const ReferencesButton = ({ metadata, sx, ...buttonProps }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        sx={{
          color: 'white',
          textTransform: 'none',
          p: 0,
          minWidth: 0,
          fontSize: { xs: 15, sm: 17 },
          whiteSpace: 'nowrap',
          '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
          ...sx,
        }}
        {...buttonProps}
      >
        About
      </Button>

      <ReferencesModal open={open} onClose={() => setOpen(false)} metadata={metadata} />
    </>
  );
};

export default ReferencesButton;
