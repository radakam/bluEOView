import React from 'react';
import Spinner from './Spinner';

/** Figure title, with a small spinner while a newer title is still loading. */
const PanelTitle = ({ title, loading, style }) => (
  <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
    <span>{title}</span>
    {loading && <Spinner size="sm" />}
  </div>
);

export default PanelTitle;
