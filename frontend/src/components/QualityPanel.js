import React from 'react';
import { Box, CircularProgress, IconButton, Tooltip, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CollapsiblePanel from './common/CollapsiblePanel';
import { useQualityControl } from '../hooks/useQualityControl';
import { noDescriptionText, noQualityText } from '../content';

const STATUS_COLORS = { pass: '#00c853', caution: '#ffab00', fail: '#e53935' };

const LEGEND_ITEMS = [
  [STATUS_COLORS.pass, 'Pass'],
  [STATUS_COLORS.caution, 'Caution'],
  [STATUS_COLORS.fail, 'Fail'],
];

const headerCellSx = (isRecommendation) => ({
  textAlign: isRecommendation ? 'left' : 'center',
  px: 1.5,
  py: 1,
  color: 'rgba(255,255,255,0.4)',
  fontWeight: 600,
  fontSize: '0.7rem',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  whiteSpace: isRecommendation ? 'normal' : 'nowrap',
  minWidth: isRecommendation ? 180 : 80,
});

const bodyCellSx = { px: 1.5, py: 1, borderBottom: '1px solid rgba(255,255,255,0.06)' };

const toRgb = (hex) => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};

/**
 * Worst status among a row of QC colours. The backend sends arbitrary hex
 * colours, so they are classified by hue rather than matched exactly.
 */
const worstStatus = (rowColors) => {
  const rgb = rowColors.map(toRgb);
  if (rgb.some(([r, g, b]) => r > 180 && g < 120 && b < 120)) return STATUS_COLORS.fail;
  if (rgb.some(([r, g, b]) => r > 180 && g > 120 && b < 100)) return STATUS_COLORS.caution;
  return STATUS_COLORS.pass;
};

const Dot = ({ color }) => (
  <Box
    sx={{
      width: 10,
      height: 10,
      borderRadius: '50%',
      backgroundColor: color,
      flexShrink: 0,
      display: 'inline-block',
    }}
  />
);

const Legend = () => (
  <Box sx={{ display: 'flex', gap: 2, mb: 2, px: 0.5 }}>
    {LEGEND_ITEMS.map(([color, label]) => (
      <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color }} />
        <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>{label}</Typography>
      </Box>
    ))}
  </Box>
);

/** One row per algorithm, one dot per QC criterion, plus its recommendation. */
const QCTable = ({ algorithms, colors, qcNames, recommendations }) => (
  <Box sx={{ overflowX: 'auto' }}>
    <Box
      component="table"
      sx={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.78rem',
        fontFamily: '"IBM Plex Mono", monospace',
      }}
    >
      <Box component="thead">
        <Box component="tr">
          <Box component="th" sx={{ ...headerCellSx(false), textAlign: 'left', minWidth: 120 }}>
            Algorithm
          </Box>
          {qcNames.map((name) => (
            <Box component="th" key={name} sx={headerCellSx(false)}>
              {name}
            </Box>
          ))}
          <Box component="th" sx={headerCellSx(true)}>
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
                transition: 'background-color 0.15s',
                '&:hover td, &:hover th': { backgroundColor: 'rgba(255,255,255,0.04)' },
              }}
            >
              <Box
                component="td"
                sx={{
                  ...bodyCellSx,
                  whiteSpace: 'nowrap',
                  color: 'rgba(255,255,255,0.9)',
                  fontWeight: 500,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Dot color={worstStatus(rowColors)} />
                  {algorithm}
                </Box>
              </Box>

              {qcNames.map((name, column) => (
                <Box component="td" key={name} sx={{ ...bodyCellSx, textAlign: 'center' }}>
                  <Tooltip title={name} placement="top" arrow>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Dot color={rowColors[column] || '#555'} />
                    </Box>
                  </Tooltip>
                </Box>
              ))}

              <Box
                component="td"
                sx={{
                  ...bodyCellSx,
                  color: 'rgba(255,255,255,0.6)',
                  fontStyle: 'italic',
                  fontSize: '0.73rem',
                  lineHeight: 1.4,
                  fontFamily: 'inherit',
                  minWidth: 180,
                }}
              >
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
      sx={{ display: 'flex', flexDirection: 'column' }}
      titleAdornment={
        <IconButton
          size="small"
          aria-label="About quality control"
          sx={{ color: '#fff', ml: 1 }}
          onClick={showQualityInfo}
        >
          <InfoOutlinedIcon fontSize="small" />
        </IconButton>
      }
    >
      <Box sx={{ px: 2, pt: 2, pb: 2 }}>
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1 }}>
            <CircularProgress size={16} sx={{ color: 'white' }} />
            <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
              Loading data...
            </Typography>
          </Box>
        )}

        {error && (
          <Typography sx={{ fontSize: '0.85rem', color: STATUS_COLORS.fail, p: 1 }}>
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
          <Typography
            sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', p: 1, fontStyle: 'italic' }}
          >
            {noQualityText}
          </Typography>
        )}
      </Box>
    </CollapsiblePanel>
  );
};

export default QualityPanel;
