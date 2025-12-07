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

// Types - Public API only
export type {
  PlaceOrderDataInput,
  Market,
  Order,
  Position,
  Balance,
  Trade,
  Orderbook,
  QuoteToken,
  FeeRates,
  PriceHistoryPoint,
  OrderbookLevel,
  OutcomeToken,
  TransactionResult,
} from './types/models.js';

export {
  OrderSide,
  OrderType,
  TopicStatus,
  TopicType,
  TopicStatusFilter,
  SignatureType,
} from './types/enums.js';

// Errors
export * from './errors.js';

// Config constants
export {
  SUPPORTED_CHAIN_IDS,
  CHAIN_ID_BNBCHAIN_MAINNET,
  DEFAULT_CONTRACT_ADDRESSES,
  ZERO_ADDRESS,
  PRICE_CONSTRAINTS,
  GAS_SETTINGS,
} from './config.js';

// Utilities - Public API only
export { safeAmountToWei, weiToAmount, validatePrice, validateAmount } from './utils/precision.js';
export {
  validateMarketId,
  validateChainId,
  validatePagination,
  validateTokenId,
  validateOrderId,
} from './utils/validation.js';
