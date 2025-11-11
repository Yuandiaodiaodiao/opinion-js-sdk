# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **unofficial** TypeScript SDK for Opinion Labs CLOB (Central Limit Order Book) prediction markets on BNB Chain. It provides a modern, type-safe interface for trading prediction market tokens using EOA wallets.

**Key Technologies:**
- TypeScript with strict mode
- Viem (Web3 library for blockchain interactions)
- EIP-712 signature standard for order signing
- Undici for HTTP requests
- Vitest for testing

## Development Commands

### Build & Development
```bash
npm run build           # Build the library (outputs to dist/)
npm run dev             # Build in watch mode
npm run type-check      # Run TypeScript type checking
```

### Testing
```bash
npm run test                    # Run all tests
npm run test:watch              # Run tests in watch mode
npm run test:coverage           # Run tests with coverage report
npm run test:integration        # Run integration tests (requires .env)
```

### Documentation
```bash
npm run docs            # Generate TypeDoc documentation
npm run docs:watch      # Generate docs in watch mode
npm run docs:serve      # Serve docs at http://localhost:8080
```

## Architecture

### Core Client (`src/client.ts`)

The `Client` class is the main entry point, orchestrating all SDK functionality. It manages:
- **API clients**: `MarketApi` and `UserApi` for REST operations
- **Chain components**: `ContractCaller` for on-chain operations, `Signer` for EIP-712 signatures
- **Caching**: Time-based caches for quote tokens and markets
- **State**: Approval tracking to avoid redundant transactions

### Module Structure

```
src/
├── client.ts              # Main Client class (orchestrator)
├── config.ts              # Constants, addresses, gas settings
├── errors.ts              # Custom error classes
├── api/
│   ├── client.ts         # HTTP client wrapper (undici)
│   ├── marketApi.ts      # Market data & order API
│   └── userApi.ts        # User account API
├── chain/
│   ├── contractCaller.ts # Viem-based contract interactions
│   ├── orderBuilder.ts   # EIP-712 order construction
│   ├── signer.ts         # EIP-712 signature generation
│   └── abis.ts          # Contract ABIs
├── utils/
│   ├── cache.ts          # Time-based cache utility
│   ├── precision.ts      # Decimal/BigInt conversion
│   └── validation.ts     # Input validation
└── types/
    ├── index.ts          # Type exports
    ├── enums.ts          # OrderSide, OrderType, etc.
    └── models.ts         # API response models
```

### Order Placement Flow

1. **Input validation** - Validate market ID, price constraints, amounts
2. **Market lookup** - Fetch market details (cached)
3. **Amount calculation** - Convert user inputs to maker/taker amounts based on side and order type
4. **Order building** - `OrderBuilder` creates EIP-712 order structure
5. **Signing** - `Signer` generates EIP-712 signature
6. **API submission** - `MarketApi.placeOrder()` posts signed order

### Token Operations (Split/Merge/Redeem)

All token operations go through `ContractCaller`:
- **Split**: Convert collateral (e.g., USDC) into outcome tokens (YES/NO)
- **Merge**: Convert outcome tokens back into collateral
- **Redeem**: Claim winnings after market resolution

### Key Design Patterns

1. **Caching Strategy**: Two-level caching
   - Quote tokens (1 hour TTL) - rarely change
   - Markets (5 min TTL) - more dynamic
   - Approval state (in-memory) - session-scoped

2. **Precision Handling**: All amounts use `safeAmountToWei()` to avoid floating point errors
   - Input: human-readable strings (e.g., "100.5")
   - Internal: BigInt for exact calculations
   - Output: strings to preserve precision

3. **Error Hierarchy**:
   - `InvalidParamError` - Client-side validation failures
   - `OpenApiError` - API response errors
   - `InsufficientGasBalance` - Blockchain errors
   - `BalanceNotEnough` - Insufficient token balance

## Code Conventions

### Imports
- Always use `.js` extension in imports (required for ESM)
- Group imports: external deps → internal modules → types

### Async Operations
- All blockchain operations are async and may throw
- API methods include retry logic for network errors
- Always handle errors appropriately in examples

### Type Safety
- Use strict TypeScript types throughout
- Prefer `bigint` over `number` for on-chain amounts
- Use `Hex` and `Address` types from viem for clarity

### camelCase Conversion
The SDK automatically converts POST request bodies from camelCase (TypeScript convention) to snake_case (API convention). Do not manually convert field names in POST requests.

## Important Implementation Details

### Order Signing
Orders use EIP-712 structured data signing:
- Domain: "OPINION CTF Exchange" v1
- Primary type: `Order`
- Signature type: `POLY_GNOSIS_SAFE` (enum value 1)

### Gas Handling
- BNB Chain uses EIP-1559 gas pricing
- Priority fee: 2 gwei baseline
- Gas estimates include 20% safety margin (50% for multisend)
- Fallback gas limit: 500,000 if estimation fails

### Price Constraints
Valid prices for limit orders:
- Range: 0.001 to 0.999
- Max decimals: 6
- Must be positive non-zero

### Batch Operations
Batch operations (placeOrdersBatch, cancelOrdersBatch) execute sequentially and return detailed results for each operation, including successes and failures.

## Testing Notes

- Integration tests require a `.env` file with valid API credentials
- Unit tests mock blockchain interactions
- Use `vitest` for all test files

## Chain Information

**Supported Networks:**
- BNB Chain Mainnet (Chain ID: 56)

**Default Contract Addresses:**
- Conditional Tokens: `0xAD1a38cEc043e70E83a3eC30443dB285ED10D774`
- Multisend: `0x998739BFdAAdde7C933B942a68053933098f9EDa`

## Common Pitfalls

1. **Amount precision**: Always use `safeAmountToWei()` for conversions
2. **Order types**: Market orders ignore price, limit orders require valid price
3. **Buy vs Sell**:
   - Buy orders use makerAmountInQuoteToken (USDC spent)
   - Sell orders use makerAmountInBaseToken (outcome tokens sold)
4. **Approval management**: Call `enableTrading()` once before trading, not before every order
5. **ESM imports**: Must include `.js` extension in relative imports
