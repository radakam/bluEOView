import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Link,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Citation from './Citation';
import { softwareCredit } from '../content';

/** NetCDF global attributes shown verbatim, in display order. */
const PLAIN_FIELDS = [
  ['title', 'Title'],
  ['summary', 'Summary'],
  ['description', 'Description'],
  ['author', 'Author / Creator'],
  ['institution', 'Institution'],
  ['project', 'Project'],
  ['source', 'Source'],
];

const AFTER_PUBLICATION_FIELDS = [
  ['version', 'Version'],
  ['date_created', 'Date Created'],
  ['license', 'License'],
];

const GEOSPATIAL_KEYS = [
  'geospatial_lat_min',
  'geospatial_lat_max',
  'geospatial_lon_min',
  'geospatial_lon_max',
];

const MetaRow = ({ label, children }) => (
  <Box sx={{ mb: 1 }}>
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
    >
      {label}
    </Typography>
    <Typography variant="body2" component="div">
      {children}
    </Typography>
  </Box>
);

const plainRows = (metadata, fields) =>
  fields
    .filter(([key]) => metadata[key])
    .map(([key, label]) => (
      <MetaRow key={key} label={label}>
        {metadata[key]}
      </MetaRow>
    ));

const doiHref = (doi) => (doi.startsWith('http') ? doi : `https://doi.org/${doi}`);

const ReferencesModal = ({ open, onClose, metadata = {} }) => {
  const [extraOpen, setExtraOpen] = useState(false);

  const extra = metadata.extra_attributes || {};
  const hasMeta = Object.keys(metadata).length > 0;
  const hasGeospatial = GEOSPATIAL_KEYS.some((k) => metadata[k] != null);
  const hasTimeCoverage = metadata.time_coverage_start || metadata.time_coverage_end;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>References &amp; Data Courtesy</DialogTitle>

      <DialogContent dividers>
        <Citation />

        {hasMeta && (
          <Box sx={{ mb: 2 }}>
            <Divider sx={{ my: 2 }} />

            {plainRows(metadata, PLAIN_FIELDS)}

            {(metadata.paper || metadata.doi) && (
              <MetaRow label="Publication">
                {metadata.paper && <span>{metadata.paper} </span>}
                {metadata.doi && (
                  <Link
                    href={doiHref(metadata.doi)}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: 'block', wordBreak: 'break-all' }}
                  >
                    {metadata.doi}
                  </Link>
                )}
              </MetaRow>
            )}

            {plainRows(metadata, AFTER_PUBLICATION_FIELDS)}

            {metadata.keywords && (
              <MetaRow label="Keywords">
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.25 }}>
                  {metadata.keywords
                    .split(/[,;]+/)
                    .map((kw) => kw.trim())
                    .filter(Boolean)
                    .map((kw) => (
                      <Chip key={kw} label={kw} size="small" variant="outlined" />
                    ))}
                </Box>
              </MetaRow>
            )}

            {hasGeospatial && (
              <MetaRow label="Spatial Extent">
                {[
                  metadata.geospatial_lat_min != null &&
                    `Lat: ${metadata.geospatial_lat_min} – ${metadata.geospatial_lat_max ?? '?'}`,
                  metadata.geospatial_lon_min != null &&
                    `Lon: ${metadata.geospatial_lon_min} – ${metadata.geospatial_lon_max ?? '?'}`,
                ]
                  .filter(Boolean)
                  .join('   |   ')}
              </MetaRow>
            )}

            {hasTimeCoverage && (
              <MetaRow label="Time Coverage">
                {[metadata.time_coverage_start, metadata.time_coverage_end]
                  .filter(Boolean)
                  .join(' – ')}
              </MetaRow>
            )}

            {metadata.comment && <MetaRow label="Comment">{metadata.comment}</MetaRow>}

            {metadata.history && (
              <MetaRow label="History">
                <Typography
                  variant="body2"
                  sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}
                >
                  {metadata.history}
                </Typography>
              </MetaRow>
            )}

            <MetaRow label="Software Development">{softwareCredit}</MetaRow>

            {Object.keys(extra).length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Button
                  size="small"
                  onClick={() => setExtraOpen((prev) => !prev)}
                  endIcon={extraOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  sx={{ textTransform: 'none', px: 0 }}
                >
                  Learn more
                </Button>
                <Collapse in={extraOpen}>
                  <Box
                    component="dl"
                    sx={{
                      m: 0,
                      mt: 1,
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr',
                      columnGap: 1.5,
                      rowGap: 0.25,
                    }}
                  >
                    {Object.entries(extra).map(([key, value]) => (
                      <React.Fragment key={key}>
                        <Typography
                          component="dt"
                          variant="body2"
                          sx={{ fontWeight: 600, color: 'text.secondary' }}
                        >
                          {key}
                        </Typography>
                        <Typography
                          component="dd"
                          variant="body2"
                          sx={{ m: 0, wordBreak: 'break-word' }}
                        >
                          {value}
                        </Typography>
                      </React.Fragment>
                    ))}
                  </Box>
                </Collapse>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReferencesModal;
