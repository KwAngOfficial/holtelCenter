export const SITE = {
  name: 'Sao Dem Holtel',
  phone: '0866642875',
  phoneDisplay: '0866 642 875',
  mapsUrl: 'https://maps.app.goo.gl/eoPmS2PiKxnyPRer9',
  placeName: 'Nhà Nghỉ Sao Đêm',
  coordinates: {
    lat: 21.1884541,
    lng: 106.0027352,
  },
} as const;

/** Port API backend (VPS / local) */
export const API_PORT = 5161;

/** Fallback khi deploy Vercel (không cùng VPS) */
export const PRODUCTION_API_URL =
  (import.meta.env.VITE_PRODUCTION_API_URL as string | undefined) ??
  'https://holtelcenter.onrender.com/api';

export function isLocalHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export function isLocalApiUrl(url: string) {
  return url.includes('localhost') || url.includes('127.0.0.1');
}

export const MAPS_EMBED_URL = `https://maps.google.com/maps?q=${SITE.coordinates.lat},${SITE.coordinates.lng}&hl=vi&z=17&output=embed`;

export const MAPS_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${SITE.coordinates.lat},${SITE.coordinates.lng}&travelmode=driving`;
