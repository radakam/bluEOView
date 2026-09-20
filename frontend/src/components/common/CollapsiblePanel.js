import React, { useState } from 'react';
import { Box, Collapse, IconButton, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { glassPanelSx, panelHeaderSx, panelTitleSx } from '../../styles/panels';

/**
 * Glass card with a clickable header that expands and collapses its body.
 *
 * @param titleAdornment rendered next to the title (e.g. an info button)
 * @param actions        rendered right-aligned; clicks there do not collapse
 */
const CollapsiblePanel = ({
  title,
  titleAdornment = null,
  actions = null,
  defaultOpen = true,
  sx = {},
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Box sx={{ ...glassPanelSx, ...sx }}>
      <Box sx={panelHeaderSx(open)} onClick={() => setOpen((v) => !v)}>
        <IconButton
          size="small"
          aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
          sx={{ color: 'white', pr: { xs: 0.5, sm: 3 }, flexShrink: 0 }}
        >
          {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>

        <Typography sx={panelTitleSx}>{title}</Typography>
        {titleAdornment}

        {actions && (
          <Box
            sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, gap: { xs: 0.5, sm: 1 }, ml: 'auto', pl: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </Box>
        )}
      </Box>

      <Collapse in={open}>{children}</Collapse>
    </Box>
  );
};

export default CollapsiblePanel;
