'use strict';

const fs = require('fs');
const path = require('path');
const StreamZip = require('node-stream-zip');

const zip = new StreamZip({
  file: './Epubs/es21_S.zip',
  storeEntries: true,
});

zip.on('error', (err) => {
  console.error('[ERROR]', err);
});

zip.on('ready', () => {
  console.log(`All entries read: ${zip.entriesCount}`);
  //console.log(zip.entries());
});

zip.on('entry', (entry) => {
  const pathname = path.resolve('./Epubs/Lab', entry.name);

  if (/\.\./.test(path.relative('./Epubs/Lab', pathname))) {
    console.warn('[zip warn]: ignoring maliciously crafted paths in zip file:', entry.name);
    return;
  }

  if ('/' === entry.name[entry.name.length - 1]) {
    console.log('[DIR]', entry.name);
    return;
  }

  console.log('[FILE]', entry.name);

  if (!entry.name.split('.').pop() == 'xhtml') {
    entry.name.split('.').pop() == 'xhtml';
    return;
  }

  zip.stream(entry.name, (err, stream) => {
    if (err) {
      console.error('Error:', err.toString());
      return;
    }

    stream.on('error', (err) => {
      console.log('[ERROR]', err);
      return;
    });

    // example: print contents to screen
    //stream.pipe(process.stdout);

    // example: save contents to file
    fs.mkdir(path.dirname(pathname), { recursive: true }, (_err) => {
      stream.pipe(fs.createWriteStream(pathname));
    });
  });
});
