import { InvalidParamError } from '../errors.js';
import { SUPPORTED_CHAIN_IDS } from '../config.js';

/**
 * Validate market ID
 */
export function validateMarketId(marketId: number): void {
  if (!marketId || marketId <= 0) {
    throw new InvalidParamError('market_id must be a positive integer');
  }
}

/**
 * Validate chain ID is supported
 */
export function validateChainId(chainId: number): void {
  if (!SUPPORTED_CHAIN_IDS.includes(chainId as any)) {
    throw new InvalidParamError(
      `Chain ID ${chainId} is not supported. Supported chains: ${SUPPORTED_CHAIN_IDS.join(', ')}`,
    );
  }
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page: number, limit: number, maxLimit: number = 20): void {
  if (page < 1) {
    throw new InvalidParamError('page must be >= 1');
  }
  if (limit < 1 || limit > maxLimit) {
    throw new InvalidParamError(`limit must be between 1 and ${maxLimit}`);
  }
}

/**
 * Validate token ID format
 */
export function validateTokenId(tokenId: string): void {
  if (!tokenId || tokenId.trim() === '') {
    throw new InvalidParamError('token_id cannot be empty');
  }
}

/**
 * Validate order ID format
 */
export function validateOrderId(orderId: string): void {
  if (!orderId || orderId.trim() === '') {
    throw new InvalidParamError('order_id cannot be empty');
  }
}
