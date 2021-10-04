'use strict';

const merge = require('../src/merger');
const fs = require('fs');
const out = './test/output'

if (fs.existsSync(out)) (fs.rmSync ?? fs.rmdirSync)(out, { recursive: true });
merge('./test', {
  verbose: true,
  outputPath: './test/output',
})
.then(r => {
  if (r) console.info('Test done.')
  else throw new Error('Something went wrong...')
})
.catch(e => {
  throw e;
})