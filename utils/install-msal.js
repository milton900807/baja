const fs = require('fs');
const path = require('path');
const tar = require('tar');
const zlib = require('zlib');

const tarGzFilePath = './utils/msal.tar.gz';
const extractionDirectory = './node_modules';

// Create the extraction directory if it doesn't exist
if (!fs.existsSync(extractionDirectory)) {
  fs.mkdirSync(extractionDirectory);
}

// Create a readable stream from the tar.gz file
const readStream = fs.createReadStream(tarGzFilePath);

// Create a transform stream to decompress the gzip data
const gunzip = zlib.createGunzip();

// Create a tar parser stream to extract the contents
const extractor = tar.extract({
  cwd: extractionDirectory,
});

// Pipe the streams to extract the contents
readStream.pipe(gunzip).pipe(extractor);

// Listen for the 'finish' event to know when extraction is complete
extractor.on('finish', () => {
  console.log('Extraction complete.');
});

// Handle errors
readStream.on('error', (error) => {
  console.error('Error reading the tar.gz file:', error);
});

gunzip.on('error', (error) => {
  console.error('Error decompressing the gzip data:', error);
});

extractor.on('error', (error) => {
  console.error('Error extracting the contents:', error);
});

