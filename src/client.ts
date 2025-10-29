import type { Address, Hex } from 'viem';
import Decimal from 'decimal.js';
import { ApiClient } from './api/client.js';
import { MarketApi } from './api/marketApi.js';
import { UserApi } from './api/userApi.js';
import { ContractCaller } from './chain/contractCaller.js';
import { OrderBuilder } from './chain/orderBuilder.js';
import { Signer } from './chain/signer.js';
import { TimeCache } from './utils/cache.js';
import {
  safeAmountToWei,
  validatePrice,
  calculateOrderAmounts,
} from './utils/precision.js';
import { validateMarketId, validateChainId } from './utils/validation.js';
import {
  InvalidParamError,
  OpenApiError,
} from './errors.js';
import {
  DEFAULT_CONTRACT_ADDRESSES,
  DEFAULT_CACHE_TTL,
  CHAIN_ID_BNBCHAIN_MAINNET,
} from './config.js';
import type {
  PlaceOrderDataInput,
  OrderDataInput,
  QuoteToken,
  Market,
  Order,
  Position,
  Balance,
  Trade,
  Orderbook,
  FeeRates,
  PriceHistoryPoint,
  TransactionResult,
} from './types/index.js';
import { OrderSide, OrderType, SignatureType, TopicStatus, TopicType } from './types/index.js';

/**
 * Client configuration options
 */
export interface ClientConfig {
  /** API host URL */
  host: string;
  /** API authentication key */
  apiKey: string;
  /** Blockchain chain ID (default: 56 for BNB Chain) */
  chainId?: number;
  /** RPC endpoint URL */
  rpcUrl: string;
  /** Private key for signing transactions */
  privateKey: Hex;
  /** Wallet address (for EOA wallets) */
  walletAddress: Address;
  /** Conditional tokens contract address (optional, uses default if not provided) */
  conditionalTokensAddr?: Address;
  /** Quote tokens cache TTL in seconds (default: 3600) */
  quoteTokensCacheTtl?: number;
  /** Market cache TTL in seconds (default: 300) */
  marketCacheTtl?: number;
}

/**
 * Quote token with exchange info
 */
interface QuoteTokenWithExchange extends QuoteToken {
  ctf_exchange_address: Address;
  quote_token_address: Address;
  decimal: number;
}

/**
 * Main SDK client for Opinion CLOB
 */
export class Client {
  private apiClient: ApiClient;
  private marketApi: MarketApi;
  private userApi: UserApi;
  private contractCaller: ContractCaller;
  private signer: Signer;
  private chainId: number;
  private walletAddress: Address;

  // Caches
  private quoteTokensCache?: TimeCache<QuoteTokenWithExchange[]>;
  private marketCache?: TimeCache<Market>;
  private enableTradingCache: Map<string, boolean> = new Map();

  /**
   * Create a new Opinion CLOB SDK client
   * @param config - Client configuration
   */
  constructor(config: ClientConfig) {
    this.chainId = config.chainId ?? CHAIN_ID_BNBCHAIN_MAINNET;
    validateChainId(this.chainId);

    this.walletAddress = config.walletAddress;

    // Initialize API clients
    this.apiClient = new ApiClient(config.host, config.apiKey);
    this.marketApi = new MarketApi(this.apiClient, this.chainId);
    this.userApi = new UserApi(this.apiClient, this.chainId);

    // Initialize blockchain components
    const conditionalTokensAddr =
      config.conditionalTokensAddr ?? DEFAULT_CONTRACT_ADDRESSES[this.chainId].conditional_tokens;

    this.signer = new Signer(config.privateKey);
    this.contractCaller = new ContractCaller(
      config.rpcUrl,
      this.chainId,
      config.privateKey,
      conditionalTokensAddr,
    );

    // Setup caches
    const quoteTokensTtl = config.quoteTokensCacheTtl ?? DEFAULT_CACHE_TTL.QUOTE_TOKENS;
    if (quoteTokensTtl > 0) {
      this.quoteTokensCache = new TimeCache<QuoteTokenWithExchange[]>(quoteTokensTtl);
    }

    const marketTtl = config.marketCacheTtl ?? DEFAULT_CACHE_TTL.MARKET;
    if (marketTtl > 0) {
      this.marketCache = new TimeCache<Market>(marketTtl);
    }
  }

  // ========== Trading Operations ==========

