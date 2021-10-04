<h2 align="center">FiveM Merge</h2>

<p align="center">
<a href="https://travis-ci.com/github/TFNRP/fivem-merge"><img href="https://www.travis-ci.com/github/TFNRP/fivem-merge" alt="Travis" src="https://app.travis-ci.com/TFNRP/fivem-merge.svg?branch=main"></a>
<a href="https://patreon.com/yeen"><img alt="Patreon" src="https://img.shields.io/badge/patreon-donate?color=F77F6F&labelColor=F96854&logo=patreon&logoColor=ffffff"></a>
<a href="https://discord.gg/xHaPKfSDtu"><img alt="Discord" src="https://img.shields.io/discord/463778631551025187?color=7389D8&labelColor=6A7EC2&logo=discord&logoColor=ffffff"></a>
</p>

## Table of Contents

- [About](#about)
- [Documentation](#documentation)
  - [CLI](#cli)
  - [API](#api)

## About

Fivem API for vehicle resource packing.

## Documentation

### CLI

```sh
$ vmerge --help
```

### API

```js
const merge = require('fivem-merge');
/**
 * The relative paths to the resources to merge
 * @type {(string|string[])}
 */
const paths = './'
/**
 * Options for vMerge
 * @type {Object}
 */
const options = {
  /**
   * The location to move the merged resource into
   * @type {string}
   */
  outputPath: './vehicles',
  /**
   * A preferred temp path. Uses `os.tmpdir()` by default
   * @type {string}
   * @default undefined
   */
  tempPath: null,
  /**
   * Additional info logging
   * @type {boolean}
   * @default false
   */
  verbose: true,
  /**
   * Whether output XML should be linted for human readability
   * @type {Boolean}
   * @default true
   */
  lintOutput: true,
}

/**
 * Merges FiveM vehicle resources
 * @param {(string|string[])} paths The relative paths to the resources to merge
 * @param {VMergeOptions} options Options to use with vMerge
 * @returns {Promise<boolean>}
 */
merge(paths, options)
```
