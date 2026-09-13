// MUI `sx` fragments shared by the control surfaces (panels, selects, dialogs).
import { alpha } from '@mui/material/styles';

/** Translucent dark card used for the Control and Quality panels. */
export const glassPanelSx = {
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0,0,0,0.25)',
  backdropFilter: 'blur(8px)',
  borderRadius: 1,
  border: '1px solid rgba(255,255,255,0.15)',
  overflow: 'hidden',
};

/** Clickable header strip of a collapsible panel. */
export const panelHeaderSx = (open) => ({
  display: 'flex',
  alignItems: 'center',
  px: 2,
  py: 1,
  cursor: 'pointer',
  borderBottom: open ? '1px solid rgba(255,255,255,0.08)' : 'none',
  '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)' },
});

export const panelTitleSx = { fontSize: 19, color: 'white' };

/** Frosted-glass input, used for every dropdown on the control panel. */
export const glassSelectSx = {
  backgroundColor: 'rgba(255,255,255,0.12)',
  backdropFilter: 'blur(12px)',
  borderRadius: 2,
  border: '1px solid rgba(255,255,255,0.25)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  '& .MuiInputBase-input': { color: '#fff' },
  '& .MuiSvgIcon-root': { color: '#fff' },
  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
};

/** Dark dropdown surface matching `glassSelectSx`. */
export const darkMenuProps = {
  PaperProps: {
    sx: {
      backgroundColor: 'rgba(30, 30, 30, 0.9)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.25)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      maxHeight: 400,
      '& .MuiMenuItem-root': {
        color: '#fff',
        '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' },
        '&.Mui-selected': { backgroundColor: 'rgba(255,255,255,0.2)' },
      },
    },
  },
};

export const viewToggleSx = {
  '& .MuiToggleButton-root': {
    color: 'rgba(255,255,255,0.6)',
    borderColor: 'rgba(255,255,255,0.25)',
    '&.Mui-selected': {
      color: '#fff',
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderColor: 'rgba(255,255,255,0.4)',
    },
    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
  },
};

/** "Show SD" / "Show Obs" buttons; highlighted while the panel is visible. */
export const layerToggleSx = (active) => ({
  color: '#fff',
  borderColor: 'rgba(255,255,255,0.25)',
  backgroundColor: active ? 'rgba(60,80,120,0.85)' : 'rgba(30,30,30,0.75)',
  backdropFilter: 'blur(4px)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.04em',
  py: '9px',
  '&:hover': {
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: active ? 'rgba(70,90,140,0.9)' : 'rgba(50,50,50,0.85)',
  },
});

/** Corner button that hides the SD / Obs panel; styled like an inactive `layerToggleSx`. */
export const closeButtonSx = {
  position: 'absolute',
  top: 8,
  right: 8,
  zIndex: 15,
  width: 28,
  height: 28,
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: 1,
  backgroundColor: 'rgba(30,30,30,0.75)',
  backdropFilter: 'blur(4px)',
  '&:hover': {
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(50,50,50,0.85)',
  },
};

/** Light, frosted dialog surface used by the modals. */
export const frostedDialogSx = {
  '& .MuiPaper-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(4px)',
  },
};

/** Inset tray on a frosted surface: the photo frame and the rank breadcrumb. */
export const insetTraySx = {
  backgroundColor: 'action.hover',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
};

/** Logo plate in the header and the footer. */
export const logoTileSx = (width, height) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width,
  height,
  backgroundColor: 'rgba(0, 0, 0, 0.25)',
  borderRadius: 1,
  textDecoration: 'none',
  transition: 'box-shadow 0.2s ease-in-out',
  '&:hover': {
    boxShadow: (theme) => theme.shadows[6],
    backgroundColor: alpha('#000000', 0.03),
  },
});

export const errorTextSx = { color: '#ff6b6b', fontWeight: 'bold' };
