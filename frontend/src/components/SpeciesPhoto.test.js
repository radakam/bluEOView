import React from 'react';
import { render, screen } from '@testing-library/react';
import SpeciesPhoto from './SpeciesPhoto';

const photo = {
  available: true,
  source: 'worms',
  sourceName: 'WoRMS photogallery',
  url: 'https://images.marinespecies.org/thumbs/9048_oithona.jpg?w=600',
  title: 'Oithona similis',
  author: 'Kwasniewski, Slawomir',
  licenseName: 'CC BY-NC-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
  pageUrl: 'https://www.marinespecies.org/aphia.php?p=image&pic=9048',
};

const commonsPhoto = {
  available: true,
  source: 'wikimedia',
  sourceName: 'Wikimedia Commons',
  url: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Emiliania_huxleyi.jpg',
  title: 'Emiliania huxleyi',
  author: 'Ernst Haeckel',
  licenseName: 'Public domain',
  licenseUrl: null,
  pageUrl: 'https://commons.wikimedia.org/wiki/File:Emiliania_huxleyi.jpg',
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
  expect(await screen.findByText('No photograph in WoRMS or Wikimedia Commons.')).toBeInTheDocument();
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

test('credits Wikimedia when the picture came from there instead', async () => {
  respondWith(commonsPhoto);
  render(<SpeciesPhoto aphiaId={115104} enabled />);
  await screen.findByAltText('Emiliania huxleyi');

  expect(screen.getByText('Wikimedia Commons')).toHaveAttribute('href', commonsPhoto.pageUrl);
  // Out of copyright, so the author is credited without a ©.
  expect(screen.getByText('Ernst Haeckel')).toBeInTheDocument();
  expect(screen.getByText('Public domain')).not.toHaveAttribute('href');
});

test('says so when neither archive holds one', async () => {
  respondWith({ available: false });
  render(<SpeciesPhoto aphiaId={115088} enabled />);
  expect(await screen.findByText('No photograph in WoRMS or Wikimedia Commons.')).toBeInTheDocument();
});

test('degrades to a quiet line when the lookup fails', async () => {
  respondWith({ error: 'registry unreachable' });
  render(<SpeciesPhoto aphiaId={106656} enabled />);
  expect(await screen.findByText('Could not reach the photo archives.')).toBeInTheDocument();
});
