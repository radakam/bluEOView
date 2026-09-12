import React from 'react';
import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LaunchIcon from '@mui/icons-material/Launch';
import { fetchWormsClassification, wormsTaxonUrl } from '../api/worms';
import { useAsyncData } from '../hooks/useAsyncData';

const POPUP_SIZE = { width: 1000, height: 800 };
const ITALIC_RANKS = ['Genus', 'Species'];

const openTaxonPopup = (event, url, aphiaId) => {
  event.preventDefault();
  const { width, height } = POPUP_SIZE;
  const left = window.screen.width / 2 - width / 2;
  const top = window.screen.height / 2 - height / 2;

  window.open(
    url,
    `worms_popup_${aphiaId}`,
    `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=yes`
  );
};

const RankStep = ({ rank, scientificname }) => (
  <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
    <Typography
      sx={{
        fontSize: '0.65rem',
        color: 'text.secondary',
        textTransform: 'uppercase',
        lineHeight: 1,
      }}
    >
      {rank}
    </Typography>
    <Typography
      sx={{
        fontSize: '0.85rem',
        fontWeight: rank === 'Species' ? 'bold' : 'normal',
        fontStyle: ITALIC_RANKS.includes(rank) ? 'italic' : 'normal',
        color: rank === 'Species' ? '#1976d2' : 'text.primary',
        lineHeight: 1.2,
      }}
    >
      {scientificname}
    </Typography>
  </Box>
);

/** Taxonomic classification of one taxon, anchored at the click that opened it. */
const WormsModal = ({ open, onClose, wormsId, clickPosition }) => {
  const { data: classification, loading, error } = useAsyncData(
    (signal) => fetchWormsClassification(wormsId, signal),
    [wormsId],
    { enabled: Boolean(open && wormsId), initialData: [], reset: true }
  );

  if (!wormsId) return null;

  const taxonUrl = wormsTaxonUrl(wormsId);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          position: 'absolute',
          top: clickPosition ? `${clickPosition.y}px` : '50%',
          left: clickPosition ? `${clickPosition.x}px` : '50%',
          transform: clickPosition ? 'none' : 'translate(-50%, -50%)',
          margin: 0,
          maxHeight: '40vh',
          backgroundColor: '#ffffff',
          color: 'text.primary',
          borderRadius: 2,
          boxShadow: 3,
        },
      }}
    >
      <DialogTitle
        sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Box>
          <Typography
            variant="subtitle1"
            component="div"
            sx={{ fontWeight: 'bold', lineHeight: 1.2, color: 'text.primary' }}
          >
            WoRMS ID: {wormsId}
          </Typography>
          <Typography
            component="a"
            href={taxonUrl}
            onClick={(e) => openTaxonPopup(e, taxonUrl, wormsId)}
            sx={{
              fontSize: '0.75rem',
              color: '#1976d2',
              textDecoration: 'none',
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' },
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              mt: 0.5,
            }}
          >
            WoRMS web entry <LaunchIcon sx={{ fontSize: '0.75rem' }} />
          </Typography>
        </Box>

        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: 'text.secondary', '&:hover': { color: '#d32f2f' }, p: 0.5 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2, borderColor: 'rgba(0, 0, 0, 0.12)', overflowY: 'auto' }}>
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2, gap: 2 }}>
            <CircularProgress size={24} sx={{ color: '#1976d2' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Querying Marine Registry...
            </Typography>
          </Box>
        )}

        {!loading && error && (
          <Typography variant="body2" sx={{ color: '#d32f2f', textAlign: 'center', py: 1 }}>
            {error}
          </Typography>
        )}

        {!loading && !error && classification.length === 0 && (
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', opacity: 0.7, textAlign: 'center' }}
          >
            No classification history found.
          </Typography>
        )}

        {!loading && !error && classification.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              rowGap: 1,
              columnGap: 0.75,
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
              p: 1.5,
              borderRadius: 1,
            }}
          >
            {classification.map((step, index) => (
              <React.Fragment key={`${step.rank}-${step.scientificname}`}>
                <RankStep {...step} />
                {index < classification.length - 1 && (
                  <Typography
                    sx={{
                      color: 'rgba(0, 0, 0, 0.26)',
                      fontSize: '0.85rem',
                      px: 0.25,
                      userSelect: 'none',
                    }}
                  >
                    &gt;
                  </Typography>
                )}
              </React.Fragment>
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WormsModal;
