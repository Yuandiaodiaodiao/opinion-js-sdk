import { ApiClient } from './client.js';
import { validateMarketId, validateTokenId, validatePagination } from '../utils/validation.js';
import type { Market, Orderbook, FeeRates, PriceHistoryPoint, QuoteToken } from '../types/index.js';
import { TopicType, TopicStatusFilter } from '../types/index.js';

/**
 * Market API for market data operations
 */
export class MarketApi {
  constructor(private client: ApiClient) {}

  /**
   * Get supported quote tokens
   */
  async getQuoteTokens(): Promise<QuoteToken[]> {
    return this.client.get<QuoteToken[]>('/openapi/quoteToken');
  }

  /**
   * Get markets with pagination
   * @param params - Query parameters
   */
  async getMarkets(params: {
    chainId: string;
    topicType?: TopicType;
    page?: number;
    limit?: number;
    status?: TopicStatusFilter;
  }): Promise<{ list: Market[]; total?: number }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    validatePagination(page, limit, 20);

    const queryParams: Record<string, any> = {
      chainId: params.chainId,
      page,
      limit,
    };

    if (params.topicType !== undefined) {
      queryParams.marketType = params.topicType;
    }

    if (params.status && params.status !== TopicStatusFilter.ALL) {
      queryParams.status = params.status;
    }

    return this.client.getList<Market>('/openapi/market', queryParams);
  }

  /**
   * Get specific market by ID
   * @param marketId - Market ID
   * @param chainId - Chain ID
   */
  async getMarket(marketId: number, chainId: string): Promise<Market> {
    validateMarketId(marketId);
    return this.client.get<Market>('/openapi/market', {
      marketId: marketId,
      chainId: chainId,
    });
  }

  /**
   * Get categorical market details
   * @param marketId - Market ID
   */
  async getCategoricalMarket(marketId: number): Promise<any> {
    validateMarketId(marketId);
    return this.client.get(`/openapi/market/${marketId}/categorical`);
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
    validateTokenId(params.tokenId);

    const queryParams: Record<string, any> = {
      token_id: params.tokenId,
    };

    if (params.interval) {
      queryParams.interval = params.interval;
    }
    if (params.startAt) {
      queryParams.start_at = params.startAt;
    }
    if (params.endAt) {
      queryParams.end_at = params.endAt;
    }

    return this.client.get<PriceHistoryPoint[]>('/openapi/token/price-history', queryParams);
  }

  /**
   * Get orderbook for a token
   * @param tokenId - Token ID
   */
  async getOrderbook(tokenId: string): Promise<Orderbook> {
    validateTokenId(tokenId);
    return this.client.get<Orderbook>('/openapi/token/orderbook', {
      token_id: tokenId,
    });
  }

  /**
   * Get latest price for a token
   * @param tokenId - Token ID
   */
  async getLatestPrice(tokenId: string): Promise<{ price: string }> {
    validateTokenId(tokenId);
    return this.client.get<{ price: string }>('/openapi/token/latest-price', {
      token_id: tokenId,
    });
  }

  /**
   * Get fee rates for a token
   * @param tokenId - Token ID
   */
  async getFeeRates(tokenId: string): Promise<FeeRates> {
    validateTokenId(tokenId);
    return this.client.get<FeeRates>('/openapi/token/fee-rates', {
      token_id: tokenId,
    });
  }

  /**
   * Place an order
   * @param orderData - Order data
   */
  async placeOrder(orderData: any): Promise<any> {
    return this.client.post('/openapi/order', orderData);
  }

  /**
   * Cancel an order
   * @param orderId - Order ID
   */
  async cancelOrder(orderId: string): Promise<any> {
    return this.client.post('/openapi/order/cancel', { orderId: orderId });
  }
}
