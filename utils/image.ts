export function getDisplayableImageUrl(imageValue?: string): string | null {
  if (!imageValue) return null;
  if (imageValue.startsWith('http://') || imageValue.startsWith('https://') || imageValue.startsWith('data:')) {
    return imageValue;
  }

  let code = '';
  try {
    const licenseStr = localStorage.getItem('license_cache') || '{}';
    code = JSON.parse(licenseStr).code || '';
  } catch {}

  if (!code) return null;

  return `https://corepanel-api.tajikr450.workers.dev/api/shop/${encodeURIComponent(code)}/image/${encodeURIComponent(imageValue)}`;
}
