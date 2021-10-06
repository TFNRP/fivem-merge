'use strict';

const fs = require('fs');
const nodePath = require('path');
const xml = require('fast-xml-parser');
const { isEqual } = require('lodash');
const lua = require('luaparse');
const Manifest = require('./Manifest');

class Util extends null {
  static parseManifest(src) {
    const parsed = lua.parse(src, {
      comments: false,
      luaVersion: '5.1',
    });
    const object = {};
    for (const item of parsed.body) {
      switch (item.type) {
        case 'CallStatement': {
          switch (item.expression.type) {
            case 'StringCallExpression': {
              switch (item.expression.base.type) {
                case 'StringCallExpression': {
                  if (
                    item.expression.base.base.type === 'Identifier' &&
                    item.expression.argument.type === 'StringLiteral' &&
                    item.expression.base.argument.type === 'StringLiteral'
                  ) {
                    if (!object[item.expression.base.base.name]) object[item.expression.base.base.name] = {};
                    if (
                      ["'", '"'].includes(Util.arrayAt(item.expression.base.argument.raw, 0)) &&
                      ["'", '"'].includes(Util.arrayAt(item.expression.base.argument.raw, -1))
                    ) {
                      item.expression.base.argument.raw = item.expression.base.argument.raw.slice(1, -1);
                    }
                    if (
                      ["'", '"'].includes(Util.arrayAt(item.expression.argument.raw, 0)) &&
                      ["'", '"'].includes(Util.arrayAt(item.expression.argument.raw, -1))
                    ) {
                      item.expression.argument.raw = item.expression.argument.raw.slice(1, -1);
                    }
                    object[item.expression.base.base.name][item.expression.base.argument.raw] =
                      item.expression.argument.raw;
                  }
                  break;
                }
                case 'Identifier': {
                  if (item.expression.argument.type === 'StringLiteral') {
                    if (!object[item.expression.base.name]) object[item.expression.base.name] = {};
                    if (
                      ["'", '"'].includes(Util.arrayAt(item.expression.argument.raw, 0)) &&
                      ["'", '"'].includes(Util.arrayAt(item.expression.argument.raw, -1))
                    ) {
                      item.expression.argument.raw = item.expression.argument.raw.slice(1, -1);
                    }
                    object[item.expression.base.name][Object.keys(object[item.expression.base.name]).length] =
                      item.expression.argument.raw;
                  }
                  break;
                }
              }
              break;
            }

            case 'TableCallExpression': {
              if (
                item.expression.base.type === 'Identifier' &&
                item.expression.arguments.type === 'TableConstructorExpression'
              ) {
                if (!object[item.expression.base.name]) object[item.expression.base.name] = {};
                for (const field of item.expression.arguments.fields) {
                  switch (field.type) {
                    case 'TableValue': {
                      if (field.value.type === 'StringLiteral') {
                        if (
                          ["'", '"'].includes(Util.arrayAt(field.value.raw, 0)) &&
                          ["'", '"'].includes(Util.arrayAt(field.value.raw, -1))
                        ) {
                          field.value.raw = field.value.raw.slice(1, -1);
                        }

                        object[item.expression.base.name][Object.keys(object[item.expression.base.name]).length] =
                          field.value.raw;
                      }
                      break;
                    }
                    case 'TableKey': {
                      break;
                    }
                  }
                }
              }
              break;
            }
          }
          break;
        }
      }
    }

    return object;
  }

  static parseMeta(path) {
    return xml.parse(fs.readFileSync(path, { encoding: 'utf8' }), {
      ignoreAttributes: false,
    });
  }

  static unparseMeta(object, { lint = true } = {}) {
    let str = new xml.j2xParser({
      ignoreAttributes: false,
      format: lint,
      supressEmptyNode: false,
      indentBy: '  ',
    }).parse(object);
    return `<?xml version="1.0" encoding="UTF-8"?>${lint ? '\n' : ''}${str}`;
  }

  static mergeMeta(meta0, meta1) {
    const meta = Object.assign({}, meta0);

    for (const name in meta1) {
      if (typeof meta1[name] === 'object' && meta1[name] !== null && name !== 'Item') {
        meta[name] = Util.mergeMeta(meta[name], meta1[name]);
      } else if (meta1[name] !== '') {
        if ([undefined, null].includes(meta[name])) {
          meta[name] = meta1[name];
        } else {
          const fixedMeta1Array = Array.isArray(meta1[name]) ? meta1[name] : [meta1[name]];
          if (!Array.isArray(meta[name])) meta[name] = [meta[name]];
          for (const fixedMeta1 of fixedMeta1Array) {
            if (!meta[name].some(v => isEqual(v, fixedMeta1))) meta[name].push(fixedMeta1);
          }
        }
      }
    }

    return meta;
  }

  static mergeManifest({ path = null, files = [], data_files = [] } = {}) {
    if (path && fs.existsSync(path)) {
      const src = fs.readFileSync(path, { encoding: 'utf8' });
      const manifest = new Manifest(Util.parseManifest(src));
      for (const file of Object.values(manifest.file ?? {})) {
        if (!files.includes(file)) files.unshift(file);
      }
      for (const dataName in manifest.data_file) {
        const text = `'${dataName}' '${manifest.data_file[dataName]}'`;
        if (!data_files.includes(text)) data_files.unshift(text);
      }
    }
    // Why i like common-tags
    return (
      `fx_version 'cerulean'\n` +
      `game 'gta5'\n\n` +
      `${files.length > 0 ? `files {\n${files.map(file => `  '${file}'`).join(',\n')}\n}\n` : ''}` +
      `${data_files.length > 0 ? `${data_files.map(file => `data_file ${file}`).join('\n')}\n` : ''}`
    );
  }

  // Polyfill for Array.prototype.at
  static arrayAt(array, n) {
    n = Math.trunc(n) || 0;
    if (n < 0) n += array.length;
    if (n < 0 || n >= array.length) return undefined;
    return array[n];
  }

  // Polyfill for fs.cpSync
  static copyRecursive(source, destination) {
    if (!fs.existsSync(source)) fs.mkdirSync(source);
    if (!fs.existsSync(destination)) fs.mkdirSync(destination);
    for (const ent of fs.readdirSync(source, { withFileTypes: true })) {
      if (ent.isDirectory()) {
        Util.copyRecursive(nodePath.join(source, ent.name), nodePath.join(destination, ent.name));
      } else if (ent.isFile()) {
        fs.copyFileSync(nodePath.join(source, ent.name), nodePath.join(destination, ent.name));
      }
    }
  }

  // Polyfill for fs.cpSync
  static removeRecursive(source) {
    for (const ent of fs.readdirSync(source, { withFileTypes: true })) {
      if (ent.isDirectory()) {
        Util.removeRecursive(nodePath.join(source, ent.name));
      } else if (ent.isFile()) {
        fs.unlinkSync(nodePath.join(source, ent.name));
      }
    }
    fs.rmdirSync(source);
  }
}

module.exports = Util;
