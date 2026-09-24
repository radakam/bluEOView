import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  ListSubheader,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Slider,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MapIcon from '@mui/icons-material/Map';
import PublicIcon from '@mui/icons-material/Public';
import SearchIcon from '@mui/icons-material/Search';
import CollapsiblePanel from './common/CollapsiblePanel';
import WormsModal from './WormsModal';
import { SpeciesThumbnail } from './SpeciesCard';
import { useIsPhone } from '../hooks/useViewport';
import { ANNUAL_MONTH, MONTH_OPTIONS } from '../constants';
import { noDescriptionText } from '../content';
import { isWormsTaxon, monthLabel } from '../utils';
import {
  darkMenuProps,
  frostedDialogSx,
  glassSelectSx,
  layerToggleSx,
  viewToggleSx,
} from '../styles/panels';

const ADD_NEW_SOURCE = '__add_new__';

const MONTH_MARKS = MONTH_OPTIONS.filter((opt) => opt.value !== ANNUAL_MONTH).map((opt) => ({
  value: opt.value,
  label: opt.label.slice(0, 3),
}));

/** Same ticks, but only Jan/Apr/Jul/Oct are named; twelve labels overlap on a phone. */
const QUARTERLY_MARKS = MONTH_MARKS.map((mark, index) =>
  index % 3 === 0 ? mark : { value: mark.value }
);

/** "+ Show SD" where the panel header has the room, "+ SD" once it does not. */
const layerLabel = (active, name, compact) =>
  `${active ? '✕' : '+'} ${compact ? name : `${active ? 'Hide' : 'Show'} ${name}`}`;

const monoTextSx = { fontFamily: 'monospace', fontSize: '0.85em' };

/** One labelled control; the label sits beside it, or above it once space runs out. */
const controlRowSx = {
  display: 'flex',
  flexDirection: { xs: 'column', sm: 'row' },
  alignItems: { xs: 'stretch', sm: 'center' },
  gap: { xs: 0.75, sm: 1.5 },
};

/** Label column of a control row; full width once the row stacks. */
const rowLabelSx = { width: { xs: 'auto', sm: 110 }, flexShrink: 0, color: 'white' };

const RowLabel = ({ children }) => <Typography sx={rowLabelSx}>{children}</Typography>;

/** A source is shown by its label; a pasted URL has none, so show the URL itself. */
const sourceText = (source) =>
  source.label !== source.value ? source.label : <span style={monoTextSx}>{source.value}</span>;

/** Dataset picker, plus a dialog for loading a NetCDF file from an arbitrary URL. */
const SourceControl = ({ sources, value, onSelect }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftUrl, setDraftUrl] = useState('');

  const closeDialog = () => {
    setDialogOpen(false);
    setDraftUrl('');
  };

  const confirmDialog = () => {
    const trimmed = draftUrl.trim();
    if (!trimmed) return;
    closeDialog();
    onSelect(trimmed);
  };

  const handleChange = (e) => {
    if (e.target.value === ADD_NEW_SOURCE) {
      setDraftUrl('');
      setDialogOpen(true);
      return;
    }
    onSelect(e.target.value);
  };

  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <FormControl size="small" sx={{ ...glassSelectSx, width: '100%' }}>
        <Select
          value={sources.some((s) => s.value === value) ? value : ''}
          displayEmpty
          onChange={handleChange}
          MenuProps={darkMenuProps}
          renderValue={(selected) => {
            const source = sources.find((s) => s.value === selected);
            if (!source) return <span style={{ opacity: 0.5 }}>Select a source…</span>;
            if (source.label !== source.value) return source.label;
            return (
              <span
                style={{
                  ...monoTextSx,
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  direction: 'rtl',
                  textAlign: 'left',
                }}
              >
                <bdi>{source.value}</bdi>
              </span>
            );
          }}
        >
          {sources.map((source) => (
            <MenuItem key={source.value} value={source.value}>
              {sourceText(source)}
            </MenuItem>
          ))}

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', my: 0.5 }} />
          <MenuItem
            value={ADD_NEW_SOURCE}
            sx={{ color: 'rgba(255,255,255,0.7) !important', gap: 1, '&:hover': { color: '#fff !important' } }}
          >
            <AddIcon sx={{ fontSize: 16 }} /> Add new source…
          </MenuItem>
        </Select>
      </FormControl>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth sx={frostedDialogSx}>
        <DialogTitle>Add new source</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Enter a URL to a NetCDF file.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            size="small"
            value={draftUrl}
            onChange={(e) => setDraftUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && confirmDialog()}
            placeholder="https://…"
            inputProps={{ style: { fontFamily: 'monospace' } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={confirmDialog} disabled={!draftUrl.trim()}>
            Load
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

/**
 * Opens the WoRMS record of the selected taxon. Acts on mousedown without taking
 * focus, since it sits inside the Select, which would otherwise swallow the click.
 */
const WormsInfoButton = ({ onOpen }) => (
  <Tooltip title="WoRMS record" placement="top" arrow>
    <IconButton
      size="small"
      tabIndex={-1}
      aria-label="Show WoRMS record"
      sx={{ color: '#fff', ml: 0.5, p: 0.25 }}
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onOpen();
      }}
    >
      <InfoOutlinedIcon fontSize="small" />
    </IconButton>
  </Tooltip>
);

