import React from 'react';
import { render, screen } from '@testing-library/react';
import SpeciesPhoto from './SpeciesPhoto';

const photo = {
  available: true,
  url: 'https://images.marinespecies.org/thumbs/9048_oithona.jpg?w=600',
  title: 'Oithona similis',
  author: 'Kwasniewski, Slawomir',
  licenseName: 'CC BY-NC-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
  pageUrl: 'https://www.marinespecies.org/aphia.php?p=image&pic=9048',
};

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  delete global.fetch;
});

const respondWith = (body) =>
  global.fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(body) });

test('queries nothing until the panel is open', async () => {
  respondWith(photo);
  render(<SpeciesPhoto aphiaId={106656} enabled={false} />);

  expect(global.fetch).not.toHaveBeenCalled();
  expect(await screen.findByText('No photograph in the WoRMS gallery.')).toBeInTheDocument();
});

test('shows the photograph and its credit once open', async () => {
  respondWith(photo);
  render(<SpeciesPhoto aphiaId={106656} enabled />);
  await screen.findByAltText('Oithona similis');

  expect(global.fetch).toHaveBeenCalledWith(
    '/api/species-image?aphiaId=106656',
    expect.anything()
  );
  expect(screen.getByAltText('Oithona similis')).toHaveAttribute('src', photo.url);
  expect(screen.getByText('Oithona similis')).toBeInTheDocument();
  expect(screen.getByText(/Kwasniewski/)).toBeInTheDocument();
  expect(screen.getByText('CC BY-NC-SA 4.0')).toHaveAttribute('href', photo.licenseUrl);
  expect(screen.getByText('WoRMS photogallery')).toHaveAttribute('href', photo.pageUrl);
});

test('says so when the gallery holds none', async () => {
  respondWith({ available: false });
  render(<SpeciesPhoto aphiaId={115088} enabled />);
  expect(await screen.findByText('No photograph in the WoRMS gallery.')).toBeInTheDocument();
});

test('degrades to a quiet line when the lookup fails', async () => {
  respondWith({ error: 'registry unreachable' });
  render(<SpeciesPhoto aphiaId={106656} enabled />);
  expect(await screen.findByText('Could not reach the WoRMS photogallery.')).toBeInTheDocument();
});
