'use strict';

const fs = require('fs');
const path = require('path');

// Fail the build early if Express chain (iconv-lite) is broken on the host.
const iconvRoot = path.join(__dirname, '..', 'node_modules', 'iconv-lite');
const iconvIndex = path.join(iconvRoot, 'lib', 'index.js');

if (!fs.existsSync(iconvIndex)) {
  console.error('verify-deps: iconv-lite is not installed.');
  process.exit(1);
}

const indexSource = fs.readFileSync(iconvIndex, 'utf8');
const needsMergeExports = indexSource.includes('./helpers/merge-exports');

if (needsMergeExports) {
  const mergeExports = path.join(iconvRoot, 'lib', 'helpers', 'merge-exports.js');
  if (!fs.existsSync(mergeExports)) {
    console.error(
      'verify-deps: iconv-lite expects merge-exports.js but the file is missing.'
    );
    process.exit(1);
  }
}

require('express');
console.log('verify-deps: express and iconv-lite OK');
