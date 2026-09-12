// Values that describe the data and its presentation. Pure data only: copy lives
// in content.js, reusable styles in styles/, and helpers in utils.js.

/** Time index the backend uses for the annual mean, past the twelve months. */
export const ANNUAL_MONTH = 13;

export const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
  { value: ANNUAL_MONTH, label: 'Annual' },
];

/** Grid cells whose SD exceeds this share of the global maximum are hatched. */
export const SD_THRESHOLD = 50;

/** Tick positions of the SD colour bar and globe legend, in percent. */
export const SD_TICK_PERCENTS = [0, 10, 25, 40, 50, 60, 75, 90, 100];

/** Viridis, sampled at ten stops; used for the mean and observation scales. */
export const VIRIDIS_COLORS = [
  '#440154',
  '#482777',
  '#3b528b',
  '#31688e',
  '#21918c',
  '#35b779',
  '#5ec962',
  '#aadc32',
  '#dde318',
  '#fde725',
];

/** White-to-black-red ramp for the standard deviation, keyed to percentages. */
export const SD_COLORSCALE = [
  [0.0, '#ffffff'],
  [0.1, '#fff5cc'],
  [0.25, '#ffe066'],
  [0.4, '#ffb347'],
  [0.5, '#ff7e00'],
  [0.6, '#ff3c00'],
  [0.75, '#cc1100'],
  [0.9, '#7a0000'],
  [1.0, '#3d0000'],
];

/** Colours for presence/absence observations, which have no continuous scale. */
export const PRESENCE_COLORSCALE = [[0, '#333333'], [1, '#fde725']];
export const PRESENCE_COLOR = '#fde725';

export const EARTH_TEXTURE = '/assets/earth_texture.png';

export const BlueCloudLogo = {
  alt: 'Blue-Cloud',
  src: '/assets/BlueCloud_logo.png',
  href: 'https://blue-cloud.org',
};

export const logos = [
  {
    alt: 'ETH Zurich',
    src: '/assets/ETH_logo_black.png',
    href: 'https://up.ethz.ch/research/ongoing-projects.html',
  },
  {
    alt: 'Sorbonne University',
    src: '/assets/Sorbonne_logo.png',
    href: 'https://www.sorbonne-universite.fr/en',
  },
  {
    alt: 'EMBL',
    src: '/assets/EMBL_logo.png',
    href: 'https://www.embl.org/about/',
  },
  {
    alt: 'EU',
    src: '/assets/EU_logo.png',
    href: 'https://eosc.eu/eosc-about/calls-grants/',
  },
];
