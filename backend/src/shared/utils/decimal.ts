/**
 * Decimal utility class for financial calculations
 * Provides precise decimal arithmetic with 2 decimal places
 */
export class Decimal {
  private value: number;

  constructor(value: number) {
    this.value = Math.round(value * 100) / 100;
  }

  toNumber(): number {
    return this.value;
  }

  add(other: Decimal): Decimal {
    return new Decimal(this.value + other.value);
  }

  subtract(other: Decimal): Decimal {
    return new Decimal(this.value - other.value);
  }

  multiply(factor: number): Decimal {
    return new Decimal(this.value * factor);
  }

  divide(divisor: number): Decimal {
    return new Decimal(this.value / divisor);
  }

  greaterThanOrEqualTo(other: number): boolean {
    return this.value >= other;
  }

  greaterThan(other: number): boolean {
    return this.value > other;
  }

  lessThan(other: number): boolean {
    return this.value < other;
  }

  equals(other: number): boolean {
    return this.value === other;
  }
}

export default Decimal;
