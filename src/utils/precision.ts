import Decimal from 'decimal.js';
import { InvalidParamError } from '../errors.js';
import { PRICE_CONSTRAINTS } from '../config.js';

/**
 * Safely convert human-readable amount to wei without precision loss
 * @param amount - Amount in human-readable format
 * @param decimals - Token decimals (0-18)
 * @returns Amount in wei as bigint
 */
export function safeAmountToWei(amount: number | string, decimals: number): bigint {
  if (Number(amount) <= 0) {
    throw new InvalidParamError('Amount must be positive');
  }

  if (decimals < 0 || decimals > 18) {
    throw new InvalidParamError('Decimals must be between 0 and 18');
  }

  // Use Decimal for exact calculation
  const amountDecimal = new Decimal(amount.toString());
  const multiplier = new Decimal(10).pow(decimals);
  const resultDecimal = amountDecimal.mul(multiplier);

  // Convert to string then to bigint
  const resultStr = resultDecimal.toFixed(0);
  const result = BigInt(resultStr);

  // Validate fits in uint256
  const MAX_UINT256 = BigInt(2) ** BigInt(256) - BigInt(1);
  if (result > MAX_UINT256) {
    throw new InvalidParamError('Amount too large for uint256');
  }

  return result;
}

/**
 * Convert wei to human-readable amount
 * @param amountWei - Amount in wei
 * @param decimals - Token decimals
 * @returns Human-readable amount as string
 */
export function weiToAmount(amountWei: bigint, decimals: number): string {
  const amountDecimal = new Decimal(amountWei.toString());
  const divisor = new Decimal(10).pow(decimals);
  return amountDecimal.div(divisor).toString();
}

/**
 * Validate price is within acceptable range and precision
 * Accepts string or number, returns validated string
 * @param price - Price to validate (string or number)
 * @throws {InvalidParamError} If price is invalid
 * @returns Validated price as string
 */
export function validatePrice(price: string | number): string {
  // Convert number to string, checking precision first
  let priceStr: string;
  if (typeof price === 'number') {
    priceStr = String(price);
    const decimalPart = priceStr.split('.')[1];
    if (decimalPart && decimalPart.length > PRICE_CONSTRAINTS.MAX_DECIMALS) {
      throw new InvalidParamError(
        `Price precision exceeds ${PRICE_CONSTRAINTS.MAX_DECIMALS} decimal places: ${priceStr}. Please provide a price with at most ${PRICE_CONSTRAINTS.MAX_DECIMALS} decimal places.`,
      );
    }
  } else {
    priceStr = price;
  }

  const priceDecimal = new Decimal(priceStr);
  const minPrice = new Decimal(PRICE_CONSTRAINTS.MIN.toString());
  const maxPrice = new Decimal(PRICE_CONSTRAINTS.MAX.toString());

  if (priceDecimal.lessThan(minPrice) || priceDecimal.greaterThan(maxPrice)) {
    throw new InvalidParamError(
      `Price ${priceStr} is out of valid range. Price must be between ${PRICE_CONSTRAINTS.MIN} and ${PRICE_CONSTRAINTS.MAX}.`,
    );
  }

  // Check decimal places for string input
  const decimalPlaces = priceDecimal.decimalPlaces();
  if (decimalPlaces > PRICE_CONSTRAINTS.MAX_DECIMALS) {
    throw new InvalidParamError(
      `Price precision exceeds ${PRICE_CONSTRAINTS.MAX_DECIMALS} decimal places: ${priceStr}. Maximum allowed is ${PRICE_CONSTRAINTS.MAX_DECIMALS} decimal places.`,
    );
  }

  return priceStr;
}

/**
 * Validate and convert amount to string
 * @param amount - Amount to validate (string or number)
 * @param maxDecimals - Maximum decimal places allowed (optional)
 * @param fieldName - Field name for error messages
 * @throws {InvalidParamError} If amount precision exceeds maxDecimals
 * @returns Validated amount as string
 */
