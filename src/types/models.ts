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
 * Internal order structure for signing (bigint types for EIP712)
 */
export interface Order {
  /** Order salt */
  salt: bigint;
  /** Maker address */
  maker: Address;
  /** Signer address */
  signer: Address;
  /** Taker address */
  taker: Address;
  /** Token ID */
  tokenId: bigint;
  /** Maker amount in wei */
  makerAmount: bigint;
  /** Taker amount in wei */
  takerAmount: bigint;
  /** Expiration timestamp */
  expiration: bigint;
  /** Nonce */
  nonce: bigint;
  /** Fee rate in basis points */
  feeRateBps: bigint;
  /** Order side */
  side: number;
  /** Signature type */
  signatureType: number;
}

/**
 * Signed order structure (string types for API)
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
  /** Token ID */
  id: number;
  /** Token name */
  quoteTokenName: string;
  /** Token address */
  quoteTokenAddress: Address;
  /** CTF Exchange address */
  ctfExchangeAddress: Address;
  /** Token decimals */
  decimal: number;
  /** Token symbol (e.g., USDC) */
  symbol: string;
  /** Chain ID */
  chainId: string;
  /** Created at timestamp */
  createdAt: number;
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
  marketId: number;
  /** Market title */
  marketTitle: string;
  /** Market status (numeric) */
  marketStatus: number;
  /** Market status (enum string) */
  marketStatusEnum: string;
  /** Market cutoff timestamp */
  marketCutoffAt: number;
  /** Root market ID */
  rootMarketId: number;
  /** Root market title */
  rootMarketTitle: string;
  /** Outcome name */
  outcome: string;
  /** Outcome side (numeric) */
  outcomeSide: number;
  /** Outcome side (enum string) */
  outcomeSideEnum: string;
  /** Shares owned */
  sharesOwned: string;
  /** Shares frozen */
  sharesFrozen: string;
  /** Unrealized PnL */
  unrealizedPnl: string;
  /** Unrealized PnL percent */
  unrealizedPnlPercent: string;
  /** Daily PnL change */
  dailyPnlChange: string;
  /** Daily PnL change percent */
  dailyPnlChangePercent: string;
  /** Condition ID */
  conditionId: string;
  /** Token ID */
  tokenId: string;
  /** Current value in quote token */
  currentValueInQuoteToken: string;
  /** Average entry price */
  avgEntryPrice: string;
  /** Claim status (numeric) */
  claimStatus: number;
  /** Claim status (enum string) */
  claimStatusEnum: string;
  /** Quote token address */
  quoteToken: Address;
}

/**
 * Single token balance
 */
export interface TokenBalance {
  /** Quote token address */
  quoteToken: Address;
  /** Token decimals */
  tokenDecimals: number;
  /** Total balance */
  totalBalance: string;
  /** Available balance */
  availableBalance: string;
  /** Frozen balance */
  frozenBalance: string;
}

/**
 * User balance response
 */
export interface Balance {
  /** Wallet address */
  walletAddress: Address;
  /** Multi-signature address */
  multiSignAddress: Address;
  /** Chain ID */
  chainId: string;
  /** Token balances */
  balances: TokenBalance[];
}

/**
 * Order from API
 */
export interface Order {
  /** Order ID */
  orderId: string;
  /** Transaction number */
  transNo: string;
  /** Order status (numeric) */
  status: number;
  /** Order status (enum string) */
  statusEnum: string;
  /** Market ID */
  marketId: number;
  /** Market title */
  marketTitle: string;
  /** Root market ID */
  rootMarketId: number;
  /** Root market title */
  rootMarketTitle: string;
  /** Order side (numeric) */
  side: number;
  /** Order side (enum string) */
  sideEnum: string;
  /** Trading method (numeric) */
  tradingMethod: number;
  /** Trading method (enum string) */
  tradingMethodEnum: string;
  /** Outcome name */
  outcome: string;
  /** Outcome side (numeric) */
  outcomeSide: number;
  /** Outcome side (enum string) */
  outcomeSideEnum: string;
  /** Price */
  price: string;
  /** Order shares */
  orderShares: string;
  /** Order amount */
  orderAmount: string;
  /** Filled shares */
  filledShares: string;
  /** Filled amount */
  filledAmount: string;
  /** Profit */
  profit: string;
  /** Quote token address */
  quoteToken: Address;
  /** Created at timestamp */
  createdAt: number;
  /** Expires at timestamp */
  expiresAt: number;
  /** Related trades */
  trades: any[];
}

/**
 * Trade information
 */
export interface Trade {
  /** Order number */
  orderNo: string;
  /** Trade number */
  tradeNo: string;
  /** Transaction hash */
  txHash: string;
  /** Market ID */
  marketId: number;
  /** Market title */
  marketTitle: string;
  /** Root market ID */
  rootMarketId: number;
  /** Root market title */
  rootMarketTitle: string;
  /** Side (string) */
  side: string;
  /** Outcome name */
  outcome: string;
  /** Outcome side (numeric) */
  outcomeSide: number;
  /** Outcome side (enum string) */
  outcomeSideEnum: string;
  /** Price */
  price: string;
  /** Shares */
  shares: string;
  /** Amount */
  amount: string;
  /** Fee */
  fee: number | string;
  /** Profit */
  profit: string;
  /** Quote token address */
  quoteToken: Address;
  /** Quote token USD price */
  quoteTokenUsdPrice: string;
  /** USD amount */
  usdAmount: string;
  /** Trade status (numeric) */
  status: number;
  /** Trade status (enum string) */
  statusEnum: string;
  /** Chain ID */
  chainId: string;
  /** Created at timestamp */
  createdAt: number;
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
  /** Token ID */
  tokenId: string;
  /** Taker fee rate in basis points */
  takerFeeBps: string;
  /** Maker fee rate in basis points */
  makerFeeBps: string;
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
