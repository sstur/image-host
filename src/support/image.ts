import { verify } from './signature';

const imageServingUrl = process.env.IMAGE_SERVING_URL ?? '';
if (!imageServingUrl) {
  throw new Error('Environment variable IMAGE_SERVING_URL not found');
}

// The single-letter identifier will be encoded into the signed file ID
const supportedImageTypes: Record<string, { type: string; ext: string }> = {
  j: { type: 'image/jpeg', ext: 'jpg' },
  p: { type: 'image/png', ext: 'png' },
};

const imageById = new Map(Object.entries(supportedImageTypes));

export const imageByType = new Map(
  Object.entries(supportedImageTypes).map(([id, { type, ext }]) => {
    return [type, { id, ext }];
  }),
);

export function validateImageFileName(fileName: string) {
  if (!fileName.match(/^\w+\.\w+$/)) {
    return false;
  }
  const [id = '', ext = ''] = fileName.split('.');
  if (!verify(id)) {
    return false;
  }
  const typeId = id.slice(0, -8).slice(-1);
  const imageType = imageById.get(typeId);
  if (!imageType || ext !== imageType.ext) {
    return false;
  }
  return true;
}

export function toFullyQualifiedUrl(fileName: string) {
  return imageServingUrl.replace('%FILE_NAME%', fileName);
}
