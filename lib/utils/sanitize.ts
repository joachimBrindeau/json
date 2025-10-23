export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') {
    return '';
  }
  return input
    .trim()
    .replace(/[<>\'"&]/g, '')
    .substring(0, 1000);
}
