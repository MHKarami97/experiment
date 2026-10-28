/**
 * SI Unit formatting, conversion, and localized digit conversion
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(input: string | number): string {
  const str = String(input);
  return str.replace(/\d/g, (char) => PERSIAN_DIGITS[Number(char)] ?? char);
}

export interface FormatOptions {
  decimals?: number;
  usePersianDigits?: boolean;
  unit?: string;
  significantDigits?: number;
}

export function formatScientificValue(
  value: number,
  options: FormatOptions = {}
): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '—';
  }

  if (!Number.isFinite(value)) {
    return value > 0 ? '+∞' : '-∞';
  }

  let formatted: string;

  if (options.significantDigits !== undefined) {
    formatted = value.toPrecision(options.significantDigits);
  } else {
    const decimals = options.decimals ?? 2;
    // Avoid -0.00
    if (Math.abs(value) < Math.pow(10, -decimals) / 2) {
      formatted = (0).toFixed(decimals);
    } else {
      formatted = value.toFixed(decimals);
    }
  }

  if (options.usePersianDigits) {
    formatted = toPersianDigits(formatted);
  }

  if (options.unit) {
    return `${formatted} ${options.unit}`;
  }

  return formatted;
}

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}
