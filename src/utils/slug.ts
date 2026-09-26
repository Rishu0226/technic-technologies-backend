export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const SLUG_FORMAT_ERROR = 'Slug must be lowercase words separated by hyphens.';
export const SLUG_DUPLICATE_ERROR = 'Slug already exists. Please choose another slug.';

export function cleanSlug(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function duplicateSlug(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === 11000;
}
