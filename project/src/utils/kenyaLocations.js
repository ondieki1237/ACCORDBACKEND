/**
 * Kenya Counties and Major Cities Geocoding Data
 * Provides fallback coordinates for machine locations
 */

export const kenyaCounties = {
    // Central Kenya
    'nairobi': { lat: -1.2921, lng: 36.8219, name: 'Nairobi' },
    'kiambu': { lat: -1.1714, lng: 36.8356, name: 'Kiambu' },
    'murang\'a': { lat: -0.7833, lng: 37.0000, name: 'Murang\'a' },
    'nyeri': { lat: -0.4167, lng: 36.9500, name: 'Nyeri' },
    'nyandarua': { lat: -0.1833, lng: 36.5167, name: 'Nyandarua' },
    'kirinyaga': { lat: -0.6589, lng: 37.3831, name: 'Kirinyaga' },

    // Coast
    'mombasa': { lat: -4.0435, lng: 39.6682, name: 'Mombasa' },
    'kwale': { lat: -4.1833, lng: 39.4500, name: 'Kwale' },
    'kilifi': { lat: -3.6308, lng: 39.8494, name: 'Kilifi' },
    'tana river': { lat: -1.5167, lng: 39.8833, name: 'Tana River' },
    'lamu': { lat: -2.2717, lng: 40.9020, name: 'Lamu' },
    'taita taveta': { lat: -3.3167, lng: 38.3500, name: 'Taita Taveta' },

    // Eastern
    'machakos': { lat: -1.5177, lng: 37.2634, name: 'Machakos' },
    'makueni': { lat: -2.2667, lng: 37.8333, name: 'Makueni' },
    'kitui': { lat: -1.3667, lng: 38.0167, name: 'Kitui' },
    'embu': { lat: -0.5333, lng: 37.4500, name: 'Embu' },
    'tharaka nithi': { lat: -0.3667, lng: 37.7167, name: 'Tharaka Nithi' },
    'meru': { lat: 0.0500, lng: 37.6500, name: 'Meru' },
    'isiolo': { lat: 0.3556, lng: 37.5833, name: 'Isiolo' },
    'marsabit': { lat: 2.3333, lng: 37.9833, name: 'Marsabit' },

    // North Eastern
    'garissa': { lat: -0.4536, lng: 39.6401, name: 'Garissa' },
    'wajir': { lat: 1.7500, lng: 40.0667, name: 'Wajir' },
    'mandera': { lat: 3.9167, lng: 41.8333, name: 'Mandera' },

    // Nyanza
    'kisumu': { lat: -0.0917, lng: 34.7680, name: 'Kisumu' },
    'siaya': { lat: -0.0667, lng: 34.2833, name: 'Siaya' },
    'homa bay': { lat: -0.5167, lng: 34.4500, name: 'Homa Bay' },
    'migori': { lat: -1.0634, lng: 34.4731, name: 'Migori' },
    'kisii': { lat: -0.6833, lng: 34.7667, name: 'Kisii' },
    'nyamira': { lat: -0.5667, lng: 34.9333, name: 'Nyamira' },

    // Rift Valley
    'nakuru': { lat: -0.3031, lng: 36.0800, name: 'Nakuru' },
    'narok': { lat: -1.0833, lng: 35.8667, name: 'Narok' },
    'kajiado': { lat: -2.0978, lng: 36.7820, name: 'Kajiado' },
    'kericho': { lat: -0.3667, lng: 35.2833, name: 'Kericho' },
    'bomet': { lat: -0.7833, lng: 35.3167, name: 'Bomet' },
    'kakamega': { lat: 0.2827, lng: 34.7519, name: 'Kakamega' },
    'vihiga': { lat: 0.0667, lng: 34.7167, name: 'Vihiga' },
    'bungoma': { lat: 0.5635, lng: 34.5606, name: 'Bungoma' },
    'busia': { lat: 0.4346, lng: 34.1115, name: 'Busia' },
    'trans nzoia': { lat: 1.0500, lng: 34.9500, name: 'Trans Nzoia' },
    'uasin gishu': { lat: 0.5500, lng: 35.3000, name: 'Uasin Gishu' },
    'elgeyo marakwet': { lat: 0.8333, lng: 35.4667, name: 'Elgeyo Marakwet' },
    'nandi': { lat: 0.1833, lng: 35.1167, name: 'Nandi' },
    'baringo': { lat: 0.4667, lng: 36.0833, name: 'Baringo' },
    'laikipia': { lat: 0.3667, lng: 36.7833, name: 'Laikipia' },
    'samburu': { lat: 1.2167, lng: 36.9500, name: 'Samburu' },
    'turkana': { lat: 3.1167, lng: 35.6000, name: 'Turkana' },
    'west pokot': { lat: 1.6167, lng: 35.3667, name: 'West Pokot' },

    // Western
    'kakamega': { lat: 0.2827, lng: 34.7519, name: 'Kakamega' },
    'vihiga': { lat: 0.0667, lng: 34.7167, name: 'Vihiga' },
    'bungoma': { lat: 0.5635, lng: 34.5606, name: 'Bungoma' },
    'busia': { lat: 0.4346, lng: 34.1115, name: 'Busia' },
};

