/**
 * Core type detection system
 * Detects special data types within string values
 */

import type { DetectionResult } from '../types';

// ============================================================================
// Detection Patterns
// ============================================================================

const PATTERNS = {
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  rgbColor: /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/,
  rgbaColor: /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(0|1|0?\.\d+)\s*\)$/,
  hslColor: /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/,
  hslaColor: /^hsla\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*(0|1|0?\.\d+)\s*\)$/,
  iso8601: /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/,
  unixTimestamp: /^\d{10,13}$/,
  phone: /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
  ipv4: /^(\d{1,3}\.){3}\d{1,3}$/,
  ipv6: /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::)$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  base64: /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/,
  semver: /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/,
  currency: /^[$€£¥₹]\s*\d+([,\.]\d{3})*([,\.]\d{2})?$/,
  filesize: /^\d+(\.\d+)?\s*(B|KB|MB|GB|TB|PB)$/i,
  duration: /^(\d+d\s*)?(\d+h\s*)?(\d+m\s*)?(\d+s\s*)?(\d+ms)?$/,
  filepath: /^([a-zA-Z]:)?[\/\\]?[\w\s\-\/\\\.]+\.\w+$/,
  imageUrl: /\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i,
  videoUrl: /\.(mp4|avi|mov|wmv|flv|webm|mkv)(\?.*)?$/i,
  audioUrl: /\.(mp3|wav|ogg|m4a|aac|flac)(\?.*)?$/i,
};

// ============================================================================
// Detection Functions
// ============================================================================

export function detectURL(value: string): DetectionResult | null {
  if (!PATTERNS.url.test(value)) return null;

  try {
    const url = new URL(value);
    return {
      type: 'url',
      confidence: 1.0,
      metadata: {
        protocol: url.protocol,
        domain: url.hostname,
        path: url.pathname,
        queryParams: Object.fromEntries(url.searchParams),
        hash: url.hash,
        isSecure: url.protocol === 'https:',
      },
    };
  } catch {
    return null;
  }
}

export function detectEmail(value: string): DetectionResult | null {
  if (!PATTERNS.email.test(value)) return null;

  const [username, domain] = value.split('@');

  return {
    type: 'email',
    confidence: 1.0,
    metadata: {
      username,
      domain,
      isValid: true,
    },
  };
}

export function detectColor(value: string): DetectionResult | null {
  // Hex color
  if (PATTERNS.hexColor.test(value)) {
    return {
      type: 'color',
      confidence: 1.0,
      metadata: {
        format: 'hex',
        hex: value,
      },
    };
  }

  // RGB color
  const rgbMatch = value.match(PATTERNS.rgbColor);
  if (rgbMatch) {
    return {
      type: 'color',
      confidence: 1.0,
      metadata: {
        format: 'rgb',
        rgb: {
          r: parseInt(rgbMatch[1]),
          g: parseInt(rgbMatch[2]),
          b: parseInt(rgbMatch[3]),
        },
      },
    };
  }

  // RGBA color
  const rgbaMatch = value.match(PATTERNS.rgbaColor);
  if (rgbaMatch) {
    return {
      type: 'color',
      confidence: 1.0,
      metadata: {
        format: 'rgba',
        rgb: {
          r: parseInt(rgbaMatch[1]),
          g: parseInt(rgbaMatch[2]),
          b: parseInt(rgbaMatch[3]),
        },
        alpha: parseFloat(rgbaMatch[4]),
      },
    };
  }

  // HSL color
  const hslMatch = value.match(PATTERNS.hslColor);
  if (hslMatch) {
    return {
      type: 'color',
      confidence: 1.0,
      metadata: {
        format: 'hsl',
        hsl: {
          h: parseInt(hslMatch[1]),
          s: parseInt(hslMatch[2]),
          l: parseInt(hslMatch[3]),
        },
      },
    };
  }

  return null;
}

export function detectDate(value: string): DetectionResult | null {
  // ISO 8601
  if (PATTERNS.iso8601.test(value)) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return {
        type: 'date',
        confidence: 1.0,
        metadata: {
          format: 'iso8601',
          timestamp: date.getTime(),
          isValid: true,
        },
      };
    }
  }

  // Unix timestamp
  if (PATTERNS.unixTimestamp.test(value)) {
    const timestamp = parseInt(value);
    const date = new Date(timestamp > 9999999999 ? timestamp : timestamp * 1000);

    // Check if date is reasonable (between 1970 and 2100)
    if (date.getFullYear() >= 1970 && date.getFullYear() <= 2100) {
      return {
        type: 'date',
        confidence: 0.8,
        metadata: {
          format: 'unix',
          timestamp: date.getTime(),
          isValid: true,
        },
      };
    }
  }

  return null;
}

