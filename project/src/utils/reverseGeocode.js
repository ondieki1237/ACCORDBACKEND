import fetch from 'node-fetch';

/**
 * Reverse geocode latitude and longitude to a human-readable address using OpenStreetMap Nominatim API
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<string>} Human-readable address or 'Unknown location'
 */
export async function reverseGeocode(latitude, longitude) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AccordBackend/1.0 (contact@accordmedical.co.ke)'
      }
    });
    if (!response.ok) return 'Unknown location';
    const data = await response.json();
    return data.display_name || 'Unknown location';
  } catch (err) {
    return 'Unknown location';
  }
}
