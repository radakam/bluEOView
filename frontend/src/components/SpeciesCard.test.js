import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SpeciesCard from './SpeciesCard';

const photo = {
  available: true,
  sourceName: 'WoRMS photogallery',
  url: 'https://images.marinespecies.org/thumbs/9048_oithona.jpg?w=600',
  title: 'Oithona similis',
  author: 'Kwasniewski, Slawomir',
  licenseName: 'CC BY-NC-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
  pageUrl: 'https://www.marinespecies.org/aphia.php?p=image&pic=9048',
};

test('shows the photograph with its credit and licence', () => {
  render(<SpeciesCard photo={photo} />);

  expect(screen.getByAltText('Oithona similis')).toHaveAttribute('src', photo.url);
  expect(screen.getByText(/Kwasniewski/)).toBeInTheDocument();
  expect(screen.getByText('CC BY-NC-SA 4.0')).toHaveAttribute('href', photo.licenseUrl);
});

test('credits a public-domain work without a ©', () => {
  render(<SpeciesCard photo={{ ...photo, licenseName: 'Public domain', licenseUrl: null }} />);
  expect(screen.getByText(/Kwasniewski/).textContent).not.toMatch('©');
});

test('opens the WoRMS record when the picture is clicked', () => {
  const onClick = jest.fn();
  render(<SpeciesCard photo={photo} onClick={onClick} />);
  fireEvent.click(screen.getByLabelText('Show photograph and WoRMS record'));
  expect(onClick).toHaveBeenCalled();
});
