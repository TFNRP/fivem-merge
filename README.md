<h2 align="center">FiveM Merge</h2>

<p align="center">
<a href="https://travis-ci.com/github/TFNRP/fivem-merge"><img href="https://www.travis-ci.com/github/TFNRP/fivem-merge" alt="Travis" src="https://app.travis-ci.com/TFNRP/fivem-merge.svg?branch=main"></a>
<a href="https://patreon.com/yeen"><img alt="Patreon" src="https://img.shields.io/badge/patreon-donate?color=F77F6F&labelColor=F96854&logo=patreon&logoColor=ffffff"></a>
<a href="https://discord.gg/xHaPKfSDtu"><img alt="Discord" src="https://img.shields.io/discord/463778631551025187?color=7389D8&labelColor=6A7EC2&logo=discord&logoColor=ffffff"></a>
</p>

## Table of Contents

- [About](#about)
- [Documentation](#documentation)

## About

Fivem API for vehicle resource packing.

## Documentation

```js
const merge = require('fivem-merge');
/**
 * an array of vehicle resources to merge together
 * @type {string[]}
 */
const resourcesToMerge
/** @type {Object} */
const options = {
  /**
   * whether output XML files should be linted for human readability
   * @type {Boolean}
   * @default true
   */
  lintOutput: true,
  /**
   * the output directory of the merge resource
   * @type {string}
   */
  outputPath: './vehicles',
}

merge(resourcesToMerge, options)
```
