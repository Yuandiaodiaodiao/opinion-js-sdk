/**
 * Opinion CLOB SDK for TypeScript
 *
 * A TypeScript SDK for interacting with Opinion Labs' CLOB prediction markets on BNB Chain.
 *
 * @packageDocumentation
 */

// Main client
export { Client } from './client.js';
export type { ClientConfig } from './client.js';

// Types
export * from './types/index.js';

// Errors
export * from './errors.js';

// Config constants
export {
  SUPPORTED_CHAIN_IDS,
  CHAIN_ID_BNB_MAINNET,
  DEFAULT_CONTRACT_ADDRESSES,
  ZERO_ADDRESS,
  PRICE_CONSTRAINTS,
  GAS_SETTINGS,
} from './config.js';

// Utilities
export { safeAmountToWei, weiToAmount, validatePrice } from './utils/precision.js';
export {
  validateMarketId,
  validateChainId,
  validatePagination,
  validateTokenId,
  validateOrderId,
} from './utils/validation.js';
