# Opinion CLOB SDK (TypeScript)

TypeScript SDK for interacting with Opinion Labs' CLOB (Central Limit Order Book) prediction markets on BNB Chain.

## Features

- 🔐 **EOA Wallet Support** - Seamlessly interact with markets using standard Ethereum wallets
- 📊 **Complete Market Data** - Access real-time prices, orderbooks, and market information
- 💱 **Trading Operations** - Place, cancel, and manage orders with full type safety
- 🪙 **Token Operations** - Split, merge, and redeem outcome tokens
- ⚡ **Optimized Performance** - Built-in caching for frequently accessed data
- 🛡️ **Type Safety** - Full TypeScript support with comprehensive type definitions
- 🌐 **Viem Integration** - Modern, lightweight Web3 library for blockchain interactions

## Installation

```bash
npm install opinion-clob-sdk
```

## Quick Start

```typescript
import { Client, OrderSide, OrderType } from 'opinion-clob-sdk';

// Initialize the client
const client = new Client({
  host: 'https://api.opinion.com',
  apiKey: 'your-api-key',
  rpcUrl: 'https://bsc-dataseed.binance.org/',
  privateKey: '0x...',
  walletAddress: '0x...',
  chainId: 56, // BNB Chain
});

// Get markets
const markets = await client.getMarkets({ page: 1, limit: 20 });
console.log('Available markets:', markets.list);

// Place a limit buy order
const order = await client.placeOrder({
  marketId: 123,
  tokenId: '0x...',
  price: '0.55',
  makerAmountInQuoteToken: '100', // 100 USDC
  side: OrderSide.BUY,
  orderType: OrderType.LIMIT_ORDER,
});

console.log('Order placed:', order);
```

## Configuration

### Client Options

```typescript
interface ClientConfig {
  /** API host URL */
  host: string;

  /** API authentication key */
  apiKey: string;

  /** Blockchain chain ID (default: 56 for BNB Chain) */
  chainId?: number;

  /** RPC endpoint URL */
  rpcUrl: string;

  /** Private key for signing transactions (with 0x prefix) */
  privateKey: Hex;

  /** Wallet address */
  walletAddress: Address;

  /** Conditional tokens contract address (optional, uses default) */
  conditionalTokensAddr?: Address;

  /** Quote tokens cache TTL in seconds (default: 3600) */
  quoteTokensCacheTtl?: number;

  /** Market cache TTL in seconds (default: 300) */
  marketCacheTtl?: number;
}
```

### Supported Chains

- **BNB Chain (BSC)** - Chain ID: 56 (mainnet)

## API Reference

### Market Data

#### Get Markets

```typescript
const markets = await client.getMarkets({
  topicType: TopicType.BINARY,
  page: 1,
  limit: 20,
  status: 'activated',
});
```

#### Get Market Details

```typescript
const market = await client.getMarket(marketId);
console.log('Market:', market.title);
console.log('Status:', market.status);
```

#### Get Orderbook

```typescript
const orderbook = await client.getOrderbook(tokenId);
console.log('Bids:', orderbook.bids);
console.log('Asks:', orderbook.asks);
```

#### Get Price History

```typescript
const history = await client.getPriceHistory({
  tokenId: '0x...',
  interval: '1h', // 1m, 1h, 1d, 1w, max
  startAt: Math.floor(Date.now() / 1000) - 86400, // last 24h
});
```

### Trading Operations

#### Enable Trading (Approve Tokens)

```typescript
// Approve quote tokens for trading
const txHashes = await client.enableTrading();
console.log('Approval transactions:', txHashes);
```

#### Place Order

```typescript
// Limit buy order
const buyOrder = await client.placeOrder({
  marketId: 123,
  tokenId: '0x...',
  price: '0.65',
  makerAmountInQuoteToken: '100', // 100 USDC
  side: OrderSide.BUY,
  orderType: OrderType.LIMIT_ORDER,
}, true); // checkApproval = true

// Limit sell order
const sellOrder = await client.placeOrder({
  marketId: 123,
  tokenId: '0x...',
  price: '0.70',
  makerAmountInBaseToken: '150', // 150 YES tokens
  side: OrderSide.SELL,
  orderType: OrderType.LIMIT_ORDER,
});

// Market order
const marketOrder = await client.placeOrder({
  marketId: 123,
  tokenId: '0x...',
  price: '0', // ignored for market orders
  makerAmountInQuoteToken: '50',
  side: OrderSide.BUY,
  orderType: OrderType.MARKET_ORDER,
});
```

#### Cancel Order

```typescript
await client.cancelOrder('order-id-123');
```

#### Batch Operations

```typescript
// Place multiple orders
const orders = [
  { marketId: 1, tokenId: '0x...', price: '0.5', ... },
  { marketId: 2, tokenId: '0x...', price: '0.6', ... },
];
const results = await client.placeOrdersBatch(orders, true);

// Cancel multiple orders
const cancelResults = await client.cancelOrdersBatch(['id1', 'id2']);

// Cancel all open orders (with optional filters)
const summary = await client.cancelAllOrders({
  marketId: 123, // optional
  side: OrderSide.BUY, // optional
});
console.log(`Cancelled ${summary.cancelled} orders`);
```

