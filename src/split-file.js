import { createReadStream, createWriteStream } from 'node:fs';
import { basename, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

function splitFile(inputFileName, maxSizeMB = 5) {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const inputFile = resolve(__dirname, inputFileName);

    const fileStream = createReadStream(inputFile, { encoding: 'utf-8' });

    let fileCount = 1;
    let currentSize = 0;
    let currentFile = null;

    fileStream.on('data', (chunk) => {
        if (!currentFile || currentSize + Buffer.byteLength(chunk, 'utf-8') > maxSizeBytes) {
            if (currentFile) currentFile.end();
            const outputFileName = `${basename(inputFile, extname(inputFile))}_part${fileCount}.txt`;
            currentFile = createWriteStream(outputFileName);
            fileCount++;
            currentSize = 0;
        }

        currentFile.write(chunk);
        currentSize += Buffer.byteLength(chunk, 'utf-8');
    });

    fileStream.on('end', () => {
        if (currentFile) currentFile.end();
        console.log(`File splitting complete. Created ${fileCount - 1} files.`);
    });

    fileStream.on('error', (err) => {
        console.error('Error reading the input file:', err);
    });
}

// Example usage
const inputFilePath = 'stellar.txt'; // Replace with your file path
splitFile(inputFilePath);
