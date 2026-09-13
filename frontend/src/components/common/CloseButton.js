import React, { useState } from 'react';
import { closeButtonStyle } from '../../styles/display';

/** Small "✕" in a panel's top-right corner that hides the panel. */
const CloseButton = ({ onClick, label = 'Hide' }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={closeButtonStyle(hovered)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      ✕
    </button>
  );
};

export default CloseButton;
