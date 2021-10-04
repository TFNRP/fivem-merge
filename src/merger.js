'use strict';

const fs = require('fs');
const nodePath = require('path');
const md5Dir = require('md5-dir/promise');
const mv = require('mv');
const Constants = require('./util/Constants');
const Manifest = require('./util/Manifest');
const Util = require('./util/Util');

/**
 * Options for vMerge
 * @typedef {Object} VMergeOptions
 * @property {string} outputPath The location to move the merged resource into
 * @property {string} [tempPath] A preferred temp path. Uses `os.tmpdir()` by default
 * @property {boolean} [verbose=false] Additional info logging
 * @property {boolean} [lintOutput=true] Whether output XML should be linted for human readability
 * @property {(string|string[])} [paths]
 */

/**
 * Merges FiveM vehicle resources
 * @param {(string|string[])} paths The relative paths to the resources to merge
 * @param {VMergeOptions} options Options to use with vMerge
 * @returns {Promise<boolean>}
 */
async function merge(paths, options) {
  if (typeof paths === 'string') paths = [paths];
  if (!Array.isArray(paths) && typeof options === 'object' && options !== null) {
    // @ts-ignore
    options = paths;
    paths = options.paths;
  }
  options = Object.assign({}, Constants.DefaultOptions, options);
  if (!Array.isArray(paths)) throw new TypeError(`paths must be an array, got '${typeof paths}'.`);
  if (typeof options !== 'object' || options === null) {
    throw new TypeError(`options must be type of object, got '${typeof options}'.`);
  }
  if (typeof options.outputPath !== 'string') {
    throw new TypeError(`options.outputPath must be type of string, got '${typeof options.outputPath}'.`);
  }
  if (!fs.existsSync(options.tempPath)) throw new Error(`ENOENT: tempPath does not exist`);
  if (!fs.statSync(options.tempPath).isDirectory()) throw new Error(`ENOTDIR: tempPath must be a directory`);

  let info;
  if (options.verbose) info = console.info;
  else info = () => {}; // eslint-disable-line no-empty-function

  let tempPath;
  for (let i = 0; i < paths.length; i++) {
    const path = nodePath.isAbsolute(paths[i]) ? paths[i] : nodePath.join(process.cwd(), paths[i]);
    info(`Tasking '${path}'`);
    if (!fs.existsSync(path)) throw new Error(`ENOENT: the path you provided does not exist, '${path}'`);

    let manifestPath;
    if (fs.existsSync((manifestPath = nodePath.join(path, 'fxmanifest.lua')))) {
      info(`Parsing FXv2 manifest.`);
    } else if (fs.existsSync((manifestPath = nodePath.join(path, '__resource.lua')))) {
      process.emitWarning(
        'FXv1 manifests are deprecated and will no longer be supported in the future.',
        'DeprecationWarning',
        'MANIFEST',
      );
      // So far, no breakages have occurred from the drastic version difference, but we still are warning
      // you that we will not continue our support for FXv1 if it becomes too much of a burden.
      // stop using FXv1 anyway
      info(`Parsing FXv1 manifest.`);
    } else {
      const dirs = [];
      for (const ent of fs.readdirSync(path, { withFileTypes: true })) {
        if (ent.isDirectory()) dirs.push(nodePath.join(path, ent.name));
      }
      if (dirs.length > 0) {
        return merge([...dirs, ...paths.slice(0, i), ...paths.slice(i, -1)], Object.assign({}, options));
      } else {
        console.warn(`Directory './${nodePath.relative(process.cwd(), path)}' contains no resources. Continuing...`);
        continue;
      }
    }

    if (!tempPath) {
      // eslint-disable-next-line no-await-in-loop
      tempPath = nodePath.join(options.tempPath, `fvm-temp-${await md5Dir(path)}`);
      info(`Creating temp directory at ${tempPath}`);
      if (fs.existsSync(tempPath)) Util.removeRecursive(tempPath);
      fs.mkdirSync(tempPath);
      fs.mkdirSync(nodePath.join(tempPath, 'data'));
      fs.mkdirSync(nodePath.join(tempPath, 'stream'));
    }

    if (!fs.existsSync(nodePath.join(path, 'stream'))) {
      console.warn(`The resource '${nodePath.basename(path)}' doesn't have any streamed assets. Continuing...`);
      continue;
    }

    // From here, we will be assuming they are using Cerulean due to lack of changes in api we use
    const manifest = new Manifest(Util.parseManifest(fs.readFileSync(manifestPath, { encoding: 'utf8' })));
    if (manifest.client_script || manifest.server_script) {
      process.emitWarning(
        `The fivem merge library does not automatically add server/client scripts. ` +
          `You will have to do this manually for ${nodePath.basename(path)}.`,
      );
    }
    const dataFiles = [];

    for (const dataName in manifest.data_file) {
      if (!Constants.DataFileNames[dataName]) {
        process.emitWarning(
          `The fivem merge library cannot merge the '${dataName}' data file. ` +
            `You will have to do this manually for ${nodePath.basename(path)}.`,
        );
        continue;
      }
      const dataPath = nodePath.join(path, manifest.data_file[dataName]);
      if (!fs.existsSync(dataPath)) continue;
      const dataTempPath = nodePath.join(tempPath, 'data', Constants.DataFileNames[dataName]);
      dataFiles.push(dataName);

      if (fs.existsSync(dataTempPath)) {
        info(`Merging meta file '${dataName}' ${dataPath}`);
        info('Parsing.');
        const parsed = Util.parseMeta(dataPath);
        info('Merging.');
        const merged = Util.mergeMeta(parsed, Util.parseMeta(dataTempPath));
        info('Formatting XML.');
        const unparsed = Util.unparseMeta(merged, { lint: options.lintOutput });
        info('Writing.');
        fs.writeFileSync(dataTempPath, unparsed, { encoding: 'utf8' });
      } else {
        info(`Copying meta file '${dataName}' to ${dataTempPath}`);
        fs.copyFileSync(dataPath, dataTempPath, fs.constants.COPYFILE_EXCL);
      }
    }

    // Create manifest
    fs.writeFileSync(
      nodePath.join(tempPath, 'fxmanifest.lua'),
      Util.mergeManifest({
        files: dataFiles.map(r => `data/${Constants.DataFileNames[r]}`),
        data_files: dataFiles.map(r => `'${r}' 'data/${Constants.DataFileNames[r]}'`),
        path: nodePath.join(tempPath, 'fxmanifest.lua'),
      }),
      { encoding: 'utf8' },
    );

    // Copy assets
    for (const ent of fs.readdirSync(nodePath.join(path, 'stream'), { withFileTypes: true })) {
      if (ent.isDirectory()) {
        Util.copyRecursive(nodePath.join(path, 'stream', ent.name), nodePath.join(tempPath, 'stream', ent.name));
      } else if (ent.isFile()) {
        const name = ent.name.replace(/(_hi)?.yft$/, '').replace(/(\+hi)?.ytd$/, '');
        if (!ent.name.endsWith('.yft') && !ent.name.endsWith('.ytd')) continue;
        const dir = nodePath.join(tempPath, 'stream', name);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        fs.copyFileSync(nodePath.join(path, 'stream', ent.name), nodePath.join(dir, ent.name));
      }
    }
  }

  // Move assets
  // eslint-disable-next-line no-empty-function
  mv(tempPath, options.outputPath, error => {
    if (error) throw error;
  });

  return true;
}

module.exports = merge;
