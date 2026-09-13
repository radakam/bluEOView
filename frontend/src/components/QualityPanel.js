import React from 'react';
import { Box, CircularProgress, IconButton, Tooltip, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CollapsiblePanel from './common/CollapsiblePanel';
import { useQualityControl } from '../hooks/useQualityControl';
import {
  algorithmDescriptions,
  noDescriptionText,
  noQualityText,
  qcMetricDescriptions,
} from '../content';
import { errorTextSx } from '../styles/panels';

const STATUS_COLORS = { pass: '#00c853', caution: '#ffab00', fail: '#e53935' };

const LEGEND_ITEMS = [
  [STATUS_COLORS.pass, 'Pass'],
  [STATUS_COLORS.caution, 'Caution'],
  [STATUS_COLORS.fail, 'Fail'],
];

/** Divider weight of the panel header, so the table reads as part of the same card. */
const RULE = '1px solid rgba(255,255,255,0.08)';

const cellSx = { px: 1, py: 0.75, borderBottom: RULE, fontSize: '0.85rem', color: '#fff' };

const headerCellSx = { ...cellSx, fontWeight: 500, whiteSpace: 'nowrap', textAlign: 'center' };

/** Criterion the file leaves uncoloured ("white"), i.e. not evaluated. */
const UNKNOWN_COLOR = '#555';

const STATUS_RANK = [STATUS_COLORS.pass, STATUS_COLORS.caution, STATUS_COLORS.fail];

/** Maps a file's QC colour onto `STATUS_COLORS` by hue, so dots match the legend. */
const statusColor = (color) => {
  const match = /^#?([0-9a-f]{6})$/i.exec(String(color ?? '').trim());
  if (!match) return UNKNOWN_COLOR;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(match[1].slice(i, i + 2), 16));
  if (Math.min(r, g, b) > 200) return UNKNOWN_COLOR;
  if (r > 150 && g > 150 && b < 100) return STATUS_COLORS.caution;
  if (r > g && r > b) return STATUS_COLORS.fail;
  return STATUS_COLORS.pass;
};

/** Worst status among a row of QC colours; unevaluated criteria are ignored. */
const worstStatus = (rowColors) => {
  const ranks = rowColors.map((c) => STATUS_RANK.indexOf(statusColor(c))).filter((i) => i >= 0);
  return ranks.length ? STATUS_RANK[Math.max(...ranks)] : UNKNOWN_COLOR;
};

const Dot = ({ color, size = 10 }) => (
  <Box
    sx={{
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: color,
      flexShrink: 0,
      display: 'inline-block',
    }}
  />
);

const Legend = () => (
  <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
    {LEGEND_ITEMS.map(([color, label]) => (
      <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Dot color={color} size={8} />
        <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>{label}</Typography>
      </Box>
    ))}
  </Box>
);

/** Column or row header whose meaning is explained on hover. */
const HeaderHint = ({ name, description }) =>
  description ? (
    <Tooltip title={description} placement="top" arrow>
      <Box component="span" sx={{ cursor: 'help', borderBottom: '1px dotted' }}>
        {name}
      </Box>
    </Tooltip>
  ) : (
    name
  );

/** One row per algorithm, one dot per QC criterion, plus its recommendation. */
const QCTable = ({ algorithms, colors, qcNames, recommendations }) => (
  <Box sx={{ overflowX: 'auto' }}>
    <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
      <Box component="thead">
        <Box component="tr">
          <Box component="th" sx={{ ...headerCellSx, textAlign: 'left' }}>
            Algorithm
          </Box>
          {qcNames.map((name) => (
            <Box component="th" key={name} sx={headerCellSx}>
              <HeaderHint name={name} description={qcMetricDescriptions[name]} />
            </Box>
          ))}
          <Box component="th" sx={{ ...headerCellSx, textAlign: 'left', pl: 3 }}>
            Recommendation
          </Box>
        </Box>
      </Box>

      <Box component="tbody">
        {algorithms.map((algorithm, row) => {
          const rowColors = colors[row] || [];

          return (
            <Box
              component="tr"
              key={algorithm}
              sx={{
                '&:last-child td': { borderBottom: 'none' },
                '&:hover td': { backgroundColor: 'rgba(255,255,255,0.04)' },
              }}
            >
              <Box component="td" sx={{ ...cellSx, whiteSpace: 'nowrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Dot color={worstStatus(rowColors)} />
                  <HeaderHint name={algorithm} description={algorithmDescriptions[algorithm]} />
                </Box>
              </Box>

              {qcNames.map((name, column) => (
                <Box component="td" key={name} sx={{ ...cellSx, textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Dot color={statusColor(rowColors[column])} />
                  </Box>
                </Box>
              ))}

              <Box component="td" sx={{ ...cellSx, pl: 3, color: 'rgba(255,255,255,0.7)', minWidth: 140 }}>
                {recommendations[row] || '—'}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  </Box>
);

const QualityPanel = ({ netcdfUrl, feature, openInfoModal }) => {
  const { qualityControl, loading, error } = useQualityControl({ file: netcdfUrl, feature });

  const showQualityInfo = (e) => {
    e.stopPropagation();
    const parts = [qualityControl?.qcColLongName, qualityControl?.qcRecLongName].filter(Boolean);
    openInfoModal?.('Quality Control', parts.join('\n\n') || noDescriptionText);
  };

  return (
    <CollapsiblePanel
      title="Quality Control"
      titleAdornment={
        <IconButton
          size="small"
          aria-label="About quality control"
          sx={{ color: '#fff', ml: 0.5, p: 0.25 }}
          onClick={showQualityInfo}
        >
          <InfoOutlinedIcon fontSize="small" />
        </IconButton>
      }
    >
      <Box sx={{ px: 2, py: 1.5 }}>
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={14} sx={{ color: 'rgba(255,255,255,0.5)' }} />
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              Loading…
            </Typography>
          </Box>
        )}

        {error && (
          <Typography variant="body2" sx={errorTextSx}>
            {error}
          </Typography>
        )}

        {!loading && qualityControl?.available && (
          <>
            <Legend />
            <QCTable
              algorithms={qualityControl.algorithms}
              colors={qualityControl.colors}
              qcNames={qualityControl.qcNames}
              recommendations={qualityControl.recommendations}
            />
          </>
        )}

        {!loading && !error && qualityControl && !qualityControl.available && (
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {noQualityText}
          </Typography>
        )}
      </Box>
    </CollapsiblePanel>
  );
};

export default QualityPanel;