  /**
   * Enable trading by approving tokens for the exchange
   * @returns Array of transaction results (aligned with Python SDK)
   */
  async enableTrading(): Promise<TransactionResult[]> {
    const quoteTokens = await this.getQuoteTokens(true);

    const results: TransactionResult[] = [];

    for (const quoteToken of quoteTokens) {
      const quoteTokenAddr = quoteToken.quote_token_address as Address;
      const exchangeAddr = quoteToken.ctf_exchange_address as Address;

      // Check if already enabled in cache
      const cacheKey = `${quoteTokenAddr}-${exchangeAddr}`;
      if (this.enableTradingCache.has(cacheKey)) {
        continue;
      }

      const result = await this.contractCaller.enableTrading(quoteTokenAddr, exchangeAddr);

      if (result) {
        results.push(result);
      }

      // Cache successful approval
      this.enableTradingCache.set(cacheKey, true);
    }

    return results;
  }

  /**
   * Split collateral into outcome tokens
   * @param marketId - Market ID
   * @param amount - Amount in wei
   * @param checkApproval - Whether to check and enable trading first
   * @returns Transaction result (aligned with Python SDK)
   */
  async split(marketId: number, amount: bigint, checkApproval: boolean = true): Promise<TransactionResult> {
    validateMarketId(marketId);

    if (amount <= 0n) {
      throw new InvalidParamError('amount must be positive');
    }

    if (checkApproval) {
      await this.enableTrading();
    }

    const market = await this.getMarket(marketId, true);

    if (Number(market.marketId) !== marketId) {
      throw new OpenApiError('Market not found');
    }

    const status = market.status;
    if (
      status !== TopicStatus.ACTIVATED &&
      status !== TopicStatus.RESOLVED &&
      status !== TopicStatus.RESOLVING
    ) {
      throw new OpenApiError('Cannot split on non-activated/resolving/resolved market');
    }

    const collateral = market.quoteToken!;
    const conditionId = `0x${market.conditionId!.replace(/^0x/, '')}` as Hex;

    // Partition for binary markets is [1, 2]
    const partition = [1n, 2n];

    return this.contractCaller.split(collateral, conditionId, amount, partition);
  }

  /**
   * Merge outcome tokens back to collateral
   * @param marketId - Market ID
   * @param amount - Amount in wei
   * @param checkApproval - Whether to check and enable trading first
   * @returns Transaction result (aligned with Python SDK)
   */
  async merge(marketId: number, amount: bigint, checkApproval: boolean = true): Promise<TransactionResult> {
    validateMarketId(marketId);

    if (amount <= 0n) {
      throw new InvalidParamError('amount must be positive');
    }

    if (checkApproval) {
      await this.enableTrading();
    }

    const market = await this.getMarket(marketId, true);

    const status = market.status;
    if (
      status !== TopicStatus.ACTIVATED &&
      status !== TopicStatus.RESOLVED &&
      status !== TopicStatus.RESOLVING
    ) {
      throw new OpenApiError('Cannot merge on non-activated/resolving/resolved market');
    }

    const collateral = market.quoteToken!;
    const conditionId = `0x${market.conditionId!.replace(/^0x/, '')}` as Hex;

    const partition = [1n, 2n];

    return this.contractCaller.merge(collateral, conditionId, amount, partition);
  }

  /**
   * Redeem winning tokens after market resolution
   * @param marketId - Market ID
   * @param checkApproval - Whether to check and enable trading first
   * @returns Transaction result (aligned with Python SDK)
   */
  async redeem(marketId: number, checkApproval: boolean = true): Promise<TransactionResult> {
    validateMarketId(marketId);

    if (checkApproval) {
      await this.enableTrading();
    }

    const market = await this.getMarket(marketId, true);

    if (market.status !== TopicStatus.RESOLVED) {
      throw new OpenApiError('Cannot redeem on non-resolved market');
    }

    const collateral = market.quoteToken!;
    const conditionId = `0x${market.conditionId!.replace(/^0x/, '')}` as Hex;

    // For binary markets, redeem both index sets
    const indexSets = [1n, 2n];

    return this.contractCaller.redeem(collateral, conditionId, indexSets);
  }

  // ========== Market Data ==========

  /**
   * Get supported quote tokens
   * @param useCache - Whether to use cached data
   * @returns List of quote tokens
   */
  async getQuoteTokens(useCache: boolean = true): Promise<QuoteTokenWithExchange[]> {
    if (useCache && this.quoteTokensCache) {
      const cached = this.quoteTokensCache.get('quote_tokens');
      if (cached) {
        return cached;
      }
    }

    const tokens = (await this.marketApi.getQuoteTokens()) as unknown as QuoteTokenWithExchange[];

    if (this.quoteTokensCache) {
      this.quoteTokensCache.set('quote_tokens', tokens);
    }

    return tokens;
  }