export const majorCities = {
    'nairobi': { lat: -1.2921, lng: 36.8219, name: 'Nairobi' },
    'mombasa': { lat: -4.0435, lng: 39.6682, name: 'Mombasa' },
    'kisumu': { lat: -0.0917, lng: 34.7680, name: 'Kisumu' },
    'nakuru': { lat: -0.3031, lng: 36.0800, name: 'Nakuru' },
    'eldoret': { lat: 0.5143, lng: 35.2698, name: 'Eldoret' },
    'thika': { lat: -1.0332, lng: 37.0690, name: 'Thika' },
    'malindi': { lat: -3.2167, lng: 40.1167, name: 'Malindi' },
    'kitale': { lat: 1.0167, lng: 35.0000, name: 'Kitale' },
    'garissa': { lat: -0.4536, lng: 39.6401, name: 'Garissa' },
    'kakamega': { lat: 0.2827, lng: 34.7519, name: 'Kakamega' },
    'nyeri': { lat: -0.4167, lng: 36.9500, name: 'Nyeri' },
    'machakos': { lat: -1.5177, lng: 37.2634, name: 'Machakos' },
    'meru': { lat: 0.0500, lng: 37.6500, name: 'Meru' },
    'embu': { lat: -0.5333, lng: 37.4500, name: 'Embu' },
    'kericho': { lat: -0.3667, lng: 35.2833, name: 'Kericho' },
    'kisii': { lat: -0.6833, lng: 34.7667, name: 'Kisii' },
};

/**
 * Geocode a location string to coordinates
 * @param {string} locationString - Location name (e.g., "Nairobi", "Mombasa County")
 * @returns {object|null} - { lat, lng, name } or null if not found
 */
export function geocodeLocation(locationString) {
    if (!locationString || typeof locationString !== 'string') {
        return null;
    }

    const normalized = locationString.toLowerCase().trim();

    // Try exact match in major cities first
    if (majorCities[normalized]) {
        return majorCities[normalized];
    }

    // Try exact match in counties
    if (kenyaCounties[normalized]) {
        return kenyaCounties[normalized];
    }

    // Try partial match (e.g., "Nairobi County" -> "nairobi")
    for (const [key, value] of Object.entries(majorCities)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return value;
        }
    }

    for (const [key, value] of Object.entries(kenyaCounties)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return value;
        }
    }

    return null;
}

/**
 * Get Kenya center coordinates for map initialization
 * @returns {object} - { lat, lng, zoom }
 */
export function getKenyaCenter() {
    return {
        lat: 0.0236,
        lng: 37.9062,
        zoom: 6
    };
}

/**
 * Generate a color for a machine model
 * Uses a consistent hash-based color generation
 * @param {string} model - Machine model name
 * @returns {string} - Hex color code
 */
export function getColorForModel(model) {
    if (!model) return '#808080'; // Gray for unknown

    // Predefined colors for common models (you can customize these)
    const predefinedColors = {
        'xray': '#3B82F6',      // Blue
        'ct scanner': '#EF4444', // Red
        'ultrasound': '#10B981', // Green
        'mri': '#8B5CF6',        // Purple
        'ecg': '#F59E0B',        // Amber
        'ventilator': '#EC4899', // Pink
        'dialysis': '#14B8A6',   // Teal
        'anesthesia': '#F97316', // Orange
    };

    // Check for predefined colors (case-insensitive partial match)
    const modelLower = model.toLowerCase();
    for (const [key, color] of Object.entries(predefinedColors)) {
        if (modelLower.includes(key)) {
            return color;
        }
    }

    // Generate color from hash for other models
    let hash = 0;
    for (let i = 0; i < model.length; i++) {
        hash = model.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Convert to HSL for better color distribution
    const hue = Math.abs(hash % 360);
    const saturation = 65 + (Math.abs(hash) % 20); // 65-85%
    const lightness = 45 + (Math.abs(hash >> 8) % 15); // 45-60%

    return hslToHex(hue, saturation, lightness);
}

/**
 * Convert HSL to Hex color
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} - Hex color code
 */
function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) {
        r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
        r = c; g = 0; b = x;
    }

    const toHex = (val) => {
        const hex = Math.round((val + m) * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default {
    kenyaCounties,
    majorCities,
    geocodeLocation,
    getKenyaCenter,
    getColorForModel
};
