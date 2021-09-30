#!/usr/bin/env node

'use strict';

const mri = require('mri');
const chalk = require('chalk');
const merge = require('../src');
const fs = require('fs');

const parsed = mri(process.argv.slice(2))

if ((parsed.version ?? parsed.v) || parsed._[0] === 'version') {
  console.log(`fivem-merge v${require('../package.json').version}`);

  process.exit();
}

if ((parsed.help ?? parsed.h) || parsed._[0] === 'help' || Object.keys(parsed).length === 1) {
  console.log(`  Usage:`);
  console.log(`    ${chalk.yellow('vmerge')} <...paths> -o <path>  Merge two or more resources and output them at ${chalk.whiteBright('path')}`);
  console.log(`    ${chalk.yellow('vmerge help')}                  This.`);
  console.log(`    ${chalk.yellow('vmerge version')}               The version of this package.`);
  console.log();
  console.log(`  Options:`);
  console.log(`    ${chalk.yellow('--output , -o')}  The merge destination.`);
  console.log(`    ${chalk.yellow('--help   , -h')}  This.`);
  console.log(`    ${chalk.yellow('--verbose, -v')}  Enable additional info.`);
  console.log(`    ${chalk.yellow('--no-lint, -l')}  Enable this to disable meta linting.`);
  console.log();
  console.log(`  Examples:`);
  console.log(`    ${chalk.yellow('- Merge bmw3, bmw4 and 18bmw into bmws')}`);
  console.log(`    vmerge ./bmw3 ./bmw4 ./18bmw ${chalk.grey('--output')} ./bmws`);

  process.exit();
}

const paths = [...parsed._];
function hmBool(name) {
  if (name in parsed) {
    if (typeof parsed[name] === 'string') paths.push(parsed[name]);
    return true;
  }
  return false;
}
const noLint = hmBool('no-lint') ?? hmBool('l') ?? false;
const verb = hmBool('verbose') ?? hmBool('v') ?? false;
const output = parsed.output ?? parsed.o;

if (!output) {
  console.warn(`The ${chalk.grey('--output')} option is required.`);
  process.exit();
}

if (!(0 in paths)) {
  console.warn(`Please supply some paths to resources to merge.`);
  process.exit();
}

if (fs.existsSync(output)) {
  console.warn(`${chalk.grey('fivem-merge')} cannot output files into an already existing directory.`);
  process.exit();
}

for (const path of paths) {
  if (!fs.existsSync(path)) {
    console.warn(`The resource ${chalk.grey(path)} does not exist.`);
    process.exit();
  }
}

merge(paths, {
  verbose: verb,
  outputPath: output,
  lintOutput: !noLint,
})