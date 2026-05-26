const ACCEPTED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
]);

const ACCEPTED_EXT = /\.(jpg|jpeg|png|heic)$/i;

export function isValidFormat(file: File): boolean {
  return ACCEPTED_MIME.has(file.type) || ACCEPTED_EXT.test(file.name);
}

export function getFormatError(file: File): string | null {
  if (!isValidFormat(file)) {
    return `"${file.name}" is not a supported format. Use JPEG, PNG, or HEIC.`;
  }
  return null;
}
