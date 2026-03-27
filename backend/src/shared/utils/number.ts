type NumericValue = number | string | { toNumber(): number };

export function toNumber(value: NumericValue): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    return Number(value);
  }

  return value.toNumber();
}

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}
