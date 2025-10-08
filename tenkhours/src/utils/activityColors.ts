import { Activity } from '@/types';

const DEFAULT_ACTIVITY_COLORS = [
  '#4F46E5', // Indigo
  '#10B981', // Emerald
  '#F59E42', // Orange
  '#F43F5E', // Rose
  '#0EA5E9', // Sky
  '#8B5CF6', // Violet
  '#F97316', // Amber
  '#14B8A6', // Teal
  '#EC4899', // Pink
  '#FACC15', // Amber light
];

const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{6})$/;

const normalizeColor = (color: string) => color.toUpperCase();

const hslToHex = (h: number, s: number, l: number): string => {
  const sat = s / 100;
  const light = l / 100;
  const chroma = sat * Math.min(light, 1 - light);
  const huePrime = h / 60;
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1));

  const [r1, g1, b1] = (() => {
    if (huePrime < 1) return [chroma, x, 0];
    if (huePrime < 2) return [x, chroma, 0];
    if (huePrime < 3) return [0, chroma, x];
    if (huePrime < 4) return [0, x, chroma];
    if (huePrime < 5) return [x, 0, chroma];
    return [chroma, 0, x];
  })();

  const m = light - chroma / 2;
  const toHex = (component: number) => {
    const value = Math.round((component + m) * 255);
    return value.toString(16).padStart(2, '0').toUpperCase();
  };

  return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`;
};

const pickFallbackColor = (used: Set<string>, seedIndex: number): string => {
  for (const candidate of DEFAULT_ACTIVITY_COLORS) {
    const normalized = normalizeColor(candidate);
    if (!used.has(normalized)) {
      return normalized;
    }
  }

  let attempt = 0;
  while (attempt < 360) {
    const hue = Math.round(((seedIndex + attempt) * 47) % 360);
    const generated = normalizeColor(hslToHex(hue, 70, 55));
    if (!used.has(generated)) {
      return generated;
    }
    attempt += 1;
  }

  return DEFAULT_ACTIVITY_COLORS[0];
};

const sanitizeColor = (
  color: string | undefined,
  used: Set<string>,
  seedIndex: number
): string => {
  if (color) {
    const normalized = normalizeColor(color);
    if (HEX_COLOR_REGEX.test(normalized) && !used.has(normalized)) {
      return normalized;
    }
  }

  return pickFallbackColor(used, seedIndex);
};

export const ensureActivityColors = (activities: Activity[]): Activity[] => {
  const used = new Set<string>();

  return activities.map((activity, index) => {
    const color = sanitizeColor(activity.color, used, index);
    used.add(normalizeColor(color));
    return { ...activity, color };
  });
};

export const getNextActivityColor = (activities: Activity[]): string => {
  const used = new Set<string>();
  activities.forEach(activity => {
    if (activity.color && HEX_COLOR_REGEX.test(activity.color)) {
      used.add(normalizeColor(activity.color));
    }
  });

  return sanitizeColor(undefined, used, activities.length);
};

export const getPalette = () => [...DEFAULT_ACTIVITY_COLORS];

