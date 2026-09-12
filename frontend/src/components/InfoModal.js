import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Link,
  Typography,
} from '@mui/material';
import { frostedDialogSx } from '../styles/panels';

const HIDE_WELCOME_KEY = 'hideProjectExplanation';

/**
 * Explanatory dialog: a short text, an optional "Learn More" section, and an
 * optional opt-out that is remembered in localStorage.
 */
const InfoModal = ({
  open,
  onClose,
  title,
  shortText,
  longText,
  buttonText = 'Close',
  showDontShowAgain = false,
}) => {
  const [showFullText, setShowFullText] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (!open) return;
    setShowFullText(false);
    setDontShowAgain(false);
  }, [open]);

  const handleClose = () => {
    if (showDontShowAgain) {
      if (dontShowAgain) localStorage.setItem(HIDE_WELCOME_KEY, 'true');
      else localStorage.removeItem(HIDE_WELCOME_KEY);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth sx={frostedDialogSx}>
      <DialogTitle>{title}</DialogTitle>

      <DialogContent dividers>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
          {shortText}
        </Typography>

        {longText && (
          <Box mt={2}>
            <Link
              component="button"
              variant="body2"
              underline="hover"
              onClick={() => setShowFullText((prev) => !prev)}
              sx={{ color: 'primary.main', fontWeight: 500 }}
            >
              {showFullText ? 'Show Less' : 'Learn More'}
            </Link>

            <Collapse in={showFullText}>
              <Box mt={2}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                  {longText}
                </Typography>
              </Box>
            </Collapse>
          </Box>
        )}

        {showDontShowAgain && (
          <Box mt={3}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  color="primary"
                />
              }
              label="Don’t show this again"
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>{buttonText}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default InfoModal;