/** Searchable variable picker. */
const VariableControl = ({ feature, featureOptions, onFeatureChange, loading, onShowWorms }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const matches = useMemo(
    () =>
      [...featureOptions]
        .sort((a, b) => a.label.localeCompare(b.label))
        .filter((opt) => opt.label.toLowerCase().includes(searchTerm.toLowerCase())),
    [featureOptions, searchTerm]
  );

  if (!featureOptions.length || feature == null) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {loading && <CircularProgress size={14} sx={{ color: 'rgba(255,255,255,0.5)' }} />}
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          {loading ? 'Loading…' : 'No variable'}
        </Typography>
      </Box>
    );
  }

  return (
    <FormControl size="small" sx={{ ...glassSelectSx, flex: 1 }}>
      <Select
        value={feature}
        onChange={onFeatureChange}
        onClose={() => setSearchTerm('')}
        MenuProps={{ ...darkMenuProps, autoFocus: false }}
        renderValue={(value) => {
          const selected = featureOptions.find((f) => f.value === value);
          if (!selected) return <span style={{ opacity: 0.5 }}>Select a variable…</span>;
          return (
            <span>
              {selected.label}
              {isWormsTaxon(selected) && <WormsInfoButton onOpen={onShowWorms} />}
            </span>
          );
        }}
      >
        <ListSubheader sx={{ bgcolor: 'rgb(45, 45, 45)', p: 1 }}>
          <TextField
            size="small"
            autoFocus
            fullWidth
            placeholder="Search name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.5)' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiInputBase-input': { color: '#fff', fontSize: '0.85rem' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
            }}
          />
        </ListSubheader>

        {matches.length === 0 && <MenuItem disabled>No matches found</MenuItem>}
        {matches.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
            {isWormsTaxon(opt) && (
              <Typography
                component="span"
                sx={{ ...monoTextSx, ml: 1, color: 'rgba(255,255,255,0.4)', fontSize: '0.78em' }}
              >
                [{opt.target_id}]
              </Typography>
            )}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

/** Annual/monthly switch and the month slider. */
const TimeControl = ({ month, onMonthChange }) => {
  const isPhone = useIsPhone();

  // Local state keeps the slider fluid; the committed value drives the fetch.
  const [draftMonth, setDraftMonth] = useState(month);
  useEffect(() => setDraftMonth(month), [month]);

  const isAnnual = draftMonth === ANNUAL_MONTH;

  const selectMode = (mode) => {
    const next = mode === 'annual' ? ANNUAL_MONTH : 1;
    setDraftMonth(next);
    onMonthChange?.(next);
  };

  return (
    <>
      <RadioGroup
        value={isAnnual ? 'annual' : 'monthly'}
        onChange={(e) => selectMode(e.target.value)}
        sx={{ flexShrink: 0, flexDirection: { xs: 'row', sm: 'column' }, columnGap: 2 }}
      >
        {['Annual', 'Monthly'].map((label) => (
          <FormControlLabel
            key={label}
            value={label.toLowerCase()}
            control={
              <Radio
                size="small"
                sx={{ color: 'rgba(255,255,255,0.5)', '&.Mui-checked': { color: '#fff' }, py: 0.25 }}
              />
            }
            label={<Typography sx={{ color: '#fff', fontSize: '0.85rem' }}>{label}</Typography>}
          />
        ))}
      </RadioGroup>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          opacity: isAnnual ? 0.3 : 1,
          pointerEvents: isAnnual ? 'none' : 'auto',
        }}
      >
        <Slider
          value={isAnnual ? 1 : draftMonth ?? 1}
          min={1}
          max={12}
          step={1}
          marks={isPhone ? QUARTERLY_MARKS : MONTH_MARKS}
          onChange={(_, value) => setDraftMonth(value)}
          onChangeCommitted={(_, value) => onMonthChange?.(value)}
          sx={{
            flex: 1,
            color: '#fff',
            mb: 1.5,
            '& .MuiSlider-markLabel': {
              color: 'rgba(255,255,255,0.7)',
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
            },
            '& .MuiSlider-markLabelActive': { color: '#fff', fontWeight: 'bold' },
          }}
        />
        <Typography
          variant="body2"
          sx={{
            color: '#fff',
            minWidth: 28,
            textAlign: 'right',
            whiteSpace: 'nowrap',
            fontWeight: 500,
            pl: 1,
            mb: 1.5,
          }}
        >
          {isAnnual ? '' : monthLabel(draftMonth)}
        </Typography>
      </Box>
    </>
  );
};

