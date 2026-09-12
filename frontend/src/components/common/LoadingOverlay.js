import React from 'react';
import Spinner from './Spinner';
import { overlayStyle } from '../../styles/display';

/** Dims a figure while the next one loads, instead of unmounting it. */
const LoadingOverlay = ({ visible }) => (
  <div style={overlayStyle(visible)}>
    <Spinner />
  </div>
);

export default LoadingOverlay;
