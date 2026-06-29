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

export const MAPS_EMBED_URL = `https://maps.google.com/maps?q=${SITE.coordinates.lat},${SITE.coordinates.lng}&hl=vi&z=17&output=embed`;

export const MAPS_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${SITE.coordinates.lat},${SITE.coordinates.lng}&travelmode=driving`;
