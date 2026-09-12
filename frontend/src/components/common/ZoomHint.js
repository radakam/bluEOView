import React from 'react';
import { zoomHintStyle } from '../../styles/display';

const ZoomHint = ({ visible }) => (
  <div style={zoomHintStyle(visible)}>Double-click to reset zoom</div>
);

export default ZoomHint;
