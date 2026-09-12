import React from 'react';
import { Link, Typography } from '@mui/material';

const DOI_URL = 'https://doi.org/10.1111/2041-210X.70040';

/** Method paper behind the projections; shown at the top of the references modal. */
const Citation = () => (
  <Typography variant="body2">
    Schickele, A., Clerc, C., Benedetti, F., De Angelis, D., Hofmann Elizondo, U., Münnich, M.,
    Irisson, J.-O., &amp; Vogt, M. (2025).{' '}
    <i>
      CEPHALOPOD: A package to standardize marine habitat-modelling practices and enhance
      inter-comparability across biological observations
    </i>
    . <em>Methods in Ecology and Evolution</em>.{' '}
    <Link href={DOI_URL} target="_blank" rel="noopener noreferrer">
      {DOI_URL}
    </Link>
  </Typography>
);

export default Citation;
