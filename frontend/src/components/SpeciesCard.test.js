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

test('renders nothing without a photograph', () => {
  const { container } = render(<SpeciesCard photo={null} top={0} right={0} />);
  expect(container).toBeEmptyDOMElement();
});

test('shows the photograph with its credit and source', () => {
  render(<SpeciesCard photo={photo} top={0} right={0} />);

  expect(screen.getByAltText('Oithona similis')).toHaveAttribute('src', photo.url);
  expect(screen.getByRole('link', { name: 'Oithona similis' })).toHaveAttribute('href', photo.pageUrl);
  expect(screen.getByText(/Kwasniewski/)).toBeInTheDocument();
  expect(screen.getByText('CC BY-NC-SA 4.0')).toHaveAttribute('href', photo.licenseUrl);
});

test('stays hidden once dismissed, until another taxon is picked', () => {
  const { rerender } = render(<SpeciesCard photo={photo} top={0} right={0} />);
  fireEvent.click(screen.getByLabelText('Hide photograph'));
  expect(screen.queryByAltText('Oithona similis')).not.toBeInTheDocument();

  const next = { ...photo, url: 'https://example.org/calanus.jpg', title: 'Calanus finmarchicus' };
  rerender(<SpeciesCard photo={next} top={0} right={0} />);
  expect(screen.getByAltText('Calanus finmarchicus')).toBeInTheDocument();
});
