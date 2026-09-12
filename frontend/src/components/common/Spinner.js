import React from 'react';
import './Spinner.css';

/** Indeterminate spinner for the map and globe panels. */
const Spinner = ({ size = 'lg' }) => <div className={`spinner spinner--${size}`} />;

export default Spinner;
