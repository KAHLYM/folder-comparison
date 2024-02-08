import { logger } from './logger';

var yauzl = require("yauzl");
var fs = require('fs'); 
var path = require('path');
var mkdirp = require('mkdirp');

export function _isDirectory(filepath: any): boolean {
    return /\/$/.test(filepath.fileName);
}

/* istanbul ignore next: uses file system */
export function extract(filepath: string) {
    return new Promise<void>((resolve, reject) => {
        try {
            const unzipToDir = filepath.substring(0, filepath.lastIndexOf('.')) || filepath;
            mkdirp.sync(unzipToDir);

            yauzl.open(filepath, { lazyEntries: true }, function (err: any, zipfile: any) {
                if (err) {
                    logger.error(`Yauzl failed to open ${filepath} with error ${err}`);
                    zipfile.close();
                    reject(err);
                    return;
                }

                zipfile.readEntry();

                zipfile.on('entry', (entry: any) => {
                    try {
                        if (_isDirectory(entry)) {
                            mkdirp.sync(path.join(unzipToDir, entry.fileName));
                            zipfile.readEntry();
                        }
                        else {
                            zipfile.openReadStream(entry, (readErr: any, readStream: any) => {
                                if (readErr) {
                                    logger.error(`Yauzl failed to with read stream ${filepath} with error ${err}`);
                                    zipfile.close();
                                    reject(readErr);
                                    return;
                                }

                                const file = fs.createWriteStream(path.join(unzipToDir, entry.fileName));
                                readStream.pipe(file);
                                file.on('finish', () => {
                                    file.close(() => {
                                        zipfile.readEntry();
                                    });

                                    file.on('error', (err: any) => {
                                        logger.error(`Yauzl failed to with finish ${filepath} with error ${err}`);
                                        zipfile.close();
                                        reject(err);
                                    });
                                });
                            });
                        }
                    }
                    catch (e: any) {
                        logger.error(`Yauzl failed caught error ${err}`);
                        zipfile.close();
                        reject(e);
                    }
                    zipfile.on('end', (_err: any) => {
                        resolve();
                    });
                    zipfile.on('error', (err: any) => {
                        logger.error(`Yauzl failed on error ${err}`);
                        zipfile.close();
                        reject(err);
                    });
                });
            });
        }
        catch (e: any) {
            logger.error(`Yauzl caught error e ${e}`);
            reject(e);
        }
        
        fs.rmSync(filepath, { recursive: true, force: true });
    });
}
