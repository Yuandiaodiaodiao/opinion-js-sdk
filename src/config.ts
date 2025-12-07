import type { Address } from 'viem';
import type { ChainContractAddresses } from './types/index.js';

/**
 * Supported chain IDs
 */
export const SUPPORTED_CHAIN_IDS = [56] as const;

/**
 * BNB Chain mainnet ID
 * @deprecated Use CHAIN_ID_BNBCHAIN_MAINNET for alignment with Python SDK
 */
export const CHAIN_ID_BNB_MAINNET = 56;

/**
 * BNB Chain mainnet ID (aligned with Python SDK naming)
 */
export const CHAIN_ID_BNBCHAIN_MAINNET = 56;

/**
 * Default contract addresses by chain ID
 */
export const DEFAULT_CONTRACT_ADDRESSES: Record<number, ChainContractAddresses> = {
  [CHAIN_ID_BNBCHAIN_MAINNET]: {
    conditional_tokens: '0xAD1a38cEc043e70E83a3eC30443dB285ED10D774',
    multisend: '0x998739BFdAAdde7C933B942a68053933098f9EDa',
  },
};

/**
 * Zero address constant
 */
export const ZERO_ADDRESS: Address = '0x0000000000000000000000000000000000000000';

/**
 * Default cache TTL values (in seconds)
 */
export const DEFAULT_CACHE_TTL = {
  ENABLE_TRADING: 3600, // 1 hour
  QUOTE_TOKENS: 3600, // 1 hour
  MARKET: 300, // 5 minutes
} as const;

/**
 * Price validation constants
 */
export const PRICE_CONSTRAINTS = {
  MIN: 0.001,
  MAX: 0.999,
  MAX_DECIMALS: 3,
} as const;

/**
 * Default gas settings
 */
export const GAS_SETTINGS = {
  PRIORITY_FEE_GWEI: 2n, // 2 gwei priority fee for EIP-1559
  BASE_FEE_MULTIPLIER: 2n, // Allow 2x base fee increase
  SAFETY_MARGIN: 1.2, // 20% safety margin on gas estimates
  MULTISEND_MARGIN: 1.5, // 50% safety margin for multisend operations
  FALLBACK_GAS_LIMIT: 500000n, // Fallback gas limit if estimation fails
} as const;
