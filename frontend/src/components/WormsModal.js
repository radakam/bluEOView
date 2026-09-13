import React from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Link,
  Typography,
} from '@mui/material';
import LaunchIcon from '@mui/icons-material/Launch';
import { fetchWormsClassification, wormsTaxonUrl } from '../api/worms';
import { useAsyncData } from '../hooks/useAsyncData';
import SpeciesPhoto from './SpeciesPhoto';
import { frostedDialogSx, insetTraySx } from '../styles/panels';

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
        color: rank === 'Species' ? 'primary.main' : 'text.primary',
        lineHeight: 1.2,
      }}
    >
      {scientificname}
    </Typography>
  </Box>
);

/** Photograph and taxonomic classification of one taxon. */
const WormsModal = ({ open, onClose, wormsId }) => {
  const { data: classification, loading, error } = useAsyncData(
    (signal) => fetchWormsClassification(wormsId, signal),
    [wormsId],
    { enabled: Boolean(open && wormsId), initialData: [], reset: true }
  );

  if (!wormsId) return null;

  const taxonUrl = wormsTaxonUrl(wormsId);
  // The chain ends at the taxon itself, which titles the panel once it loads.
  const taxon = classification[classification.length - 1];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth sx={frostedDialogSx}>
      <DialogTitle>
        <Box
          component="span"
          sx={{ fontStyle: ITALIC_RANKS.includes(taxon?.rank) ? 'italic' : 'normal' }}
        >
          {taxon?.scientificname || 'WoRMS record'}
        </Box>

        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
          AphiaID {wormsId} &middot;{' '}
          <Link
            href={taxonUrl}
            onClick={(e) => openTaxonPopup(e, taxonUrl, wormsId)}
            underline="hover"
            sx={{ cursor: 'pointer' }}
          >
            WoRMS web entry <LaunchIcon sx={{ fontSize: '0.85em', verticalAlign: '-0.1em' }} />
          </Link>
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <SpeciesPhoto aphiaId={wormsId} enabled={open} />

        <Divider sx={{ my: 2 }} />

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2, gap: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Querying Marine Registry...
            </Typography>
          </Box>
        )}

        {!loading && error && (
          <Typography variant="body2" sx={{ color: 'error.main', textAlign: 'center', py: 1 }}>
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
              ...insetTraySx,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              rowGap: 1,
              columnGap: 0.75,
              p: 1.5,
            }}
          >
            {classification.map((step, index) => (
              <React.Fragment key={`${step.rank}-${step.scientificname}`}>
                <RankStep {...step} />
                {index < classification.length - 1 && (
                  <Typography
                    sx={{
                      color: 'text.disabled',
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

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default WormsModal;
