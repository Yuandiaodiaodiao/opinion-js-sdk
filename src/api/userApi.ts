import { ApiClient } from './client.js';
import { validateOrderId, validatePagination } from '../utils/validation.js';
import type { Order, Position, Balance, Trade } from '../types/index.js';

/**
 * User API for account-related operations
 */
export class UserApi {
  constructor(
    private client: ApiClient,
    private chainId: number,
  ) {}

  /**
   * Get user's orders
   * @param params - Query parameters
   */
  async getMyOrders(params: {
    marketId?: number;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ list: Order[]; total?: number }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    validatePagination(page, limit, 20);

    const queryParams: Record<string, any> = {
      page,
      limit,
    };

    if (params.marketId) {
      queryParams.marketId = params.marketId;
    }

    if (params.status) {
      queryParams.status = params.status;
    }

    return this.client.getList<Order>('/openapi/order', queryParams);
  }

  /**
   * Get order by ID
   * @param orderId - Order ID
   */
  async getOrderById(orderId: string): Promise<Order> {
    validateOrderId(orderId);
    return this.client.get<Order>('/openapi/order/{orderId}', {}, { orderId });
  }

  /**
   * Get user's positions
   * @param params - Query parameters
   */
  async getMyPositions(params: {
    marketId?: number;
    page?: number;
    limit?: number;
  }): Promise<{ list: Position[]; total?: number }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    validatePagination(page, limit, 20);

    const queryParams: Record<string, any> = {
      page,
      limit,
    };

    if (params.marketId) {
      queryParams.marketId = params.marketId;
    }

    return this.client.getList<Position>('/openapi/positions', queryParams);
  }

  /**
   * Get user's balances
   */
  async getMyBalances(): Promise<any> {
    return this.client.get('/openapi/user/balance', {
      chain_id: String(this.chainId),
    });
  }

  /**
   * Get user's trade history
   * @param params - Query parameters
   */
  async getMyTrades(params: {
    marketId?: number;
    page?: number;
    limit?: number;
  }): Promise<{ list: Trade[]; total?: number }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    validatePagination(page, limit, 20);

    const queryParams: Record<string, any> = {
      page,
      limit,
    };

    if (params.marketId) {
      queryParams.marketId = params.marketId;
    }

    return this.client.getList<Trade>('/openapi/trade', queryParams);
  }

  /**
   * Get authenticated user info
   */
  async getUserAuth(): Promise<any> {
    return this.client.get('/openapi/user/auth');
  }
}
