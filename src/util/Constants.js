'use strict';

const os = require('os');

exports.DefaultOptions = {
  tempPath: os.tmpdir(),
  verbose: false,
  lintOutput: true,
};

exports.DataFileNames = {
  HANDLING_FILE: 'handling.meta',
  VEHICLE_METADATA_FILE: 'vehicles.meta',
  CARCOLS_FILE: 'carcols.meta',
  VEHICLE_VARIATION_FILE: 'carvariations.meta',
  VEHICLE_LAYOUTS_FILE: 'vehiclelayouts.meta',
};
