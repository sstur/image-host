import type { Readable, Writable } from 'stream';

type Options = {
  beforeFirstWrite?: () => void;
};

export function pipeStreamAsync(
  readStream: Readable,
  writeStream: Writable,
  options: Options = {},
) {
  const { beforeFirstWrite } = options;
  return new Promise<void>((resolve, reject) => {
    if (beforeFirstWrite) {
      readStream.once('data', beforeFirstWrite);
    }
    readStream
      .pipe(writeStream)
      .on('close', () => resolve())
      .on('error', (error) => {
        if (beforeFirstWrite) {
          readStream.off('data', beforeFirstWrite);
        }
        reject(error);
      });
  });
}
