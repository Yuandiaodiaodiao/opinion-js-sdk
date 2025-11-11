/**
 * Order side enum
 */
export enum OrderSide {
  BUY = 0,
  SELL = 1,
}

/**
 * Order type enum
 */
export enum OrderType {
  MARKET_ORDER = 1,
  LIMIT_ORDER = 2,
}

/**
 * Topic (market) status enum
 */
export enum TopicStatus {
  CREATED = 1,
  ACTIVATED = 2,
  RESOLVING = 3,
  RESOLVED = 4,
  FAILED = 5,
  DELETED = 6,
}

/**
 * Topic type enum
 */
export enum TopicType {
  BINARY = 0,
  CATEGORICAL = 1,
}

/**
 * Topic status filter for API queries
 */
export enum TopicStatusFilter {
  ALL = '',
  ACTIVATED = 'activated',
  RESOLVED = 'resolved',
}

/**
 * Signature type enum
 */
export enum SignatureType {
  /** ECDSA EIP712 signatures */
  EOA = 0,
  /** Polymarket Proxy wallets */
  POLY_PROXY = 1,
  /** Polymarket Gnosis Safes */
  POLY_GNOSIS_SAFE = 2,
}

/**
 * MultiSend operation type
 */
export enum MultiSendOperation {
  CALL = 0,
  DELEGATE_CALL = 1,
}