export function validateAmount(
  amount: string | number,
  maxDecimals?: number,
  fieldName: string = 'amount',
): string {
  let amountStr: string;
  if (typeof amount === 'number') {
    amountStr = String(amount);
  } else {
    amountStr = amount;
  }

  if (maxDecimals !== undefined) {
    const decimalPart = amountStr.split('.')[1];
    if (decimalPart && decimalPart.length > maxDecimals) {
      throw new InvalidParamError(
        `${fieldName} precision exceeds ${maxDecimals} decimal places: ${amountStr}. Maximum allowed is ${maxDecimals} decimal places.`,
      );
    }
  }

  return amountStr;
}

/**
 * Round an integer to n significant digits
 * @param value - Value to round
 * @param n - Number of significant digits
 * @returns Rounded value
 */
export function roundToSignificantDigits(value: bigint, n: number): bigint {
  if (value === 0n) {
    return 0n;
  }

  const valueStr = value.toString();
  const magnitude = valueStr.length;

  if (magnitude <= n) {
    return value;
  }

  const divisor = BigInt(10) ** BigInt(magnitude - n);
  const divided = value / divisor;
  const rounded = (divided + BigInt(5) / BigInt(10)) * divisor;

  return rounded;
}

/**
 * Calculate order amounts from price and maker amount
 * Uses rational number arithmetic to ensure exact price representation
 * @param price - Order price
 * @param makerAmount - Maker amount in wei
 * @param side - Order side (0 = BUY, 1 = SELL)
 * @returns Tuple of [recalculated maker amount, taker amount]
 */
export function calculateOrderAmounts(
  price: string,
  makerAmount: bigint,
  side: number,
): [bigint, bigint] {
  // Convert price to fraction with denominator limit
  const priceDecimal = new Decimal(price);

  // Use simple fraction representation
  // For price like 0.5, we want 1/2
  // For price like 0.333, we want 333/1000
  const priceFraction = approximateFraction(priceDecimal, 1000000);

  // Round maker to 4 significant digits
  const maker4digit = roundToSignificantDigits(makerAmount, 4);

  let recalculatedMaker: bigint;
  let takerAmount: bigint;

  if (side === 0) {
    // BUY: price = maker/taker
    // taker = maker/price
    const k = maker4digit / BigInt(priceFraction.numerator);
    recalculatedMaker = k * BigInt(priceFraction.numerator);
    takerAmount = k * BigInt(priceFraction.denominator);
  } else {
    // SELL: price = taker/maker
    // taker = maker * price
    const k = maker4digit / BigInt(priceFraction.denominator);
    recalculatedMaker = k * BigInt(priceFraction.denominator);
    takerAmount = k * BigInt(priceFraction.numerator);
  }

  return [recalculatedMaker, takerAmount];
}

/**
 * Approximate a decimal as a fraction with limited denominator
 * @param decimal - Decimal number to approximate
 * @param maxDenominator - Maximum denominator value
 * @returns Fraction as {numerator, denominator}
 */
function approximateFraction(
  decimal: Decimal,
  maxDenominator: number,
): { numerator: number; denominator: number } {
  // Simple continued fraction approximation
  let h1 = 1,
    h2 = 0;
  let k1 = 0,
    k2 = 1;
  let b = decimal.toNumber();

  for (let i = 0; i < 20; i++) {
    const a = Math.floor(b);
    let aux = h1;
    h1 = a * h1 + h2;
    h2 = aux;
    aux = k1;
    k1 = a * k1 + k2;
    k2 = aux;

    if (k1 > maxDenominator) {
      return { numerator: h2, denominator: k2 };
    }

    if (Math.abs(b - a) < 1e-10) {
      break;
    }

    b = 1 / (b - a);
  }

  return { numerator: h1, denominator: k1 };
}
