import fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { resolve } from 'path';

import type { Application } from 'express';

import { createTimestamp } from '../support/timestamp';
import { createId } from '../support/createId';
import { sign } from '../support/signature';
import {
  imageByType,
  toFullyQualifiedUrl,
  validateImageFileName,
} from '../support/image';

const uploadsDirRelative = '../../uploads';
const uploadsDir = resolve(__dirname, uploadsDirRelative);

// TODO: Wrap each of these in a try/catch
export default (app: Application) => {
  app.get('/images/:fileName', (request, response, next) => {
    const fileName = request.params.fileName ?? '';
    const isValid = validateImageFileName(fileName);
    if (!isValid) {
      return next();
    }
    const filePath = resolve(uploadsDir, fileName);
    const readStream = createReadStream(filePath);
    readStream.on('error', (error) => {
      if (Object(error).code === 'ENOENT') {
        next();
      } else {
        next(error);
      }
    });
    readStream.pipe(response);
  });

  app.post('/images', async (request, response) => {
    const contentType =
      request.header('content-disposition') ??
      request.header('content-type') ??
      '';
    const imageType = imageByType.get(contentType);
    if (!imageType) {
      response.status(400).send({ error: 'Bad Request' });
      return;
    }
    const id = sign(createTimestamp() + createId() + imageType.id);
    await fs.mkdir(uploadsDir, { recursive: true });
    const fileName = id + '.' + imageType.ext;
    const filePath = resolve(uploadsDir, fileName);
    const fileStream = createWriteStream(filePath);
    request.on('end', () => {
      response.json({
        fileName,
        url: toFullyQualifiedUrl(fileName),
      });
    });
    request.pipe(fileStream);
  });
};