### Token Operations

#### Split Collateral

Convert collateral tokens (e.g., USDC) into outcome tokens:

```typescript
const amount = safeAmountToWei(100, 6); // 100 USDC (6 decimals)
const txHash = await client.split(marketId, amount);
console.log('Split transaction:', txHash);
```

#### Merge Outcome Tokens

Convert outcome tokens back to collateral:

```typescript
const amount = safeAmountToWei(50, 6);
const txHash = await client.merge(marketId, amount);
```

#### Redeem Winning Tokens

After market resolution, redeem winning tokens:

```typescript
const txHash = await client.redeem(marketId);
console.log('Redemption transaction:', txHash);
```

### User Account

#### Get Orders

```typescript
const myOrders = await client.getMyOrders({
  marketId: 123, // optional filter
  status: '1', // 1 = pending
  page: 1,
  limit: 10,
});
```

#### Get Positions

```typescript
const positions = await client.getMyPositions({
  marketId: 123,
  page: 1,
  limit: 10,
});
```

#### Get Balances

```typescript
const balances = await client.getMyBalances();
balances.forEach(b => {
  console.log(`${b.symbol}: ${b.balance}`);
});
```

#### Get Trade History

```typescript
const trades = await client.getMyTrades({
  marketId: 123,
  page: 1,
  limit: 20,
});
```

## Utilities

### Amount Conversion

```typescript
import { safeAmountToWei, weiToAmount } from 'opinion-clob-sdk';

// Convert human-readable amount to wei
const amountWei = safeAmountToWei(100.5, 6); // 100500000n (for 6 decimals)

// Convert wei back to human-readable
const amount = weiToAmount(100500000n, 6); // "100.5"
```

### Price Validation

```typescript
import { validatePrice } from 'opinion-clob-sdk';

// Validate price is within 0.001 - 0.999 with max 6 decimals
validatePrice('0.550000'); // OK
validatePrice('1.5'); // throws InvalidParamError
validatePrice('0.5555555'); // throws InvalidParamError (too many decimals)
```

## Types

### Enums

```typescript
enum OrderSide {
  BUY = 0,
  SELL = 1,
}

enum OrderType {
  MARKET_ORDER = 1,
  LIMIT_ORDER = 2,
}

enum TopicStatus {
  CREATED = 1,
  ACTIVATED = 2,
  RESOLVING = 3,
  RESOLVED = 4,
  FAILED = 5,
  DELETED = 6,
}

enum TopicType {
  BINARY = 0,
  CATEGORICAL = 1,
}
```

### Interfaces

See the full type definitions in the [types documentation](./docs/models.md).

## Error Handling

```typescript
import {
  InvalidParamError,
  OpenApiError,
  InsufficientGasBalance,
  BalanceNotEnough,
} from 'opinion-clob-sdk';

try {
  await client.placeOrder({ ... });
} catch (error) {
  if (error instanceof InvalidParamError) {
    console.error('Invalid parameters:', error.message);
  } else if (error instanceof OpenApiError) {
    console.error('API error:', error.message);
  } else if (error instanceof InsufficientGasBalance) {
    console.error('Not enough BNB for gas:', error.message);
  }
}
```

## Best Practices

### 1. Cache Management

The SDK includes built-in caching for frequently accessed data:

```typescript
// Use cache for better performance (default)
const market = await client.getMarket(123, true);

// Force fresh data when needed
const freshMarket = await client.getMarket(123, false);
```

### 2. Approval Management

Enable trading once before multiple operations:

```typescript
// Approve tokens once
await client.enableTrading();

// Then place multiple orders without re-checking
await client.placeOrder(order1, false);
await client.placeOrder(order2, false);
await client.placeOrder(order3, false);
```

### 3. Precision Handling

Always use utility functions for amount conversion:

```typescript
// ✅ Correct
const amount = safeAmountToWei(100.5, 6);

// ❌ Avoid manual conversion
const amount = BigInt(100.5 * 1e6); // Can lose precision
```

### 4. Error Handling

Always handle errors appropriately:

```typescript
try {
  await client.placeOrder({ ... });
} catch (error) {
  // Log and handle error
  console.error('Failed to place order:', error);
  // Retry logic, user notification, etc.
}
```

## Development

### Build

```bash
npm run build
```

### Type Check

```bash
npm run type-check
```

## License

MIT

## Support

For issues and questions:
- GitHub Issues: [opinion-clob-sdk/issues](https://github.com/opinion-labs/opinion-js-sdk/issues)
- Documentation: [docs.opinion.com](https://docs.opinion.com)

## Credits

Converted from the official Python SDK by Opinion Labs.
