export interface FormatCurrencyDraftOptions {
  allowDecimals?: boolean;
  maxDecimals?: number;
  min?: number;
  max?: number;
}

export interface CurrencyDraftResult {
  display: string;
  canonical: string;
  numeric: number;
}

export function formatCurrency(value: number | null | undefined, maximumFractionDigits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '0';
  const normalized = Object.is(value, -0) || value === 0 ? 0 : value;
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits }).format(normalized);
}

export function formatCurrencyFull(value: number | null | undefined): string {
  return `${formatCurrency(value)}\u00a0VNĐ`;
}

export function formatCurrencyVnd(value: number | null | undefined): string {
  return `${formatCurrency(value)} VNĐ`;
}

export function parseCurrencyInput(value: string): number {
  const cleaned = String(value ?? '').trim().replace(/[^\d.,]/g, '');
  if (!cleaned) return 0;

  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');
  let normalized: string;

  if (hasComma && hasDot) {
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) {
      const withoutDots = cleaned.replace(/\./g, '');
      const idx = withoutDots.lastIndexOf(',');
      normalized = `${withoutDots.slice(0, idx).replace(/,/g, '')}.${withoutDots.slice(idx + 1)}`;
    } else {
      const withoutCommas = cleaned.replace(/,/g, '');
      const idx = withoutCommas.lastIndexOf('.');
      normalized = `${withoutCommas.slice(0, idx).replace(/\./g, '')}.${withoutCommas.slice(idx + 1)}`;
    }
  } else if (hasComma) {
    const commaCount = (cleaned.match(/,/g) ?? []).length;
    if (commaCount > 1 && /^\d{1,3}(,\d{3})+$/.test(cleaned)) {
      normalized = cleaned.replace(/,/g, '');
    } else {
      const idx = cleaned.indexOf(',');
      normalized = `${cleaned.slice(0, idx)}.${cleaned.slice(idx + 1).replace(/,/g, '')}`;
    }
  } else if (hasDot) {
    const dotCount = (cleaned.match(/\./g) ?? []).length;
    if (dotCount > 1) {
      normalized = cleaned.replace(/\./g, '');
    } else {
      const [intPart, fracPart] = cleaned.split('.');
      if (/^[1-9]\d{0,2}$/.test(intPart) && /^\d{3}$/.test(fracPart)) {
        normalized = `${intPart}${fracPart}`;
      } else {
        normalized = `${intPart || '0'}.${fracPart}`;
      }
    }
  } else {
    normalized = cleaned;
  }

  const n = Number(normalized);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function formatCurrencyInput(value: number | null | undefined, maxDecimals = 2): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return '';
  return formatCurrency(value, maxDecimals);
}

function groupViThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatCurrencyDraft(
  raw: string,
  prevDisplay: string,
  options?: FormatCurrencyDraftOptions,
): CurrencyDraftResult {
  const allowDecimals = options?.allowDecimals ?? true;
  const maxDecimals = Math.max(0, options?.maxDecimals ?? 2);
  const effectiveMaxDecimals = allowDecimals ? maxDecimals : 0;
  const max = options?.max;

  if (!raw || !raw.trim()) {
    return { display: '', canonical: '', numeric: 0 };
  }

  let workingRaw = raw;

  // Single-keystroke Numpad '.' detection when decimals are allowed and no comma is present yet
  if (allowDecimals && !prevDisplay.includes(',')) {
    if (prevDisplay === '' && workingRaw === '.') {
      workingRaw = '0,';
    } else if (workingRaw.length === prevDisplay.length + 1) {
      let diffIdx = -1;
      for (let i = 0; i < workingRaw.length; i++) {
        if (workingRaw[i] !== prevDisplay[i]) {
          diffIdx = i;
          break;
        }
      }
      if (
        diffIdx !== -1
        && workingRaw[diffIdx] === '.'
        && workingRaw.slice(diffIdx + 1) === prevDisplay.slice(diffIdx)
      ) {
        workingRaw = `${workingRaw.slice(0, diffIdx)},${workingRaw.slice(diffIdx + 1)}`;
      }
    }
  }

  // Multi-char paste / Playwright fill() detection
  const cleanedPaste = workingRaw.trim().replace(/[^\d.,]/g, '');
  if (workingRaw.length > prevDisplay.length + 1) {
    if (!cleanedPaste) {
      return { display: '', canonical: '', numeric: 0 };
    }
    const lastComma = cleanedPaste.lastIndexOf(',');
    const lastDot = cleanedPaste.lastIndexOf('.');
    const commaCount = (cleanedPaste.match(/,/g) ?? []).length;
    if (
      !cleanedPaste.includes(',')
      || lastDot > lastComma
      || (commaCount > 1 && /^\d{1,3}(,\d{3})+$/.test(cleanedPaste))
    ) {
      let n = parseCurrencyInput(workingRaw);
      if (max != null && n > max) n = max;
      const factor = 10 ** effectiveMaxDecimals;
      n = Math.round(n * factor) / factor;
      if (n <= 0 && !cleanedPaste.includes('0')) {
        return { display: '', canonical: '', numeric: 0 };
      }
      if (n === 0) {
        return { display: '0', canonical: '0', numeric: 0 };
      }
      return {
        display: formatCurrency(n, effectiveMaxDecimals),
        canonical: String(n),
        numeric: n,
      };
    }
  }

  // Standard typing / Vietnamese ',' decimal path
  const kept = workingRaw.replace(/[^\d,]/g, '');
  if (!kept) {
    return { display: '', canonical: '', numeric: 0 };
  }

  if (allowDecimals && kept.includes(',')) {
    const commaIdx = kept.indexOf(',');
    const before = kept.slice(0, commaIdx);
    const after = kept.slice(commaIdx + 1).replace(/,/g, '');
    const rawInt = before.replace(/\D/g, '');
    const fracDigits = after.replace(/\D/g, '').slice(0, effectiveMaxDecimals);
    const normInt = rawInt.replace(/^0+(?=\d)/, '') || '0';
    const groupedInt = groupViThousands(normInt);
    let display = `${groupedInt},${fracDigits}`;
    const factor = 10 ** effectiveMaxDecimals;
    let numeric = Math.round(Number(`${normInt}.${fracDigits || '0'}`) * factor) / factor;
    if (max != null && numeric > max) {
      numeric = Math.round(max * factor) / factor;
      display = formatCurrency(numeric, effectiveMaxDecimals);
    }
    return { display, canonical: String(numeric), numeric };
  }

  const rawInt = kept.replace(/\D/g, '');
  if (!rawInt) {
    return { display: '', canonical: '', numeric: 0 };
  }
  const normInt = rawInt.replace(/^0+(?=\d)/, '') || '0';
  let display = groupViThousands(normInt);
  let numeric = Number(normInt);
  if (max != null && numeric > max) {
    const factor = 10 ** effectiveMaxDecimals;
    numeric = Math.round(max * factor) / factor;
    display = formatCurrency(numeric, effectiveMaxDecimals);
  }
  return { display, canonical: String(numeric), numeric };
}

export function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(1).replace('.0', '') + ' tỷ';
  }
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(0) + ' triệu';
  }
  return formatCurrency(value);
}
