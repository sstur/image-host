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
import { SECRET_KEY } from '../support/constants';
import { pipeStreamAsync } from '../support/pipeStreamAsync';

const uploadsDirRelative = '../../uploads';
const uploadsDir = resolve(__dirname, uploadsDirRelative);

// TODO: Wrap each of these in a try/catch
export default (app: Application) => {
  app.get('/images/:fileName', async (request, response, next) => {
    const fileName = request.params.fileName ?? '';
    const imageDetails = validateImageFileName(fileName);
    if (!imageDetails) {
      return next();
    }
    const filePath = resolve(uploadsDir, fileName);
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      return next();
    }
    const readStream = createReadStream(filePath);
    await pipeStreamAsync(readStream, response, {
      beforeFirstWrite: () => {
        response.header('Content-Type', imageDetails.type);
      },
    });
  });

  app.post('/images', async (request, response) => {
    const authHeader = request.header('authorization') ?? '';
    const secretKey = authHeader.replace(/^Bearer /i, '');
    if (secretKey !== SECRET_KEY) {
      response.status(401).send({ error: 'Unauthorized' });
      return;
    }
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
    const writeStream = createWriteStream(filePath);
    await pipeStreamAsync(request, writeStream);
    response.json({
      id,
      fileName,
      url: toFullyQualifiedUrl(fileName),
    });
  });
};