  /**
   * Get markets with pagination
   * @param params - Query parameters
   * @returns Markets list with pagination info
   */
  async getMarkets(params?: {
    topicType?: TopicType;
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ list: Market[]; total?: number }> {
    return this.marketApi.getMarkets({
      chainId: String(this.chainId),
      topicType: params?.topicType,
      page: params?.page,
      limit: params?.limit,
      status: params?.status as any,
    });
  }

  /**
   * Get specific market by ID
   * @param marketId - Market ID
   * @param useCache - Whether to use cached data
   * @returns Market details
   */
  async getMarket(marketId: number, useCache: boolean = true): Promise<Market> {
    validateMarketId(marketId);

    if (useCache && this.marketCache) {
      const cached = this.marketCache.get(`market_${marketId}`);
      if (cached) {
        return cached;
      }
    }

    const market = await this.marketApi.getMarket(marketId);

    if (this.marketCache) {
      this.marketCache.set(`market_${marketId}`, market);
    }

    return market;
  }

  /**
   * Get categorical market details
   * @param marketId - Market ID
   */
  async getCategoricalMarket(marketId: number): Promise<any> {
    validateMarketId(marketId);
    return this.marketApi.getCategoricalMarket(marketId);
  }

  /**
   * Get price history for a token
   * @param params - Query parameters
   */
  async getPriceHistory(params: {
    tokenId: string;
    interval?: string;
    startAt?: number;
    endAt?: number;
  }): Promise<PriceHistoryPoint[]> {
    return this.marketApi.getPriceHistory(params);
  }

  /**
   * Get orderbook for a token
   * @param tokenId - Token ID
   */
  async getOrderbook(tokenId: string): Promise<Orderbook> {
    return this.marketApi.getOrderbook(tokenId);
  }

  /**
   * Get latest price for a token
   * @param tokenId - Token ID
   */
  async getLatestPrice(tokenId: string): Promise<{ price: string }> {
    return this.marketApi.getLatestPrice(tokenId);
  }

  /**
   * Get fee rates for a token
   * @param tokenId - Token ID
   */
  async getFeeRates(tokenId: string): Promise<FeeRates> {
    return this.marketApi.getFeeRates(tokenId);
  }

  // ========== Order Operations ==========

  /**
   * Place an order
   * @param data - Order data
   * @param checkApproval - Whether to check and enable trading first
   * @returns Order placement result
   */
  async placeOrder(data: PlaceOrderDataInput, checkApproval: boolean = false): Promise<any> {
    if (checkApproval) {
      await this.enableTrading();
    }

    // Get quote tokens and market
    const quoteTokens = await this.getQuoteTokens(true);
    const market = await this.getMarket(data.marketId, true);

    const quoteTokenAddr = market.quoteToken!.toLowerCase();

    // Find matching quote token
    const quoteToken = quoteTokens.find(
      (t) => t.quote_token_address.toLowerCase() === quoteTokenAddr,
    );

    if (!quoteToken) {
      throw new OpenApiError('Quote token not found for this market');
    }

    const exchangeAddr = quoteToken.ctf_exchange_address;
    const quoteTokenDecimals = quoteToken.decimal;

    // Calculate maker amount
    let makerAmount = 0;
    const minimalMakerAmount = 1;

    // Validate combinations
    if (
      data.side === OrderSide.BUY &&
      data.orderType === OrderType.MARKET_ORDER &&
      data.makerAmountInBaseToken
    ) {
      throw new InvalidParamError('makerAmountInBaseToken is not allowed for market buy');
    }

    if (
      data.side === OrderSide.SELL &&
      data.orderType === OrderType.MARKET_ORDER &&
      data.makerAmountInQuoteToken
    ) {
      throw new InvalidParamError('makerAmountInQuoteToken is not allowed for market sell');
    }

    // Validate price for limit orders
    if (data.orderType === OrderType.LIMIT_ORDER) {
      validatePrice(data.price);
      const priceDecimal = new Decimal(data.price);
      if (priceDecimal.lte(0)) {
        throw new InvalidParamError('Price must be positive for limit orders');
      }
    }

    // Calculate maker amount based on side and inputs
    if (data.side === OrderSide.BUY) {
      if (data.makerAmountInBaseToken) {
        const baseAmount = new Decimal(data.makerAmountInBaseToken);
        const priceDecimal = new Decimal(data.price);
        makerAmount = baseAmount.mul(priceDecimal).toNumber();

        if (Number(data.makerAmountInBaseToken) < minimalMakerAmount) {
          throw new InvalidParamError('makerAmountInBaseToken must be at least 1');
        }
      } else if (data.makerAmountInQuoteToken) {
        makerAmount = Number(data.makerAmountInQuoteToken);

        if (Number(data.makerAmountInQuoteToken) < minimalMakerAmount) {
          throw new InvalidParamError('makerAmountInQuoteToken must be at least 1');
        }
      } else {
        throw new InvalidParamError(
          'Either makerAmountInBaseToken or makerAmountInQuoteToken must be provided for BUY orders',
        );
      }
    } else if (data.side === OrderSide.SELL) {
      if (data.makerAmountInBaseToken) {
        makerAmount = Number(data.makerAmountInBaseToken);

        if (Number(data.makerAmountInBaseToken) < minimalMakerAmount) {
          throw new InvalidParamError('makerAmountInBaseToken must be at least 1');
        }
      } else if (data.makerAmountInQuoteToken) {
        const quoteAmount = new Decimal(data.makerAmountInQuoteToken);
        const priceDecimal = new Decimal(data.price);

        if (priceDecimal.eq(0)) {
          throw new InvalidParamError('Price cannot be zero for SELL orders with makerAmountInQuoteToken');
        }

        makerAmount = quoteAmount.div(priceDecimal).toNumber();

        if (Number(data.makerAmountInQuoteToken) < minimalMakerAmount) {
          throw new InvalidParamError('makerAmountInQuoteToken must be at least 1');
        }
      } else {
        throw new InvalidParamError(
          'Either makerAmountInBaseToken or makerAmountInQuoteToken must be provided for SELL orders',
        );
      }
    }

    if (makerAmount <= 0) {
      throw new InvalidParamError('Calculated makerAmount must be positive');
    }

    // Build order input
    const orderInput: OrderDataInput = {
      marketId: data.marketId,
      tokenId: data.tokenId,
      makerAmount,
      price: data.price,
      orderType: data.orderType,
      side: data.side,
    };

    return this._placeOrder(orderInput, exchangeAddr, quoteTokenAddr as Address, quoteTokenDecimals);
  }

  /**
   * Internal method to place order
   */
  private async _placeOrder(
    data: OrderDataInput,
    exchangeAddr: Address,
    currencyAddr: Address,
    currencyDecimal: number,
  ): Promise<any> {
    const builder = new OrderBuilder(exchangeAddr, this.chainId, this.signer);

    let recalculatedMakerAmount: bigint;
    let takerAmount: bigint;

    if (data.orderType === OrderType.MARKET_ORDER) {
      takerAmount = 0n;
      data.price = '0';
      recalculatedMakerAmount = safeAmountToWei(data.makerAmount, currencyDecimal);
    } else {
      // LIMIT_ORDER
      const makerAmountWei = safeAmountToWei(data.makerAmount, currencyDecimal);
      [recalculatedMakerAmount, takerAmount] = calculateOrderAmounts(
        data.price,
        makerAmountWei,
        data.side,
      );
    }

    // Create order data
    const orderData = builder.createOrderData({
      maker: this.walletAddress,
      tokenId: data.tokenId,
      makerAmount: recalculatedMakerAmount,
      takerAmount,
      side: data.side,
      signatureType: SignatureType.EOA,
    });

    // Build and sign order
    const signedOrder = await builder.buildSignedOrder(orderData);

    // Create API request body
    const orderRequest = {
      salt: signedOrder.salt,
      topic_id: data.marketId,
      maker: signedOrder.maker,
      signer: signedOrder.signer,
      taker: signedOrder.taker,
      token_id: signedOrder.tokenId,
      maker_amount: signedOrder.makerAmount,
      taker_amount: signedOrder.takerAmount,
      expiration: signedOrder.expiration,
      nonce: signedOrder.nonce,
      fee_rate_bps: signedOrder.feeRateBps,
      side: signedOrder.side,
      signature_type: signedOrder.signatureType,
      signature: signedOrder.signature,
      currency_address: currencyAddr,
      price: data.price,
      trading_method: data.orderType,
      timestamp: Math.floor(Date.now() / 1000),
    };

    return this.marketApi.placeOrder(orderRequest);
  }

  /**
   * Cancel an order
   * @param orderId - Order ID to cancel
   */
  async cancelOrder(orderId: string): Promise<any> {
    return this.marketApi.cancelOrder(orderId);
  }

  /**
   * Place multiple orders in batch
   * @param orders - List of orders to place
   * @param checkApproval - Whether to check and enable trading first
   */
  async placeOrdersBatch(
    orders: PlaceOrderDataInput[],
    checkApproval: boolean = false,
  ): Promise<any[]> {
    if (!orders || orders.length === 0) {
      throw new InvalidParamError('orders list cannot be empty');
    }

    if (checkApproval) {
      await this.enableTrading();
    }

    const results: any[] = [];

    for (let i = 0; i < orders.length; i++) {
      try {
        const result = await this.placeOrder(orders[i], false);
        results.push({
          index: i,
          success: true,
          result,
          order: orders[i],
        });
      } catch (error: any) {
        results.push({
          index: i,
          success: false,
          error: error.message,
          order: orders[i],
        });
      }
    }

    return results;
  }

  /**
   * Cancel multiple orders in batch
   * @param orderIds - List of order IDs to cancel
   */
  async cancelOrdersBatch(orderIds: string[]): Promise<any[]> {
    if (!orderIds || orderIds.length === 0) {
      throw new InvalidParamError('orderIds list cannot be empty');
    }

    const results: any[] = [];

    for (let i = 0; i < orderIds.length; i++) {
      try {
        const result = await this.cancelOrder(orderIds[i]);
        results.push({
          index: i,
          success: true,
          result,
          orderId: orderIds[i],
        });
      } catch (error: any) {
        results.push({
          index: i,
          success: false,
          error: error.message,
          orderId: orderIds[i],
        });
      }
    }

    return results;
  }

  /**
   * Cancel all open orders
   * @param params - Optional filters
   */
  async cancelAllOrders(params?: {
    marketId?: number;
    side?: OrderSide;
  }): Promise<{ totalOrders: number; cancelled: number; failed: number; results: any[] }> {
    const allOrders: Order[] = [];
    let page = 1;
    const limit = 20;
    const maxPages = 100;

    while (page <= maxPages) {
      const response = await this.getMyOrders({
        marketId: params?.marketId,
        status: '1', // pending/open orders
        page,
        limit,
      });

      if (!response.list || response.list.length === 0) {
        break;
      }

      allOrders.push(...response.list);

      if (response.list.length < limit) {
        break;
      }

      page++;
    }

    if (allOrders.length === 0) {
      return {
        totalOrders: 0,
        cancelled: 0,
        failed: 0,
        results: [],
      };
    }

    // Filter by side if specified
    let filteredOrders = allOrders;
    if (params?.side !== undefined) {
      filteredOrders = allOrders.filter((order) => order.side === params.side);
    }

    const orderIds = filteredOrders.map((order) => order.id);

    if (orderIds.length === 0) {
      return {
        totalOrders: 0,
        cancelled: 0,
        failed: 0,
        results: [],
      };
    }

    const results = await this.cancelOrdersBatch(orderIds);

    const cancelled = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      totalOrders: orderIds.length,
      cancelled,
      failed,
      results,
    };
  }

