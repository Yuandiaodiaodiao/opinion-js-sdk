import type { Address, Hex } from 'viem';
import { OrderSide, OrderType, SignatureType } from './enums.js';

/**
 * User-facing order input data
 */
export interface PlaceOrderDataInput {
  /** Market ID */
  marketId: number;
  /** Token ID (outcome token) */
  tokenId: string;
  /** Amount in quote token (e.g., 500 USDC). Either this or makerAmountInBaseToken must be provided. */
  makerAmountInQuoteToken?: string;
  /** Amount in base token (e.g., 500 YES tokens). Either this or makerAmountInQuoteToken must be provided. */
  makerAmountInBaseToken?: string;
  /** Price between 0.001 and 0.999 (max 6 decimals) */
  price: string;
  /** Order side (BUY or SELL) */
  side: OrderSide;
  /** Order type (MARKET_ORDER or LIMIT_ORDER) */
  orderType: OrderType;
}

/**
 * Internal order data representation
 */
export interface OrderData {
  /** Maker address */
  maker: Address;
  /** Taker address (use zero address for open orders) */
  taker: Address;
  /** Token ID */
  tokenId: string;
  /** Maker amount in wei */
  makerAmount: bigint;
  /** Taker amount in wei */
  takerAmount: bigint;
  /** Order side */
  side: OrderSide;
  /** Fee rate in basis points */
  feeRateBps: string;
  /** Nonce */
  nonce: string;
  /** Signer address */
  signer: Address;
  /** Expiration timestamp */
  expiration: string;
  /** Signature type */
  signatureType: SignatureType;
}

/**
 * Internal order input for building signed orders
 */
export interface OrderDataInput {
  /** Market ID */
  marketId: number;
  /** Token ID */
  tokenId: string;
  /** Maker amount (human-readable) */
  makerAmount: number;
  /** Price */
  price: string;
  /** Order type */
  orderType: OrderType;
  /** Order side */
  side: OrderSide;
}

/**
 * Signed order structure
 */
export interface SignedOrder {
  /** Order salt */
  salt: string;
  /** Maker address */
  maker: Address;
  /** Signer address */
  signer: Address;
  /** Taker address */
  taker: Address;
  /** Token ID */
  tokenId: string;
  /** Maker amount in wei */
  makerAmount: string;
  /** Taker amount in wei */
  takerAmount: string;
  /** Expiration timestamp */
  expiration: string;
  /** Nonce */
  nonce: string;
  /** Fee rate in basis points */
  feeRateBps: string;
  /** Order side */
  side: string;
  /** Signature type */
  signatureType: string;
  /** Signature hex string */
  signature: Hex;
}

/**
 * Quote token information
 */
export interface QuoteToken {
  /** Token address */
  address: Address;
  /** Token symbol (e.g., USDC) */
  symbol: string;
  /** Token name */
  name: string;
  /** Token decimals */
  decimals: number;
  /** Chain ID */
  chainId: number;
}

/**
 * Market information (matches API response format with camelCase)
 */
export interface Market {
  /** Market ID */
  marketId: number;
  /** Market title */
  marketTitle: string;
  /** Market rules/description */
  rules?: string;
  /** Market status (numeric) */
  status: number;
  /** Market status (enum string) */
  statusEnum?: string;
  /** Quote token address */
  quoteToken?: Address;
  /** Chain ID */
  chainId?: string;
  /** Condition ID */
  conditionId?: string;
  /** Question ID */
  questionId?: string;
  /** Yes label */
  yesLabel?: string;
  /** No label */
  noLabel?: string;
  /** Yes token ID */
  yesTokenId?: string;
  /** No token ID */
  noTokenId?: string;
  /** Result token ID */
  resultTokenId?: string;
  /** Volume */
  volume?: string;
  /** Child markets */
  childMarkets?: any[];
  /** Created at timestamp */
  createdAt?: number;
  /** Cutoff timestamp */
  cutoffAt?: number;
  /** Resolved timestamp */
  resolvedAt?: number;
}

/**
 * Outcome token information
 */
export interface OutcomeToken {
  /** Token ID */
  token_id: string;
  /** Outcome name */
  outcome: string;
  /** Current price */
  price?: string;
}

/**
 * User position
 */
export interface Position {
  /** Market ID */
  market_id: number;
  /** Token ID */
  token_id: string;
  /** Outcome name */
  outcome: string;
  /** Position size */
  size: string;
  /** Average entry price */
  avg_price?: string;
  /** Unrealized PnL */
  unrealized_pnl?: string;
}

/**
 * User balance
 */
export interface Balance {
  /** Token address */
  token_address: Address;
  /** Token symbol */
  symbol: string;
  /** Available balance */
  balance: string;
  /** Balance in USD */
  balance_usd?: string;
}

/**
 * Order from API
 */
export interface Order {
  /** Order ID */
  id: string;
  /** Market ID */
  market_id: number;
  /** Token ID */
  token_id: string;
  /** Maker address */
  maker: Address;
  /** Order side */
  side: number;
  /** Price */
  price: string;
  /** Original amount */
  original_amount: string;
  /** Filled amount */
  filled_amount: string;
  /** Remaining amount */
  remaining_amount: string;
  /** Order status */
  status: number;
  /** Created at timestamp */
  created_at: number;
  /** Updated at timestamp */
  updated_at?: number;
}

/**
 * Trade information
 */
export interface Trade {
  /** Trade ID */
  id: string;
  /** Market ID */
  market_id: number;
  /** Token ID */
  token_id: string;
  /** Order ID */
  order_id: string;
  /** Side */
  side: number;
  /** Price */
  price: string;
  /** Amount */
  amount: string;
  /** Fee */
  fee?: string;
  /** Timestamp */
  timestamp: number;
}

/**
 * Price history data point
 */
export interface PriceHistoryPoint {
  /** Timestamp */
  t: number;
  /** Price */
  p: string;
  /** Volume */
  v?: string;
}

/**
 * Orderbook level
 */
export interface OrderbookLevel {
  /** Price */
  price: string;
  /** Size */
  size: string;
}

/**
 * Orderbook data
 */
export interface Orderbook {
  /** Buy orders (bids) */
  bids: OrderbookLevel[];
  /** Sell orders (asks) */
  asks: OrderbookLevel[];
}

/**
 * Fee rates
 */
export interface FeeRates {
  /** Maker fee rate in basis points */
  maker_fee_bps: string;
  /** Taker fee rate in basis points */
  taker_fee_bps: string;
}

/**
 * EIP712 domain
 */
export interface EIP712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: Address;
}

/**
 * EIP712 Order type definition
 */
export const EIP712_ORDER_TYPES = {
  Order: [
    { name: 'salt', type: 'uint256' },
    { name: 'maker', type: 'address' },
    { name: 'signer', type: 'address' },
    { name: 'taker', type: 'address' },
    { name: 'tokenId', type: 'uint256' },
    { name: 'makerAmount', type: 'uint256' },
    { name: 'takerAmount', type: 'uint256' },
    { name: 'expiration', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'feeRateBps', type: 'uint256' },
    { name: 'side', type: 'uint8' },
    { name: 'signatureType', type: 'uint8' },
  ],
} as const;

/**
 * Contract addresses for a specific chain
 */
export interface ChainContractAddresses {
  conditional_tokens: Address;
  multisend: Address;
}

/**
 * Transaction result (aligned with Python SDK Tuple[tx_hash, tx_receipt, contract_event])
 */
export interface TransactionResult {
  /** Transaction hash */
  txHash: Hex;
  /** Transaction receipt */
  receipt: any;
  /** Contract event (if any) */
  event?: any;
}