export function detectCoordinates(value: string | Record<string, unknown>): DetectionResult | null {
  // Object with lat/lng properties
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    const lat = obj.lat ?? obj.latitude ?? obj.Lat ?? obj.Latitude;
    const lng = obj.lng ?? obj.lon ?? obj.longitude ?? obj.Lng ?? obj.Lon ?? obj.Longitude;

    if (typeof lat === 'number' && typeof lng === 'number') {
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return {
          type: 'coordinates',
          confidence: 1.0,
          metadata: {
            lat,
            lng,
            format: 'object',
          },
        };
      }
    }
  }

  // Comma-separated string
  if (typeof value === 'string') {
    const parts = value.split(',').map((s) => s.trim());
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);

      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return {
          type: 'coordinates',
          confidence: 0.9,
          metadata: {
            lat,
            lng,
            format: 'decimal',
          },
        };
      }
    }
  }

  return null;
}

export function detectPhone(value: string): DetectionResult | null {
  if (!PATTERNS.phone.test(value)) return null;

  return {
    type: 'phone',
    confidence: 0.7,
    metadata: {
      formatted: value,
    },
  };
}

export function detectIP(value: string): DetectionResult | null {
  if (PATTERNS.ipv4.test(value)) {
    return {
      type: 'ip',
      confidence: 1.0,
      metadata: {
        version: 4,
        address: value,
      },
    };
  }

  if (PATTERNS.ipv6.test(value)) {
    return {
      type: 'ip',
      confidence: 1.0,
      metadata: {
        version: 6,
        address: value,
      },
    };
  }

  return null;
}

export function detectUUID(value: string): DetectionResult | null {
  if (!PATTERNS.uuid.test(value)) return null;

  const version = parseInt(value[14], 16);

  return {
    type: 'uuid',
    confidence: 1.0,
    metadata: {
      version,
      value,
    },
  };
}

export function detectBase64(value: string): DetectionResult | null {
  if (PATTERNS.base64.test(value)) {
    const match = value.match(PATTERNS.base64);
    return {
      type: 'base64',
      confidence: 1.0,
      metadata: {
        mimeType: match?.[1],
        isDataURI: true,
      },
    };
  }

  return null;
}

// ============================================================================
// Main Detection Function
// ============================================================================

export function detectTypes(value: unknown): DetectionResult[] {
  if (typeof value !== 'string') {
    // Check for coordinate objects
    const coordDetection = detectCoordinates(value as any);
    if (coordDetection) return [coordDetection];
    return [];
  }

  const detections: DetectionResult[] = [];

  // Run all detectors
  const urlDetection = detectURL(value);
  if (urlDetection) {
    detections.push(urlDetection);

    // Check if URL is media
    if (PATTERNS.imageUrl.test(value)) {
      detections.push({ type: 'image', confidence: 1.0, metadata: { url: value } });
    } else if (PATTERNS.videoUrl.test(value)) {
      detections.push({ type: 'video', confidence: 1.0, metadata: { url: value } });
    } else if (PATTERNS.audioUrl.test(value)) {
      detections.push({ type: 'audio', confidence: 1.0, metadata: { url: value } });
    }
  }

  const emailDetection = detectEmail(value);
  if (emailDetection) detections.push(emailDetection);

  const colorDetection = detectColor(value);
  if (colorDetection) detections.push(colorDetection);

  const dateDetection = detectDate(value);
  if (dateDetection) detections.push(dateDetection);

  const coordDetection = detectCoordinates(value);
  if (coordDetection) detections.push(coordDetection);

  const phoneDetection = detectPhone(value);
  if (phoneDetection) detections.push(phoneDetection);

  const ipDetection = detectIP(value);
  if (ipDetection) detections.push(ipDetection);

  const uuidDetection = detectUUID(value);
  if (uuidDetection) detections.push(uuidDetection);

  const base64Detection = detectBase64(value);
  if (base64Detection) detections.push(base64Detection);

  return detections;
}