  // ========== User Account ==========

  /**
   * Get user's orders
   * @param params - Query parameters
   */
  async getMyOrders(params?: {
    marketId?: number;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ list: Order[]; total?: number }> {
    return this.userApi.getMyOrders(params ?? {});
  }

  /**
   * Get order by ID
   * @param orderId - Order ID
   */
  async getOrderById(orderId: string): Promise<Order> {
    return this.userApi.getOrderById(orderId);
  }

  /**
   * Get user's positions
   * @param params - Query parameters
   */
  async getMyPositions(params?: {
    marketId?: number;
    page?: number;
    limit?: number;
  }): Promise<{ list: Position[]; total?: number }> {
    return this.userApi.getMyPositions(params ?? {});
  }

  /**
   * Get user's balances
   */
  async getMyBalances(): Promise<Balance[]> {
    return this.userApi.getMyBalances();
  }

  /**
   * Get user's trade history
   * @param params - Query parameters
   */
  async getMyTrades(params?: {
    marketId?: number;
    page?: number;
    limit?: number;
  }): Promise<{ list: Trade[]; total?: number }> {
    return this.userApi.getMyTrades(params ?? {});
  }

  /**
   * Get authenticated user info
   */
  async getUserAuth(): Promise<any> {
    return this.userApi.getUserAuth();
  }
}
