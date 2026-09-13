// User-facing copy, kept out of the components that display it.

export const APP_TITLE = 'CEPHALOView';

export const welcomeShortText =
  'CEPHALOView is an interactive tool for exploring marine biodiversity data.\n\n' +
  'Browse global observation maps, switch between monthly and annual views, and ' +
  'compare multiple diversity metrics derived from open ocean datasets.';

export const welcomeLongText =
  'Data is loaded from NetCDF files hosted on the BlueCloud infrastructure. You can ' +
  'explore the preloaded datasets from the dropdown, or paste a custom URL to load ' +
  'your own file.\n\nUse the feature selector to switch between biodiversity indices, ' +
  'and the month slider to animate seasonal patterns. The globe and map views are ' +
  'linked — zoom and pan are shared between them.\n\nThis tool was developed as part ' +
  'of the BlueCloud 2026 project, which aims to make marine research data more ' +
  'accessible and reusable.';

export const noQualityText =
  'Quality control metrics are not explicitly provided, as the data have been ' +
  'pre-filtered. Only those that passed the initial quality checks were used for ' +
  'the projection.';

/** What each quality-control criterion in the `qc` dimension checks. */
export const qcMetricDescriptions = {
  PRE_VIP:
    'Pre-modelling variable importance: the environmental predictors selected before ' +
    'fitting carry enough information about the target.',
  FIT:
    'Model fit: predictive performance on cross-validation (e.g. R² or AUC) is above ' +
    'the acceptance threshold.',
  CUM_VIP:
    'Cumulative variable importance: the most important predictors together explain a ' +
    'sufficient share of the model, so it relies on meaningful drivers.',
  DEV:
    'Deviation: the spread between bootstrap projections is small enough for the ' +
    'predicted patterns to be robust.',
};

/** Full names of the modelling algorithms in the `algorithm` dimension. */
export const algorithmDescriptions = {
  GLM: 'Generalised Linear Model: a regression linking the target to linear combinations of the predictors.',
  GAM: 'Generalised Additive Model: a regression using smooth, non-linear responses to each predictor.',
  BRT: 'Boosted Regression Trees: an ensemble of small decision trees, each fitted to the errors of the previous ones.',
  RF: 'Random Forest: an ensemble of decision trees trained on random subsets of the data and predictors.',
  SVM: 'Support Vector Machine: a kernel-based method that fits a flexible boundary or regression surface.',
  MLP: 'Multi-Layer Perceptron: a feed-forward neural network capturing complex non-linear relationships.',
};

export const noDescriptionText = 'No description available.';

export const softwareCredit = 'Backend & Frontend: Rada Kamysheva';