const ControlPanel = ({
  feature,
  featureOptions = [],
  onFeatureChange,
  openInfoModal,
  month,
  onMonthChange,
  view,
  onViewChange,
  sources = [],
  selectedSource,
  onSelectSource,
  featuresLoading,
  timeLongName,
  showStd = false,
  onToggleStd,
  showObs = false,
  onToggleObs,
  hasObs = false,
  photo = null,
}) => {
  const [wormsOpen, setWormsOpen] = useState(false);
  const isPhone = useIsPhone();

  const selectedFeature = featureOptions.find((f) => f.value === feature);

  const showVariableInfo = () => {
    const parts = [selectedFeature?.standard_name, selectedFeature?.long_name].filter(Boolean);
    openInfoModal?.('Variable', parts.join('\n\n') || noDescriptionText);
  };

  // The header is one line, so on a phone these shrink rather than wrap below it.
  const actions = (
    <>
      <Button size="small" variant="outlined" onClick={onToggleStd} sx={layerToggleSx(showStd)}>
        {layerLabel(showStd, 'SD', isPhone)}
      </Button>

      {hasObs && (
        <Button size="small" variant="outlined" onClick={onToggleObs} sx={layerToggleSx(showObs)}>
          {layerLabel(showObs, 'Obs', isPhone)}
        </Button>
      )}

      <ToggleButtonGroup
        value={view}
        exclusive
        size="small"
        onChange={(_, value) => value && onViewChange?.(value)}
        sx={viewToggleSx}
      >
        <ToggleButton value="map" aria-label="Map view">
          <MapIcon sx={{ fontSize: 16, mr: isPhone ? 0 : 0.5 }} />
          {!isPhone && 'Map'}
        </ToggleButton>
        <ToggleButton value="globe" aria-label="Globe view">
          <PublicIcon sx={{ fontSize: 16, mr: isPhone ? 0 : 0.5 }} />
          {!isPhone && 'Globe'}
        </ToggleButton>
      </ToggleButtonGroup>
    </>
  );

  return (
    <>
      <CollapsiblePanel title="Control Panel" actions={actions}>
        <Box
          sx={{
            px: { xs: 1.5, sm: 2 },
            py: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Box sx={controlRowSx}>
            <RowLabel>Source</RowLabel>
            <SourceControl sources={sources} value={selectedSource} onSelect={onSelectSource} />
          </Box>

          <Box sx={controlRowSx}>
            <Box sx={{ ...rowLabelSx, display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ color: 'white' }}>Variable</Typography>
              <IconButton
                size="small"
                aria-label="About this variable"
                sx={{ color: '#fff', ml: 0.5, p: 0.25 }}
                onClick={showVariableInfo}
              >
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
              <VariableControl
                feature={feature}
                featureOptions={featureOptions}
                onFeatureChange={onFeatureChange}
                loading={featuresLoading}
                onShowWorms={() => setWormsOpen(true)}
              />
              {photo && <SpeciesThumbnail photo={photo} onClick={() => setWormsOpen(true)} />}
            </Box>
          </Box>

          <Box sx={controlRowSx}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <Typography sx={{ color: 'white', whiteSpace: 'nowrap' }}>Time Frame</Typography>
              <IconButton
                size="small"
                aria-label="About the time frame"
                sx={{ color: '#fff', ml: 0.5, p: 0.25 }}
                onClick={() => openInfoModal?.('Time Frame', timeLongName || noDescriptionText)}
              >
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Box>
            <TimeControl month={month} onMonthChange={onMonthChange} />
          </Box>
        </Box>
      </CollapsiblePanel>

      <WormsModal
        open={wormsOpen}
        onClose={() => setWormsOpen(false)}
        wormsId={selectedFeature?.target_id}
      />
    </>
  );
};

export default ControlPanel;
