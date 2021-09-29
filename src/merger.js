'use strict';

const fs = require('fs');
const nodePath = require('path');
const md5Dir = require('md5-dir/promise');
const Constants = require('./util/Constants');
const Manifest = require('./util/Manifest');
const Util = require('./util/Util');

async function merge(paths, options) {
  if (!Array.isArray(paths) && typeof options === 'object' && options !== null) {
    options = paths;
    paths = options.paths;
  }
  options = Object.assign({}, Constants.DefaultOptions, options);
  if (!Array.isArray(paths)) throw new TypeError(`paths must be an array, got '${typeof paths}'.`);
  if (typeof options !== 'object' || options === null) {
    throw new TypeError(`options must be type of object, got '${typeof options}'.`);
  }
  if (!fs.existsSync(options.tempPath)) throw new Error(`ENOENT: tempPath does not exist`);
  if (!fs.statSync(options.tempPath).isDirectory()) throw new Error(`ENOTDIR: tempPath must be a directory`);

  let info;
  if (options.verbose) info = console.info;
  else info = () => {}; // eslint-disable-line no-empty-function

  let tempPath;
  for (let path of paths) {
    path = nodePath.isAbsolute(path) ? path : nodePath.join(process.cwd(), path);
    info(`Tasking '${path}'`);
    if (!fs.existsSync(path)) throw new Error(`ENOENT: the path you provided does not exist, '${path}'`);
    if (
      typeof options.outputPath !== 'string' &&
      paths[0] &&
      nodePath.join(path, '..') !== nodePath.join(paths[0], '..')
    ) {
      throw new Error(`Cannot merge folders to an ambigious output directory. Please use 'options.outputPath'`);
    }
    if (!fs.existsSync(nodePath.join(path, 'stream'))) {
      console.warn(`The resource '${nodePath.basename(path)}' doesn't have any streamed assets. Continuing...`);
      continue;
    }

    if (!tempPath) {
      // eslint-disable-next-line no-await-in-loop
      tempPath = nodePath.join(options.tempPath, `fvm-temp-${await md5Dir(path)}`);
      info(`Creating temp directory at ${tempPath}`);
      if (fs.existsSync(tempPath)) fs.rmSync(tempPath, { recursive: true });
      fs.mkdirSync(tempPath);
      fs.mkdirSync(nodePath.join(tempPath, 'data'));
      fs.mkdirSync(nodePath.join(tempPath, 'stream'));
    }

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
      throw new Error(`ENOENT: no manifest could be found in '${path}'`);
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
        fs.cpSync(nodePath.join(path, 'stream', ent.name), nodePath.join(tempPath, 'stream', ent.name), {
          force: false,
          recursive: true,
        });
      } else if (ent.isFile()) {
        const name = ent.name.replace(/(_hi)?.yft$/, '').replace(/.ytd$/, '');
        if (!ent.name.endsWith('.yft') && !ent.name.endsWith('.ytd')) continue;
        const dir = nodePath.join(tempPath, 'stream', name);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        fs.copyFileSync(nodePath.join(path, 'stream', ent.name), nodePath.join(dir, ent.name));
      }
    }
  }
}

module.exports = merge;
